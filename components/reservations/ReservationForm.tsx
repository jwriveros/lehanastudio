"use client";
import FichaTecnicaEditor from "./FichaTecnicaEditor";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import AutocompleteInput from "./AutocompleteInput";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Trash2,
  User,
  Phone,
  Calendar,
  Clock,
  Building,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  Tag
} from "lucide-react";

/* =========================
   TIPOS
========================= */
type ClientItem = {
  nombre: string | null;
  celular: number;
  numberc?: string | null;
};
type ServiceItem = {
  SKU: string;
  Servicio: string | null;
  Precio: number | null;
  duracion: string | null;
};
type SpecialistItem = {
  id: string;
  name: string;
  color?: string | null;
  role?: string;
};
type ServiceLine = {
  servicio: string;
  precio: number;
  duracion: string;
  especialista: string;
  appointment_at: string;
};
type FormState = {
  cliente: string;
  celular: string;
  sede: string;
  cantidad: number;
  estado: string;
  lines: ServiceLine[];
};

interface ReservationFormProps {
  appointmentData?: any | null;
  onSuccess?: () => void;
}

/* =========================
   CONSTANTES
========================= */
const EMPTY_LINE: ServiceLine = {
  servicio: "",
  precio: 0,
  duracion: "60",
  especialista: "",
  appointment_at: "",
};
const EMPTY_FORM: FormState = {
  cliente: "",
  celular: "",
  sede: "Marquetalia",
  cantidad: 1,
  estado: "Nueva reserva creada", //
  lines: [{ ...EMPTY_LINE }],
};

