"use client";

import { useState } from "react";

import { AgendaBoard, ChatPanel } from "@/components";

export default function AgendaPage() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [bookingSignal, setBookingSignal] = useState<number | null>(null);

  return (
    <section className="relative space-y-4 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-500">Reservas</p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Chats en curso y agenda</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Gestiona las reservas y abre el calendario solo cuando lo necesitas.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
        <ChatPanel />
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
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Vista en rejilla al estilo Google Calendar</h3>
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
