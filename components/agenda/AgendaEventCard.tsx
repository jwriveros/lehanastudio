"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";

/* =========================
   TYPES
========================= */
type Appointment = {
  title: string;
  start: Date;
  end: Date;
  bg_color?: string;
  raw?: {
    cliente?: string;
    especialista?: string;
    estado?: string;
  };
};

function getEstadoLineColor(estado?: string) {
  switch (estado) {
    case "Cita pagada":
      return "bg-emerald-600";
    case "Cita confirmada":
      return "bg-blue-600";
    case "Nueva reserva creada":
      return "bg-yellow-500";
    case "Cita cancelada":
      return "bg-red-500";
    default:
      return "bg-transparent";
  }
}

export default function AgendaEventCard({
  appointment,
  style,
}: {
  appointment: Appointment;
  style: React.CSSProperties;
}) {
  const estado = appointment.raw?.estado;
  const estadoLine = getEstadoLineColor(estado);

  return (
    <div
      className="absolute group rounded-xl shadow-lg overflow-hidden border border-white/30 cursor-pointer transition-all hover:scale-[1.02] hover:z-40"
      style={{
        ...style,
        backgroundColor: appointment.bg_color || "#6366f1",
      }}
    >
      {/* 🔥 LÍNEA SUPERIOR DE ESTADO */}
      <div className={`h-1.5 w-full ${estadoLine}`} />

      <div className="p-2 text-[11px] leading-tight text-white h-full flex flex-col justify-between">
        <div>
          {/* HORA */}
          <div className="font-semibold opacity-90">
            {format(appointment.start, "h:mm a", { locale: es })} –{" "}
            {format(appointment.end, "h:mm a", { locale: es })}
          </div>

          {/* SERVICIO */}
          <div className="mt-0.5 font-bold uppercase truncate">
            {appointment.title}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-1 flex items-center justify-between text-[10px] opacity-90">
          <span className="truncate">
            {appointment.raw?.cliente}
          </span>
          <span className="italic">
            {appointment.raw?.especialista}
          </span>
        </div>
      </div>

      {/* HOVER TOOLTIP */}
      <div className="pointer-events-none absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/20 text-[10px] text-white">
        Click para ver detalles
      </div>
    </div>
  );
}
