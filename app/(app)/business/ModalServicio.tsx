"use client";

import { useEffect, useState, useRef } from "react";
import { X, Save, Scissors, Tag, DollarSign, Clock, Link as LinkIcon, Sparkles, ChevronDown, Check } from "lucide-react";

export type ServicioPayload = {
  id?: string;
  SKU: string;
  category: string;
  Servicio: string;
  Precio: number;
  duracion: string | number;
  catalogo?: string | null;
};

type ModalServicioProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  formData?: ServicioPayload | null;
  onSave: (data: ServicioPayload) => void | Promise<void>;
};

const CATEGORIAS_HABITUALES = [
  "Cejas",
  "Pestañas",
  "Retoques de pestañas",
  "Micropigmentación",
  "Refuerzo de color Micropigmentación",
  "Limpieza facial",
  "Depilación"
];

const DURACIONES_RAPIDAS = ["15", "30", "45", "60", "90", "120", "180"];

const EMPTY_SERVICE: ServicioPayload = {
  SKU: "",
  category: "Cejas",
  Servicio: "",
  Precio: 0,
  duracion: "60",
  catalogo: "",
};

/* =========================================================
   🔹 COMPONENTE: SELECTOR DE CATEGORÍA FLOTANTE ESTILIZADO
========================================================= */
function CustomCategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
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

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs hover:border-rose-500/50 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <Tag size={13} className="text-rose-400 shrink-0" />
          <span className="truncate">{value || "Seleccionar categoría..."}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto animate-in fade-in duration-150">
          {CATEGORIAS_HABITUALES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChange(cat);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                value === cat
                  ? "bg-rose-500/10 text-rose-400 border-l-2 border-rose-500"
                  : "text-zinc-300 hover:bg-zinc-800/80"
              }`}
            >
              <span>{cat}</span>
              {value === cat && <Check size={14} className="text-rose-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 MODAL PRINCIPAL DE SERVICIO
========================================================= */
export default function ModalServicio({
  isOpen,
  onClose,
  mode,
  formData,
  onSave,
}: ModalServicioProps) {
  const [form, setForm] = useState<ServicioPayload>(EMPTY_SERVICE);
  const [saving, setSaving] = useState(false);
  const [customCategory, setCustomCategory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "create" || !formData) {
        setForm({ ...EMPTY_SERVICE });
        setCustomCategory(false);
      } else {
        setForm({
          id: formData.id,
          SKU: formData.SKU || "",
          category: formData.category || "General",
          Servicio: formData.Servicio || "",
          Precio: formData.Precio || 0,
          duracion: String(formData.duracion || "60"),
          catalogo: formData.catalogo || "",
        });
        
        if (formData.category && !CATEGORIAS_HABITUALES.includes(formData.category)) {
          setCustomCategory(true);
        } else {
          setCustomCategory(false);
        }
      }
    }
  }, [formData, isOpen, mode]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ServicioPayload, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generateSKU = () => {
    if (!form.Servicio.trim()) return;
    const cleanSku = form.Servicio
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 20);
    
    handleChange("SKU", cleanSku);
  };

  const handleSubmit = async () => {
    if (!form.Servicio.trim()) return alert("El nombre del servicio es obligatorio");
    if (!form.SKU.trim()) return alert("El código SKU es obligatorio");
    if (Number(form.Precio) < 0) return alert("El precio no puede ser negativo");

    setSaving(true);

    try {
      await onSave({
        ...form,
        Precio: Number(form.Precio),
        duracion: String(form.duracion),
      });
      onClose();
    } catch (err: any) {
      console.error("Error guardando servicio:", err);
      alert("Error al guardar el servicio: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 text-zinc-100 font-sans antialiased">
      <div className="w-full max-w-lg bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <Scissors size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-100">
                {mode === "create" ? "Nuevo Servicio" : "Editar Servicio"}
              </h2>
              <p className="text-[10px] font-semibold text-zinc-400">
                {mode === "create" ? "Agrega un tratamiento al catálogo" : `Modificando ${form.Servicio || "Servicio"}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO FORMULARIO */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* Nombre del Servicio */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
              Nombre del Servicio *
            </label>
            <input 
              type="text"
              placeholder="Ej. Diseño y depilación de cejas"
              className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
              value={form.Servicio} 
              onChange={(e) => handleChange("Servicio", e.target.value)} 
            />
          </div>

          {/* SKU y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* SKU */}
            <div className="space-y-1">
              <div className="flex justify-between items-center pr-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                  SKU (Código único) *
                </label>
                <button
                  type="button"
                  onClick={generateSKU}
                  className="text-[9px] font-bold text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Sparkles size={10} /> Auto
                </button>
              </div>
              <input 
                type="text"
                placeholder="cejas_disenio"
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold font-mono text-zinc-100 focus:border-rose-500 transition-colors" 
                value={form.SKU} 
                onChange={(e) => handleChange("SKU", e.target.value)} 
              />
            </div>

            {/* Categoría Estilizada */}
            <div className="space-y-1">
              <div className="flex justify-between items-center pr-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                  Categoría *
                </label>
                <button
                  type="button"
                  onClick={() => setCustomCategory(!customCategory)}
                  className="text-[9px] font-bold text-indigo-400 hover:underline cursor-pointer"
                >
                  {customCategory ? "Ver Lista" : "+ Otra Categoría"}
                </button>
              </div>

              {customCategory ? (
                <input 
                  type="text"
                  placeholder="Escribe la categoría..."
                  className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                  value={form.category} 
                  onChange={(e) => handleChange("category", e.target.value)} 
                />
              ) : (
                <CustomCategorySelect
                  value={form.category}
                  onChange={(val) => handleChange("category", val)}
                />
              )}
            </div>
          </div>

          {/* Precio y Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Precio */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider flex items-center gap-1">
                <DollarSign size={12} className="text-emerald-400" /> Precio (COP) *
              </label>
              <input 
                type="number"
                placeholder="20000"
                step="5000"
                min="0"
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-emerald-400 focus:border-rose-500 transition-colors" 
                value={form.Precio} 
                onChange={(e) => handleChange("Precio", e.target.value)} 
              />
            </div>

            {/* Duración */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider flex items-center gap-1">
                <Clock size={12} className="text-indigo-400" /> Duración (Minutos) *
              </label>
              <input 
                type="number"
                placeholder="60"
                step="15"
                min="5"
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                value={form.duracion} 
                onChange={(e) => handleChange("duracion", e.target.value)} 
              />
            </div>
          </div>

          {/* Accesos Rápidos de Duración */}
          <div className="space-y-1 pt-1">
            <label className="text-[9px] font-bold uppercase text-zinc-500 ml-1 block">
              Tiempos comunes (clic rápido):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DURACIONES_RAPIDAS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleChange("duracion", d)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                    String(form.duracion) === d
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Enlace al Catálogo / WhatsApp */}
          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider flex items-center gap-1">
              <LinkIcon size={12} className="text-rose-400" /> URL Catálogo / WhatsApp (Opcional)
            </label>
            <input 
              type="url"
              placeholder="https://wa.me/p/..."
              className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-medium text-zinc-300 focus:border-rose-500 transition-colors" 
              value={form.catalogo || ""} 
              onChange={(e) => handleChange("catalogo", e.target.value)} 
            />
          </div>

        </div>

        {/* FOOTER ACCIONES */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-2xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={saving}
            className="flex-[1.5] py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={16} /> 
            <span>{saving ? "Guardando..." : mode === "create" ? "Crear Servicio" : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}