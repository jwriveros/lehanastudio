"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Bot,
  Users,
  CalendarCheck,
  Send,
  Headphones,
  PhoneCall,
  Search,
  Loader2,
  RefreshCw,
  Clock,
  Calendar as CalendarIcon,
  X,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange, RangeKeyDict } from "react-date-range";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Interfaz para la tabla de clientes atendidos
export interface TodayClientDetail {
  phone: string;
  messageCount: number;
  lastTime: string;
}

// Interfaz con las métricas recibidas del backend API
export interface BotMetricData {
  totalClientsToday: number;
  firstInteractionTime: string;
  lastInteractionTime: string;
  agentTransfersCount: number;
  reservationsByBot: number;
  totalReservations?: number;
  followupsSent: number;
  conversionRate: number;
}

// Interfaz para la tabla de sesiones recientes
export interface BotSessionItem {
  id: number;
  client_phone: string;
  status: string;
  active_agent?: string;
  context_summary?: string;
  last_bot_message_at?: string;
}

export default function BotDashboard() {
  const [metricsData, setMetricsData] = useState<BotMetricData>({
    totalClientsToday: 0,
    firstInteractionTime: "—",
    lastInteractionTime: "—",
    agentTransfersCount: 0,
    reservationsByBot: 0,
    totalReservations: 0,
    followupsSent: 0,
    conversionRate: 0,
  });
  const [todayClients, setTodayClients] = useState<TodayClientDetail[]>([]);
  const [sessions, setSessions] = useState<BotSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"today" | "recent">("today");

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

  // Función principal para obtener las métricas desde la API Next.js
  const fetchRealData = async () => {
    setLoading(true);
    try {
      const startStr = format(dateRange[0].startDate, "yyyy-MM-dd");
      const endStr = format(dateRange[0].endDate, "yyyy-MM-dd");

      const res = await fetch(`/api/bot/metrics?startDate=${startStr}&endDate=${endStr}`);
      const json = await res.json();
      if (json.ok) {
        setMetricsData(json.metrics);
        setTodayClients(json.todayClientsDetail || []);
        setSessions(json.sessions || []);
      }
    } catch (err) {
      console.error("Error al conectar con las métricas del bot:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, [dateRange]);

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

  // Filtros de búsqueda en las tablas
  const filteredTodayClients = useMemo(() => {
    return todayClients.filter((client) => client.phone.includes(searchTerm));
  }, [todayClients, searchTerm]);

  const filteredRecentSessions = useMemo(() => {
    return sessions.filter(
      (s) =>
        s.client_phone.includes(searchTerm) ||
        s.context_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.active_agent?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  return (
    <div className="w-full space-y-8 p-4 sm:p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300">
      
      {/* ENCABEZADO PRINCIPAL Y FILTRO DE FECHAS */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-500">
            <Sparkles size={18} />
            <span className="text-xs font-bold tracking-wider uppercase text-rose-500">
              Inteligencia Artificial & WhatsApp
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Panel de Control del Bot
          </h1>
          <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Monitoreo en tiempo real, rendimiento de conversión y métricas por rango de fechas
          </p>
        </div>

        {/* ACCIONES Y SELECTOR DE FECHAS */}
        <div className="relative flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto" ref={calendarRef}>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs hover:border-rose-400 transition-all text-xs font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer"
          >
            <CalendarIcon size={15} className="text-rose-500" />
            <span>
              {format(dateRange[0].startDate, "dd MMM yyyy", { locale: es })} —{" "}
              {format(dateRange[0].endDate, "dd MMM yyyy", { locale: es })}
            </span>
          </button>

          {showCalendar && (
            <div className="absolute top-14 right-0 z-50 bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Seleccionar Rango
                </span>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 [&_*]:!text-zinc-900 dark:[&_*]:!text-zinc-100">
                <DateRange
                  editableDateInputs={true}
                  onChange={handleSelectRange}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  locale={es}
                  rangeColors={["#f43f5e"]}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={() => {
                    setShowCalendar(false);
                    fetchRealData();
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                >
                  Aplicar Rango
                </button>
              </div>
            </div>
          )}

          <button
            onClick={fetchRealData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-rose-500/20 cursor-pointer shrink-0"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Actualizar</span>
          </button>
        </div>
      </header>

      {/* METRICAS PRINCIPALES (KPIS) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Clientes Atendidos */}
        <div 
          onClick={() => setActiveTab("today")}
          className={`p-6 rounded-3xl border cursor-pointer transition-all shadow-xs space-y-4 ${
            activeTab === "today" 
              ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50" 
              : "bg-white dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Clientes Atendidos
            </span>
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
              <Users size={18} />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : metricsData.totalClientsToday}
            </span>
            <span className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1">
              Detalles <ArrowRight size={13} />
            </span>
          </div>

          <div className="pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block font-medium">Primera hora:</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 mt-0.5">
                <Clock size={11} className="text-rose-500" />
                {loading ? "..." : metricsData.firstInteractionTime}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block font-medium">Última hora:</span>
              <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 mt-0.5">
                <Clock size={11} className="text-emerald-500" />
                {loading ? "..." : metricsData.lastInteractionTime}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Enviados a Agente */}
        <div className="p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Enviados a Agente
            </span>
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
              <Headphones size={18} />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
              {loading ? "..." : metricsData.agentTransfersCount}
            </span>
            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 px-2.5 py-1 rounded-full">
              Atención Humana
            </span>
          </div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Derivados para soporte manual
          </span>
        </div>

        {/* 3. Reservas por Bot */}
        <div className="p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Reservas por Bot
            </span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
              <CalendarCheck size={18} />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : `${metricsData.reservationsByBot}/${metricsData.totalReservations ?? "N/A"}`}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={11} /> {metricsData.conversionRate}% Conv.
            </span>
          </div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Citas agendadas automáticamente
          </span>
        </div>

        {/* 4. Seguimientos Enviados */}
        <div className="p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Seguimientos
            </span>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20">
              <Send size={18} />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : metricsData.followupsSent}
            </span>
            <span className="text-xs font-semibold text-indigo-500">Recordatorios</span>
          </div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Notificaciones y retoques
          </span>
        </div>

      </section>

      {/* SECCIÓN DETALLADA DE TABLAS */}
      <section className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-6 sm:p-8 space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* PESTAÑAS TIPO PILL */}
          <div className="flex bg-zinc-100/80 dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "today"
                  ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Clientes del Período ({todayClients.length})
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "recent"
                  ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Sesiones Recientes ({sessions.length})
            </button>
          </div>

          {/* BUSCADOR */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por teléfono o detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs font-medium rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-400 transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* TABLA DE CONTENIDO */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-zinc-400 text-xs gap-2">
              <Loader2 size={20} className="animate-spin text-rose-500" />
              <span>Cargando métricas actualizadas...</span>
            </div>
          ) : activeTab === "today" ? (
            
            /* TABLA 1: CLIENTES DEL PERÍODO */
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold text-[11px] uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-800/30">
                  <th className="py-4 px-6">Teléfono de Cuenta</th>
                  <th className="py-4 px-6 text-center">Cantidad de Mensajes IA</th>
                  <th className="py-4 px-6 text-right">Última Hora de Atención</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredTodayClients.length > 0 ? (
                  filteredTodayClients.map((client, index) => (
                    <tr key={index} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl">
                            <PhoneCall size={14} />
                          </div>
                          <span>{client.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-extrabold text-[11px] px-3 py-1 rounded-xl border border-rose-100 dark:border-rose-900/30">
                          <MessageSquare size={12} />
                          {client.messageCount} msgs
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-zinc-500 dark:text-zinc-400">
                        {client.lastTime}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-zinc-400 font-medium italic">
                      No hay interacciones registradas para este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          ) : (

            /* TABLA 2: SESIONES RECIENTES */
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold text-[11px] uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-800/30">
                  <th className="py-4 px-6">Teléfono</th>
                  <th className="py-4 px-6">Ruta / Agente Bot</th>
                  <th className="py-4 px-6">Resumen del Contexto</th>
                  <th className="py-4 px-6">Última Hora</th>
                  <th className="py-4 px-6 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredRecentSessions.length > 0 ? (
                  filteredRecentSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl">
                            <PhoneCall size={14} />
                          </div>
                          <span>{session.client_phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] uppercase tracking-wider">
                          {session.active_agent || "General"}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-zinc-500 dark:text-zinc-400 font-medium">
                        {session.context_summary || "Sin resumen"}
                      </td>
                      <td className="py-4 px-6 text-zinc-400 font-medium">
                        {session.last_bot_message_at || "—"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span
                          className={`px-3 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider ${
                            session.status === "resolved"
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
                              : session.status === "agent_active"
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                              : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400 font-medium italic">
                      No se registraron conversaciones en este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          )}
        </div>

      </section>
    </div>
  );
}