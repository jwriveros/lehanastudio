"use client";

import { useState } from "react";
import { AgendaBoard, ChatPanel } from "@/components";

export default function AgendaPage() {
  const [showCalendar, setShowCalendar] = useState(true);

  return (
    <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Agenda</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Gestiona reservas, cambia especialista y confirma por chat.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-200"
            onClick={() => setShowCalendar((v) => !v)}
          >
            {showCalendar ? "Ocultar calendario" : "Ver calendario"}
          </button>
          <button className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
            Filtros
          </button>
        </div>
      </div>

      {showCalendar ? (
        <div className="mt-2">
          <AgendaBoard />
        </div>
      ) : null}

      <div className="mt-2 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
        Panel de chat para reservas activas. Atiende cambios de hora, recordatorios y confirmaciones sin salir de Agenda.
      </div>

      <div className="mt-2 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 text-sm text-zinc-700 shadow-inner dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200">
        Vista semanal compacta inspirada en Lizto. Arrastra y suelta con Supabase Realtime + n8n para confirmar.
      </div>

      <div className="mt-4">
        <ChatPanel />
      </div>
    </section>
  );
}
