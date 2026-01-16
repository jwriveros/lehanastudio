"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Plus, Trash2, Receipt, Calendar, User, 
  Wallet, FileText, Loader2, X, DollarSign 
} from "lucide-react";

export default function ExpensesManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  
  // Estado del formulario
  const [form, setForm] = useState({
    concepto: "",
    notas: "",
    fecha: new Date().toLocaleDateString('en-CA'),
    especialista: "",
    metodo_pago: "Efectivo",
    valor: ""
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    // Cargar especialistas para el select
    const { data: users } = await supabase.from("app_users").select("name").order("name");
    if (users) setSpecialists(users);

    // Cargar gastos del mes actual
    const { data: exp } = await supabase
      .from("expenses")
      .select("*")
      .order("fecha", { ascending: false });
    if (exp) setExpenses(exp);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.concepto || !form.valor) return alert("Concepto y Valor son obligatorios");

    setLoading(true);
    const { error } = await supabase.from("expenses").insert([{
      ...form,
      valor: Number(form.valor)
    }]);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      setForm({ ...form, concepto: "", notas: "", valor: "" });
      loadData();
    }
    setLoading(false);
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
          <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* FORMULARIO DE REGISTRO */}
          <form onSubmit={handleSubmit} className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-2">Nuevo Registro</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Concepto</label>
                <input 
                  type="text" 
                  placeholder="Ej: Insumos de pestañas"
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Fecha</label>
                <input 
                  type="date" 
                  value={form.fecha}
                  onChange={e => setForm({...form, fecha: e.target.value})}
                  className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl text-xs font-bold border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Responsable</label>
                <select 
                  value={form.especialista}
                  onChange={e => setForm({...form, especialista: e.target.value})}
                  className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl text-xs font-bold border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800"
                >
                  <option value="">Gasto General</option>
                  {specialists.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1 col-span-2 md:col-span-1">
                <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Pago</label>
                <select 
                  value={form.metodo_pago}
                  onChange={e => setForm({...form, metodo_pago: e.target.value})}
                  className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl text-xs font-bold border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Caja Menor">Caja Menor</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase ml-1 text-zinc-500">Notas adicionales</label>
              <textarea 
                rows={2}
                placeholder="Detalles del gasto..."
                value={form.notas}
                onChange={e => setForm({...form, notas: e.target.value})}
                className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl text-sm font-medium border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-amber-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
              Registrar Gasto
            </button>
          </form>

          {/* LISTADO DE GASTOS RECUPERADOS */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest ml-2">Historial Reciente</h3>
            {expenses.length === 0 ? (
              <p className="text-center py-10 text-zinc-400 text-xs font-bold italic">No hay gastos registrados aún.</p>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="bg-white dark:bg-zinc-800 border dark:border-zinc-800 p-5 rounded-3xl flex justify-between items-center shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <span className="text-sm font-black block">{exp.concepto}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{exp.fecha}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-full font-black text-zinc-500 uppercase">{exp.metodo_pago}</span>
                        {exp.especialista && <span className="text-[10px] text-indigo-500 font-bold uppercase">{exp.especialista}</span>}
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