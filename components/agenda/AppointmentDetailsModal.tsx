"use client";

import { X, Pencil, Trash2, Ban } from "lucide-react";
import type { CalendarAppointment } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AppointmentDetailsModal({
  appointment,
  onClose,
  onEdit,
  onCancel,
  onDelete,
}: {
  appointment: CalendarAppointment;
  onClose: () => void;

  // 👉 callbacks (los conectas donde ya manejas estado / API)
  onEdit?: (appointment: CalendarAppointment) => void;
  onCancel?: (appointment: CalendarAppointment) => void;
  onDelete?: (appointment: CalendarAppointment) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="w-[380px] rounded-2xl bg-white shadow-xl p-5">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Detalle de la cita</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-zinc-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="space-y-2 text-sm mb-5">
          <div>
            <b>Cliente:</b> {appointment.raw.cliente}
          </div>

          <div>
            <b>Servicio:</b> {appointment.title}
          </div>

          <div>
            <b>Especialista:</b> {appointment.raw.especialista}
          </div>

          <div>
            <b>Estado:</b>{" "}
            <span className="capitalize">{appointment.raw.estado}</span>
          </div>

          <div>
            <b>Fecha:</b>{" "}
            {format(appointment.start, "PPP", { locale: es })}
          </div>

          <div>
            <b>Hora:</b>{" "}
            {format(appointment.start, "HH:mm")} –{" "}
            {format(appointment.end, "HH:mm")}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex justify-between gap-2">
          {/* EDITAR */}
          <button
            onClick={() => onEdit?.(appointment)}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-zinc-50"
          >
            <Pencil size={14} />
            Editar
          </button>

          {/* CANCELAR */}
          <button
            onClick={() => onCancel?.(appointment)}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
          >
            <Ban size={14} />
            Cancelar
          </button>

          {/* ELIMINAR */}
          <button
            onClick={() => onDelete?.(appointment)}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
