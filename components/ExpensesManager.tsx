"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Plus, Trash2, Receipt, Calendar, User, 
  Wallet, FileText, Loader2, X, DollarSign, Repeat, Bell
} from "lucide-react";

export default function ExpensesManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [recurringRules, setRecurringRules] = useState<any[]>([]); // Plantillas fijas
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [showFixedManager, setShowFixedManager] = useState(false);
  
  const [form, setForm] = useState({
    concepto: "",
    notas: "",
    fecha: new Date().toLocaleDateString('en-CA'),
    especialista: "",
    metodo_pago: "Efectivo",
    valor: "",
    es_fijo: false, // Checkbox
    dia_pago: "1"   // Día del mes
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    const { data: users } = await supabase.from("app_users").select("name").order("name");
    if (users) setSpecialists(users);

    const { data: exp } = await supabase.from("expenses").select("*").order("fecha", { ascending: false });
    if (exp) setExpenses(exp);

    // Cargar las plantillas fijas
    const { data: recur } = await supabase.from("recurring_expenses").select("*").order("dia_pago");
    if (recur) setRecurringRules(recur);

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.concepto || !form.valor) return alert("Concepto y Valor son obligatorios");

    setLoading(true);
    
    // 1. Registrar el gasto de hoy
    const { error: expError } = await supabase.from("expenses").insert([{
      concepto: form.concepto,
      notas: form.notas,
      fecha: form.fecha,
      especialista: form.especialista,
      metodo_pago: form.metodo_pago,
      valor: Number(form.valor)
    }]);

    // 2. Si es fijo, guardar la plantilla para el futuro
    if (form.es_fijo && !expError) {
      await supabase.from("recurring_expenses").insert([{
        concepto: form.concepto,
        valor: Number(form.valor),
        especialista: form.especialista,
        metodo_pago: form.metodo_pago,
        notas: form.notas,
        dia_pago: Number(form.dia_pago)
      }]);
    }

    if (expError) {
      alert("Error: " + expError.message);
    } else {
      setForm({ ...form, concepto: "", notas: "", valor: "", es_fijo: false });
      loadData();
    }
    setLoading(false);
  };

  const deleteRule = async (id: string) => {
    if (!confirm("¿Eliminar esta automatización? Ya no se creará el gasto cada mes.")) return;
    await supabase.from("recurring_expenses").delete().eq("id", id);
    loadData();
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    loadData();
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-md text-sm transition-all">
      <Receipt size={18} /> Gestionar Gastos
    </button>
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-zinc-900 shadow-2xl border dark:border-zinc-800 flex flex-col w-full max-w-2xl h-[90vh] rounded-[2.5rem] overflow-hidden text-zinc-900 dark:text-zinc-100">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3 font-bold uppercase tracking-tight text-amber-600">
            <Receipt size={24} />
            <span>Control de Gastos</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowFixedManager(!showFixedManager)}
                className={`p-2 rounded-lg transition-all ${showFixedManager ? 'bg-amber-100 text-amber-600' : 'text-zinc-400'}`}
                title="Gestionar Gastos Fijos"
            >
                <Repeat size={20} />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {showFixedManager ? (
            /* GESTOR DE GASTOS FIJOS (PLANTILLAS) */
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-amber-600 mb-4">
                    <Repeat size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest">Automatizaciones Activas</h3>
                </div>
                {recurringRules.length === 0 ? (
                    <p className="text-center py-10 text-zinc-400 text-xs italic">No hay gastos automáticos configurados.</p>
                ) : (
                    recurringRules.map(rule => (
                        <div key={rule.id} className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl flex justify-between items-center">
                            <div>
                                <span className="text-sm font-black block">{rule.concepto}</span>
                                <span className="text-[10px] font-bold text-amber-600 uppercase">Se crea el día {rule.dia_pago} de cada mes</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-zinc-600">${rule.valor.toLocaleString()}</span>
                                <button onClick={() => deleteRule(rule.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
                <button 
                    onClick={() => setShowFixedManager(false)}
                    className="w-full py-3 text-xs font-bold text-zinc-500 border border-dashed rounded-xl"
                >
                    Volver al registro manual
                </button>
            </div>
          ) : (
            <>
            {/* FORMULARIO DE REGISTRO */}
            <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border dark:border-zinc-800 space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2">Nuevo Registro</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Concepto</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Pago de Arriendo"
                    value={form.concepto}
                    onChange={e => setForm({...form, concepto: e.target.value})}
                    className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl text-sm font-bold border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Valor</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input 
                      type="number" 
                      placeholder="0"
                      value={form.valor}
                      onChange={e => setForm({...form, valor: e.target.value})}
                      className="w-full bg-white dark:bg-zinc-900 p-3 pl-10 rounded-xl text-sm font-bold border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* CHECKBOX GASTO FIJO */}
              <div className="flex flex-col gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={form.es_fijo}
                        onChange={e => setForm({...form, es_fijo: e.target.checked})}
                        className="w-5 h-5 rounded-md border-zinc-300 text-amber-500 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-2">
                        <Repeat size={16} className={form.es_fijo ? "text-amber-500" : "text-zinc-400"} />
                        <span className={`text-xs font-black uppercase ${form.es_fijo ? 'text-amber-600' : 'text-zinc-500'}`}>
                            ¿Es un gasto fijo mensual?
                        </span>
                    </div>
                </label>

                {form.es_fijo && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-center justify-between animate-in zoom-in-95 duration-200">
                        <span className="text-[10px] font-bold text-amber-700 uppercase">Se registrará automáticamente el día:</span>
                        <input 
                            type="number" 
                            min="1" max="31"
                            value={form.dia_pago}
                            onChange={e => setForm({...form, dia_pago: e.target.value})}
                            className="w-16 bg-white dark:bg-zinc-900 p-2 rounded-lg text-center font-black text-amber-600 outline-none ring-1 ring-amber-200"
                        />
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl text-xs font-bold border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Responsable</label>
                  <select value={form.especialista} onChange={e => setForm({...form, especialista: e.target.value})} className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl text-xs font-bold border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800">
                    <option value="">Gasto General</option>
                    {specialists.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Pago</label>
                  <select value={form.metodo_pago} onChange={e => setForm({...form, metodo_pago: e.target.value})} className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl text-xs font-bold border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Caja Menor">Caja Menor</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                {form.es_fijo ? 'Guardar y Activar Automatización' : 'Registrar Gasto'}
              </button>
            </form>

            {/* LISTADO DE GASTOS */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest ml-2">Historial Reciente</h3>
              {expenses.length === 0 ? (
                <p className="text-center py-10 text-zinc-400 text-xs font-bold italic">No hay gastos registrados aún.</p>
              ) : (
                expenses.map((exp) => (
                  <div key={exp.id} className="bg-white dark:bg-zinc-800 border dark:border-zinc-800 p-5 rounded-3xl flex justify-between items-center shadow-sm group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl relative">
                        <Receipt size={20} />
                        {exp.generado_auto && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1 border-2 border-white dark:border-zinc-800" title="Gasto automático">
                                <Repeat size={8} />
                            </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black block">{exp.concepto}</span>
                            {exp.generado_auto && (
                                <span className="flex items-center gap-1 text-[8px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-600 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                                    <Bell size={8} /> Automático
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">{exp.fecha}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-full font-black text-zinc-500 uppercase">{exp.metodo_pago}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-black text-red-500">-${exp.valor.toLocaleString()}</span>
                      <button onClick={() => deleteExpense(exp.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            </>
          )}
        </div>

        <div className="p-6 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase text-zinc-400">Total acumulado</span>
            <span className="text-2xl font-black text-red-500">
              ${expenses.reduce((acc, curr) => acc + curr.valor, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}