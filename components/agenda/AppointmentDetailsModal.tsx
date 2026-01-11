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
  ClipboardList,
  DollarSign,
  Undo2, // Icono para anular
} from "lucide-react";
import FichaTecnicaModal from "../FichaTecnicaModal";
import type { CalendarAppointment } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

/**
 * Devuelve las clases de Tailwind CSS para un estado de cita específico.
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

export default function AppointmentDetailsModal({
  appointment,
  onClose,
  onEdit,
  onCancel,
  onDelete,
  onMarkAsPaid,
}: {
  appointment: CalendarAppointment;
  onClose: () => void;
  onEdit?: (appointment: CalendarAppointment) => void;
  onCancel?: (appointment: CalendarAppointment) => void;
  onDelete?: (appointment: CalendarAppointment) => void;
  onMarkAsPaid?: (appointmentId: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFicha, setShowFicha] = useState(false);

  const isPaid = appointment.raw.estado?.toLowerCase() === "cita pagada";
  const isCancelled = appointment.raw.estado?.toLowerCase() === "cita cancelada";
  // Dentro de AppointmentDetailsModal.tsx
  const notifyN8N = async (action: "EDITED" | "CANCELLED") => {
    try {
      // Normalizamos el celular para el webhook
      const rawPhone = String((appointment.raw as any).celular || "").replace(/\D/g, "");
      const rawIndicativo = String((appointment.raw as any).indicativo || "57").replace(/\D/g, "");
      
      // 2. Creamos el número completo formateado
      const fullPhone = `+${rawIndicativo}${rawPhone}`;

      await fetch("/api/bookings/notify-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action, // "EDITED" o "CANCELLED"
          appointmentId: appointment.id,
          customerName: appointment.raw.cliente,
          customerPhone: fullPhone, // Envía el número internacional real
          servicio: appointment.title,
          especialista: appointment.raw.especialista,
          fecha: format(appointment.start, "PPP", { locale: es }),
          hora: format(appointment.start, "p", { locale: es }),
          indicativo: (appointment.raw as any).indicativo || "+57"
        }),
      });
    } catch (error) {
      console.error(`Error notificando ${action}:`, error);
    }
  };
  const handleCancelAction = async () => {
  if (!appointment?.id) return;
  if (!confirm("¿Deseas cancelar esta cita? El cliente recibirá un mensaje.")) return;

  setIsSubmitting(true);
  try {
    const response = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: appointment.id }),
    });

    if (!response.ok) throw new Error("Error al cancelar");
    await notifyN8N("CANCELLED");

    onCancel?.(appointment); // Refresca el calendario
    onClose();
  } catch (error) {
    alert("No se pudo cancelar la cita.");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleTogglePayment = async () => {
  if (!appointment?.id) return;
  setIsSubmitting(true);

  const endpoint = isPaid ? "/api/bookings/unpay" : "/api/bookings/mark-as-paid";
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: appointment.id }),
    });

    const data = await response.json(); // Leemos la respuesta del servidor

    if (!response.ok) {
      // Ahora el error será específico, ej: "Falta SUPABASE_SERVICE_ROLE_KEY"
      throw new Error(data.error || data.details || "Error en la operación");
    }

    onMarkAsPaid?.(appointment.id);
    onClose();
  } catch (error: any) {
    alert("Atención: " + error.message); // Muestra el error real en un alert
    console.error("Detalle del error:", error);
  } finally {
    setIsSubmitting(false);
  }
};
  

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
            <div className="flex items-center gap-2">
              <span>{appointment.raw.cliente}</span>
              <button 
                onClick={() => setShowFicha(true)}
                className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-md text-[10px] font-bold hover:bg-indigo-200 transition-colors"
              >
                <ClipboardList size={12} />
                INFO
              </button>
            </div>
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
              onClick={handleCancelAction}
              // Se deshabilita si ya está enviando, o si ya está pagada, o si ya está cancelada
              disabled={isSubmitting || isPaid || isCancelled}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isCancelled 
                  ? "bg-red-50 text-red-400 border border-red-100" // Estilo "Ya cancelado"
                  : "text-zinc-800 hover:bg-zinc-100/60 dark:text-zinc-200 dark:hover:bg-zinc-800/30"
              }`}
            >
              <Ban size={15} />
              {isSubmitting ? "Cancelando..." : isCancelled ? "Cancelada" : "Cancelar"}
            </button>

            {/* BOTÓN DE PAGO / ANULACIÓN DINÁMICO */}
            <button
              onClick={handleTogglePayment}
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isPaid 
                  ? "bg-red-500 hover:bg-red-600" // Rojo si ya está pagado
                  : "bg-green-500 hover:bg-green-600" // Verde si está pendiente
              }`}
            >
              {isPaid ? <Undo2 size={15} /> : <DollarSign size={15} />}
              {isSubmitting 
                ? "Procesando..." 
                : isPaid 
                  ? "Anular Pago" 
                  : "Marcar Pago"
              }
            </button>

            <button
              onClick={() => onEdit?.(appointment)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <Pencil size={14} />
            </button>
          </div>
        </div>
      </div>

      <FichaTecnicaModal 
        isOpen={showFicha}
        onClose={() => setShowFicha(false)}
        cliente={{
          nombre: appointment.raw.cliente || "",
          celular: String((appointment.raw as any).celular || "")
        }}
      />
    </div>
  );
}