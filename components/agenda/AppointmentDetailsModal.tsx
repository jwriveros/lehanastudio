"use client";

import { X } from "lucide-react";
import type { CalendarAppointment } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AppointmentDetailsModal({
  appointment,
  onClose,
}: {
  appointment: CalendarAppointment;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="w-[360px] rounded-2xl bg-white shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Detalle de la cita</h2>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div><b>Cliente:</b> {appointment.raw.cliente}</div>
          <div><b>Servicio:</b> {appointment.title}</div>
          <div><b>Especialista:</b> {appointment.raw.especialista}</div>
          <div><b>Estado:</b> {appointment.raw.estado}</div>
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
      </div>
    </div>
  );
}
