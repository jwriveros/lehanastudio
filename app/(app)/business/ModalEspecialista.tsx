"use client";
import { useState, useEffect } from "react";
import { X, User, Percent, Save, Key, Mail } from "lucide-react";

export default function ModalEspecialista({ isOpen, onClose, mode, formData, onSave }: any) {
  const [activeTab, setActiveTab] = useState<"perfil" | "comisiones">("perfil");
  const [localData, setLocalData] = useState({
    id: "", name: "", email: "", password: "", color: "#6366f1", comision_base: 50, excepciones_comision: {}
  });

  useEffect(() => {
    if (isOpen && formData) {
      setLocalData({
        id: formData.id || "",
        name: formData.name || "",
        email: formData.email || "",
        password: formData.password || "",
        color: formData.color || "#6366f1",
        comision_base: formData.comision_base ?? 50,
        excepciones_comision: formData.excepciones_comision || {},
      });
      setActiveTab("perfil");
    }
  }, [formData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER COMPACTO */}
        <div className="px-5 py-4 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/50">
          <h2 className="text-sm font-bold uppercase tracking-tight italic">
            {mode === "create" ? "Nuevo Especialista" : "Editar Perfil"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* TABS PEQUEÑOS */}
        <div className="flex border-b dark:border-zinc-800">
          <button onClick={() => setActiveTab("perfil")} className={`flex-1 py-3 text-[10px] font-bold uppercase transition-all ${activeTab === "perfil" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10" : "text-zinc-400"}`}>
            Perfil
          </button>
          <button onClick={() => setActiveTab("comisiones")} className={`flex-1 py-3 text-[10px] font-bold uppercase transition-all ${activeTab === "comisiones" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10" : "text-zinc-400"}`}>
            Comisión
          </button>
        </div>

        {/* CONTENIDO REDUCIDO */}
        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          {activeTab === "perfil" ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Nombre</label>
                <input className="w-full bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl outline-none text-sm border border-transparent focus:border-indigo-500" value={localData.name} onChange={e => setLocalData({...localData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Email</label>
                <input className="w-full bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl outline-none text-sm border border-transparent focus:border-indigo-500" value={localData.email} onChange={e => setLocalData({...localData, email: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-indigo-500 mb-1 block flex items-center gap-1">
                  <Key size={10} /> Contraseña
                </label>
                <input type="text" className="w-full bg-indigo-50/30 dark:bg-indigo-900/10 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800 outline-none text-sm" value={localData.password} onChange={e => setLocalData({...localData, password: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Color Identificador</label>
                <div className="flex gap-3 items-center">
                  <div className="h-8 w-8 rounded-lg shadow-sm" style={{ backgroundColor: localData.color }} />
                  <input type="color" className="flex-1 h-8 bg-transparent cursor-pointer" value={localData.color} onChange={e => setLocalData({...localData, color: e.target.value})} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-200 text-center">
              <div className="text-2xl font-black text-indigo-600">{localData.comision_base}%</div>
              <input type="range" min="0" max="100" step="5" className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" value={localData.comision_base} onChange={e => setLocalData({...localData, comision_base: Number(e.target.value)})} />
            </div>
          )}
        </div>

        {/* FOOTER COMPACTO */}
        <div className="p-4 border-t dark:border-zinc-800 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">Cancelar</button>
          <button onClick={() => onSave(localData)} className="flex-[1.5] py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
            {mode === "create" ? "Crear" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}