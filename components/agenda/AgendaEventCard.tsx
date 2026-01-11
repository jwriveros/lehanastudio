"use client";
import type { CalendarAppointment } from "./types";
import { CSSProperties } from "react";

/* =========================
   TYPES
========================= */
function getEstadoColores(estado?: string): {
  border: string;
  indicador: string;
} {
  switch (estado) {
    case "Cita pagada":
      return { border: "border-green-600", indicador: "bg-green-500" };
    case "Cita confirmada":
      return { border: "border-blue-600", indicador: "bg-blue-500" };
    case "Nueva reserva creada":
      return { border: "border-amber-500", indicador: "bg-amber-500" };
    case "Cita cancelada":
      return { border: "border-red-600", indicador: "bg-red-500" };
    default:
      return { border: "border-zinc-500", indicador: "bg-zinc-500" };
  }
}

export default function AgendaEventCard({
  appointment,
  style,
  onViewDetails,
}: {
  appointment: CalendarAppointment;
  style: CSSProperties;
  onViewDetails?: (appt: CalendarAppointment) => void;
}) {
  const { border, indicador } = getEstadoColores(appointment.raw?.estado);

  const cardStyle = {
    ...style,
    backgroundColor: appointment.bg_color || "#6366f1",
  };

  return (
    <div
      onClick={() => onViewDetails?.(appointment)}
      className={`
        absolute group rounded-lg shadow-sm border-l-[4px] 
        cursor-pointer transition-all duration-200
        hover:z-50 hover:brightness-105 active:scale-[0.98]
        ${border}
      `}
      style={cardStyle}
    >
      <div className="p-1.5 h-full flex flex-col overflow-hidden">
        
        {/* SERVICIO */}
        <div className="leading-tight">
          <span className="block font-medium text-[12px] text-white/90 line-clamp-2 Poppins sans-seriff uppercase tracking-tighter">
            {appointment.title}
          </span>
        </div>

        {/* PIE: ESTADO SIMPLIFICADO */}
        <div className="mt-auto flex items-center gap-1">
          <div className={`h-1.5 w-1.5 rounded-full ${indicador} shrink-0 shadow-sm`} />
          <span className="text-[12px] font-bold text-white/80 uppercase truncate">
            {appointment.raw?.estado?.replace("Cita ", "")}
          </span>
        </div>
      </div>
    </div>
  );
}