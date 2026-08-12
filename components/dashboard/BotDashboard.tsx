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
  totalReservations?: number; // Permite renderizar el formato X/Y (ej. 5/10)
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

  // Se ejecuta al cambiar la fecha seleccionada
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
    <div className="w-full space-y-6 p-6 bg-gray-50 dark:bg-zinc-950 min-h-screen text-gray-900 dark:text-zinc-100">
      
      {/* ENCABEZADO CON SELECTOR DE CALENDARIO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl dark:bg-indigo-900/40 dark:text-indigo-400">
              <Bot size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Panel de Control del Bot</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Monitoreo en tiempo real y métricas por rango de fechas.
          </p>
        </div>

        <div className="relative flex items-center gap-3 w-full lg:w-auto" ref={calendarRef}>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-indigo-500 transition-all text-xs font-bold text-gray-700 dark:text-zinc-200"
          >
            <CalendarIcon size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>
              {format(dateRange[0].startDate, "dd MMM yyyy", { locale: es })} —{" "}
              {format(dateRange[0].endDate, "dd MMM yyyy", { locale: es })}
            </span>
          </button>

          {showCalendar && (
            <div className="absolute top-12 right-0 z-50 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-2 pb-2 border-b dark:border-zinc-800">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Rango de Fechas
                </span>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <X size={16} />
                </button>
              </div>

              <DateRange
                editableDateInputs={true}
                onChange={handleSelectRange}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                locale={es}
                rangeColors={["#4f46e5"]}
              />

              <div className="mt-3 pt-2 border-t dark:border-zinc-800 flex justify-end">
                <button
                  onClick={() => {
                    setShowCalendar(false);
                    fetchRealData();
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Aplicar Rango
                </button>
              </div>
            </div>
          )}

          <button
            onClick={fetchRealData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-500/20"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Clientes Atendidos */}
        <div 
          onClick={() => setActiveTab("today")}
          className={`p-5 rounded-2xl border cursor-pointer transition-all shadow-sm space-y-3 ${
            activeTab === "today" 
              ? "bg-indigo-50/50 border-indigo-300 dark:bg-indigo-950/20 dark:border-indigo-800" 
              : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-gray-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Clientes Atendidos</span>
            <Users size={18} className="text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black">{loading ? "..." : metricsData.totalClientsToday}</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              Ver detalle →
            </span>
          </div>

          <div className="pt-2 border-t border-dashed border-gray-200 dark:border-zinc-800 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-gray-400 block font-medium">Primera hora:</span>
              <span className="font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1">
                <Clock size={11} className="text-indigo-500" />
                {loading ? "..." : metricsData.firstInteractionTime}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Última hora:</span>
              <span className="font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1">
                <Clock size={11} className="text-emerald-500" />
                {loading ? "..." : metricsData.lastInteractionTime}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Enviados a Agente */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Enviados a Agente</span>
            <Headphones size={18} className="text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {loading ? "..." : metricsData.agentTransfersCount}
            </span>
            <span className="text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
              Atención humana
            </span>
          </div>
        </div>

        {/* 3. Reservas por Bot (Formato X/Y) */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Reservas por Bot</span>
            <CalendarCheck size={18} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {loading ? "..." : `${metricsData.reservationsByBot}/${metricsData.totalReservations ?? "N/A"}`}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {metricsData.conversionRate}% conv.
            </span>
          </div>
        </div>

        {/* 4. Seguimientos Enviados */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Seguimientos Enviados</span>
            <Send size={18} className="text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black">{loading ? "..." : metricsData.followupsSent}</span>
            <span className="text-xs text-gray-400">Retoques</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN DETALLADA DE TABLAS */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "today"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-zinc-200"
              }`}
            >
              Clientes del Período ({todayClients.length})
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "recent"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-zinc-200"
              }`}
            >
              Sesiones Recientes Hoy ({sessions.length})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 text-xs gap-2">
              <Loader2 size={18} className="animate-spin text-indigo-500" /> Cargando datos...
            </div>
          ) : activeTab === "today" ? (
            
            /* TABLA 1: CLIENTES DEL PERÍODO */
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Teléfono de Cuenta</th>
                  <th className="py-3 px-4 text-center">Cantidad de Mensajes IA</th>
                  <th className="py-3 px-4 text-right">Última Hora de Atención</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredTodayClients.length > 0 ? (
                  filteredTodayClients.map((client, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                        <PhoneCall size={14} className="text-indigo-500" />
                        {client.phone}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-indigo-600 dark:text-indigo-400">
                        <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md">
                          <MessageSquare size={12} />
                          {client.messageCount} msgs
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-600 dark:text-zinc-300">
                        {client.lastTime}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400 italic">
                      No hay interacciones registradas para este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          ) : (

            /* TABLA 2: SESIONES RECIENTES DE HOY */
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Ruta / Agente Bot</th>
                  <th className="py-3 px-4">Resumen del Contexto</th>
                  <th className="py-3 px-4">Última Hora</th>
                  <th className="py-3 px-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredRecentSessions.length > 0 ? (
                  filteredRecentSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold flex items-center gap-2">
                        <PhoneCall size={14} className="text-indigo-500" />
                        {session.client_phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-extrabold uppercase tracking-tight text-[10px]">
                          {session.active_agent}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-gray-600 dark:text-zinc-300">
                        {session.context_summary}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {session.last_bot_message_at}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            session.status === "resolved"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : session.status === "agent_active"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                      No se registraron conversaciones el día de hoy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          )}
        </div>

      </div>
    </div>
  );
}