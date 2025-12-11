"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { AgendaBoard } from "@/components/AgendaBoard";

export default function SupportPage() {
  // Estado para controlar la visibilidad del Calendario (Modal Grande)
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Nuevo estado para controlar la visibilidad del Modal de Solo Reserva
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Señal que el AgendaBoard usa para abrir su formulario interno
  const [bookingSignal, setBookingSignal] = useState<number | null>(null);

  const handleCloseModal = () => {
    setCalendarOpen(false);
    setBookingModalOpen(false);
    setBookingSignal(null);
  };

  // Handler para abrir el modal de reserva
  const handleNewBookingClick = () => {
    setCalendarOpen(false);
    setBookingModalOpen(true);
    setBookingSignal(Date.now());
  };

  // Handler para abrir el modal de calendario
  const handleCalendarClick = () => {
    setBookingModalOpen(false);
    setCalendarOpen(true);
    setBookingSignal(null);
  };

  const showCalendarAgenda = calendarOpen;
  const showBookingAgenda = bookingModalOpen;

  return (
    // 🔴 IMPORTANTE: aquí ya NO usamos h-screen
    <section className="relative flex-1 min-h-0 overflow-hidden bg-white flex flex-col">
      {/* Botones flotantes */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition"
          title="Abrir Calendario"
          onClick={handleCalendarClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-calendar"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" x2="16" y1="2" y2="6"></line>
            <line x1="8" x2="8" y1="2" y2="6"></line>
            <line x1="3" x2="21" y1="10" y2="10"></line>
          </svg>
        </button>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 active:scale-95 transition"
          title="Nueva reserva"
          onClick={handleNewBookingClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-plus"
          >
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
        </button>
      </div>

      {/* Panel principal (Chat) ocupa TODO el alto disponible */}
      <div className="w-full flex-1 min-h-0">
        <ChatPanel />
      </div>

      {/* Modal Nueva Reserva */}
      {showBookingAgenda && (
        <div className="fixed inset-0 z-[60] overflow-y-auto p-4 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
          />
          <div className="relative z-10 w-full max-w-xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl bg-white">
            <AgendaBoard
              externalBookingSignal={bookingSignal}
              renderCalendarShell={false}
              onBookingClose={handleCloseModal}
            />
            <button
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 p-2 z-[999] bg-white rounded-full shadow-lg"
              onClick={handleCloseModal}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal Calendario */}
      {showCalendarAgenda && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center">
          <div className="relative w-full h-full max-w-[1900px] max-h-[95vh] rounded-3xl overflow-hidden bg-white shadow-2xl">
            <AgendaBoard
              externalBookingSignal={null}
              renderCalendarShell={true}
            />

            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-xl shadow-black/20 hover:bg-white hover:text-zinc-900 active:scale-95 backdrop-blur-md border border-zinc-200 transition-all z-[999]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
