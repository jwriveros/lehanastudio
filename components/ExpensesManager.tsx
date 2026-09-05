"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Plus, Trash2, Receipt, Calendar, User, 
  Wallet, FileText, Loader2, X, DollarSign, Repeat, Bell, Sparkles, ChevronDown
} from "lucide-react";

export default function ExpensesManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [recurringRules, setRecurringRules] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [showFixedManager, setShowFixedManager] = useState(false);
  
  const [form, setForm] = useState({
    concepto: "",
    notas: "",
    fecha: new Date().toLocaleDateString('en-CA'),
    especialista: "",
    metodo_pago: "Efectivo",
    valor: "",
    es_fijo: false,
    dia_pago: "1"
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

  /* BOTÓN PRINCIPAL ACTIVADOR */
  if (!isOpen) return (
    <button 
      type="button"
      onClick={() => setIsOpen(true)} 
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black py-3 px-4 rounded-2xl shadow-md shadow-rose-500/20 text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
    >
      <Receipt size={16} /> Gestionar Gastos
    </button>
  );

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-zinc-900 font-sans antialiased animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col w-full max-w-2xl h-[88vh] rounded-3xl overflow-hidden text-zinc-900 dark:text-zinc-100">
        
        {/* ENCABEZADO DEL MODAL */}
        <div className="px-6 py-4.5 border-b border-zinc-200/80 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
              <Receipt size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block leading-none">
                Lehana Studio CRM
              </span>
              <h2 className="text-sm font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5">
                Control de Gastos
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              onClick={() => setShowFixedManager(!showFixedManager)}
              className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                showFixedManager 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400' 
                  : 'border-zinc-200/80 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
              title="Gestionar Gastos Fijos"
            >
              <Repeat size={18} />
            </button>

            <button 
              type="button"
              onClick={() => setIsOpen(false)} 
              className="p-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer rounded-2xl"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CUERPO DEL MODAL CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {showFixedManager ? (
            /* GESTOR DE GASTOS FIJOS (PLANTILLAS AUTOMÁTICAS) */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-rose-500 mb-2">
                <Repeat size={16} />
                <h3 className="text-xs font-extrabold uppercase tracking-wider">Automatizaciones Activas</h3>
              </div>

              {recurringRules.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6">
                  <p className="text-zinc-400 text-xs font-semibold">No hay gastos automáticos configurados aún.</p>
                </div>
              ) : (
                recurringRules.map(rule => (
                  <div key={rule.id} className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 p-4 rounded-3xl flex justify-between items-center shadow-2xs">
                    <div>
                      <span className="text-xs font-extrabold uppercase block text-zinc-900 dark:text-zinc-100">{rule.concepto}</span>
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mt-0.5">
                        Se genera el día {rule.dia_pago} de cada mes
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-rose-500">${rule.valor.toLocaleString("es-CO")} COP</span>
                      <button 
                        type="button"
                        onClick={() => deleteRule(rule.id)} 
                        className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar automatización"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button 
                type="button"
                onClick={() => setShowFixedManager(false)}
                className="w-full py-3 text-xs font-extrabold text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer uppercase tracking-wider"
              >
                Volver al registro manual
              </button>
            </div>
          ) : (
            <>
              {/* FORMULARIO DE REGISTRO MANUAL */}
              <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 space-y-4 shadow-2xs">
                <h3 className="text-xs font-extrabold uppercase text-zinc-900 dark:text-zinc-100 tracking-wider flex items-center gap-2">
                  <Sparkles size={15} className="text-rose-500" />
                  Nuevo Registro de Gasto
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Concepto *</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Insumos de pestañas, Arriendo..."
                      value={form.concepto}
                      onChange={e => setForm({...form, concepto: e.target.value})}
                      className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 px-3.5 text-xs font-bold text-zinc-900 shadow-2xs focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Valor (COP) *</label>
                    <div className="group relative">
                      <DollarSign className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500" size={15} />
                      <input 
                        type="number" 
                        placeholder="0"
                        value={form.valor}
                        onChange={e => setForm({...form, valor: e.target.value})}
                        className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3.5 text-xs font-bold text-zinc-900 shadow-2xs focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                {/* OPCIÓN DE CONVERTIR EN GASTO FIJO AUTOMÁTICO */}
                <div className="flex flex-col gap-3 p-3.5 bg-zinc-50/80 dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.es_fijo}
                      onChange={e => setForm({...form, es_fijo: e.target.checked})}
                      className="h-4 w-4 rounded-md border-zinc-300 text-rose-500 focus:ring-rose-400 dark:bg-zinc-900 dark:border-zinc-700 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Repeat size={15} className={form.es_fijo ? "text-rose-500" : "text-zinc-400"} />
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${form.es_fijo ? 'text-rose-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        ¿Automatizar mensualmente?
                      </span>
                    </div>
                  </label>

                  {form.es_fijo && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-150">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Día de cobro cada mes:</span>
                      <input 
                        type="number" 
                        min="1" max="31"
                        value={form.dia_pago}
                        onChange={e => setForm({...form, dia_pago: e.target.value})}
                        className="w-16 bg-white dark:bg-zinc-900 py-1 px-2.5 rounded-xl text-center font-black text-xs text-rose-500 border border-rose-500/30 outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Fecha</label>
                    <input 
                      type="date" 
                      value={form.fecha} 
                      onChange={e => setForm({...form, fecha: e.target.value})} 
                      className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 px-3 text-xs font-bold text-zinc-900 shadow-2xs focus:border-rose-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Responsable</label>
                    <div className="group relative">
                      <select 
                        value={form.especialista} 
                        onChange={e => setForm({...form, especialista: e.target.value})} 
                        className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white py-2.5 pl-3 pr-8 text-xs font-bold text-zinc-900 shadow-2xs focus:border-rose-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 cursor-pointer"
                      >
                        <option value="">Gasto General</option>
                        {specialists.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Método de Pago</label>
                    <div className="group relative">
                      <select 
                        value={form.metodo_pago} 
                        onChange={e => setForm({...form, metodo_pago: e.target.value})} 
                        className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white py-2.5 pl-3 pr-8 text-xs font-bold text-zinc-900 shadow-2xs focus:border-rose-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 cursor-pointer"
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Caja Menor">Caja Menor</option>
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  {form.es_fijo ? 'Guardar y Activar Automatización' : 'Registrar Gasto'}
                </button>
              </form>

              {/* HISTORIAL RECIENTE DE GASTOS */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase text-zinc-900 dark:text-zinc-100 tracking-wider flex items-center gap-2">
                  <Receipt size={15} className="text-rose-500" />
                  Historial Reciente
                </h3>

                {expenses.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6">
                    <p className="text-zinc-400 text-xs font-semibold">No hay gastos registrados aún.</p>
                  </div>
                ) : (
                  expenses.map((exp) => (
                    <div key={exp.id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-3xl flex justify-between items-center shadow-2xs group">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl relative border border-rose-500/20">
                          <Receipt size={18} />
                          {exp.generado_auto && (
                            <div className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 border border-white dark:border-zinc-900" title="Gasto automático">
                              <Repeat size={10} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold uppercase block text-zinc-900 dark:text-zinc-100">{exp.concepto}</span>
                            {exp.generado_auto && (
                              <span className="flex items-center gap-1 text-[8px] font-black bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                <Bell size={8} /> Automático
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-extrabold text-zinc-400 uppercase">{exp.fecha}</span>
                            <span className="text-[9px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full font-black text-zinc-500 uppercase">{exp.metodo_pago}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-rose-500">-${exp.valor.toLocaleString("es-CO")} COP</span>
                        <button 
                          type="button"
                          onClick={() => deleteExpense(exp.id)} 
                          className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* PIE DEL MODAL CON ACUMULADO */}
        <div className="p-4 sm:p-5 border-t border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          <div className="flex justify-between items-center rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3.5">
            <span className="text-xs font-black uppercase tracking-wider text-rose-500">Total Acumulado</span>
            <span className="text-xl font-black text-rose-500">
              -${expenses.reduce((acc, curr) => acc + curr.valor, 0).toLocaleString("es-CO")} COP
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}