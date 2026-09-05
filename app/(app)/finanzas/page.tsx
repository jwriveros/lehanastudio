"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Plus, Trash2, Receipt, Calendar as CalendarIcon, User, 
  Loader2, X, DollarSign, Repeat, Bell, ChevronDown, 
  TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, RefreshCcw, Save,
  BarChart3, FileSpreadsheet, Sparkles, ChevronLeft, ChevronRight, Check, CreditCard
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import DailyPaymentsReports from "@/components/DailyPaymentsReports";
import ComparativeReports from "@/components/ComparativeReports";

const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/* =========================================================
   🔹 DATE PICKER PERSONALIZADO (FLOTANTE Y ADAPTATIVO)
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
        <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 mb-1 block tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs hover:border-rose-400 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={14} className="text-rose-500 shrink-0" />
          <span className="truncate">{formatDisplay(value)}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
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
   🔹 SELECTOR DESPLEGABLE PERSONALIZADO
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

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [form, setForm] = useState({
    concepto: "", notas: "", fecha: new Date().toISOString().split('T')[0],
    especialista: "", metodo_pago: "Efectivo", valor: "", es_fijo: false, dia_pago: "1"
  });

  const calcularIngresosLehana = (citas: any[]) => {
    return citas.reduce((acc, cita) => {
      const valorBase = Number(cita.price) || 0;
      const comision = cita.especialista === "Leslie Gutierrez" ? 1 : 0.5;
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

      const { data: ventas } = await supabase
        .from("appointments")
        .select("price, especialista")
        .gte("appointment_at", `${dateRange.from}T00:00:00Z`)
        .lte("appointment_at", `${dateRange.to}T23:59:59Z`)
        .in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA"]);
      
      setTotalVentas(calcularIngresosLehana(ventas || []));

      const { data: exp } = await supabase
        .from("expenses")
        .select("*")
        .gte("fecha", dateRange.from)
        .lte("fecha", dateRange.to)
        .order("fecha", { ascending: false });
      if (exp) setExpenses(exp);

      await loadChartData();

      const { data: recur } = await supabase.from("recurring_expenses").select("*").order("dia_pago");
      if (recur) setRecurringRules(recur);

    } catch (err) {
      console.error(err);
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
      const { data: v } = await supabase.from("appointments").select("price, especialista")
        .gte("appointment_at", m.start).lte("appointment_at", m.end)
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

        {/* CONTROLES Y RANGOS DE FECHA */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="w-36">
              <CustomDatePicker value={dateRange.from} onChange={(val) => setDateRange({ ...dateRange, from: val })} />
            </div>
            <span className="text-zinc-400 font-bold text-xs">/</span>
            <div className="w-36">
              <CustomDatePicker value={dateRange.to} onChange={(val) => setDateRange({ ...dateRange, to: val })} />
            </div>
            <button 
              onClick={() => setRefreshKey(k => k + 1)} 
              className="p-2 hover:rotate-180 transition-all text-zinc-400 hover:text-rose-500 cursor-pointer rounded-xl"
            >
              <RefreshCcw size={14}/>
            </button>
          </div>
          
          {/* BOTÓN DE LIQUIDACIONES CORREGIDO Y CON TAMAÑO HOMOGÉNEO */}
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

      {/* METRICAS FINANCIERAS CON SOPORTE ADAPTATIVO DUAL */}
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

        {/* Balance Final / Utilidad Neta (Totalmente Adaptativo Claro/Oscuro) */}
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

      {/* REPORTES COMPARATIVOS ENVOLVENTE ADAPTATIVO */}
      <section className="w-full rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-xs [&_*]:!text-zinc-900 dark:[&_*]:!text-zinc-100">
        <ComparativeReports />
      </section>

      {/* GRÁFICO HISTÓRICO RECHARTS DE 5 MESES */}
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

      {/* LISTADO DE GASTOS */}
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

      {/* MODAL FLOTANTE DE REGISTRO DE GASTO */}
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
                <CustomDatePicker 
                  label="Fecha" 
                  value={form.fecha} 
                  onChange={(val) => setForm({ ...form, fecha: val })} 
                />

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