/* =========================
   HELPERS
========================= */
function toDatetimeLocal(dateString: string) {
  const d = new Date(dateString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDateTimeToUTC(localDateTime: string) {
  const localDate = new Date(localDateTime);
  return new Date(
    localDate.getTime() - localDate.getTimezoneOffset() * 60000
  ).toISOString();
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function ReservationForm({
  appointmentData,
  onSuccess,
}: ReservationFormProps) {
  const closeReservationDrawer = useUIStore((s) => s.closeReservationDrawer);
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!appointmentData?.id && !isNaN(Number(appointmentData.id));
  
  // Estados originales
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveClient, setSaveClient] = useState(false);
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);

  // Nuevos estados para el Panel Lateral
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservas' | 'fichas'>('fichas');

  /* =========================
      CARGAR ESPECIALISTAS
  ========================= */
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoadingSpecialists(true);
      try {
        const { data, error } = await supabase
          .from("app_users")
          .select("id,name,role,color")
          .in("role", ["ESPECIALISTA", "SPECIALIST"])
          .order("name", { ascending: true });
        if (!mounted) return;
        if (error) throw error;
        setSpecialists((data ?? []) as SpecialistItem[]);
      } catch (e) {
        console.error("Error cargando especialistas:", e);
      } finally {
        if (mounted) setLoadingSpecialists(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  /* =========================
      PRECARGAR (EDICIÓN) / RESET
  ========================= */
  useEffect(() => {
    if (!appointmentData?.id) {
      setForm(EMPTY_FORM);
      setSaveClient(false); 
      return;
    }
    const raw = appointmentData.raw ?? {};
    setForm({
      cliente: raw.cliente ?? appointmentData.cliente ?? "",
      celular: String(raw.celular ?? appointmentData.celular ?? ""),
      sede: raw.sede ?? "Marquetalia",
      cantidad: 1,
      estado: raw.estado ?? "Nueva reserva creada",
      lines: [
        {
          servicio: raw.servicio ?? appointmentData.title ?? "",
          precio: Number(raw.price ?? 0),
          duracion: String(raw.duration ?? "60"),
          especialista: raw.especialista ?? "",
          appointment_at: toDatetimeLocal(
            raw.appointment_at_local ?? raw.appointment_at ?? appointmentData.start
          ),
        },
      ],
    });
    setSaveClient(false);
  }, [appointmentData]);

  /* =========================
      HELPERS FORMULARIO
  ========================= */
  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateLine = useCallback((index: number, patch: Partial<ServiceLine>) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l, i) => i === index ? { ...l, ...patch } : l),
    }));
  }, []);

  const addLine = () => {
    setForm((prev) => {
      const lastLine = prev.lines[prev.lines.length - 1];
      let nextTime = "";
      if (lastLine && lastLine.appointment_at && lastLine.duracion) {
        const currentDate = new Date(lastLine.appointment_at);
        const durationMinutes = parseInt(lastLine.duracion, 10) || 0;
        const nextDate = new Date(currentDate.getTime() + durationMinutes * 60000);
        const pad = (n: number) => String(n).padStart(2, "0");
        nextTime = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(
          nextDate.getDate()
        )}T${pad(nextDate.getHours())}:${pad(nextDate.getMinutes())}`;
      }
      return {
        ...prev,
        lines: [...prev.lines, { ...EMPTY_LINE, appointment_at: nextTime }],
      };
    });
  };

  const removeLine = (index: number) =>
    setForm((prev) =>
      prev.lines.length <= 1 ? prev : { ...prev, lines: prev.lines.filter((_, i) => i !== index) }
    );

  const totalEstimado = useMemo(() => {
    const sum = form.lines.reduce((acc, l) => acc + Number(l.precio || 0), 0);
    return sum * (Number(form.cantidad) || 1);
  }, [form.lines, form.cantidad]);

  const validate = () => {
    if (!form.cliente.trim()) return "Debes seleccionar o escribir un cliente.";
    if (!form.celular.trim()) return "Debes ingresar el celular.";
    const hasAnyService = form.lines.some((l) => l.servicio.trim());
    if (!hasAnyService) return "Debes agregar al menos un servicio.";
    const invalid = form.lines.some(
      (l) => l.servicio.trim() && (!l.especialista.trim() || !l.appointment_at)
    );
    if (invalid) return "Cada servicio debe tener especialista y fecha/hora.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { alert(err); return; }
    setSaving(true);
    try {
      const lines = form.lines.filter((l) => l.servicio.trim());
      if (saveClient) {
        await supabase.from("clients").upsert(
          { nombre: form.cliente.trim(), celular: String(form.celular).replace(/[^\d]/g, "") },
          { onConflict: "celular" }
        );
      }
      if (isEditing) {
        const l = lines[0];
        const dateObj = new Date(l.appointment_at);
        const newAt = localDateTimeToUTC(l.appointment_at);

        // 1. Actualizar en Supabase
        const { error } = await supabase
          .from("appointments")
          .update({
            cliente: form.cliente.trim(),
            celular: String(form.celular).replace(/[^\d]/g, ""),
            sede: form.sede,
            servicio: l.servicio,
            especialista: l.especialista,
            duration: l.duracion,
            appointment_at: newAt,
            estado: form.estado,
          })
          .eq("id", Number(appointmentData.id));

        if (error) throw error;

        // 2. Notificar a n8n del cambio (Acción EDITED)
        try {
          const rawPhone = String(form.celular).replace(/\D/g, "");
          const normalizedPhone = rawPhone.startsWith("57") ? `+${rawPhone}` : `+57${rawPhone}`;
          const dateObj = new Date(l.appointment_at);

          await fetch("/api/bookings/notify-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "EDITED",
              customerName: form.cliente.trim(),
              customerPhone: normalizedPhone,
              servicio: l.servicio,
              especialista: l.especialista,
              // Forzamos el envío de estos campos para que n8n no los reciba vacíos
              fecha: format(dateObj, "PPPP", { locale: es }), 
              hora: format(dateObj, "p", { locale: es }),
              sede: form.sede, // <-- Añade la sede aquí también
              appointmentId: appointmentData.id,
              estado: form.estado
            }),
          });
        } catch (webhookErr) {
          console.error("Error enviando notificación de edición:", webhookErr);
        }

        onSuccess?.();
        closeReservationDrawer();
        return;
      }
      const payload = {
        action: "CREATE",
        cliente: form.cliente.trim(),
        celular: String(form.celular).replace(/[^\d]/g, ""),
        sede: form.sede,
        cantidad: String(form.cantidad),
        items: lines.map((l) => ({
          servicio: l.servicio,
          especialista: l.especialista,
          duration: l.duracion,
          appointment_at: localDateTimeToUTC(l.appointment_at),
        })),
      };
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Error creando la reserva");
      onSuccess?.();
      closeReservationDrawer();
    } catch (e: any) {
      alert(e.message || "Error guardando la reserva");
    } finally {
      setSaving(false);
    }
  };

  const isLastLineComplete = useMemo(() => {
    const lastLine = form.lines[form.lines.length - 1];
    return lastLine && lastLine.servicio.trim() !== "" && lastLine.especialista.trim() !== "";
  }, [form.lines]);

  /* =========================
      RENDER PRINCIPAL
  ========================= */
  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-50 dark:bg-zinc-950">
      
      {/* PANEL IZQUIERDO: DETALLES DEL CLIENTE */}
      {showDetails && form.celular && (
        <div className="w-full md:w-[450px] border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-zinc-900 overflow-y-auto animate-in slide-in-from-left duration-300">
          <div className="sticky top-0 z-20 bg-white/80 p-4 backdrop-blur-md dark:bg-zinc-900/80">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Perfil del Cliente</h2>
            <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              <button 
                type="button"
                onClick={() => setActiveTab('fichas')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'fichas' ? 'bg-white shadow-sm text-indigo-600 dark:bg-zinc-700 dark:text-indigo-400' : 'text-gray-500'}`}
              >
                <ClipboardList size={16} /> Ficha Técnica
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('reservas')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'reservas' ? 'bg-white shadow-sm text-indigo-600 dark:bg-zinc-700 dark:text-indigo-400' : 'text-gray-500'}`}
              >
                <History size={16} /> Historial
              </button>
            </div>
          </div>

          <div className="p-4">
            {activeTab === 'fichas' ? (
              <FichaTecnicaEditor celular={form.celular} />
            ) : (
              <div className="text-center py-10 text-gray-500 text-sm">Próximamente: Historial de citas</div>
            )}
          </div>
        </div>
      )}

      {/* PANEL DERECHO: FORMULARIO DE RESERVA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {form.celular && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-indigo-600 text-white p-1.5 rounded-r-xl shadow-lg hover:bg-indigo-700 transition-all"
            title={showDetails ? "Ocultar detalles" : "Ver detalles del cliente"}
          >
            {showDetails ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 space-y-8 overflow-y-auto p-6">
            
            {/* Información del Cliente */}
            <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información del Cliente</h3>
                {form.celular && !showDetails && (
                  <button 
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <ClipboardList size={14} /> VER INFO DEL CLIENTE
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Cliente</label>
                <div className="group relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                  <AutocompleteInput<ClientItem>
                    placeholder="Buscar por nombre o número..."
                    apiEndpoint="/api/autocomplete/clients"
                    initialValue={form.cliente}
                    getValue={(i) => i.nombre ?? ""}
                    getKey={(i) => String(i.celular)}
                    onSelect={(i) =>
                      setForm((p) => ({
                        ...p,
                        cliente: i.nombre ?? "",
                        celular: String(i.celular ?? ""),
                      }))
                    }
                    inputClassName="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="celular" className="text-sm font-medium text-gray-700 dark:text-gray-400">Celular</label>
                <div className="group relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                  <input
                    id="celular"
                    type="tel"
                    value={form.celular}
                    onChange={(e) => updateField("celular", e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: 3001234567"
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  id="save-client"
                  type="checkbox"
                  checked={saveClient}
                  onChange={(e) => setSaveClient(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="save-client" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Guardar este cliente para futuras citas
                </label>
              </div>
            </section>

            {/* Servicios */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Servicios</h3>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={addLine}
                    disabled={!isLastLineComplete}
                    className="inline-flex items-center gap-2 rounded-md border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300"
                  >
                    <Plus size={16} /> <span>Añadir</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {form.lines.map((line, index) => (
                  <div key={index} className="relative rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50 dark:bg-gray-800/50 dark:ring-gray-700/50">
                    {!isEditing && form.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-gray-200 p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:border-gray-800 dark:bg-gray-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <div className="space-y-4">
                      <AutocompleteInput<ServiceItem>
                        label={form.lines.length > 1 ? `Servicio ${index + 1}` : "Servicio"}
                        placeholder="Buscar servicio..."
                        apiEndpoint="/api/autocomplete/services"
                        initialValue={line.servicio}
                        getValue={(i) => i.Servicio ?? ""}
                        getKey={(i) => i.SKU}
                        renderItem={(i) => (
                          <div className="flex flex-col">
                            <span className="font-medium">{i.Servicio}</span>
                            <span className="text-xs text-zinc-500">${Number(i.Precio ?? 0).toLocaleString("es-CO")} • {i.duracion} min</span>
                          </div>
                        )}
                        onSelect={(i) => updateLine(index, {
                          servicio: i.Servicio ?? "",
                          precio: Number(i.Precio ?? 0),
                          duracion: String(i.duracion ?? "60"),
                        })}
                        inputClassName="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-3 text-sm focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                      />
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Especialista</label>
                          <div className="group relative">
                            <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                            <select
                              value={line.especialista}
                              onChange={(e) => updateLine(index, { especialista: e.target.value })}
                              className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                            >
                              <option value="">{loadingSpecialists ? "Cargando..." : "Selecciona"}</option>
                              {specialists.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Fecha y Hora</label>
                          <div className="group relative">
                            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                            <input
                              type="datetime-local"
                              value={line.appointment_at}
                              onChange={(e) => updateLine(index, { appointment_at: e.target.value })}
                              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Duración (min)</label>
                          <div className="group relative">
                            <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
                            <input
                              type="number"
                              min={5}
                              value={Number(line.duracion || 60)}
                              onChange={(e) => updateLine(index, { duracion: String(e.target.value) })}
                              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Precio</label>
                          <div className="group relative">
                            <DollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
                            <input
                              type="number"
                              value={Number(line.precio || 0)}
                              onChange={(e) => updateLine(index, { precio: Number(e.target.value) })}
                              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Detalles Adicionales */}
            <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800/50 dark:ring-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalles Adicionales</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="estado" className="text-sm font-medium text-gray-700 dark:text-gray-400">Estado de la Cita</label>
                  <div className="group relative">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
                    <select
                      id="estado"
                      value={form.estado}
                      onChange={(e) => updateField("estado", e.target.value)}
                      className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                    >
                      <option value="Nueva reserva creada">Nueva reserva creada</option>
                      <option value="Cita confirmada">Cita confirmada</option>
                      <option value="Cita pagada">Cita pagada</option>
                      <option value="Cita cancelada">Cita cancelada</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="sede" className="text-sm font-medium text-gray-700 dark:text-gray-400">Sede</label>
                  <div className="group relative">
                    <Building className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
                    <input
                      id="sede"
                      type="text"
                      value={form.sede}
                      onChange={(e) => updateField("sede", e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                    />
                  </div>
                </div>
                {!isEditing && (
                  <div className="space-y-2">
                    <label htmlFor="cantidad" className="text-sm font-medium text-gray-700 dark:text-gray-400">Personas</label>
                    <div className="group relative">
                      <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400" />
                      <input
                        id="cantidad"
                        type="number"
                        min={1}
                        value={form.cantidad}
                        onChange={(e) => updateField("cantidad", Number(e.target.value))}
                        className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 z-10 mt-auto border-t border-gray-200 bg-white/95 p-4 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-800/95">
            {!isEditing && (
              <div className="mb-4 flex items-center justify-between rounded-xl bg-indigo-50 p-4 dark:bg-indigo-900/30">
                <span className="text-base font-semibold text-indigo-800 dark:text-indigo-200">Total Estimado</span>
                <span className="text-2xl font-bold text-indigo-900 dark:text-white">${Number(totalEstimado).toLocaleString("es-CO")}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-indigo-600 px-4 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}