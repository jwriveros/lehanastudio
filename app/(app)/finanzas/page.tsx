"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Plus, Trash2, Receipt, Calendar, User, 
  Loader2, X, DollarSign, Repeat, Bell, ChevronDown, 
  TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, RefreshCcw, Save,
  BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
    concepto: "", notas: "", fecha: new Date().toLocaleDateString('en-CA'),
    especialista: "", metodo_pago: "Efectivo", valor: "", es_fijo: false, dia_pago: "1"
  });

  // --- LÓGICA DE AUTOMATIZACIÓN CORREGIDA ---
  const syncRecurringExpenses = async () => {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesReferencia = hoy.toISOString().slice(0, 7); // "2026-02"
    const fechaControl = `${mesReferencia}-01`; // "2026-02-01" para evitar error de tipo date

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
        .select("precio_final")
        .gte("appointment_at", `${dateRange.from}T00:00:00Z`)
        .lte("appointment_at", `${dateRange.to}T23:59:59Z`)
        .in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA"]);
      
      const vTotal = ventas?.reduce((acc, curr) => acc + (Number(curr.precio_final) || 0), 0) || 0;
      setTotalVentas(vTotal);

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
        label: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
        start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      });
    }

    const historicalData = await Promise.all(months.map(async (m) => {
      const { data: v } = await supabase.from("appointments").select("precio_final")
        .gte("appointment_at", m.start).lte("appointment_at", m.end)
        .in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA"]);
      const { data: g } = await supabase.from("expenses").select("valor")
        .gte("fecha", m.start.split('T')[0]).lte("fecha", m.end.split('T')[0]);

      return {
        name: m.label,
        Ingresos: v?.reduce((acc, curr) => acc + (Number(curr.precio_final) || 0), 0) || 0,
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

      if (expError) throw expError;

      if (form.es_fijo) {
        // CORRECCIÓN: Guardamos una fecha completa YYYY-MM-DD en last_created_month
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
      alert("Error: " + err.message);
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
    <main className="p-4 lg:p-6 w-full space-y-6 animate-in fade-in duration-700 text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER INTEGRADO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-zinc-900 dark:text-white">Estado Financiero</h1>
          <div className="flex items-center gap-2 mt-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Balance de Lehana Studio</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl border dark:border-zinc-700 shadow-inner">
              <Calendar size={16} className="text-amber-500" />
              <input type="date" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} className="bg-transparent text-[11px] font-black uppercase outline-none text-zinc-900 dark:text-zinc-100" />
              <span className="text-zinc-400 font-black">/</span>
              <input type="date" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} className="bg-transparent text-[11px] font-black uppercase outline-none text-zinc-900 dark:text-zinc-100" />
              <button onClick={() => setRefreshKey(k => k + 1)} className="ml-2 p-1 hover:rotate-180 transition-all text-zinc-400"><RefreshCcw size={14}/></button>
            </div>
            <button onClick={() => setIsAdding(true)} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl">
              <Plus size={16} /> Nuevo Gasto
            </button>
        </div>
      </header>

      {/* TARJETAS DINÁMICAS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border dark:border-zinc-800 shadow-sm relative overflow-hidden group text-zinc-900 dark:text-zinc-100">
          <div className="flex justify-between items-start"><div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl"><TrendingUp size={24} /></div><ArrowUpRight className="text-emerald-500" size={14} /></div>
          <div className="mt-4"><span className="text-[10px] font-black uppercase tracking-widest">Ingresos</span><p className="text-3xl font-black italic mt-1">${totalVentas.toLocaleString()}</p></div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border dark:border-zinc-800 shadow-sm relative overflow-hidden group text-zinc-900 dark:text-zinc-100">
          <div className="flex justify-between items-start"><div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl"><TrendingDown size={24} /></div><ArrowDownRight className="text-rose-500" size={14} /></div>
          <div className="mt-4"><span className="text-[10px] font-black uppercase tracking-widest">Egresos</span><p className="text-3xl font-black italic mt-1">${totalGastosPeriodo.toLocaleString()}</p></div>
        </div>
        <div className="bg-zinc-900 dark:bg-white p-6 rounded-[2.5rem] shadow-2xl text-white dark:text-zinc-900">
          <div className="flex justify-between items-start"><div className="p-3 bg-zinc-800 dark:bg-zinc-100 rounded-2xl inline-block"><Wallet size={24} /></div><span className="bg-indigo-500 text-white text-[8px] px-2 py-1 rounded-full font-black uppercase italic">Utilidad Neta</span></div>
          <div className="mt-4"><span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Balance Final</span><p className="text-3xl font-black italic tracking-tighter mt-1">${(totalVentas - totalGastosPeriodo).toLocaleString()}</p></div>
        </div>
      </section>

      {/* GRÁFICO 5 MESES */}
      <section className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl"><BarChart3 size={20}/></div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] italic text-zinc-900 dark:text-zinc-100">Rendimiento Histórico</h2>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5}/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
              <YAxis hide />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[10, 10, 10, 10]} barSize={25} />
              <Bar dataKey="Gastos" fill="#f43f5e" radius={[10, 10, 10, 10]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* LISTADO DE GASTOS */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 border dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
             {showFixedManager ? <Repeat size={16}/> : <Receipt size={16}/>} {showFixedManager ? "Gastos Programados" : "Historial del Intervalo"}
          </h3>
          <button onClick={() => setShowFixedManager(!showFixedManager)} className="text-[10px] font-black uppercase text-indigo-600 underline underline-offset-4 decoration-2">
             {showFixedManager ? "Volver" : "Gestionar Gastos Fijos"}
          </button>
        </div>

        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar text-zinc-900 dark:text-zinc-100">
          {showFixedManager ? (
             recurringRules.map(rule => (
              <div key={rule.id} className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-5 rounded-3xl flex justify-between items-center">
                <div><span className="text-sm font-black block uppercase">{rule.concepto}</span><span className="text-[9px] font-bold text-amber-600 uppercase">Día {rule.dia_pago} del mes</span></div>
                <button onClick={() => deleteRule(rule.id)} className="p-2 text-rose-500 hover:bg-white rounded-xl transition-all"><Trash2 size={18} /></button>
              </div>
            ))
          ) : (
            expenses.length === 0 ? (
              <p className="text-center py-20 text-zinc-400 text-[10px] font-bold italic uppercase font-black">Sin movimientos.</p>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="bg-zinc-50 dark:bg-zinc-800/40 border border-transparent hover:border-amber-200 p-5 rounded-3xl flex justify-between items-center group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-zinc-900 text-zinc-400 group-hover:text-emerald-500 rounded-2xl shadow-sm"><Receipt size={20} /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black uppercase block leading-tight">{exp.concepto}</span>
                        {exp.generado_auto && <span className="text-[7px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase">Auto</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-zinc-400 uppercase">
                        <span className="italic">{exp.fecha}</span> • <span>{exp.metodo_pago}</span> {exp.especialista && <span className="text-indigo-500">@{exp.especialista}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-black text-rose-500">-${Number(exp.valor).toLocaleString()}</span>
                    <button onClick={() => deleteExpense(exp.id)} className="p-2 text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* MODAL FLOTANTE */}
      {isAdding && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-hidden text-zinc-900 dark:text-zinc-100">
            <div className="px-8 py-6 border-b dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest italic text-indigo-600">Nuevo Gasto</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <input type="text" required placeholder="Concepto" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl font-bold ring-1 ring-zinc-200 dark:ring-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input type="number" required placeholder="Valor" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 pl-10 rounded-2xl font-bold outline-none ring-1 ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700">
                <input type="checkbox" checked={form.es_fijo} onChange={e => setForm({...form, es_fijo: e.target.checked})} className="w-5 h-5 rounded border-zinc-300 text-indigo-600" />
                <span className="text-[11px] font-black uppercase">¿Automatizar mensualmente?</span>
                {form.es_fijo && <input type="number" min="1" max="31" value={form.dia_pago} onChange={e => setForm({...form, dia_pago: e.target.value})} className="w-14 p-2 rounded-xl text-center font-black text-indigo-600 bg-white" />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-[10px] font-bold outline-none" />
                <select value={form.especialista} onChange={e => setForm({...form, especialista: e.target.value})} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-[10px] font-bold outline-none">
                  <option value="">Responsable</option>
                  {specialists.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <select value={form.metodo_pago} onChange={e => setForm({...form, metodo_pago: e.target.value})} className="col-span-2 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-[10px] font-bold outline-none">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Caja Menor">Caja Menor</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Confirmar Registro
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}