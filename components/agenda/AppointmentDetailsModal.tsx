"use client";
import {
  X,
  Pencil,
  Trash2,
  Ban,
  User,
  Scissors,
  Tag,
  Calendar,
  Clock,
} from "lucide-react";
import type { CalendarAppointment } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
/**
 * Devuelve las clases de Tailwind CSS para un estado de cita específico.
 * @param status - El estado de la cita.
 * @returns Una cadena de clases de Tailwind CSS.
 */
const getStatusStyles = (status: string | undefined): string => {
  const defaultStyles = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  if (!status) return defaultStyles;

  const statusMap: { [key: string]: string } = {
    "cita confirmada": "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400",
    "cita pagada": "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
    "cita cancelada": "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
    "nueva reserva creada": "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
  };

  return statusMap[status.toLowerCase()] || defaultStyles;
};
/**
 * Un componente de modal para mostrar los detalles de una cita.
 *
 * @param appointment - El objeto de la cita a mostrar.
 * @param onClose - Función de callback para cerrar el modal.
 * @param onEdit - Callback opcional para editar la cita.
 * @param onCancel - Callback opcional para cancelar la cita.
 * @param onDelete - Callback opcional para eliminar la cita.
 */
export default function AppointmentDetailsModal({
  appointment,
  onClose,
  onEdit,
  onCancel,
  onDelete,
}: {
  appointment: CalendarAppointment;
  onClose: () => void;
  onEdit?: (appointment: CalendarAppointment) => void;
  onCancel?: (appointment: CalendarAppointment) => void;
  onDelete?: (appointment: CalendarAppointment) => void;
}) {
  const DetailItem = ({
    icon,
    label,
    children,
  }: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex-shrink-0 text-zinc-500 dark:text-zinc-400">
        {icon}
      </div>
      <div>
        <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
        <dd className="font-semibold text-zinc-800 dark:text-zinc-200">
          {children}
        </dd>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-zinc-800 dark:bg-zinc-900">
        {/* HEADER */}
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Detalle de la cita
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        {/* CONTENIDO */}
        <dl className="mb-8 space-y-4">
          <DetailItem icon={<User size={18} />} label="Cliente">
            {appointment.raw.cliente}
          </DetailItem>
          <DetailItem icon={<Scissors size={18} />} label="Servicio">
            {appointment.title}
          </DetailItem>
          <DetailItem icon={<User size={18} />} label="Especialista">
            {appointment.raw.especialista}
          </DetailItem>
          <DetailItem icon={<Tag size={18} />} label="Estado">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyles(
                appointment.raw.estado
              )}`}
            >
              {appointment.raw.estado}
            </span>
          </DetailItem>
          <DetailItem icon={<Calendar size={18} />} label="Fecha">
            {format(appointment.start, "PPP", { locale: es })}
          </DetailItem>
          <DetailItem icon={<Clock size={18} />} label="Hora">
            {format(appointment.start, "p", { locale: es })} –{" "}
            {format(appointment.end, "p", { locale: es })}
          </DetailItem>
        </dl>
        {/* ACCIONES */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => onDelete?.(appointment)}
            className="inline-flex items-center gap-1.5 rounded-lg p-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100/60 dark:text-red-500 dark:hover:bg-red-900/30"
            title="Eliminar cita"
          >
            <Trash2 size={16} />
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => onCancel?.(appointment)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100/60 dark:text-zinc-200 dark:hover:bg-zinc-800/30"
            >
              <Ban size={15} />
              Anular
            </button>
            <button
              onClick={() => onEdit?.(appointment)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Pencil size={14} />
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
