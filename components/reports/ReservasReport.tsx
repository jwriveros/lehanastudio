"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  UserX,
  Tag,
  Users,
  X,
  ChevronDown,
  Check,
} from "lucide-react";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange, RangeKeyDict } from "react-date-range";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

export type ReservaRecord = {
  id: number;
  cliente: string | null;
  servicio: string | null;
  especialista: string | null;
  celular: string | null;
  appointment_at: string;
  estado: string;
  sede: string;
  price: string;
  price_final: string;
  descuento: string;
  duration: string;
  category: string;
  created_by: string;
  full_phone: string | null;
  survey?: boolean;
};

export interface ReservasReportProps {
  reservasData: ReservaRecord[];
}

const PALETTE = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

/* =========================================================
   🔹 SUB-COMPONENTE: SELECTOR DE ESPECIALISTAS PERSONALIZADO
========================================================= */
function EspecialistaSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value === "TODOS" ? "Todos los Especialistas" : value;

  return (
    <div className="relative w-full sm:w-auto" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs hover:border-rose-400 transition-all text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <Users size={15} className="text-rose-500 shrink-0" />
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180 text-rose-500" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
            {/* Opción Todos */}
            <button
              type="button"
              onClick={() => {
                onChange("TODOS");
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                value === "TODOS"
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>Todos los Especialistas</span>
              {value === "TODOS" && <Check size={14} className="text-rose-500" />}
            </button>

            {/* Opciones individuales */}
            {options.map((esp) => {
              const isSelected = value === esp;
              return (
                <button
                  key={esp}
                  type="button"
                  onClick={() => {
                    onChange(esp);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="truncate">{esp}</span>
                  {isSelected && <Check size={14} className="text-rose-500 shrink-0" />}
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
   🔹 COMPONENTE PRINCIPAL DE REPORTES
========================================================= */
export default function ReservasReport({ reservasData }: ReservasReportProps) {
  // 🌸 ESTADOS PARA REACT-DATE-RANGE
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  // 🌸 ESTADO PARA FILTRO DE ESPECIALISTA
  const [selectedEspecialista, setSelectedEspecialista] = useState<string>("TODOS");

  // 🌸 ESTADOS DE PAGINACIÓN DE TABLA
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

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

  // 📌 1. EXTRAER LISTA ÚNICA DE ESPECIALISTAS DISPONIBLES
  const especialistasDisponibles = useMemo(() => {
    const list = new Set<string>();
    reservasData.forEach((r) => {
      if (r.especialista && r.especialista.trim() !== "") {
        list.add(r.especialista.trim());
      }
    });
    return Array.from(list).sort((a, b) => a.localeCompare(b));
  }, [reservasData]);

  // 📌 2. FILTRADO MULTI-CRITERIO (FECHAS + ESPECIALISTA)
  const filteredReservas = useMemo(() => {
    const startStr = format(dateRange[0].startDate, "yyyy-MM-dd");
    const endStr = format(dateRange[0].endDate, "yyyy-MM-dd");

    return reservasData.filter((r) => {
      // 1. Filtro de Especialista
      if (selectedEspecialista !== "TODOS") {
        const espVal = (r.especialista || "").trim().toLowerCase();
        if (espVal !== selectedEspecialista.toLowerCase()) return false;
      }

      // 2. Filtro de Fechas
      if (!r.appointment_at) return true;
      const fechaCita = r.appointment_at.slice(0, 10);
      if (fechaCita < startStr || fechaCita > endStr) return false;

      return true;
    });
  }, [reservasData, dateRange, selectedEspecialista]);

  // 📌 3. CÁLCULO DE MÉTRICAS Y ANÁLISIS
  const stats = useMemo(() => {
    let totalIngresos = 0;
    let totalDescuentosMonto = 0;
    let citasConDescuento = 0;
    let encuestasRespondidas = 0;
    let canceladas = 0;
    let noPresento = 0;

    const serviciosCount: Record<string, number> = {};
    const clientesMap: Record<string, { nombre: string; citas: number; canceladas: number; noPresento: number; totalGastado: number; survey: boolean }> = {};

    filteredReservas.forEach((r) => {
      const precioFinal = parseFloat(r.price_final || r.price || "0");
      const descuentoVal = parseFloat(r.descuento || "0");
      const clienteKey = r.full_phone || r.cliente || `ID-${r.id}`;
      const clienteNombre = r.cliente || "Sin Nombre";

      totalIngresos += precioFinal;
      if (descuentoVal > 0) {
        totalDescuentosMonto += descuentoVal;
        citasConDescuento++;
      }

      if (r.survey) encuestasRespondidas++;

      const estadoLower = (r.estado || "").toLowerCase();
      const isCancelada = estadoLower.includes("cancelada");
      const isNoPresento = estadoLower.includes("no se presentó");

      if (isCancelada) canceladas++;
      if (isNoPresento) noPresento++;

      const srv = r.servicio || "Otro Servicio";
      serviciosCount[srv] = (serviciosCount[srv] || 0) + 1;

      if (!clientesMap[clienteKey]) {
        clientesMap[clienteKey] = {
          nombre: clienteNombre,
          citas: 0,
          canceladas: 0,
          noPresento: 0,
          totalGastado: 0,
          survey: Boolean(r.survey),
        };
      }
      clientesMap[clienteKey].citas += 1;
      clientesMap[clienteKey].totalGastado += precioFinal;
      if (isCancelada) clientesMap[clienteKey].canceladas += 1;
      if (isNoPresento) clientesMap[clienteKey].noPresento += 1;
      if (r.survey) clientesMap[clienteKey].survey = true;
    });

    const totalCitas = filteredReservas.length;
    const todosClientes = Object.values(clientesMap);
    const clientesRecurrentes = todosClientes.filter((c) => c.citas > 1);
    const clientesUnicaVez = todosClientes.filter((c) => c.citas === 1);

    const topServiciosChartData = Object.entries(serviciosCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const fidelizacionChartData = [
      { name: "Recurrentes (2+ citas)", value: clientesRecurrentes.length },
      { name: "Única vez", value: clientesUnicaVez.length },
    ];

    return {
      totalCitas,
      totalIngresos,
      totalDescuentosMonto,
      citasConDescuento,
      encuestasRespondidas,
      porcentajeEncuestas: totalCitas > 0 ? Math.round((encuestasRespondidas / totalCitas) * 100) : 0,
      canceladas,
      noPresento,
      totalClientesUnicos: todosClientes.length,
      clientesRecurrentesCount: clientesRecurrentes.length,
      clientesUnicaVezCount: clientesUnicaVez.length,
      topServiciosChartData,
      fidelizacionChartData,
    };
  }, [filteredReservas]);

  // Paginación
  const totalPages = Math.ceil(filteredReservas.length / itemsPerPage);
  const paginatedReservas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReservas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReservas, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 bg-white dark:bg-zinc-900/90 p-5 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs text-zinc-800 dark:text-zinc-100 font-sans antialiased">
      
      {/* BARRA SUPERIOR: ENCABEZADO Y FILTROS ESTILIZADOS */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={15} />
            <span>Métricas de Agenda & Reservas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
            Reporte Estratégico de Citas
          </h2>
        </div>

        {/* 🌸 CONTENEDOR DE FILTROS INTEGRADOS CON SELECTOR ELEGANTE */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          
          {/* FILTRO 1: ESPECIALISTA PERSONALIZADO */}
          <EspecialistaSelect
            value={selectedEspecialista}
            onChange={(val) => {
              setSelectedEspecialista(val);
              setCurrentPage(1);
            }}
            options={especialistasDisponibles}
          />

          {/* FILTRO 2: SELECTOR REACT-DATE-RANGE CON MODAL DESPLEGABLE */}
          <div className="relative flex-1 sm:flex-none" ref={calendarRef}>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs hover:border-rose-400 transition-all text-xs font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer"
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
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 
                  [&_.rdrCalendarWrapper]:!bg-transparent 
                  [&_.rdrMonth]:!bg-transparent 
                  [&_.rdrDayInRange]:!bg-rose-500/20 
                  [&_.rdrDayInRange_.rdrDayNumber_span]:!text-rose-600 
                  [&_.rdrDayStartOfWeek]:!bg-rose-500 
                  [&_.rdrDayStartOfWeek_.rdrDayNumber_span]:!text-white 
                  [&_.rdrDayEndOfWeek]:!bg-rose-500 
                  [&_.rdrDayEndOfWeek_.rdrDayNumber_span]:!text-white 
                  [&_.rdrSelected]:!bg-rose-500 
                  [&_.rdrSelected_.rdrDayNumber_span]:!text-white
                  [&_.rdrDayStartPreview]:!bg-rose-500 
                  [&_.rdrDayEndPreview]:!bg-rose-500">
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
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    Aplicar Rango
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* KPIS DE INTELIGENCIA DE NEGOCIO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Encuestas Respondidas</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.encuestasRespondidas}</span>
            <span className="text-xs font-bold text-emerald-600">({stats.porcentajeEncuestas}%)</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">Citas con feedback completado</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Recurrencia de Clientes</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.clientesRecurrentesCount}</span>
            <span className="text-xs font-bold text-zinc-400">/ {stats.clientesUnicaVezCount} 1 cita</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">Clientes que han vuelto a agendar</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Descuentos Otorgados</span>
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
              <Tag size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            ${stats.totalDescuentosMonto.toLocaleString("es-CO")} COP
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">{stats.citasConDescuento} Citas con beneficio</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Ausencias e Inasistencias</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <UserX size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.noPresento}</span>
            <span className="text-xs font-bold text-zinc-400">({stats.canceladas} canceladas)</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">Citas no cumplidas</p>
        </div>

      </div>

      {/* GRÁFICOS ESTRATÉGICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* SERVICIOS MÁS PEDIDOS */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <BarChart3 size={16} className="text-rose-500" />
            Top 6 Servicios Más Solicitados
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topServiciosChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#71717a" opacity={0.2} />
                <XAxis type="number" stroke="#a1a1aa" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={10} width={130} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                <Bar dataKey="value" fill="#EC4899" radius={[0, 8, 8, 0]} name="Reservas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FIDELIZACIÓN Y RECURRENCIA */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <PieIcon size={16} className="text-rose-500" />
            Fidelización de Clientes (Recurrentes vs 1 Cita)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.fidelizacionChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                  {stats.fidelizacionChartData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-center">
            {stats.fidelizacionChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">{item.name}:</span>
                <span className="text-xs font-black text-zinc-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* TABLA PRINCIPAL DE AUDITORÍA */}
      <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <CalendarIcon size={16} className="text-rose-500" />
            Detalle de Citas Filtradas ({filteredReservas.length} registros)
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer focus:border-rose-500 transition-colors"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400">
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Servicio</th>
                <th className="py-2.5 px-3">Especialista</th>
                <th className="py-2.5 px-3">Precio Final</th>
                <th className="py-2.5 px-3">Encuesta</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {paginatedReservas.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-zinc-900 dark:text-white">{r.cliente || "Sin Nombre"}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">{r.servicio}</div>
                    <div className="text-[10px] text-zinc-400">{r.category}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-zinc-700 dark:text-zinc-300">{r.especialista || "Sin Asignar"}</td>
                  <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400">
                    ${parseFloat(r.price_final || r.price || "0").toLocaleString("es-CO")}
                  </td>
                  <td className="py-3 px-3">
                    {r.survey ? (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200">Si respondió</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200">Pendiente</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border border-indigo-200">
                      {r.estado}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-zinc-400">
                    {new Date(r.appointment_at).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINADOR */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Mostrando de <span className="font-bold text-zinc-800 dark:text-zinc-200">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{Math.min(currentPage * itemsPerPage, filteredReservas.length)}</span> de{" "}
              <span className="font-bold text-rose-500">{filteredReservas.length}</span> reservas
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-rose-500 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Página {currentPage} de {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-rose-500 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}