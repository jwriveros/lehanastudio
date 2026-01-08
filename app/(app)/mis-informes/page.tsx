"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSessionStore } from "@/lib/sessionStore";
import { 
  DollarSign, Loader2, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, CalendarDays,
  TrendingUp, CheckCircle2, Clock, Download
} from "lucide-react";

export default function MisInformes() {
  const { session } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPeriodo: 0, hoy: 0, totalCitas: 0, confirmadas: 0 });
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });

  // --- NAVEGACIÓN DÍA A DÍA ---
  const handlePrevDay = () => {
    const current = new Date(dateRange.start + 'T00:00:00');
    current.setDate(current.getDate() - 1);
    const dateStr = current.toISOString().split('T')[0];
    setDateRange({ start: dateStr, end: dateStr });
  };

  const handleNextDay = () => {
    const current = new Date(dateRange.start + 'T00:00:00');
    current.setDate(current.getDate() + 1);
    const dateStr = current.toISOString().split('T')[0];
    setDateRange({ start: dateStr, end: dateStr });
  };

  // --- FORMATEO 12H SEGURO ---
  const formatTimeSafe = (dateStr: string) => {
    if (!dateStr) return "--:--";
    const parts = dateStr.split(/[ T]/);
    if (parts.length < 2) return "--:--";
    let [hours, minutes] = parts[1].split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const fetchData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data: citas, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('especialista', session.name)
        .or('estado.eq.Cita pagada,estado.eq.Cita confirmada,estado.eq.Nueva reserva creada')
        .gte('appointment_at', `${dateRange.start} 00:00:00`)
        .lte('appointment_at', `${dateRange.end} 23:59:59`)
        .order('appointment_at', { ascending: false });

      if (citas) {
        const comisionFactor = (session.comision_base || 40) / 100;
        let totalP = 0, totalH = 0, countConf = 0;
        const currentToday = new Date().toLocaleDateString('en-CA');

        citas.forEach(cita => {
          if (cita.estado === 'Cita pagada') {
            const val = (parseFloat(cita.price) || 0) * comisionFactor;
            totalP += val;
            if (cita.appointment_at?.startsWith(currentToday)) totalH += val;
          }
          if (cita.estado === 'Cita confirmada') countConf++;
        });

        setStats({ totalPeriodo: totalP, hoy: totalH, totalCitas: citas.length, confirmadas: countConf });
        setAppointments(citas);
      }
    } finally { setLoading(false); }
  }, [session, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F9FC] dark:bg-zinc-950 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <header className="flex-none mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Reporte de Ingresos</h1>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
            Especialista: <span className="text-indigo-600 font-bold">{session?.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center border-r border-zinc-100 pr-2 mr-1">
            <button onClick={handlePrevDay} className="p-2 hover:bg-zinc-100 rounded-xl transition-all"><ChevronLeft size={18}/></button>
            <button onClick={() => setDateRange({start: todayStr, end: todayStr})} className="px-3 py-1.5 text-[11px] font-bold uppercase text-indigo-600">Hoy</button>
            <button onClick={handleNextDay} className="p-2 hover:bg-zinc-100 rounded-xl transition-all"><ChevronRight size={18}/></button>
          </div>
          <div className="flex items-center gap-2 px-2">
            <CalendarDays size={14} className="text-zinc-400"/>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({start: e.target.value, end: e.target.value})} className="text-[11px] font-semibold bg-transparent border-none p-0 focus:ring-0 dark:text-zinc-200" />
          </div>
        </div>
      </header>

      {/* STATS CARDS */}
      <div className="flex-none grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Ganancia Total" value={`$${stats.totalPeriodo.toLocaleString()}`} color="text-indigo-600" />
        <StatCard title="Hoy" value={`$${stats.hoy.toLocaleString()}`} color="text-emerald-600" />
        <StatCard title="Citas" value={stats.totalCitas} color="text-zinc-800 dark:text-zinc-100" />
        <StatCard title="Confirmadas" value={stats.confirmadas} color="text-orange-500" />
      </div>

      {/* TABLA CON SCROLL INTERNO */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200/60 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden mb-6">
        <div className="overflow-y-auto w-full">
          {loading ? (
            <div className="p-32 flex flex-col items-center justify-center gap-3"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-20 border-b dark:border-zinc-800">
                <tr className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                  <th className="px-8 py-6">Fecha / Hora</th>
                  <th className="px-8 py-6">Cliente & Servicio</th>
                  <th className="px-8 py-6 text-center">Estado</th>
                  <th className="px-8 py-6 text-right">Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800/50">
                {appointments.map((cita) => (
                  <tr key={cita.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-200">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center font-black">
                          <span className="text-[10px] text-zinc-800 dark:text-zinc-200">{cita.appointment_at.split(/[- T]/)[2]}</span>
                          <span className="text-[7px] uppercase text-zinc-400">{new Date(cita.appointment_at.replace(' ', 'T')).toLocaleString('default', { month: 'short' })}</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                          <Clock size={12}/> {formatTimeSafe(cita.appointment_at)} 
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase">{cita.cliente}</span>
                        <span className="text-[10px] text-zinc-400 font-medium">{cita.servicio}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        cita.estado === 'Cita pagada' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                      }`}>
                        {cita.estado}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black">
                      <span className={cita.estado === 'Cita pagada' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-300 dark:text-zinc-700'}>
                        {cita.estado === 'Cita pagada' ? `+$${(Number(cita.price) * ((session?.comision_base || 40) / 100)).toLocaleString()}` : '$0'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}