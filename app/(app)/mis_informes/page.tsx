"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSessionStore } from "@/lib/sessionStore";
import { useUIStore } from "@/lib/uiStore";
import ReservationDrawer from "@/components/reservations/ReservationDrawer";
import { 
  DollarSign, Loader2, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, CalendarDays,
  TrendingUp, CheckCircle2, Clock, Download, Filter, Sparkles, User,
  ChevronDown
} from "lucide-react";

const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/* =========================================================
   🔹 COMPONENTE: DATE PICKER PERSONALIZADO (ZINC / ROSE)
========================================================= */
function CustomDatePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(`${value}T00:00:00`) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentMonthYear] = useState(initialDate.getFullYear());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return "Seleccionar...";
    const [y, m, d] = dateStr.split("-");
    const monthName = MESES_ES[parseInt(m, 10) - 1]?.slice(0, 3);
    return `${d} ${monthName}, ${y}`;
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentMonthYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentMonthYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const handleSelectDay = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const formatted = `${currentYear}-${mm}-${dd}`;
    onChange(formatted);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      {label && (
        <span className="text-[9px] font-black text-zinc-400 uppercase mr-1">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs hover:border-rose-400 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="text-rose-500 shrink-0" />
          <span className="truncate">{formatDisplay(value)}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-4 animate-in fade-in duration-150 text-zinc-900 dark:text-zinc-100">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold">
              {MESES_ES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"].map((d) => (
              <span key={d} className="text-[10px] font-bold text-zinc-400">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((p) => (
              <div key={`pad-${p}`} />
            ))}
            {daysArray.map((d) => {
              const mm = String(currentMonth + 1).padStart(2, "0");
              const dd = String(d).padStart(2, "0");
              const dateKey = `${currentYear}-${mm}-${dd}`;
              const isSelected = value === dateKey;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`p-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 PÁGINA PRINCIPAL: MIS INFORMES
========================================================= */
export default function MisInformes() {
  const { session } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPeriodo: 0, hoy: 0, totalCitas: 0, confirmadas: 0 });
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });

  // ESTADOS DEL DRAWER LATERAL
  const isReservationDrawerOpen = useUIStore((state) => state.isReservationDrawerOpen);
  const closeReservationDrawer = useUIStore((state) => state.closeReservationDrawer);
  const openReservationDrawer = useUIStore((state) => state.openReservationDrawer);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  // LÓGICA DE PERIODOS RÁPIDOS
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
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
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

  const parseLocalDate = (dateString: string) => {
    const [date, time = "00:00:00"] = dateString.split("T");
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm, ss] = time.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, ss || 0);
  };

  const handleRowClick = (cita: any) => {
    const start = parseLocalDate(cita.appointment_at);
    const duration = Number(cita.duration || 60);
    const end = new Date(start.getTime() + duration * 60000);

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

  const getStatusStyles = (estadoStr: string) => {
    const normalize = estadoStr?.toLowerCase().trim();
    
    if (normalize === 'cita pagada') {
      return {
        label: "Pagada",
        classes: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 font-extrabold"
      };
    }
    if (normalize === 'cita confirmada' || normalize === 'nueva reserva creada') {
      return {
        label: "Confirmada",
        classes: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 font-extrabold"
      };
    }
    if (normalize === 'cita cancelada') {
      return {
        label: "Cancelada",
        classes: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 font-extrabold"
      };
    }
    return {
      label: estadoStr,
      classes: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold"
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
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-zinc-900 dark:text-zinc-100 font-sans antialiased animate-in fade-in duration-500">
      
      {/* ENCABEZADO INTEGRADO CON DATEPICKER FLOTANTE */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-500">
            <Sparkles size={18} />
            <span className="text-xs font-bold tracking-wider uppercase text-rose-500">
              Reporte de Comisiones
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mis Informes
          </h1>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <User size={13} className="text-rose-500" />
            Especialista: <span className="text-rose-500 font-extrabold">{session?.name}</span> ({session?.comision_base || 40}% comisión)
          </p>
        </div>

        {/* SELECTORES DE FECHA Y RANGOS RÁPIDOS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex bg-white dark:bg-zinc-900 rounded-2xl p-1 shadow-xs border border-zinc-200/80 dark:border-zinc-800">
            <button 
              onClick={() => setQuickPeriod('hoy')} 
              className="px-4 py-2 text-[10px] font-extrabold uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              Hoy
            </button>
            <button 
              onClick={() => setQuickPeriod('semana')} 
              className="px-4 py-2 text-[10px] font-extrabold uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              Semana
            </button>
            <button 
              onClick={() => setQuickPeriod('mes')} 
              className="px-4 py-2 text-[10px] font-extrabold uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer border-l border-zinc-100 dark:border-zinc-800"
            >
              Mes
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl shadow-xs border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-36">
              <CustomDatePicker 
                value={dateRange.start} 
                onChange={(val) => setDateRange(prev => ({ ...prev, start: val }))} 
              />
            </div>
            <span className="text-zinc-400 font-bold text-xs">/</span>
            <div className="w-36">
              <CustomDatePicker 
                value={dateRange.end} 
                onChange={(val) => setDateRange(prev => ({ ...prev, end: val }))} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Ganancia del Período" 
          value={`$${stats.totalPeriodo.toLocaleString()}`} 
          color="text-rose-500" 
          icon={<TrendingUp size={18}/>} 
        />
        <StatCard 
          title="Total Pagado Hoy" 
          value={`$${stats.hoy.toLocaleString()}`} 
          color="text-emerald-600 dark:text-emerald-400" 
          icon={<CheckCircle2 size={18}/>} 
        />
        <StatCard 
          title="Citas en Lista" 
          value={stats.totalCitas} 
          color="text-zinc-900 dark:text-zinc-100" 
          icon={<CalendarIcon size={18}/>} 
        />
        <StatCard 
          title="Pendientes por Confirmar" 
          value={stats.confirmadas} 
          color="text-amber-600 dark:text-amber-400" 
          icon={<Clock size={18}/>} 
        />
      </section>

      {/* TABLA DE CITAS */}
      <section className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[420px]">
          {loading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-rose-500" size={32} />
              <span className="text-xs font-bold text-zinc-400">Calculando comisiones...</span>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-2xl flex items-center justify-center">
                <Filter size={24}/>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                No hay citas registradas para este rango de fechas.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-zinc-50/80 dark:bg-zinc-800/40 text-[11px] font-bold text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 uppercase tracking-wider">
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4">Cliente & Servicio</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Tu Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                {appointments.map((cita) => {
                  const badge = getStatusStyles(cita.estado);
                  const esPagada = cita.estado?.toLowerCase().trim() === 'cita pagada';

                  return (
                    <tr 
                      key={cita.id} 
                      onClick={() => handleRowClick(cita)}
                      className="group cursor-pointer hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 font-extrabold flex flex-col items-center justify-center shrink-0">
                            <span className="text-xs">{cita.appointment_at.split(/[- T]/)[2]}</span>
                            <span className="text-[8px] uppercase">{new Date(cita.appointment_at.replace(' ', 'T')).toLocaleString('default', { month: 'short' })}</span>
                          </div>
                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                            <Clock size={12} className="text-zinc-400" /> {formatTimeSafe(cita.appointment_at)} 
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 transition-colors uppercase">
                            {cita.cliente}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-medium">
                            {cita.servicio}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-extrabold">
                        <span className={esPagada ? 'text-rose-500 text-sm' : 'text-zinc-400'}>
                          {esPagada ? `+$${(Number(cita.price) * ((session?.comision_base || 40) / 100)).toLocaleString()} COP` : '$0 COP'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* DRAWER LATERAL DE CITAS */}
      <ReservationDrawer
        isOpen={isReservationDrawerOpen}
        onClose={() => { closeReservationDrawer(); setSelectedAppointment(null); }}
        appointmentData={selectedAppointment}
        onSuccess={fetchData}
      />
    </main>
  );
}

function StatCard({ title, value, color, icon }: any) {
  return (
    <div className="bg-white dark:bg-zinc-900/90 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{title}</p>
        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">{icon}</div>
      </div>
      <p className={`text-2xl font-extrabold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}