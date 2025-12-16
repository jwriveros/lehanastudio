"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  servicio: string;
  precio: number;
  duracion: string;
  especialista: string;
  appointment_at: string; // 👈 fecha/hora POR SERVICIO
};

type FormState = {
  cliente: string;
  celular: string;
  sede: string;
  cantidad: number;
  lines: ServiceLine[];
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
   COMPONENTE
========================= */

export default function ReservationForm({
  appointmentData,
}: {
  appointmentData?: any | null;
}) {
  const closeReservationDrawer = useUIStore((s) => s.closeReservationDrawer);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (!appointmentData?.id) {
      setForm(EMPTY_FORM);
    }
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
    const sum = form.lines.reduce(
      (acc, l) => acc + Number(l.precio || 0),
      0
    );
    return sum * (Number(form.cantidad) || 1);
  }, [form.lines, form.cantidad]);

  /* =========================
     VALIDACIÓN
  ========================= */

  const validate = () => {
    if (!form.cliente.trim()) return "Debes seleccionar o escribir un cliente.";
    if (!form.celular.trim()) return "Debes ingresar el celular.";

    const hasAnyService = form.lines.some((l) => l.servicio.trim());
    if (!hasAnyService) return "Debes agregar al menos un servicio.";

    const invalid = form.lines.some(
      (l) =>
        l.servicio.trim() &&
        (!l.especialista.trim() || !l.appointment_at)
    );

    if (invalid)
      return "Cada servicio debe tener especialista y fecha/hora.";

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
      const payload = {
        action: "CREATE",
        cliente: form.cliente.trim(),
        celular: String(form.celular).replace(/[^\d]/g, ""),
        sede: form.sede,
        cantidad: String(form.cantidad),
        items: form.lines
          .filter((l) => l.servicio.trim())
          .map((l) => ({
            servicio: l.servicio,
            especialista: l.especialista,
            duration: l.duracion,
            appointment_at: l.appointment_at, // 👈 CLAVE
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* CLIENTE */}
      <AutocompleteInput<ClientItem>
        label="Cliente"
        placeholder="Buscar por nombre o número..."
        apiEndpoint="/api/autocomplete/clients"
        getValue={(i) => i.nombre ?? ""}
        getKey={(i) => String(i.celular)}
        renderItem={(i) => (
          <div className="flex flex-col">
            <span className="font-medium">{i.nombre ?? "Sin nombre"}</span>
            <span className="text-xs text-zinc-500">{i.celular}</span>
          </div>
        )}
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

      {/* SERVICIOS */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700">
          Servicios
        </label>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
        >
          <Plus size={14} /> Añadir
        </button>
      </div>

      <div className="space-y-3">
        {form.lines.map((line, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-3">
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
                {loadingSpecialists
                  ? "Cargando..."
                  : "Selecciona especialista"}
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

            {/* QUITAR */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeLine(index)}
                disabled={form.lines.length <= 1}
                className="text-xs text-red-600"
              >
                <Trash2 size={14} /> Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SEDE */}
      <input
        type="text"
        value={form.sede}
        onChange={(e) => updateField("sede", e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      {/* CANTIDAD */}
      <input
        type="number"
        min={1}
        value={form.cantidad}
        onChange={(e) => updateField("cantidad", Number(e.target.value))}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      {/* TOTAL */}
      <div className="rounded-lg border p-3 text-sm">
        <div className="flex justify-between">
          <span>Total estimado</span>
          <strong>
            ${Number(totalEstimado).toLocaleString("es-CO")}
          </strong>
        </div>
      </div>

      {/* BOTÓN */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-indigo-600 py-2 text-white font-semibold disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Crear reserva"}
      </button>
    </form>
  );
}
