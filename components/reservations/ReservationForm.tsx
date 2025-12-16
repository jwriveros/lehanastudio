"use client";
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
import {
  Plus,
  Trash2,
  User,
  Phone,
  Calendar,
  Clock,
  Building,
  Users,
  Tag,
  DollarSign,
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
// Convierte datetime-local (hora local Colombia) a ISO UTC correcto
function localDateTimeToUTC(localDateTime: string) {
  // localDateTime: "2025-05-22T10:00"
  const localDate = new Date(localDateTime);
  // Convertimos a UTC ISO
  return new Date(
    localDate.getTime() - localDate.getTimezoneOffset() * 60000
  ).toISOString();
}
/* =========================
   COMPONENTE
========================= */
export default function ReservationForm({
  appointmentData,
  onSuccess,
}: ReservationFormProps) {
  const closeReservationDrawer = useUIStore((s) => s.closeReservationDrawer);
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = Boolean(appointmentData?.id);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveClient, setSaveClient] = useState(false);
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
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
    return () => {
      mounted = false;
    };
  }, []);
  /* =========================
     PRECARGAR (EDICIÓN) / RESET (CREAR)
  ========================= */
  useEffect(() => {
    if (!appointmentData?.id) {
      setForm(EMPTY_FORM);
      setSaveClient(false);
      return;
    }
    const raw = appointmentData.raw ?? {};
    const appointmentAt =
      "appointment_at_local" in raw
        ? raw.appointment_at_local
        : raw.appointment_at;
    setForm({
      cliente: raw.cliente ?? "",
      celular: String(raw.celular ?? ""),
      sede: raw.sede ?? "Marquetalia",
      cantidad: 1,
      lines: [
        {
          servicio: raw.servicio ?? appointmentData.title ?? "",
          precio: Number(raw.price ?? 0),
          duracion: String(raw.duration ?? "60"),
          especialista: raw.especialista ?? "",
          appointment_at: toDatetimeLocal(
            raw.appointment_at_local ?? raw.appointment_at
          ),
        },
      ],
    });
    setSaveClient(false);
  }, [appointmentData]);
  /* =========================
     HELPERS
  ========================= */
  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );
  const updateLine = useCallback(
    (index: number, patch: Partial<ServiceLine>) => {
      setForm((prev) => ({
        ...prev,
        lines: prev.lines.map((l, i) =>
          i === index ? { ...l, ...patch } : l
        ),
      }));
    },
    []
  );
  const addLine = () =>
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...EMPTY_LINE }],
    }));
  const removeLine = (index: number) =>
    setForm((prev) =>
      prev.lines.length <= 1
        ? prev
        : { ...prev, lines: prev.lines.filter((_, i) => i !== index) }
    );
  /* =========================
     TOTAL
  ========================= */
  const totalEstimado = useMemo(() => {
    const sum = form.lines.reduce((acc, l) => acc + Number(l.precio || 0), 0);
    return sum * (Number(form.cantidad) || 1);
  }, [form.lines, form.cantidad]);
  /* =========================
     VALIDACIÓN
  ========================= */
  const validate = () => {
    if (!form.cliente.trim()) {
      const input = formRef.current?.querySelector(
        "input[type='text']"
      ) as HTMLInputElement | null;
      if (input?.value?.trim()) {
        setForm((p) => ({ ...p, cliente: input.value.trim() }));
      } else {
        return "Debes seleccionar o escribir un cliente.";
      }
    }
    if (!form.celular.trim()) return "Debes ingresar el celular.";
    const hasAnyService = form.lines.some((l) => l.servicio.trim());
    if (!hasAnyService) return "Debes agregar al menos un servicio.";
    const invalid = form.lines.some(
      (l) => l.servicio.trim() && (!l.especialista.trim() || !l.appointment_at)
    );
    if (invalid) return "Cada servicio debe tener especialista y fecha/hora.";
    return null;
  };
  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      console.log("❌ Error de validación:", err); // <-- AGREGAR ESTO
      alert(err);
      return;
    }
    setSaving(true);
    try {
      const lines = form.lines.filter((l) => l.servicio.trim());
      if (saveClient) {
        await supabase.from("clients").upsert(
          {
            nombre: form.cliente.trim(),
            celular: String(form.celular).replace(/[^\d]/g, ""),
          },
          { onConflict: "celular" }
        );
      }
      if (isEditing) {
        const l = lines[0];
        await supabase
          .from("appointments")
          .update({
            cliente: form.cliente.trim(),
            celular: String(form.celular).replace(/[^\d]/g, ""),
            sede: form.sede,
            servicio: l.servicio,
            especialista: l.especialista,
            duration: l.duracion,
            appointment_at: localDateTimeToUTC(l.appointment_at),
          })
          .eq("id", Number(appointmentData.id));
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
      console.log("📤 Enviando payload a la API:", payload); // <-- AGREGAR ESTO
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log("📥 Respuesta del servidor:", json); // <-- AGREGAR ESTO
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Error creando la reserva");
      }
      onSuccess?.();
      closeReservationDrawer();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error guardando la reserva");
    } finally {
      setSaving(false);
    }
  };
  /* =========================
     RENDER
    ========================= */
    return (
      <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex h-full flex-col"
    >
      <div className="flex-1 space-y-8 overflow-y-auto p-6">
        {/* === Client Section === */}
        <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Información del Cliente
          </h3>
          {/* CLIENTE */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-400">
              Cliente
            </label>
            <div className="group relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
              <AutocompleteInput<ClientItem>
                placeholder="Buscar por nombre o número..."
                apiEndpoint="/api/autocomplete/clients"
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
  
          {/* CELULAR */}
          <div className="space-y-2">
            <label
              htmlFor="celular"
              className="text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Celular
            </label>
            <div className="group relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
              <input
                id="celular"
                type="tel"
                value={form.celular}
                onChange={(e) => updateField("celular", e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-500"
                placeholder="Ej: 3001234567"
              />
            </div>
          </div>
  
          {/* GUARDAR CLIENTE */}
          <div className="flex items-center pt-2">
            <input
              id="save-client"
              type="checkbox"
              checked={saveClient}
              onChange={(e) => setSaveClient(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-offset-gray-800"
            />
            <label
              htmlFor="save-client"
              className="ml-3 text-sm text-gray-700 dark:text-gray-300"
            >
              Guardar este cliente para futuras citas
            </label>
          </div>
        </section>
        {/* === Services Section === */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Servicios
            </h3>
            {!isEditing && (
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-2 rounded-md border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900"
              >
                <Plus size={16} />
                <span>Añadir</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {form.lines.map((line, index) => (
              <div
                key={index}
                className="relative rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200/50 dark:bg-gray-800/50 dark:ring-gray-700/50"
              >
                {!isEditing && form.lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-gray-200 p-1 text-gray-500 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none dark:border-gray-800 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                    aria-label="Eliminar servicio"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <div className="space-y-4">
                  <AutocompleteInput<ServiceItem>
                    label={
                      form.lines.length > 1 ? `Servicio ${index + 1}` : "Servicio"
                    }
                    placeholder="Buscar y seleccionar un servicio..."
                    apiEndpoint="/api/autocomplete/services"
                    getValue={(i) => i.Servicio ?? ""}
                    getKey={(i) => i.SKU}
                    renderItem={(i) => (
                      <div className="flex flex-col">
                        <span className="font-medium">{i.Servicio}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          ${Number(i.Precio ?? 0).toLocaleString("es-CO")} •{" "}
                          {i.duracion ?? "—"} min
                        </span>
                      </div>
                    )}
                    onSelect={(i) =>
                      updateLine(index, {
                        servicio: i.Servicio ?? "",
                        precio: Number(i.Precio ?? 0),
                        duracion: String(i.duracion ?? "60"),
                      })
                    }
                    inputClassName="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white dark:focus:border-indigo-500"
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor={`especialista-${index}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Especialista
                      </label>
                      <div className="group relative">
                        <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                        <select
                          id={`especialista-${index}`}
                          value={line.especialista}
                          onChange={(e) =>
                            updateLine(index, {
                              especialista: e.target.value,
                            })
                          }
                          className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                        >
                          <option value="">
                            {loadingSpecialists ? "Cargando..." : "Selecciona"}
                          </option>
                          {specialists.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor={`fecha-${index}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Fecha y Hora
                      </label>
                      <div className="group relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                        <input
                          id={`fecha-${index}`}
                          type="datetime-local"
                          value={line.appointment_at}
                          onChange={(e) =>
                            updateLine(index, {
                              appointment_at: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor={`duracion-${index}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Duración (min)
                      </label>
                      <div className="group relative">
                        <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                        <input
                          id={`duracion-${index}`}
                          type="number"
                          min={5}
                          step={5}
                          value={Number(line.duracion || 60)}
                          onChange={(e) =>
                            updateLine(index, {
                              duracion: String(e.target.value),
                            })
                          }
                          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                          placeholder="Ej: 60"
                        />
                      </div>
                    </div>
                     <div className="space-y-2">
                      <label
                        htmlFor={`precio-${index}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-400"
                      >
                        Precio
                      </label>
                      <div className="group relative">
                        <DollarSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                        <input
                          id={`precio-${index}`}
                          type="number"
                          min={0}
                          step={1000}
                          value={Number(line.precio || 0)}
                          onChange={(e) =>
                            updateLine(index, {
                              precio: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white"
                          placeholder="Ej: 50000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* === Additional Details Section === */}
        <section className="space-y-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detalles Adicionales
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* SEDE */}
            <div className="space-y-2">
              <label
                htmlFor="sede"
                className="text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Sede
              </label>
              <div className="group relative">
                <Building className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                <input
                  id="sede"
                  type="text"
                  value={form.sede}
                  onChange={(e) => updateField("sede", e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white dark:focus:border-indigo-500"
                />
              </div>
            </div>
            {/* CANTIDAD */}
            {!isEditing && (
              <div className="space-y-2">
                <label
                  htmlFor="cantidad"
                  className="text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  Cantidad de Personas
                </label>
                <div className="group relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 group-focus-within:text-indigo-500" />
                  <input
                    id="cantidad"
                    type="number"
                    min={1}
                    value={form.cantidad}
                    onChange={(e) =>
                      updateField("cantidad", Number(e.target.value))
                    }
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700/80 dark:text-white dark:focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      {/* FOOTER */}
      <div className="sticky bottom-0 z-10 mt-auto border-t border-gray-200 bg-white/90 p-4 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/90">
        {!isEditing && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/30">
            <span className="text-base font-semibold text-indigo-800 dark:text-indigo-200">
              Total Estimado
            </span>
            <span className="text-2xl font-bold text-indigo-900 dark:text-white">
              ${Number(totalEstimado).toLocaleString("es-CO")}
            </span>
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {saving
            ? "Guardando..."
            : isEditing
            ? "Guardar Cambios"
            : "Crear Reserva"}
        </button>
      </div>
    </form>
  );
}