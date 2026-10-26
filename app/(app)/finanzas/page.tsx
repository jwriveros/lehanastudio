"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Plus, Trash2, Receipt, Calendar as CalendarIcon, User, 
  Loader2, X, DollarSign, Repeat, ChevronDown, 
  TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, RefreshCcw, Save,
  BarChart3, Sparkles, Check
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange, RangeKeyDict } from "react-date-range";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import DailyPaymentsReports from "@/components/DailyPaymentsReports";
import ComparativeReports from "@/components/ComparativeReports";

/* =========================================================
   🔹 SELECTOR DESPLEGABLE PERSONALIZADO (SELECT RESPONSABLE)
========================================================= */
function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  label,
  icon: Icon,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  icon?: any;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      {label && (
        <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 mb-1 block tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs hover:border-rose-400 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-rose-500 shrink-0" />}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto animate-in fade-in duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                value === opt.value
                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={14} className="text-rose-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 PÁGINA PRINCIPAL DE FINANZAS
========================================================= */
export default function FinanzasPage() {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [recurringRules, setRecurringRules] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false); 
  const [showFixedManager, setShowFixedManager] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // 🌸 SELECTOR DE RANGO UNIFICADO (REACT-DATE-RANGE)
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  // Cierra el menú desplegable del calendario al hacer clic afuera
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

  const [form, setForm] = useState({
    concepto: "", notas: "", fecha: new Date().toISOString().split('T')[0],
    especialista: "", metodo_pago: "Efectivo", valor: "", es_fijo: false, dia_pago: "1"
  });

  // 🌸 CÁLCULO DE COMISIÓN 50% LEHANA STUDIO
  const calcularIngresosLehana = (citas: any[]) => {
    if (!Array.isArray(citas)) return 0;
    return citas.reduce((acc, cita) => {
      const valorBase = Number(cita.price_final || cita.price || 0);
      const nombreEspecialista = String(cita.especialista || "").trim().toLowerCase();
      const comision = nombreEspecialista === "leslie gutierrez" ? 1.0 : 0.5;
      return acc + (valorBase * comision);
    }, 0);
  };

  const syncRecurringExpenses = async () => {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesReferencia = hoy.toISOString().slice(0, 7);
    const fechaControl = `${mesReferencia}-01`;

    const { data: plantillas } = await supabase
      .from("recurring_expenses")
      .select("*") 
      .lte("dia_pago", diaActual)
      .or(`last_created_month.is.null,last_created_month.lt.${fechaControl}`);

    if (plantillas && plantillas.length > 0) {
      for (const p of plantillas) {
        const { error: insError } = await supabase.from("expenses").insert([{
          concepto: p.concepto,
          valor: Number(p.valor),
          especialista: p.especialista,
          metodo_pago: p.metodo_pago,
          notas: p.notas || "Generado automáticamente",
          fecha: hoy.toISOString().split('T')[0],
          generado_auto: true
        }]);

        if (!insError) {
          await supabase
            .from("recurring_expenses")
            .update({ last_created_month: fechaControl })
            .eq("id", p.id);
        }
      }
      loadData();
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: users } = await supabase.from("app_users").select("name").order("name");
      if (users) setSpecialists(users);

      const startStr = format(dateRange[0].startDate, "yyyy-MM-dd");
      const endStr = format(dateRange[0].endDate, "yyyy-MM-dd");

      const { data: ventas } = await supabase
        .from("appointments")
        .select("price, price_final, especialista, estado")
        .gte("appointment_at", `${startStr}T00:00:00Z`)
        .lte("appointment_at", `${endStr}T23:59:59Z`)
        .in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA"]);
      
      setTotalVentas(calcularIngresosLehana(ventas || []));

      const { data: exp } = await supabase
        .from("expenses")
        .select("*")
        .gte("fecha", startStr)
        .lte("fecha", endStr)
        .order("fecha", { ascending: false });
      if (exp) setExpenses(exp);

      await loadChartData();

      const { data: recur } = await supabase.from("recurring_expenses").select("*").order("dia_pago");
      if (recur) setRecurringRules(recur);

    } catch (err) {
      console.error("Error al cargar finanzas:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    const months = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
        start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      });
    }

    const historicalData = await Promise.all(months.map(async (m) => {
      const { data: v } = await supabase.from("appointments")
        .select("price, price_final, especialista, estado")
        .gte("appointment_at", m.start)
        .lte("appointment_at", m.end)
        .in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA"]);

      const { data: g } = await supabase.from("expenses").select("valor")
        .gte("fecha", m.start.split('T')[0]).lte("fecha", m.end.split('T')[0]);

      return {
        name: m.name,
        Ingresos: calcularIngresosLehana(v || []),
        Gastos: g?.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) || 0,
      };
    }));
    setChartData(historicalData);
  };

  useEffect(() => { 
    loadData();
    syncRecurringExpenses();
  }, [dateRange, refreshKey]);

  const totalGastosPeriodo = useMemo(() => expenses.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0), [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.concepto || !form.valor) return alert("Concepto y Valor son obligatorios");

    setLoading(true);
    try {
      const { error: expError } = await supabase.from("expenses").insert([{
        concepto: form.concepto,
        fecha: form.fecha,
        especialista: form.especialista,
        metodo_pago: form.metodo_pago,
        valor: Number(form.valor)
      }]);

      if (form.es_fijo && !expError) {
        const fechaParaControl = `${new Date().toISOString().slice(0, 7)}-01`;
        await supabase.from("recurring_expenses").insert([{
          concepto: form.concepto,
          valor: Number(form.valor),
          especialista: form.especialista,
          metodo_pago: form.metodo_pago,
          dia_pago: Number(form.dia_pago),
          last_created_month: fechaParaControl 
        }]);
      }

      setForm({ ...form, concepto: "", valor: "", es_fijo: false });
      setIsAdding(false);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("¿Eliminar gasto?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    setRefreshKey(prev => prev + 1);
  };

  const deleteRule = async (id: string) => {
    if (!confirm("¿Eliminar automatización?")) return;
    await supabase.from("recurring_expenses").delete().eq("id", id);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      
      {/* ENCABEZADO INTEGRADO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-500">
            <Sparkles size={18} />
            <span className="text-xs font-bold tracking-wider uppercase text-rose-500">
              Módulo Financiero
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Estado Financiero
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Balance general y flujo de caja Lehana Studio
            </span>
          </div>
        </div>

        {/* 🎯 CONTROLES: SELECTOR DE RANGO UNIFICADO ESTILO BOT */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
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

                  /* 3. Días seleccionados */
                  [&_.rdrSelected]:!bg-rose-500 
                  [&_.rdrSelected_.rdrDayNumber_span]:!text-white

                  /* 4. Vistas previas al situar el cursor (Hover y Preview) */
                  [&_.rdrDayStartPreview]:!bg-rose-500 
                  [&_.rdrDayEndPreview]:!bg-rose-500 
                  [&_.rdrDayInPreview]:!bg-rose-500/20

                  /* 5. Texto en blanco cuando el ratón está encima */
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
                    rangeColors={["#f5647c"]}
                  />
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCalendar(false);
                      loadData();
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    Aplicar Rango
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setRefreshKey(k => k + 1)} 
            className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-rose-400 rounded-2xl shadow-xs transition-all text-zinc-400 hover:text-rose-500 cursor-pointer"
          >
            <RefreshCcw size={15}/>
          </button>
          
          {/* BOTÓN DE LIQUIDACIONES */}
          <div className="[&_button]:!py-3 [&_button]:!px-5 [&_button]:!rounded-2xl [&_button]:!text-xs [&_button]:!font-bold [&_button]:!shadow-xs [&_button]:!bg-zinc-100 dark:[&_button]:!bg-zinc-900 [&_button]:!text-zinc-800 dark:[&_button]:!text-zinc-100 [&_button]:!border [&_button]:!border-zinc-200 dark:[&_button]:!border-zinc-800 hover:[&_button]:!border-rose-400 transition-all">
            <DailyPaymentsReports />
          </div>

          {/* BOTÓN NUEVO GASTO */}
          <button 
            onClick={() => setIsAdding(true)} 
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={16} /> <span>Nuevo Gasto</span>
          </button>
        </div>
      </header>

      {/* METRICAS FINANCIERAS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Ingresos */}
        <div className="bg-white dark:bg-zinc-900/90 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
              <TrendingUp size={22} />
            </div>
            <ArrowUpRight className="text-emerald-500" size={16} />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Ingresos del Período
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
              ${totalVentas.toLocaleString()} COP
            </p>
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white dark:bg-zinc-900/90 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
              <TrendingDown size={22} />
            </div>
            <ArrowDownRight className="text-rose-500" size={16} />
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Gastos del Período
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-rose-500">
              ${totalGastosPeriodo.toLocaleString()} COP
            </p>
          </div>
        </div>

        {/* Balance Final / Utilidad Neta */}
        <div className="bg-white dark:bg-zinc-900/90 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
              <Wallet size={22} />
            </div>
            <span className="bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-rose-500/20">
              Utilidad Neta
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Balance Final
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-zinc-900 dark:text-zinc-50">
              ${(totalVentas - totalGastosPeriodo).toLocaleString()} COP
            </p>
          </div>
        </div>

      </section>

      {/* REPORTES COMPARATIVOS */}
      <section className="w-full rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-xs [&_*]:!text-zinc-900 dark:[&_*]:!text-zinc-100">
        <ComparativeReports />
      </section>

      {/* GRÁFICO HISTÓRICO DE 5 MESES */}
      <section className="bg-white dark:bg-zinc-900/90 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
            <BarChart3 size={20}/>
          </div>
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            Rendimiento Histórico (Últimos 5 Meses)
          </h2>
        </div>
        
        <div className="h-[300px] w-full" style={{ minHeight: "300px" }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2}/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 700, fill: '#888'}} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: 'transparent'}} 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  borderRadius: '16px', 
                  border: '1px solid #27272a', 
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }} 
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[8, 8, 0, 0]} barSize={22} />
              <Bar dataKey="Gastos" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* HISTORIAL Y GESTIÓN DE GASTOS */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex justify-between items-center px-1 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            {showFixedManager ? <Repeat size={16} className="text-rose-500" /> : <Receipt size={16} className="text-rose-500" />} 
            {showFixedManager ? "Gastos Programados Recurrentes" : "Historial del Período"}
          </h3>
          <button 
            onClick={() => setShowFixedManager(!showFixedManager)} 
            className="text-[11px] font-extrabold text-rose-500 hover:underline cursor-pointer"
          >
            {showFixedManager ? "← Volver al Historial" : "Gestionar Gastos Fijos"}
          </button>
        </div>

        <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3">
          {showFixedManager ? (
            recurringRules.length === 0 ? (
              <p className="text-center py-12 text-zinc-400 text-xs font-medium italic">
                No hay reglas de gastos recurrentes configuradas.
              </p>
            ) : (
              recurringRules.map(rule => (
                <div key={rule.id} className="bg-amber-500/10 border border-amber-500/20 p-4 sm:p-5 rounded-2xl flex justify-between items-center animate-in fade-in">
                  <div>
                    <span className="text-xs font-bold block uppercase text-zinc-900 dark:text-zinc-100">{rule.concepto}</span>
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase">Día {rule.dia_pago} de cada mes • ${Number(rule.valor).toLocaleString()} COP</span>
                  </div>
                  <button onClick={() => deleteRule(rule.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )
          ) : (
            expenses.length === 0 ? (
              <p className="text-center py-16 text-zinc-400 text-xs font-medium italic">
                Sin movimientos registrados en este período.
              </p>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800 p-4 sm:p-5 rounded-2xl flex justify-between items-center group hover:border-rose-400/40 transition-all">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-white dark:bg-zinc-900 text-zinc-400 group-hover:text-rose-500 rounded-xl shadow-xs transition-colors shrink-0">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{exp.concepto}</span>
                        {exp.generado_auto && <span className="text-[9px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">Auto</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-zinc-400">
                        <span>{exp.fecha}</span> • <span>{exp.metodo_pago}</span> {exp.especialista && <span className="text-rose-500">@{exp.especialista}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs sm:text-sm font-extrabold text-rose-500">-${Number(exp.valor).toLocaleString()}</span>
                    <button onClick={() => deleteExpense(exp.id)} className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* MODAL DE NUEVO GASTO */}
      {isAdding && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in text-zinc-900 dark:text-zinc-100">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-rose-500" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Registrar Nuevo Gasto
                </h2>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">Concepto *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. Insumos de pestañas" 
                  value={form.concepto} 
                  onChange={e => setForm({...form, concepto: e.target.value})} 
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500 transition-colors" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">Valor (COP) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input 
                    type="number" 
                    required 
                    placeholder="50000" 
                    value={form.valor} 
                    onChange={e => setForm({...form, valor: e.target.value})} 
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 pl-9 rounded-2xl text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500 transition-colors" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <input 
                  type="checkbox" 
                  id="es_fijo"
                  checked={form.es_fijo} 
                  onChange={e => setForm({...form, es_fijo: e.target.checked})} 
                  className="w-4 h-4 rounded border-zinc-300 text-rose-500 focus:ring-rose-500 cursor-pointer" 
                />
                <label htmlFor="es_fijo" className="text-xs font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer flex-1">
                  ¿Automatizar mensualmente?
                </label>
                {form.es_fijo && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-400 font-bold">Día:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="31" 
                      value={form.dia_pago} 
                      onChange={e => setForm({...form, dia_pago: e.target.value})} 
                      className="w-12 p-1.5 rounded-xl text-center text-xs font-bold bg-white dark:bg-zinc-900 border border-rose-300 text-rose-500 outline-none" 
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 p-3 rounded-2xl text-xs font-bold outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <CustomSelect 
                  label="Responsable"
                  icon={User}
                  placeholder="Opcional..."
                  value={form.especialista}
                  onChange={(val) => setForm({ ...form, especialista: val })}
                  options={specialists.map(s => ({ label: s.name, value: s.name }))}
                />
              </div>

              <CustomSelect 
                label="Método de Pago"
                placeholder="Seleccionar..."
                value={form.metodo_pago}
                onChange={(val) => setForm({ ...form, metodo_pago: val })}
                options={[
                  { label: "Efectivo", value: "Efectivo" },
                  { label: "Transferencia", value: "Transferencia" },
                  { label: "Tarjeta de Crédito", value: "Tarjeta de Crédito" },
                  { label: "Caja Menor", value: "Caja Menor" },
                ]}
              />

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)} 
                  className="flex-1 py-3 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-2xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-[1.5] py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Confirmar Registro
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </main>
  );
}