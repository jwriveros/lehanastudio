"use client";

import type { CalendarAppointment } from "./types";
import { CSSProperties } from "react";
import { useAgendaColor } from "@/lib/useAgendaColor";

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
        badgeBg: "bg-emerald-500/20 text-emerald-100",
      };
    case "Cita confirmada":
      return {
        border: "border-l-rose-400",
        indicador: "bg-rose-400",
        badgeBg: "bg-rose-500/20 text-rose-100",
      };
    case "Nueva reserva creada":
      return {
        border: "border-l-amber-400",
        indicador: "bg-amber-400",
        badgeBg: "bg-amber-500/20 text-amber-100",
      };
    case "Cita cancelada":
      return {
        border: "border-l-zinc-400 dark:border-l-zinc-500",
        indicador: "bg-zinc-400",
        badgeBg: "bg-zinc-500/20 text-zinc-600",
      };
    case "No se presentó":
      return {
        border: "border-l-zinc-500 dark:border-l-zinc-400",
        indicador: "bg-zinc-500",
        badgeBg: "bg-zinc-500/20 text-zinc-600",
      };
    case "Pago anulado":
      return {
        border: "border-l-red-500",
        indicador: "bg-red-500",
        badgeBg: "bg-red-500/20 text-red-700",
      };
    default:
      return {
        border: "border-l-zinc-400",
        indicador: "bg-zinc-400",
        badgeBg: "bg-zinc-500/20 text-zinc-100",
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
  const { resolveCardColor } = useAgendaColor();
  const estadoActual = appointment.raw?.estado;
  const { border, indicador } = getEstadoColores(estadoActual);

  // Detectamos los estados especiales
  const estadoLower = String(estadoActual || "").toLowerCase();
  const isCancelled = estadoLower.includes("cancelad");
  const isNoShow = estadoLower.includes("no se presentó") || estadoLower.includes("no se presento");
  const isAnnulled = estadoLower.includes("anulado");
  const isSpecialStatus = isCancelled || isNoShow || isAnnulled;

  // Extraemos el cliente y el precio total
  const cliente = appointment.raw?.cliente;
  const total = (appointment.raw as any)?.price_final ?? appointment.raw?.price ?? 0;

  // Si tiene estado especial, mantenemos las coordenadas (...style) pero quitamos el bg_color vibrante
  const resolvedBgColor = resolveCardColor(
    estadoActual,
    appointment.bg_color,
    appointment.raw?.especialista
  );

  // 1. Forzamos zIndex: 1 en canceladas y zIndex: 30 en activas
  const cardStyle: CSSProperties = isSpecialStatus
    ? {
        ...style,
        zIndex: 1,
      }
    : {
        ...style,
        backgroundColor: resolvedBgColor,
        zIndex: 30,
      };
  // Clases visuales dinámicas según el estado
  const statusContainerClasses = isAnnulled
    ? "bg-red-500/20 dark:bg-red-950/60 border-red-300/80 dark:border-red-800/70 opacity-65 hover:opacity-85"
    : isCancelled || isNoShow
    ? "bg-zinc-200/85 dark:bg-zinc-800/85 border-zinc-300/80 dark:border-zinc-700/80 opacity-55 grayscale hover:opacity-80"
    : "border-t border-r border-b border-white/20 dark:border-white/10 hover:shadow-md";

  const titleTextClasses = isAnnulled
    ? "text-red-700 dark:text-red-300 line-through"
    : isCancelled
    ? "text-zinc-600 dark:text-zinc-300 line-through"
    : isNoShow
    ? "text-zinc-600 dark:text-zinc-300"
    : "text-white";

  const subtitleTextClasses = isAnnulled
    ? "text-red-600/85 dark:text-red-300/80"
    : isCancelled || isNoShow
    ? "text-zinc-500 dark:text-zinc-400"
    : "text-white/85";

  const footerBorderClasses = isAnnulled
    ? "border-red-300/50 dark:border-red-800/50"
    : isCancelled || isNoShow
    ? "border-zinc-300/70 dark:border-zinc-700/70"
    : "border-white/15";

  const badgeTextClasses = isAnnulled
    ? "text-red-700 dark:text-red-300"
    : isCancelled || isNoShow
    ? "text-zinc-600 dark:text-zinc-300"
    : "text-white/90";

  const pricePillClasses = isAnnulled
    ? "text-red-700 dark:text-red-200 bg-red-500/15"
    : isCancelled || isNoShow
    ? "text-zinc-600 dark:text-zinc-300 bg-zinc-300/70 dark:bg-zinc-700/70"
    : "text-white bg-black/30 backdrop-blur-xs";

  return (
    <div
      onClick={() => onViewDetails?.(appointment)}
      className={`
        absolute group rounded-2xl shadow-xs border-l-[3.5px] 
        cursor-pointer transition-all duration-300 ease-out
        ${isSpecialStatus ? "z-[1] hover:z-[5]" : "z-[30] hover:z-[50] hover:scale-[1.01]"} 
        active:scale-[0.98] overflow-hidden select-none
        ${border}
        ${statusContainerClasses}
      `}
      style={cardStyle}
    >
      <div className="p-2 h-full flex flex-col justify-between overflow-hidden relative backdrop-blur-[1px]">
        
        {/* SECCIÓN SUPERIOR: CLIENTE Y SERVICIO */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-1">
            <span className={`block font-black text-[11px] uppercase tracking-tight truncate leading-none ${titleTextClasses}`}>
              {cliente || "Sin Nombre"}
            </span>
          </div>

          <span className={`block font-medium text-[10px] line-clamp-1 uppercase tracking-tighter leading-tight ${subtitleTextClasses}`}>
            {appointment.title}
          </span>
        </div>

        {/* PIE DE TARJETA: INDICADOR DE ESTADO Y PRECIO */}
        <div className={`mt-1 flex items-center justify-between gap-1 pt-1 border-t ${footerBorderClasses}`}>
          <div className="flex items-center gap-1.5 truncate">
            <div
              className={`h-2 w-2 rounded-full ${indicador} shrink-0 shadow-xs ${
                !isSpecialStatus ? "animate-pulse" : ""
              }`}
            />
            <span className={`text-[9px] font-extrabold uppercase truncate tracking-wider ${badgeTextClasses}`}>
              {estadoActual?.replace("Cita ", "") || "Reserva"}
            </span>
          </div>
          
          {/* PRECIO EN CÁPSULA TRASLÚCIDA */}
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-2xs ${pricePillClasses}`}>
            ${Number(total).toLocaleString("es-CO")}
          </span>
        </div>
        
      </div>
    </div>
  );
}