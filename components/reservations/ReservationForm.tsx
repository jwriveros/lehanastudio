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
import { Plus, Trash2 } from "lucide-react";

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
};

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
     VALIDACIÓN (FIX DEFINITIVO)
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

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* CLIENTE */}
      <AutocompleteInput<ClientItem>
        label="Cliente"
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
      />

      


      {/* CELULAR */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Celular
        </label>
        <input
          type="tel"
          value={form.celular}
          onChange={(e) => updateField("celular", e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* ENFOQUE HÍBRIDO */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={saveClient}
          onChange={(e) => setSaveClient(e.target.checked)}
        />
        Guardar este cliente para futuras citas
      </label>

      {/* SERVICIOS */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700">
          Servicios
        </label>

        {/* En edición NO añadimos más líneas (edición = 1 cita). En nueva reserva SÍ. */}
        {!isEditing && (
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
          >
            <Plus size={14} /> Añadir
          </button>
        )}
      </div>

      <div className="space-y-3">
        {form.lines.map((line, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-3">
            {/* AUTOCOMPLETE SERVICIOS (RESTaurado como estaba) */}
            <AutocompleteInput<ServiceItem>
              label={`Servicio ${index + 1}`}
              placeholder="Buscar servicio..."
              apiEndpoint="/api/autocomplete/services"
              getValue={(i) => i.Servicio ?? ""}
              getKey={(i) => i.SKU}
              renderItem={(i) => (
                <div className="flex flex-col">
                  <span className="font-medium">{i.Servicio}</span>
                  <span className="text-xs text-zinc-500">
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
            />

            {/* ESPECIALISTA */}
            <select
              value={line.especialista}
              onChange={(e) =>
                updateLine(index, { especialista: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">
                {loadingSpecialists ? "Cargando..." : "Selecciona especialista"}
              </option>
              {specialists.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* FECHA Y HORA POR SERVICIO */}
            <input
              type="datetime-local"
              value={line.appointment_at}
              onChange={(e) =>
                updateLine(index, { appointment_at: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />

            {/* DURACIÓN */}
            <input
              type="number"
              min={5}
              value={Number(line.duracion || 60)}
              onChange={(e) =>
                updateLine(index, { duracion: String(e.target.value) })
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />

            {/* QUITAR (solo en nueva reserva, edición = 1 cita) */}
            {!isEditing && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  disabled={form.lines.length <= 1}
                  className="text-xs text-red-600 inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Quitar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SEDE */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">Sede</label>
        <input
          type="text"
          value={form.sede}
          onChange={(e) => updateField("sede", e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* CANTIDAD (solo en nueva reserva como lo tenías) */}
      {!isEditing && (
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Cantidad
          </label>
          <input
            type="number"
            min={1}
            value={form.cantidad}
            onChange={(e) => updateField("cantidad", Number(e.target.value))}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      )}

      {/* TOTAL (solo en nueva reserva como lo tenías) */}
      {!isEditing && (
        <div className="rounded-lg border p-3 text-sm">
          <div className="flex justify-between">
            <span>Total estimado</span>
            <strong>${Number(totalEstimado).toLocaleString("es-CO")}</strong>
          </div>
        </div>
      )}

      {/* BOTÓN */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-indigo-600 py-2 text-white font-semibold disabled:opacity-50"
      >
        {saving
          ? "Guardando..."
          : isEditing
          ? "Guardar cambios"
          : "Crear reserva"}
      </button>
    </form>
  );
}
