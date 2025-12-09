"use client";

import { useState } from "react";

import { AgendaBoard, ChatPanel } from "@/components";
import { useSessionStore } from "@/lib/sessionStore";

export default function SupportPage() {
  const { session, logout } = useSessionStore();
  const [showCalendar, setShowCalendar] = useState(false);
  const [bookingSignal, setBookingSignal] = useState<number | null>(null);

  return (
    <section className="relative flex min-h-[calc(100vh-120px)] flex-col gap-4 overflow-hidden pb-20">
      <header className="rounded-3xl border border-zinc-200 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Lehana Studio</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300" hidden>
              Menú inferior con Soporte, Agenda, Mi negocio, Dashboard y Ajustes. Especialista solo ve Soporte y Agenda.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                Sesión: {session?.role ?? "Invitado"}
              </span>
              <span className="text-[11px]">{session?.name ?? "Sin sesión"}</span>
              {session ? (
                <button
                  className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold text-zinc-700 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-indigo-500"
                  onClick={() => logout()}
                  type="button"
                >
                  Cerrar sesión
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden rounded-3xl border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
        <ChatPanel fillHeight />
      </div>

      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3">
        <button
          type="button"
          title="Nueva reserva"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xl transition hover:bg-indigo-700 active:scale-95"
          aria-label="Crear nueva reserva"
          onClick={() => {
            setShowCalendar(true);
            setBookingSignal(Date.now());
          }}
        >
          +
        </button>

        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          title="Abrir calendario"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-2xl transition hover:bg-black active:scale-95"
          aria-label="Abrir calendario"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list" aria-hidden="true">
            <path d="M3 5h.01"></path>
            <path d="M3 12h.01"></path>
            <path d="M3 19h.01"></path>
            <path d="M8 5h13"></path>
            <path d="M8 12h13"></path>
            <path d="M8 19h13"></path>
          </svg>
        </button>
      </div>

      {showCalendar ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCalendar(false)} aria-hidden />
          <div className="relative z-10 flex h-[96vh] w-full max-w-[1900px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <button
                  className="bg-gray-900 text-white p-3.5 rounded-full shadow-xl hover:bg-black transition active:scale-95 flex items-center justify-center"
                  title="Ver como Lista"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list" aria-hidden="true">
                    <path d="M3 5h.01"></path>
                    <path d="M3 12h.01"></path>
                    <path d="M3 19h.01"></path>
                    <path d="M8 5h13"></path>
                    <path d="M8 12h13"></path>
                    <path d="M8 19h13"></path>
                  </svg>
                </button>
                <div>
                  <p className="text-xs uppercase tracking-wide text-indigo-500">Calendario</p>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Agenda semanal desde Soporte</h3>
                </div>
              </div>
              <button
                className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-200"
                onClick={() => setShowCalendar(false)}
                type="button"
              >
                Cerrar calendario
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 sm:p-4">
              <AgendaBoard externalBookingSignal={bookingSignal} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
