"use client";
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSessionStore } from "@/lib/sessionStore";
import { useUIStore } from "@/lib/uiStore"; // 🚩 Importamos el almacén del Drawer
import ReservationDrawer from "@/components/reservations/ReservationDrawer"; // 🚩 Importamos el contenedor de detalles
import { 
  DollarSign, Loader2, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, CalendarDays,
  TrendingUp, CheckCircle2, Clock, Download, Filter
} from "lucide-react";

export default function MisInformes() {
  const { session } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPeriodo: 0, hoy: 0, totalCitas: 0, confirmadas: 0 });
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });

  // 🚩 ESTADOS GLOBALES Y LOCALES PARA MANEJAR LA APERTURA DEL DRAWER
  const isReservationDrawerOpen = useUIStore((state) => state.isReservationDrawerOpen);
  const closeReservationDrawer = useUIStore((state) => state.closeReservationDrawer);
  const openReservationDrawer = useUIStore((state) => state.openReservationDrawer);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  // --- LÓGICA DE PERIODOS RÁPIDOS ---
  const setQuickPeriod = (period: 'hoy' | 'semana' | 'mes') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'hoy') {
      const str = now.toLocaleDateString('en-CA');
      setDateRange({ start: str, end: str });
      return;
    }

    if (period === 'semana') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajuste a Lunes
      start = new Date(now.setDate(diff));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    }

    if (period === 'mes') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    setDateRange({ 
      start: start.toLocaleDateString('en-CA'), 
      end: end.toLocaleDateString('en-CA') 
    });
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

  // --- PARSE DE FECHA PARA EL CALENDARIO ---
  const parseLocalDate = (dateString: string) => {
    const [date, time = "00:00:00"] = dateString.split("T");
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm, ss] = time.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, ss || 0);
  };

  // --- CONTROLADOR DEL CLIC EN LA FILA ---
  const handleRowClick = (cita: any) => {
    const start = parseLocalDate(cita.appointment_at);
    const duration = Number(cita.duration || 60);
    const end = new Date(start.getTime() + duration * 60000);

    // Mapeamos la cita al formato exacto 'CalendarAppointment' que devoran el Drawer y Details
    setSelectedAppointment({
      id: String(cita.id),
      title: cita.servicio,
      start,
      end,
      bg_color: cita.bg_color,
      raw: { 
        ...cita, 
        appointment_at_local: start.toISOString()
      },
    });
    openReservationDrawer();
  };

  // --- MAPEO DINÁMICO DE ESTADOS (COLORES Y TEXTOS) ---
  const getStatusStyles = (estadoStr: string) => {
    const normalize = estadoStr?.toLowerCase().trim();
    
    if (normalize === 'cita pagada') {
      return {
        label: "Pagada",
        classes: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/40"
      };
    }
    if (normalize === 'cita confirmada') {
      return {
        label: "Confirmada",
        classes: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/40"
      };
    }
    if (normalize === 'nueva reserva creada') {
      return {
        label: "Nueva Reserva",
        classes: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/40"
      };
    }
    if (normalize === 'cita cancelada') {
      return {
        label: "Cancelada",
        classes: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200/40"
      };
    }
    return {
      label: estadoStr,
      classes: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
    };
  };

  const fetchData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data: citas, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('especialista', session.name)
        .or('estado.eq.Cita pagada,estado.eq.Cita confirmada,estado.eq.Nueva reserva creada,estado.eq.Cita cancelada')
        .gte('appointment_at', `${dateRange.start} 00:00:00`)
        .lte('appointment_at', `${dateRange.end} 23:59:59`)
        .order('appointment_at', { ascending: true });

      if (citas) {
        const comisionFactor = (session.comision_base || 40) / 100;
        let totalP = 0, totalH = 0, countConf = 0;
        const currentToday = new Date().toLocaleDateString('en-CA');

        citas.forEach(cita => {
          const estadoNorm = cita.estado?.toLowerCase().trim();
          if (estadoNorm === 'cita pagada') {
            const val = (parseFloat(cita.price) || 0) * comisionFactor;
            totalP += val;
            if (cita.appointment_at?.startsWith(currentToday)) totalH += val;
          }
          if (estadoNorm === 'cita confirmada' || estadoNorm === 'nueva reserva creada') {
            countConf++;
          }
        });

        setStats({ totalPeriodo: totalP, hoy: totalH, totalCitas: citas.length, confirmadas: countConf });
        setAppointments(citas);
      }
    } finally { setLoading(false); }
  }, [session, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F9FC] dark:bg-zinc-950 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <header className="flex-none mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Reporte de Ingresos</h1>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
            Especialista: <span className="text-indigo-600 font-bold">{session?.name}</span>
          </p>
        </div>

        {/* SELECTORES DE FECHA */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex bg-white dark:bg-zinc-900 rounded-2xl p-1 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <button onClick={() => setQuickPeriod('hoy')} className="px-4 py-2 text-[10px] font-black uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all">Hoy</button>
            <button onClick={() => setQuickPeriod('semana')} className="px-4 py-2 text-[10px] font-black uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all">Semana</button>
            <button onClick={() => setQuickPeriod('mes')} className="px-4 py-2 text-[10px] font-black uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all border-l dark:border-zinc-800">Mes</button>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-400 uppercase">Desde</span>
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} 
                className="text-[11px] font-bold bg-transparent border-none p-0 focus:ring-0 dark:text-zinc-200" 
              />
            </div>
            <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-400 uppercase">Hasta</span>
              <input 
                type="date" 
                value={dateRange.end} 
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} 
                className="text-[11px] font-bold bg-transparent border-none p-0 focus:ring-0 dark:text-zinc-200" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* STATS CARDS */}
      <div className="flex-none grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Ganancia en Periodo" value={`$${stats.totalPeriodo.toLocaleString()}`} color="text-indigo-600" icon={<TrendingUp size={14}/>} />
        <StatCard title="Total Pagado Hoy" value={`$${stats.hoy.toLocaleString()}`} color="text-emerald-600" icon={<CheckCircle2 size={14}/>} />
        <StatCard title="Citas en Lista" value={stats.totalCitas} color="text-zinc-800 dark:text-zinc-100" icon={<CalendarIcon size={14}/>} />
        <StatCard title="Pendientes" value={stats.confirmadas} color="text-orange-500" icon={<Clock size={14}/>} />
      </div>

      {/* TABLA CON SCROLL INTERNO */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200/60 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden mb-6">
        <div className="overflow-y-auto w-full">
          {loading ? (
            <div className="p-32 flex flex-col items-center justify-center gap-3"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
          ) : appointments.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-2">
               <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-300"><Filter size={24}/></div>
               <p className="text-zinc-400 text-sm font-medium">No hay registros para este rango de fechas</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-20 border-b dark:border-zinc-800">
                <tr className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                  <th className="px-8 py-6">Fecha / Hora</th>
                  <th className="px-8 py-6">Cliente & Servicio</th>
                  <th className="px-8 py-6 text-center">Estado</th>
                  <th className="px-8 py-6 text-right">Tu Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800/50">
                {appointments.map((cita) => {
                  const badge = getStatusStyles(cita.estado);
                  const esPagada = cita.estado?.toLowerCase().trim() === 'cita pagada';

                  return (
                    // 🚩 AGREGADO: cursor-pointer y onClick para abrir los detalles y activar las lógicas del localStorage de forma nativa
                    <tr 
                      key={cita.id} 
                      onClick={() => handleRowClick(cita)}
                      className="group cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-200"
                    >
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
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-black">
                        <span className={esPagada ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-300 dark:text-zinc-700'}>
                          {esPagada ? `+$${(Number(cita.price) * ((session?.comision_base || 40) / 100)).toLocaleString()}` : '$0'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 🚩 CONTENEDOR LATERAL INTELIGENTE CONECTADO */}
      <ReservationDrawer
        isOpen={isReservationDrawerOpen}
        onClose={() => { closeReservationDrawer(); setSelectedAppointment(null); }}
        appointmentData={selectedAppointment}
        onSuccess={fetchData} // Recarga los reportes automáticamente al mutar una cita
      />
    </div>
  );
}

function StatCard({ title, value, color, icon }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{title}</p>
        <div className="text-zinc-300">{icon}</div>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}