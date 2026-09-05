"use client";

import { useEffect, useState } from "react";
import { X, Save, User, MapPin, Sparkles, Building, ChevronDown, Check, CreditCard, Mail } from "lucide-react";
import FichaTecnicaEditor from "@/components/reservations/FichaTecnicaEditor";

export type ClientePayload = {
  id?: number;
  celular: string;
  nombre: string;
  tipo: string;
  direccion?: string;
  cumpleanos?: string;
  identificacion?: string;
  correo_electronico?: string;
  estado: string;
  genero?: string;
  indicador: string;
  departamento?: string;
  municipio?: string;
  BSUID?: string;
  nombre_comercial?: string;
  sede?: string;
};

type ModalClienteProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  formData: ClientePayload;
  onCreate: (data: ClientePayload) => void | Promise<void>;
  onUpdate: (data: ClientePayload) => void | Promise<void>;
};

const SEDES_OPCIONES = ["Marquetalia", "Buga", "Santa Marta"];

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

const EMPTY_FORM: ClientePayload = {
  nombre: "",
  celular: "",
  tipo: "Cliente",
  estado: "Activo",
  indicador: "+57",
  correo_electronico: "",
  identificacion: "",
  genero: "",
  direccion: "",
  cumpleanos: "",
  departamento: "",
  municipio: "",
  BSUID: "",
  nombre_comercial: "",
  sede: "Marquetalia",
};

