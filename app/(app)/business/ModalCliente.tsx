"use client";

import { useEffect, useState } from "react";
import { X, Save, ClipboardList, History, User, MapPin } from "lucide-react";
import { ClientePayload } from "./page";
import FichaTecnicaEditor from "@/components/reservations/FichaTecnicaEditor";

type ModalClienteProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  formData: ClientePayload;
  onCreate: (data: ClientePayload) => void | Promise<void>;
  onUpdate: (data: ClientePayload) => void | Promise<void>;
};

const COUNTRIES = [
  { code: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "+1", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "+34", flag: "🇪🇸", name: "España" },
  { code: "+52", flag: "🇲🇽", name: "México" },
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "+51", flag: "🇵🇪", name: "Perú" },
  { code: "+58", flag: "🇻🇪", name: "Venezuela" },
  { code: "+593", flag: "🇪🇨", name: "Ecuador" },
  { code: "+502", flag: "🇬🇹", name: "Guatemala" },
  { code: "+53", flag: "🇨🇺", name: "Cuba" },
  { code: "+591", flag: "🇧🇴", name: "Bolivia" },
  { code: "+506", flag: "🇨🇷", name: "Costa Rica" },
  { code: "+1", flag: "🇩🇴", name: "Rep. Dominicana" },
  { code: "+503", flag: "🇸🇻", name: "El Salvador" },
  { code: "+504", flag: "🇭🇳", name: "Honduras" },
  { code: "+505", flag: "🇳🇮", name: "Nicaragua" },
  { code: "+507", flag: "🇵🇦", name: "Panamá" },
  { code: "+595", flag: "🇵🇾", name: "Paraguay" },
  { code: "+598", flag: "🇺🇾", name: "Uruguay" },
  { code: "+1", flag: "🇵🇷", name: "Puerto Rico" },
  { code: "+55", flag: "🇧🇷", name: "Brasil" },
  { code: "+33", flag: "🇫🇷", name: "Francia" },
  { code: "+39", flag: "🇮🇹", name: "Italia" },
  { code: "+49", flag: "🇩🇪", name: "Alemania" },
  { code: "+44", flag: "🇬🇧", name: "Reino Unido" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+41", flag: "🇨🇭", name: "Suiza" },
  { code: "+32", flag: "🇧🇪", name: "Bélgica" },
  { code: "+31", flag: "🇳🇱", name: "Países Bajos" },
  { code: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "+46", flag: "🇸🇪", name: "Suecia" },
  { code: "+47", flag: "🇳🇴", name: "Noruega" },
  { code: "+45", flag: "🇩🇰", name: "Dinamarca" },
  { code: "+358", flag: "🇫🇮", name: "Finlandia" },
  { code: "+30", flag: "🇬🇷", name: "Grecia" },
  { code: "+353", flag: "🇮🇪", name: "Irlanda" },
  { code: "+7", flag: "🇷🇺", name: "Rusia" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japón" },
  { code: "+82", flag: "🇰🇷", name: "Corea del Sur" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+64", flag: "🇳🇿", name: "Nueva Zelanda" },
  { code: "+27", flag: "🇿🇦", name: "Sudáfrica" },
  { code: "+20", flag: "🇪🇬", name: "Egipto" },
  { code: "+971", flag: "🇦🇪", name: "Emiratos Árabes" },
  { code: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "+90", flag: "🇹🇷", name: "Turquía" },
  { code: "+63", flag: "🇵🇭", name: "Filipinas" },
  { code: "+66", flag: "🇹🇭", name: "Tailandia" },
  { code: "+65", flag: "🇸🇬", name: "Singapur" },
  { code: "+60", flag: "🇲🇾", name: "Malasia" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+84", flag: "🇻🇳", name: "Vietnam" }
].sort((a, b) => a.name.localeCompare(b.name));

export default function ModalCliente({
  isOpen,
  onClose,
  mode,
  formData,
  onCreate,
  onUpdate,
}: ModalClienteProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "ubicacion" | "ficha">("personal");
  const [form, setForm] = useState<ClientePayload>(formData);

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...formData,
        nombre: formData.nombre || "",
        celular: formData.celular || "",
        tipo: formData.tipo || "Cliente",
        estado: formData.estado || "Activo",
        indicador: formData.indicador || "+57",
        correo_electronico: formData.correo_electronico || "",
        identificacion: formData.identificacion || "",
        genero: formData.genero || "",
        direccion: formData.direccion || "",
        cumpleanos: formData.cumpleanos || "",
        departamento: formData.departamento || "",
        municipio: formData.municipio || "",
      });
      
      // Si el modo es 'view', abrimos directamente la ficha técnica
      if (mode === "view") {
        setActiveTab("ficha");
      } else {
        setActiveTab("personal");
      }
    }
  }, [formData, isOpen, mode]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ClientePayload, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    if (!form.celular.trim()) return alert("El celular es obligatorio");

    if (mode === "create") onCreate(form);
    else onUpdate(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-5 py-4 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/50">
          <h2 className="text-sm font-bold uppercase italic tracking-tight">
            {mode === "create" ? "Nuevo Cliente" : (mode === "view" ? "Expediente Cliente" : "Editar Cliente")}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b dark:border-zinc-800">
          <button 
            onClick={() => setActiveTab("personal")} 
            className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${activeTab === "personal" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10" : "text-zinc-400"}`}
          >
            Información
          </button>
          
          {/* Mostramos pestaña de Ficha Técnica si el cliente ya existe */}
          {form.celular && (
            <button 
              onClick={() => setActiveTab("ficha")} 
              className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${activeTab === "ficha" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10" : "text-zinc-400"}`}
            >
              Ficha / Citas
            </button>
          )}

          <button 
            onClick={() => setActiveTab("ubicacion")} 
            className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${activeTab === "ubicacion" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10" : "text-zinc-400"}`}
          >
            Ubicación
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === "personal" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Nombre Completo *</label>
                <input 
                  className="w-full bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl outline-none text-sm border border-transparent focus:border-indigo-500 font-bold" 
                  value={form.nombre} 
                  onChange={e => handleChange("nombre", e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Celular *</label>
                <div className="flex gap-2">
                  <div className="relative w-28">
                    <select 
                      className="w-full bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl text-sm font-bold border border-transparent focus:border-indigo-500 outline-none appearance-none"
                      value={form.indicador}
                      onChange={(e) => handleChange("indicador", e.target.value)}
                    >
                      {COUNTRIES.map(c => (
                        <option key={`${c.flag}-${c.code}`} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-3 pointer-events-none text-[10px] opacity-30">▼</div>
                  </div>
                  <input 
                    type="tel"
                    placeholder="Número"
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl outline-none text-sm border border-transparent focus:border-indigo-500 font-bold"
                    value={form.celular}
                    onChange={e => handleChange("celular", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Tipo</label>
                  <select className="w-full bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl text-xs font-bold outline-none" value={form.tipo} onChange={e => handleChange("tipo", e.target.value)}>
                    <option value="Cliente">Cliente</option>
                    <option value="Contacto">Contacto</option>
                    <option value="Proveedor">Proveedor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Estado</label>
                  <select className="w-full bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl text-xs font-bold outline-none" value={form.estado} onChange={e => handleChange("estado", e.target.value)}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ficha" && form.celular && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <FichaTecnicaEditor celular={form.celular} />
            </div>
          )}

          {activeTab === "ubicacion" && (
            <div className="space-y-3 animate-in slide-in-from-right duration-200">
              <div>
                <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Dirección</label>
                <input className="w-full bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl outline-none text-sm" value={form.direccion || ""} onChange={e => handleChange("direccion", e.target.value)} placeholder="Calle..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Municipio</label>
                  <input className="w-full bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl outline-none text-xs" value={form.municipio || ""} onChange={e => handleChange("municipio", e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Identificación</label>
                  <input className="w-full bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl outline-none text-xs" value={form.identificacion || ""} onChange={e => handleChange("identificacion", e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER: Solo se muestra si no estamos en la pestaña de Ficha Técnica */}
        {activeTab !== "ficha" && (
          <div className="p-4 border-t dark:border-zinc-800 flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">Cancelar</button>
            <button onClick={handleSubmit} className="flex-[1.5] py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Save size={14} /> {mode === "create" ? "Registrar" : "Actualizar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}