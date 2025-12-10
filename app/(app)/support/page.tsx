"use client";

import { useState } from "react";
import { AgendaBoard, ChatPanel } from "@/components";

export default function SupportPage() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [bookingSignal, setBookingSignal] = useState<number | null>(null);

  return (
    <div className="w-full h-full relative overflow-hidden">

      {/* PANEL DE CHAT — ocupa toda la altura disponible */}
      <div className="w-full h-full overflow-hidden">
        <ChatPanel />
      </div>

      {/* BOTONES FLOTANTES */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3">
        <button
          type="button"
          title="Nueva reserva"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 active:scale-95"
          onClick={() => setBookingSignal(Date.now())}
        >
          +
        </button>

        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl hover:bg-black active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h.01"/>
            <path d="M3 12h.01"/>
            <path d="M3 19h.01"/>
            <path d="M8 5h13"/>
            <path d="M8 12h13"/>
            <path d="M8 19h13"/>
          </svg>
        </button>
      </div>

      {/* MODAL DEL CALENDARIO */}
      {showCalendar && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCalendar(false)}
          />

          <div className="relative z-10 flex h-[95vh] w-full max-w-[1900px] flex-col rounded-3xl overflow-hidden bg-white border shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <button className="p-3.5 rounded-full bg-gray-900 text-white shadow hover:bg-black">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 5h.01"/>
                    <path d="M3 12h.01"/>
                    <path d="M3 19h.01"/>
                    <path d="M8 5h13"/>
                    <path d="M8 12h13"/>
                    <path d="M8 19h13"/>
                  </svg>
                </button>
                <div>
                  <p className="text-xs uppercase tracking-wide text-indigo-500">Calendario</p>
                  <h3 className="text-lg font-semibold">Vista estilo Google Calendar</h3>
                </div>
              </div>

              <button
                onClick={() => setShowCalendar(false)}
                className="rounded-full border px-3 py-2 text-xs font-semibold hover:border-indigo-300 hover:text-indigo-700"
              >
                Cerrar calendario
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <AgendaBoard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
