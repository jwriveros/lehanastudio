"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import AutocompleteInput from "./AutocompleteInput";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";
import { Plus, Trash2 } from "lucide-react";

type ClientItem = {
  nombre: string | null;
  celular: number;
  numberc: string | null;
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
  servicio: string;        // guardamos el texto de Servicio en appointments.servicio
  precio: number;          // para total estimado
  duracion: string;        // minutes en string para tu route/addMinutes
  especialista: string;    // nombre del especialista (o id si quisieras, pero tu appointments guarda text)
};

type FormState = {
  cliente: string;
  celular: string;

  appointment_at: string;  // datetime-local
  sede: string;
  cantidad: number;

  lines: ServiceLine[];
};

const EMPTY_LINE: ServiceLine = {
  servicio: "",
  precio: 0,
  duracion: "60",
  especialista: "",
};

const EMPTY_FORM: FormState = {
  cliente: "",
  celular: "",
  appointment_at: "",
  sede: "Marquetalia",
  cantidad: 1,
  lines: [{ ...EMPTY_LINE }],
};

export default function ReservationForm({
  appointmentData,
}: {
  appointmentData?: any | null;
}) {
  const closeReservationDrawer = useUIStore((s) => s.closeReservationDrawer);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Lista corta de especialistas (select)
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);

  // Cargar especialistas (desde app_users) una sola vez
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

  // Si más adelante editas appointmentData, aquí puedes mapearlo. Por ahora lo dejamos en modo "crear"
  useEffect(() => {
    if (appointmentData?.id) {
      // Si algún día editas, aquí inicializas.
      // Por ahora no tocamos para no romperte nada.
    } else {
      setForm(EMPTY_FORM);
    }
  }, [appointmentData]);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateLine = useCallback((index: number, patch: Partial<ServiceLine>) => {
    setForm((prev) => {
      const lines = prev.lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
      return { ...prev, lines };
    });
  }, []);

  const addLine = useCallback(() => {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, { ...EMPTY_LINE }] }));
  }, []);

  const removeLine = useCallback((index: number) => {
    setForm((prev) => {
      if (prev.lines.length <= 1) return prev;
      return { ...prev, lines: prev.lines.filter((_, i) => i !== index) };
    });
  }, []);

  const totalEstimado = useMemo(() => {
    const sumServicios = form.lines.reduce((acc, l) => acc + (Number(l.precio) || 0), 0);
    const cant = Number(form.cantidad) || 1;
    return sumServicios * cant;
  }, [form.lines, form.cantidad]);

  const validate = () => {
    if (!form.cliente.trim()) return "Debes seleccionar o escribir un cliente.";
    if (!form.celular.trim()) return "Debes ingresar el celular.";
    if (!form.appointment_at) return "Debes seleccionar fecha y hora.";

    const hasAnyService = form.lines.some((l) => l.servicio.trim().length > 0);
    if (!hasAnyService) return "Debes agregar al menos 1 servicio.";

    // opcional: exigir especialista por línea si hay servicio
    const missingSpec = form.lines.some(
      (l) => l.servicio.trim() && !l.especialista.trim()
    );
    if (missingSpec) return "Cada servicio debe tener especialista.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errMsg = validate();
    if (errMsg) {
      alert(errMsg);
      return;
    }

    setSaving(true);

    try {
      // Enviar al mismo endpoint (tú dijiste que le pones un switch)
      // Mandamos items (lines) para que el backend cree múltiples filas si quieres.
      const payload = {
        action: "CREATE",
        cliente: form.cliente.trim(),
        celular: Number(form.celular.replace(/[^\d]/g, "")) || null,
        appointment_at: new Date(form.appointment_at).toISOString(),
        sede: form.sede,
        cantidad: String(form.cantidad),
        items: form.lines
          .filter((l) => l.servicio.trim())
          .map((l) => ({
            servicio: l.servicio,
            especialista: l.especialista,
            duration: l.duracion,
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

      closeReservationDrawer();
    } catch (err: any) {
      console.error("Error guardando reserva:", err);
      alert(err.message || "Ocurrió un error al guardar la reserva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* =========================
          CLIENTE (autocomplete)
      ========================= */}
      <AutocompleteInput<ClientItem>
        label="Cliente"
        placeholder="Buscar por nombre o número..."
        apiEndpoint="/api/autocomplete/clients"
        getValue={(item) => item.nombre ?? ""}
        getKey={(item) => String(item.celular)}
        renderItem={(item) => (
          <div className="flex flex-col">
            <div className="font-medium">{item.nombre ?? "Sin nombre"}</div>
            <div className="text-xs text-zinc-500">{item.celular}</div>
          </div>
        )}
        onSelect={(item) => {
          // ✅ al seleccionar cliente, setear celular
          setForm((prev) => ({
            ...prev,
            cliente: item.nombre ?? "",
            celular: String(item.celular ?? ""),
          }));
        }}
      />

      {/* =========================
          CELULAR (input normal, autollenado)
      ========================= */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Celular
        </label>
        <input
          type="tel"
          value={form.celular}
          onChange={(e) => updateField("celular", e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Ej: 3001234567"
        />
      </div>

      {/* =========================
          SERVICIOS (MULTI)
      ========================= */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700">
          Servicios
        </label>

        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-zinc-50"
        >
          <Plus size={14} />
          Añadir
        </button>
      </div>

      <div className="space-y-3">
        {form.lines.map((line, index) => (
          <div
            key={index}
            className="rounded-lg border p-3 bg-white space-y-3"
          >
            {/* Servicio autocomplete */}
            <AutocompleteInput<ServiceItem>
              label={`Servicio ${index + 1}`}
              placeholder="Buscar servicio..."
              apiEndpoint="/api/autocomplete/services"
              getValue={(item) => item.Servicio ?? ""}
              getKey={(item) => item.SKU}
              renderItem={(item) => (
                <div className="flex flex-col">
                  <div className="font-medium">{item.Servicio ?? "—"}</div>
                  <div className="text-xs text-zinc-500">
                    ${Number(item.Precio ?? 0).toLocaleString("es-CO")} • {item.duracion ?? "—"} min
                  </div>
                </div>
              )}
              onSelect={(item) => {
                updateLine(index, {
                  servicio: item.Servicio ?? "",
                  precio: Number(item.Precio ?? 0),
                  duracion: String(item.duracion ?? "60"),
                });
              }}
            />

            {/* Especialista select */}
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Especialista
              </label>
              <select
                value={line.especialista}
                onChange={(e) => updateLine(index, { especialista: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                disabled={loadingSpecialists}
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
            </div>

            {/* Duración (por servicio) */}
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Duración (min)
              </label>
              <input
                type="number"
                min={5}
                value={Number(line.duracion || 60)}
                onChange={(e) => updateLine(index, { duracion: String(e.target.value) })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            {/* Eliminar línea */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeLine(index)}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                disabled={form.lines.length <= 1}
                title="Eliminar servicio"
              >
                <Trash2 size={14} />
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* =========================
          FECHA / HORA
      ========================= */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Fecha y hora
        </label>
        <input
          type="datetime-local"
          value={form.appointment_at}
          onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                appointment_at: e.target.value, // 👈 AQUÍ
              }))
            }
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* =========================
          SEDE
      ========================= */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Sede
        </label>
        <input
          type="text"
          value={form.sede}
          onChange={(e) => updateField("sede", e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* =========================
          CANTIDAD PERSONAS
      ========================= */}
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Cantidad de personas
        </label>
        <input
          type="number"
          min={1}
          value={form.cantidad}
          onChange={(e) => updateField("cantidad", Number(e.target.value))}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {/* =========================
          TOTAL ESTIMADO
      ========================= */}
      <div className="rounded-lg border bg-white p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-600">Total estimado</span>
          <span className="font-semibold">
            ${Number(totalEstimado).toLocaleString("es-CO")}
          </span>
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          (Estimado: suma de servicios × cantidad. El total final lo recalcula Supabase con tu trigger.)
        </div>
      </div>

      {/* =========================
          BOTÓN
      ========================= */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Crear reserva"}
        </button>
      </div>
    </form>
  );
}