export default function ModalCliente({
  isOpen,
  onClose,
  mode,
  formData,
  onCreate,
  onUpdate,
}: ModalClienteProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "ubicacion" | "ficha">("personal");
  const [form, setForm] = useState<ClientePayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // EFECTO CORREGIDO: Reinicia a valores vacíos si el modo es 'create'
  useEffect(() => {
    if (isOpen) {
      if (mode === "create") {
        setForm({ ...EMPTY_FORM });
        setActiveTab("personal");
      } else {
        // Al editar o ver, cargamos los datos del cliente seleccionado preservando el ID
        setForm({
          id: formData.id,
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
          BSUID: formData.BSUID || "",
          nombre_comercial: formData.nombre_comercial || "",
          sede: formData.sede || "Marquetalia",
        });

        if (mode === "view") {
          setActiveTab("ficha");
        } else {
          setActiveTab("personal");
        }
      }
    }
  }, [formData, isOpen, mode]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ClientePayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    if (!form.celular.trim()) return alert("El celular es obligatorio");

    setSaving(true);

    try {
      if (mode === "create") {
        await onCreate(form);
      } else {
        await onUpdate(form);
      }
      onClose();
    } catch (err: any) {
      console.error("Error guardando cliente:", err);
      alert("Error guardando cliente: " + (err.message || "Error desconocido"));
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
              <User size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-100">
                {mode === "create" ? "Nuevo Cliente" : (mode === "view" ? "Expediente del Cliente" : "Editar Cliente")}
              </h2>
              <p className="text-[10px] font-semibold text-zinc-400">
                {mode === "create" ? "Ingresa la información del nuevo registro" : `Gestionando a ${form.nombre || "Cliente"}`}
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

        {/* TAB NAVEGACIÓN TIPO PILL */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-1.5 gap-1">
          <button 
            onClick={() => setActiveTab("personal")} 
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "personal" 
                ? "bg-zinc-800 text-rose-400 shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Información
          </button>
          
          <button 
            onClick={() => setActiveTab("ubicacion")} 
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ubicacion" 
                ? "bg-zinc-800 text-rose-400 shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Ubicación / Sede
          </button>

          {mode !== "create" && form.celular && (
            <button 
              onClick={() => setActiveTab("ficha")} 
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ficha" 
                  ? "bg-zinc-800 text-rose-400 shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Ficha / Citas
            </button>
          )}
        </div>

        {/* CONTENIDO DEL FORMULARIO */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          
          {/* PESTAÑA INFORMACIÓN PERSONAL */}
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Nombre Completo */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                  Nombre Completo *
                </label>
                <input 
                  type="text"
                  placeholder="Ej. María Pérez"
                  className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                  value={form.nombre} 
                  onChange={(e) => handleChange("nombre", e.target.value)} 
                />
              </div>

              {/* Nombre Comercial y BSUID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                    Nombre Comercial / Marca
                  </label>
                  <input 
                    type="text"
                    placeholder="Ej. Estudio María"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                    value={form.nombre_comercial || ""} 
                    onChange={(e) => handleChange("nombre_comercial", e.target.value)} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                    BSUID (ID Único)
                  </label>
                  <input 
                    type="text"
                    placeholder="Ej. CO.12345678"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold font-mono text-zinc-100 focus:border-rose-500 transition-colors" 
                    value={form.BSUID || ""} 
                    onChange={(e) => handleChange("BSUID", e.target.value)} 
                  />
                </div>
              </div>

              {/* Celular e Indicativo */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                  Celular / WhatsApp *
                </label>
                <div className="flex gap-2">
                  <div className="relative w-36">
                    <select 
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 pr-8 rounded-2xl text-xs font-bold text-zinc-100 outline-none appearance-none focus:border-rose-500 transition-colors cursor-pointer"
                      value={form.indicador}
                      onChange={(e) => handleChange("indicador", e.target.value)}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={`${c.flag}-${c.code}-${c.name}`} value={c.code} className="bg-zinc-900 text-zinc-100">
                          {c.flag} {c.code} ({c.name})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3.5 text-zinc-400 pointer-events-none" />
                  </div>

                  <input 
                    type="tel"
                    placeholder="3000000000"
                    className="flex-1 bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors"
                    value={form.celular}
                    onChange={(e) => handleChange("celular", e.target.value)}
                  />
                </div>
              </div>

              {/* Correo e Identificación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                    Cédula / Documento
                  </label>
                  <input 
                    type="text"
                    placeholder="Número de documento"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                    value={form.identificacion || ""} 
                    onChange={(e) => handleChange("identificacion", e.target.value)} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                    Correo Electrónico
                  </label>
                  <input 
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                    value={form.correo_electronico || ""} 
                    onChange={(e) => handleChange("correo_electronico", e.target.value)} 
                  />
                </div>
              </div>

              {/* Tipo y Estado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">Tipo</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 pr-8 rounded-2xl text-xs font-bold text-zinc-100 outline-none appearance-none focus:border-rose-500 transition-colors cursor-pointer" 
                      value={form.tipo} 
                      onChange={(e) => handleChange("tipo", e.target.value)}
                    >
                      <option value="Cliente" className="bg-zinc-900">Cliente</option>
                      <option value="Contacto" className="bg-zinc-900">Contacto</option>
                      <option value="Proveedor" className="bg-zinc-900">Proveedor</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">Estado</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 pr-8 rounded-2xl text-xs font-bold text-zinc-100 outline-none appearance-none focus:border-rose-500 transition-colors cursor-pointer" 
                      value={form.estado} 
                      onChange={(e) => handleChange("estado", e.target.value)}
                    >
                      <option value="Activo" className="bg-zinc-900">Activo</option>
                      <option value="Inactivo" className="bg-zinc-900">Inactivo</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA UBICACIÓN Y SEDE */}
          {activeTab === "ubicacion" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Selector de Sede */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-rose-400 ml-1 block tracking-wider flex items-center gap-1">
                  <MapPin size={12} /> Sede Principal Asignada
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SEDES_OPCIONES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleChange("sede", s)}
                      className={`p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                        form.sede === s
                          ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Municipio y Departamento */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                    Municipio / Ciudad
                  </label>
                  <input 
                    type="text"
                    placeholder="Ej. Santa Marta"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                    value={form.municipio || ""} 
                    onChange={(e) => handleChange("municipio", e.target.value)} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                    Departamento
                  </label>
                  <input 
                    type="text"
                    placeholder="Ej. Magdalena"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                    value={form.departamento || ""} 
                    onChange={(e) => handleChange("departamento", e.target.value)} 
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                  Dirección Domicilio
                </label>
                <input 
                  type="text"
                  placeholder="Calle / Carrera / Barrio..."
                  className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                  value={form.direccion || ""} 
                  onChange={(e) => handleChange("direccion", e.target.value)} 
                />
              </div>
            </div>
          )}

          {/* PESTAÑA FICHA TÉCNICA (CON RECORTE DE ESTILOS AZULES A TONOS ZINC/ROSE) */}
          {activeTab === "ficha" && form.celular && (
            <div className="animate-in fade-in duration-200 bg-zinc-950/80 p-4 rounded-3xl border border-zinc-800 [&_a]:text-rose-400 [&_button]:border-zinc-700 [&_h1]:text-zinc-100 [&_h2]:text-zinc-100 [&_h3]:text-zinc-100 [&_label]:text-zinc-400 [&_p]:text-zinc-300 [&_span]:text-zinc-300">
              <FichaTecnicaEditor celular={form.celular} />
            </div>
          )}
        </div>

        {/* FOOTER ACCIONES */}
        {activeTab !== "ficha" && (
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
              <span>{saving ? "Guardando..." : mode === "create" ? "Registrar Cliente" : "Guardar Cambios"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}