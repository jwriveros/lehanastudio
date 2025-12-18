"use client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CalendarAppointment } from "./types";
import { CSSProperties } from "react";
import { User, Scissors, Clock, Info } from "lucide-react";
/* =========================
   TYPES
========================= */
type TooltipInfo = {
  cliente: string;
  servicio: string;
  estado?: string;
  hora?: string;
  especialista?: string;
};
function getEstadoStyles(estado?: string): {
  line: string;
  dot: string;
  text: string;
} {
  switch (estado) {
    case "Cita pagada":
      return {
        line: "bg-green-500",
        dot: "bg-green-400",
        text: "text-green-100",
      };
    case "Cita confirmada":
      return {
        line: "bg-blue-500",
        dot: "bg-blue-400",
        text: "text-blue-100",
      };
    case "Nueva reserva creada":
      return {
        line: "bg-yellow-500",
        dot: "bg-yellow-400",
        text: "text-yellow-100",
      };
    case "Cita cancelada":
      return {
        line: "bg-red-500",
        dot: "bg-red-400",
        text: "text-red-100",
      };
    default:
      return {
        line: "bg-gray-400",
        dot: "bg-gray-300",
        text: "text-gray-100",
      };
  }
}
export default function AgendaEventCard({
  appointment,
  style,
  tooltip,
  onViewDetails,
}: {
  appointment: CalendarAppointment;
  style: CSSProperties;
  tooltip?: TooltipInfo;
  onViewDetails?: (appt: CalendarAppointment) => void;
}) {
  const {
    line: estadoLine,
    dot: estadoDot,
    text: estadoText,
  } = getEstadoStyles(appointment.raw?.estado);
  const cardStyle = {
    ...style,
    backgroundColor: appointment.bg_color || style.backgroundColor || "#6366f1",
  };
  return (
    <div
      onClick={() => onViewDetails?.(appointment)}
      className="absolute group rounded-lg shadow-md overflow-hidden border-l-4 cursor-pointer transition-all duration-200 ease-in-out hover:z-40 hover:shadow-xl hover:scale-[1.03]"
      style={{ ...cardStyle, borderColor: estadoLine }}
    >
      <div className="p-2 text-white h-full flex flex-col justify-between text-[11px]">
        {/* Contenido Principal */}
        <div className="flex-grow">
          <div className="flex items-center gap-0.5 mb-0.5 text-[10px] font-semibold truncate">
            <User size={10} />
            <span className="truncate">{appointment.raw?.cliente}</span>
          </div>
          <div className="flex items-center gap-0.5 font-bold text-[10px] uppercase truncate">
            <Scissors size={10} />
            <span className="truncate">{appointment.title}</span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5 text-[10px] opacity-90">
            <Clock size={6} />
            <span>{format(appointment.start, "p", { locale: es })}</span>
          </div>
        </div>
        {/* Footer */}
        <div className="mt-1 flex items-center justify-between text-[10px] opacity-80">
          <span className="italic truncate">
            {appointment.raw?.especialista}
          </span>
          <div
            className={`flex items-center gap-1 rounded-full pl-1.5 pr-2 py-0.5 text-[8px] ${estadoLine}`}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${estadoDot}`} />
            <span className="font-semibold">{appointment.raw?.estado}</span>
          </div>
        </div>
      </div>
      {/* Tooltip de Hover */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Info size={12} />
          <span>Ver Detalles</span>
        </div>
      </div>
    </div>
  );
}
