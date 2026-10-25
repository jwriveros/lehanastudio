"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSessionStore } from "@/lib/sessionStore";
import { useUIStore } from "@/lib/uiStore";
import ReservationDrawer from "@/components/reservations/ReservationDrawer";
import { 
  DollarSign, Loader2, Calendar as CalendarIcon,
  TrendingUp, CheckCircle2, Clock, Filter, Sparkles, User,
  X
} from "lucide-react";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange, RangeKeyDict } from "react-date-range";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/* =========================================================
   🔹 PÁGINA PRINCIPAL: MIS INFORMES
========================================================= */
export default function MisInformes() {
  const { session } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPeriodo: 0, hoy: 0, totalCitas: 0, confirmadas: 0 });
  const [appointments, setAppointments] = useState<any[]>([]);

  // 🌸 ESTADOS PARA REACT-DATE-RANGE UNIFICADO (ESTILO BOT)
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  // Cierra el menú desplegable del calendario al hacer clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectRange = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;
    setDateRange([
      {
        startDate: selection.startDate || new Date(),
        endDate: selection.endDate || new Date(),
        key: "selection",
      },
    ]);
  };

  // ESTADOS DEL DRAWER LATERAL
  const isReservationDrawerOpen = useUIStore((state) => state.isReservationDrawerOpen);
  const closeReservationDrawer = useUIStore((state) => state.closeReservationDrawer);
  const openReservationDrawer = useUIStore((state) => state.openReservationDrawer);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  // LÓGICA DE PERIODOS RÁPIDOS ADAPTADA A DATE-RANGE
  const setQuickPeriod = (period: 'hoy' | 'semana' | 'mes') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'hoy') {
      start = new Date();
      end = new Date();
    } else if (period === 'semana') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (period === 'mes') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    setDateRange([
      {
        startDate: start,
        endDate: end,
        key: "selection",
      },
    ]);
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

    const startStr = format(dateRange[0].startDate, "yyyy-MM-dd");
    const endStr = format(dateRange[0].endDate, "yyyy-MM-dd");

    try {
      const { data: citas, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('especialista', session.name)
        .or('estado.eq.Cita pagada,estado.eq.Cita confirmada,estado.eq.Nueva reserva creada,estado.eq.Cita cancelada')
        .gte('appointment_at', `${startStr} 00:00:00`)
        .lte('appointment_at', `${endStr} 23:59:59`)
        .order('appointment_at', { ascending: true });

      if (citas) {
        let totalP = 0, totalH = 0, countConf = 0;
        const currentToday = new Date().toLocaleDateString('en-CA');

        citas.forEach(cita => {
          const estadoNorm = cita.estado?.toLowerCase().trim();

          if (estadoNorm === 'cita pagada') {
            const porcentaje = session.excepciones_comision?.[cita.servicio] ?? session.comision_base ?? 40;
            const comisionFactor = porcentaje / 100;
            const valorReal = Number(cita.price_final ?? cita.price) || 0;
            const gananciaEfectiva = valorReal * comisionFactor;

            totalP += gananciaEfectiva;

            const fechaCitacorta = cita.appointment_at ? cita.appointment_at.split(/[ T]/)[0] : '';
            if (fechaCitacorta === currentToday) {
              totalH += gananciaEfectiva;
            }
          }

          if (estadoNorm === 'cita confirmada' || estadoNorm === 'nueva reserva creada') {
            countConf++;
          }
        });

        setStats({ totalPeriodo: totalP, hoy: totalH, totalCitas: citas.length, confirmadas: countConf });
        setAppointments(citas);
      }
    } finally { 
      setLoading(false); 
    }
  }, [session, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-zinc-900 dark:text-zinc-100 font-sans antialiased animate-in fade-in duration-500">
      
      {/* ENCABEZADO INTEGRADO CON DATEPICKER UNIFICADO */}
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
          
          {/* BOTONES RÁPIDOS */}
          <div className="flex bg-white dark:bg-zinc-900 rounded-2xl p-1 shadow-xs border border-zinc-200/80 dark:border-zinc-800">
            <button 
              type="button"
              onClick={() => setQuickPeriod('hoy')} 
              className="px-4 py-2 text-[10px] font-extrabold uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              Hoy
            </button>
            <button 
              type="button"
              onClick={() => setQuickPeriod('semana')} 
              className="px-4 py-2 text-[10px] font-extrabold uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              Semana
            </button>
            <button 
              type="button"
              onClick={() => setQuickPeriod('mes')} 
              className="px-4 py-2 text-[10px] font-extrabold uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer border-l border-zinc-100 dark:border-zinc-800"
            >
              Mes
            </button>
          </div>

          {/* 🎯 SELECTOR DE CALENDARIO ÚNICO (ESTILO BOT) */}
          <div className="relative w-full sm:w-auto" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs hover:border-rose-400 transition-all text-xs font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer"
            >
              <CalendarIcon size={15} className="text-rose-500" />
              <span>
                {format(dateRange[0].startDate, "dd MMM yyyy", { locale: es })} —{" "}
                {format(dateRange[0].endDate, "dd MMM yyyy", { locale: es })}
              </span>
            </button>

            {showCalendar && (
              <div className="absolute top-12 right-0 z-50 bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Seleccionar Rango
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* 🎯 CONTENEDOR ESTILIZADO CON CONTRASTE Y Z-INDEX CORREGIDO */}
                <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 
                  [&_.rdrCalendarWrapper]:!bg-transparent 
                  [&_.rdrMonth]:!bg-transparent 
                  
                  /* 1. Capa del número: SIEMPRE por encima de los fondos */
                  [&_.rdrDayNumber]:!relative
                  [&_.rdrDayNumber]:!z-10
                  [&_.rdrDayNumber_span]:!relative
                  [&_.rdrDayNumber_span]:!z-10

                  /* 2. Días dentro del rango seleccionado */
                  [&_.rdrDayInRange]:!bg-rose-500/20 
                  [&_.rdrDayInRange_.rdrDayNumber_span]:!text-rose-600 

                  /* 3. Días seleccionados (inicio y fin definitivos) */
                  [&_.rdrSelected]:!bg-rose-500 
                  [&_.rdrSelected_.rdrDayNumber_span]:!text-white

                  /* 4. Vistas previas al situar el cursor (Hover y Preview) */
                  [&_.rdrDayStartPreview]:!bg-rose-500 
                  [&_.rdrDayEndPreview]:!bg-rose-500 
                  [&_.rdrDayInPreview]:!bg-rose-500/20

                  /* 5. Texto en blanco cuando el ratón está encima o en previsualización */
                  [&_.rdrDay:hover_.rdrDayNumber_span]:!text-white
                  [&_.rdrDayHovered_.rdrDayNumber_span]:!text-white
                  [&_.rdrDayStartPreview~.rdrDayNumber_span]:!text-white
                  [&_.rdrDayEndPreview~.rdrDayNumber_span]:!text-white">
                  <DateRange
                    editableDateInputs={true}
                    onChange={handleSelectRange}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                    locale={es}
                    rangeColors={["#ec7c8f"]}
                  />
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCalendar(false);
                      fetchData();
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    Aplicar Rango
                  </button>
                </div>
              </div>
            )}
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

                  const porcentaje = session?.excepciones_comision?.[cita.servicio] ?? session?.comision_base ?? 40;
                  const valorReal = Number(cita.price_final ?? cita.price) || 0;
                  const gananciaCalculada = valorReal * (porcentaje / 100);

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
                          {esPagada ? `+$${gananciaCalculada.toLocaleString('es-CO')} COP` : '$0 COP'}
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