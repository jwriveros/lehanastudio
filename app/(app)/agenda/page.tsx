"use client";

import { useState } from "react";
import { AgendaBoard, ChatPanel } from "@/components";

export default function AgendaPage() {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-500">Reservas</p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Chats en curso y agenda</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Abre el calendario solo cuando necesites agendar.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-200"
            onClick={() => setShowCalendar((v) => !v)}
            type="button"
          >
            {showCalendar ? "Ocultar calendario" : "Abrir calendario"}
          </button>
          <button
            className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-200"
            type="button"
            aria-label="Crear nueva reserva"
          >
            + Nueva reserva
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
        <ChatPanel />
      </div>

      {showCalendar ? (
        <div className="space-y-3 rounded-3xl border border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-500">Calendario</p>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Vista semanal inspirada en Lizto</h3>
            </div>
            <button
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-200"
              onClick={() => setShowCalendar(false)}
            >
              Cerrar calendario
            </button>
          </div>
          <AgendaBoard />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          Pulsa &quot;Abrir calendario&quot; para desplegar la vista semanal y agendar desde aquí.
        </div>
      )}
    </section>
  );
}
