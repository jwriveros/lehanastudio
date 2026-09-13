"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DollarSign,
  X,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export interface UnpaidBooking {
  id: number;
  cliente: string;
  servicio: string;
  especialista: string;
  price: number;
  price_final: number;
  abono: number;
  appointment_at: string;
  estado: string;
  sede: string;
}

interface UnpaidBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBookingDate: (date: Date) => void;
}

/* =========================================================
   🔹 HELPER: EXTRAER HORA EXACTA SIN DESFASE UTC DE ZONA HORARIA
========================================================= */
function formatExactLocalTime(isoString: string): string {
  if (!isoString) return "—";

  // Intentar parsear hora en formato "YYYY-MM-DDTHH:mm:ss"
  const timePart = isoString.includes("T") ? isoString.split("T")[1] : isoString.split(" ")[1];
  if (!timePart) return "—";

  const [hoursStr, minutesStr] = timePart.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr ? minutesStr.substring(0, 2) : "00";

  if (isNaN(hours)) return "—";

  const period = hours >= 12 ? "p. m." : "a. m.";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const paddedHours = String(hours).padStart(2, "0");
  return `${paddedHours}:${minutes} ${period}`;
}

/* =========================================================
   🔹 HELPER: EXTRAER FECHA EXACTA SIN DESFASE
========================================================= */
function formatExactLocalDate(isoString: string): string {
  if (!isoString) return "—";
  const datePart = isoString.split("T")[0] || isoString.split(" ")[0];
  if (!datePart) return "—";

  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return "—";

  // Crear objeto Date usando hora local estricta
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UnpaidBookingsModal({
  isOpen,
  onClose,
  onSelectBookingDate,
}: UnpaidBookingsModalProps) {
  const [bookings, setBookings] = useState<UnpaidBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Asegura que se ejecute solo en el cliente para el Portal de React
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUnpaidBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/unpaid-past");
      const json = await res.json();
      if (json.ok) {
        setBookings(json.bookings || []);
      }
    } catch (err) {
      console.error("Error cargando citas por pagar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUnpaidBookings();
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Renderizar usando createPortal en document.body para evitar que el header lo corte
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100">
        
        {/* CABECERA VISIBLE Y DESTACADA */}
        <header className="flex items-center justify-between p-5 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 shrink-0">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Citas Por Pagar ({bookings.length})
              </h2>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Selecciona una cita para navegar a su día y registrar el cobro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </header>

        {/* CONTENIDO LISTA CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar bg-zinc-50/50 dark:bg-zinc-900/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 text-xs gap-2">
              <Loader2 size={24} className="animate-spin text-rose-500" />
              <span>Consultando citas pendientes de cobro...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="text-xs font-extrabold text-zinc-700 dark:text-zinc-200">
                ¡Todo al día! No hay citas pendientes por pagar.
              </p>
            </div>
          ) : (
            bookings.map((b) => {
              // Extracción exacta sin desfase UTC
              const formattedDate = formatExactLocalDate(b.appointment_at);
              const formattedTime = formatExactLocalTime(b.appointment_at);

              // Fecha para navegación en la Agenda
              const datePart = b.appointment_at.split("T")[0] || b.appointment_at.split(" ")[0];
              const [y, m, d] = datePart.split("-").map(Number);
              const navDate = new Date(y, m - 1, d);

              const valorFinal = Number(b.price_final ?? b.price ?? 0);
              const valorAbono = Number(b.abono ?? 0);
              const saldoPendiente = Math.max(0, valorFinal - valorAbono);

              return (
                <div
                  key={b.id}
                  onClick={() => {
                    onSelectBookingDate(navDate);
                    onClose();
                  }}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 hover:border-rose-400 dark:hover:border-rose-900/60 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase">
                        <Calendar size={11} /> {formattedDate}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500">
                        <Clock size={11} /> {formattedTime}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {b.sede}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <User size={13} className="text-rose-500 shrink-0" />
                      <span>{b.cliente}</span>
                    </h4>

                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                      {b.servicio} • <span className="font-bold text-zinc-700 dark:text-zinc-300">{b.especialista || "Sin asignar"}</span>
                    </p>
                  </div>

                  {/* PRECIOS Y BOTÓN NAVEGAR */}
                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="text-right space-y-0.5">
                      <div className="text-xs sm:text-sm font-black text-rose-500">
                        ${saldoPendiente.toLocaleString("es-CO")} COP
                      </div>
                      <div className="text-[9px] font-semibold text-zinc-400">
                        Total: ${valorFinal.toLocaleString("es-CO")}
                        {valorAbono > 0 && ` (Abono: $${valorAbono.toLocaleString("es-CO")})`}
                      </div>
                    </div>

                    <span className="mt-1.5 text-[10px] font-black text-rose-500 group-hover:underline flex items-center gap-1 uppercase tracking-wider">
                      Ir al día <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}