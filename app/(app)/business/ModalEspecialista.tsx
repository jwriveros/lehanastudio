"use client";

import { useEffect, useState } from "react";
import { X, Save, User, Mail, Lock, Phone, Percent, Palette, Scissors, Sparkles, Check, CheckSquare, Square, Layers } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export type EspecialistaPayload = {
  id?: string;
  name: string;
  email: string;
  password?: string;
  telefono?: string;
  color?: string;
  comision_base: number;
  role?: string;
};

type ModalEspecialistaProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  formData?: EspecialistaPayload | null;
  onSave: (data: EspecialistaPayload) => void | Promise<void>;
};

const PALETA_COLORES = [
  "#4FD1C5", // Turquesa
  "#F687B3", // Rosado Pastel
  "#9F7AEA", // Lavanda
  "#E2C974", // Dorado
  "#F6AD55", // Naranja Suave
  "#6366F1", // Índigo
  "#EC4899", // Rosa Intenso
  "#10B981"  // Esmeralda
];

const EMPTY_ESPECIALISTA: EspecialistaPayload = {
  name: "",
  email: "",
  password: "",
  telefono: "57",
  color: "#F687B3",
  comision_base: 50,
  role: "ESPECIALISTA",
};

export default function ModalEspecialista({
  isOpen,
  onClose,
  mode,
  formData,
  onSave,
}: ModalEspecialistaProps) {
  const [form, setForm] = useState<EspecialistaPayload>(EMPTY_ESPECIALISTA);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"datos" | "servicios">("datos");

  useEffect(() => {
    if (isOpen) {
      fetchServices();

      if (mode === "create" || !formData) {
        setForm({ ...EMPTY_ESPECIALISTA });
        setSelectedServiceIds([]);
        setActiveTab("datos");
      } else {
        setForm({
          id: formData.id,
          name: formData.name || "",
          email: formData.email || "",
          password: formData.password || "",
          telefono: formData.telefono || "57",
          color: formData.color || "#F687B3",
          comision_base: formData.comision_base || 50,
          role: formData.role || "ESPECIALISTA",
        });
        setActiveTab("datos");
      }
    }
  }, [formData, isOpen, mode]);

  // Cargar lista de servicios e identificar cuáles realiza la especialista
  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("id, Servicio, category, especialistas");
    if (data) {
      setServicesList(data);

      if (formData?.name) {
        const activeIds: string[] = [];
        data.forEach((srv) => {
          let specList: string[] = [];
          if (typeof srv.especialistas === "string") {
            try {
              specList = JSON.parse(srv.especialistas);
            } catch (e) {
              specList = [srv.especialistas];
            }
          } else if (Array.isArray(srv.especialistas)) {
            specList = srv.especialistas;
          }

          if (specList.includes(formData.name)) {
            activeIds.push(srv.id);
          }
        });
        setSelectedServiceIds(activeIds);
      }
    }
  };

  if (!isOpen) return null;

  const handleChange = (field: keyof EspecialistaPayload, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Selección individual
  const handleToggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  // Agrupar servicios por categoría
  const servicesByCategory = servicesList.reduce((acc: Record<string, any[]>, srv) => {
    const cat = srv.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(srv);
    return acc;
  }, {});

  // Selección masiva por categoría
  const handleToggleCategory = (categoryName: string) => {
    const categoryServices = servicesByCategory[categoryName] || [];
    const categoryIds = categoryServices.map((s) => s.id);
    const allSelected = categoryIds.every((id) => selectedServiceIds.includes(id));

    if (allSelected) {
      // Desmarcar todos los servicios de esta categoría
      setSelectedServiceIds(selectedServiceIds.filter((id) => !categoryIds.includes(id)));
    } else {
      // Marcar todos los servicios de esta categoría
      const newSelections = new Set([...selectedServiceIds, ...categoryIds]);
      setSelectedServiceIds(Array.from(newSelections));
    }
  };

  // Sincronizar la columna 'especialistas' en la tabla 'services'
  const syncServicesEspecialistas = async (specName: string) => {
    for (const srv of servicesList) {
      let currentSpecs: string[] = [];
      if (typeof srv.especialistas === "string") {
        try {
          currentSpecs = JSON.parse(srv.especialistas);
        } catch (e) {
          currentSpecs = [srv.especialistas];
        }
      } else if (Array.isArray(srv.especialistas)) {
        currentSpecs = [...srv.especialistas];
      }

      const isChecked = selectedServiceIds.includes(srv.id);

      if (isChecked && !currentSpecs.includes(specName)) {
        currentSpecs.push(specName);
        await supabase
          .from("services")
          .update({ especialistas: currentSpecs })
          .eq("id", srv.id);
      } else if (!isChecked && currentSpecs.includes(specName)) {
        const filtered = currentSpecs.filter((name) => name !== specName);
        await supabase
          .from("services")
          .update({ especialistas: filtered })
          .eq("id", srv.id);
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert("El nombre es obligatorio");
    if (!form.email.trim()) return alert("El correo electrónico es obligatorio");
    if (mode === "create" && !form.password?.trim()) return alert("La contraseña es obligatoria para un usuario nuevo");

    setSaving(true);

    try {
      if (mode === "create") {
        const authRes = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            name: form.name,
            role: "ESPECIALISTA",
          }),
        });

        const authData = await authRes.json();
        if (!authRes.ok || !authData.ok) {
          console.warn("Aviso en la creación de usuario Auth:", authData.error);
        }
      }

      await onSave(form);
      await syncServicesEspecialistas(form.name);

      onClose();
    } catch (err: any) {
      console.error("Error guardando especialista:", err);
      alert("Error al guardar especialista: " + (err.message || "Error desconocido"));
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
                {mode === "create" ? "Nueva Especialista" : "Editar Especialista"}
              </h2>
              <p className="text-[10px] font-semibold text-zinc-400">
                {mode === "create" ? "Registra una integrante del equipo" : `Modificando perfil de ${form.name || "Especialista"}`}
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

        {/* NAVEGACIÓN PESTAÑAS */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-1.5 gap-1">
          <button 
            onClick={() => setActiveTab("datos")} 
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "datos" 
                ? "bg-zinc-800 text-rose-400 shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Datos Técnicos
          </button>
          
          <button 
            onClick={() => setActiveTab("servicios")} 
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "servicios" 
                ? "bg-zinc-800 text-rose-400 shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Servicios Asignados ({selectedServiceIds.length})
          </button>
        </div>

        {/* CONTENIDO FORMULARIO */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          
          {/* PESTAÑA DATOS TÉCNICOS */}
          {activeTab === "datos" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
                  Nombre Completo *
                </label>
                <input 
                  type="text"
                  placeholder="Ej. Nary Cabrales"
                  className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                  value={form.name} 
                  onChange={(e) => handleChange("name", e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider flex items-center gap-1">
                    <Mail size={11} className="text-indigo-400" /> Correo Acceso *
                  </label>
                  <input 
                    type="email"
                    placeholder="nombre@lehanastudio.com"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                    value={form.email} 
                    onChange={(e) => handleChange("email", e.target.value)} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider flex items-center gap-1">
                    <Lock size={11} className="text-indigo-400" /> Contraseña *
                  </label>
                  <input 
                    type="text"
                    placeholder="Clave de acceso"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                    value={form.password || ""} 
                    onChange={(e) => handleChange("password", e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider flex items-center gap-1">
                    <Phone size={11} className="text-indigo-400" /> Teléfono / WhatsApp
                  </label>
                  <input 
                    type="tel"
                    placeholder="573000000000"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-zinc-100 focus:border-rose-500 transition-colors" 
                    value={form.telefono || ""} 
                    onChange={(e) => handleChange("telefono", e.target.value)} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider flex items-center gap-1">
                    <Percent size={11} className="text-emerald-400" /> Comisión Base (%)
                  </label>
                  <input 
                    type="number"
                    placeholder="50"
                    min="0"
                    max="100"
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-2xl outline-none text-xs font-bold text-emerald-400 focus:border-rose-500 transition-colors" 
                    value={form.comision_base} 
                    onChange={(e) => handleChange("comision_base", Number(e.target.value))} 
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider flex items-center gap-1">
                  <Palette size={11} className="text-rose-400" /> Color Distintivo en Agenda
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-zinc-950 rounded-2xl border border-zinc-800">
                  {PALETA_COLORES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChange("color", c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        form.color === c ? "ring-2 ring-white scale-110 shadow-md" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {form.color === c && <Check size={14} className="text-zinc-900 font-bold" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* PESTAÑA SERVICIOS ASIGNADOS CON SELECCIÓN POR CATEGORÍA */}
          {activeTab === "servicios" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider flex items-center gap-1">
                <Scissors size={12} className="text-rose-400" /> Selecciona o desmarca servicios por categoría o individualmente:
              </label>

              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {Object.entries(servicesByCategory).map(([category, services]) => {
                  const categoryIds = services.map((s) => s.id);
                  const isCategoryAllSelected = categoryIds.every((id) => selectedServiceIds.includes(id));

                  return (
                    <div 
                      key={category}
                      className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-3"
                    >
                      {/* Cabecera de Categoría */}
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-xs font-black uppercase text-zinc-200 flex items-center gap-1.5">
                          <Layers size={13} className="text-rose-400" /> {category} ({services.length})
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleCategory(category)}
                          className="text-[10px] font-extrabold text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {isCategoryAllSelected ? (
                            <>
                              <CheckSquare size={13} /> Desmarcar Categoría
                            </>
                          ) : (
                            <>
                              <Square size={13} /> Marcar Categoría
                            </>
                          )}
                        </button>
                      </div>

                      {/* Lista Individual de Servicios de esta Categoría */}
                      <div className="space-y-2 pt-1">
                        {services.map((srv) => {
                          const isChecked = selectedServiceIds.includes(srv.id);
                          return (
                            <button
                              key={srv.id}
                              type="button"
                              onClick={() => handleToggleService(srv.id)}
                              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                isChecked
                                  ? "bg-rose-500/10 border-rose-500/50 text-white"
                                  : "bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                              }`}
                            >
                              <span className="text-xs font-bold">{srv.Servicio}</span>
                              <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${isChecked ? "bg-rose-500 border-rose-500 text-white" : "border-zinc-700"}`}>
                                {isChecked && <Check size={10} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            <span>{saving ? "Guardando..." : mode === "create" ? "Registrar Especialista" : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}