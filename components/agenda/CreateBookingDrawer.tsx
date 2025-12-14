"use client";

import { FormEvent, useState } from "react";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateBookingDrawer({
  open,
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    cliente: "",
    celular: "",
    servicio: "",
    especialista: "",
    date: "",
    time: "",
    duration: 60,
    sede: "Marquetalia",
    notes: "",
  });

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const [y, m, d] = form.date.split("-").map(Number);
    const [hh, mm] = form.time.split(":").map(Number);

    const appointment_at =
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` +
      `T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;

    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: form.cliente,
        celular: form.celular,
        servicio: form.servicio,
        especialista: form.especialista,
        appointment_at,
        duration: String(form.duration),
        sede: form.sede,
        notes: form.notes,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Error al crear la reserva");
      return;
    }

    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex">
      {/* OVERLAY */}
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
      />

      {/* DRAWER */}
      <aside
        className={clsx(
          "bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out",
          // Desktop: right drawer
          "w-full sm:max-w-[420px] sm:h-full sm:translate-y-0",
          // Mobile: bottom drawer
          "fixed bottom-0 right-0 h-[85vh] rounded-t-2xl sm:rounded-none",
        )}
      >
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-indigo-600 px-5 py-4 text-white">
          <h2 className="font-semibold text-lg">Nueva Reserva</h2>
          <button onClick={onClose} className="text-xl leading-none">
            ×
          </button>
        </div>

        {/* CONTENT */}
        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          <input
            required
            placeholder="Cliente"
            className="w-full border rounded-lg p-3"
            value={form.cliente}
            onChange={(e) => setForm({ ...form, cliente: e.target.value })}
          />

          <input
            required
            placeholder="Celular"
            className="w-full border rounded-lg p-3"
            value={form.celular}
            onChange={(e) => setForm({ ...form, celular: e.target.value })}
          />

          <input
            required
            placeholder="Servicio"
            className="w-full border rounded-lg p-3"
            value={form.servicio}
            onChange={(e) => setForm({ ...form, servicio: e.target.value })}
          />

          <input
            required
            placeholder="Especialista"
            className="w-full border rounded-lg p-3"
            value={form.especialista}
            onChange={(e) => setForm({ ...form, especialista: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="date"
              className="border rounded-lg p-3"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              required
              type="time"
              className="border rounded-lg p-3"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>

          <input
            type="number"
            min={15}
            step={15}
            placeholder="Duración (min)"
            className="w-full border rounded-lg p-3"
            value={form.duration}
            onChange={(e) =>
              setForm({ ...form, duration: Number(e.target.value) })
            }
          />

          <textarea
            placeholder="Notas"
            className="w-full border rounded-lg p-3"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          {/* FOOTER */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded-xl py-3"
            >
              Cancelar
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex-1 bg-indigo-600 text-white rounded-xl py-3"
            >
              {loading ? "Guardando…" : "Agendar"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
