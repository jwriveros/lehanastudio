"use client";

import type { CalendarAppointment } from "./types";
import { CSSProperties } from "react";

/* =========================================================
   🔹 FUNCIÓN: MAPEO DE COLORES E INDICADORES DE ESTADO
========================================================= */
function getEstadoColores(estado?: string): {
  border: string;
  indicador: string;
  badgeBg: string;
} {
  switch (estado) {
    case "Cita pagada":
      return { 
        border: "border-l-emerald-400", 
        indicador: "bg-emerald-400",
        badgeBg: "bg-emerald-500/20 text-emerald-100"
      };
    case "Cita confirmada":
      return { 
        border: "border-l-rose-400", 
        indicador: "bg-rose-400",
        badgeBg: "bg-rose-500/20 text-rose-100"
      };
    case "Nueva reserva creada":
      return { 
        border: "border-l-amber-400", 
        indicador: "bg-amber-400",
        badgeBg: "bg-amber-500/20 text-amber-100"
      };
    case "Cita cancelada":
      return { 
        border: "border-l-red-400", 
        indicador: "bg-red-400",
        badgeBg: "bg-red-500/20 text-red-100"
      };
    default:
      return { 
        border: "border-l-zinc-400", 
        indicador: "bg-zinc-400",
        badgeBg: "bg-zinc-500/20 text-zinc-100"
      };
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
  
  // Extraemos el cliente y el precio total
  const cliente = appointment.raw?.cliente;
  const total = appointment.raw?.price || 0;

  const cardStyle = {
    ...style,
    backgroundColor: appointment.bg_color || "#f43f5e",
  };

  return (
    <div
      onClick={() => onViewDetails?.(appointment)}
      className={`
        absolute group rounded-2xl shadow-xs border-l-[3.5px] 
        cursor-pointer transition-all duration-300 ease-out
        hover:z-50 hover:shadow-md hover:scale-[1.01] active:scale-[0.98]
        border-t border-r border-b border-white/20 dark:border-white/10
        overflow-hidden select-none
        ${border}
      `}
      style={cardStyle}
    >
      <div className="p-2 h-full flex flex-col justify-between overflow-hidden relative backdrop-blur-[1px]">
        
        {/* SECCIÓN SUPERIOR: CLIENTE Y SERVICIO */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-1">
            <span className="block font-black text-[11px] text-white uppercase tracking-tight truncate leading-none">
              {cliente || "Sin Nombre"}
            </span>
          </div>

          <span className="block font-medium text-[10px] text-white/85 line-clamp-1 uppercase tracking-tighter leading-tight">
            {appointment.title}
          </span>
        </div>

        {/* PIE DE TARJETA: INDICADOR DE ESTADO Y PRECIO */}
        <div className="mt-1 flex items-center justify-between gap-1 pt-1 border-t border-white/15">
          <div className="flex items-center gap-1.5 truncate">
            <div className={`h-2 w-2 rounded-full ${indicador} shrink-0 shadow-xs animate-pulse`} />
            <span className="text-[9px] font-extrabold text-white/90 uppercase truncate tracking-wider">
              {appointment.raw?.estado?.replace("Cita ", "") || "Reserva"}
            </span>
          </div>
          
          {/* PRECIO EN CÁPSULA TRASLÚCIDA */}
          <span className="text-[9px] font-black text-white bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
            ${Number(total).toLocaleString("es-CO")}
          </span>
        </div>
        
      </div>
    </div>
  );
}