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
  Undo2,
} from "lucide-react";
import FichaTecnicaModal from "../FichaTecnicaModal";
import type { CalendarAppointment } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ==========================================================================
   HELPERS FUERA DEL COMPONENTE (Para evitar pérdida de foco)
   ========================================================================== */

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

/* ==========================================================================
   COMPONENTE PRINCIPAL
   ========================================================================== */

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
  const [associatedServices, setAssociatedServices] = useState<any[]>([]);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFicha, setShowFicha] = useState(false);

  const isPaid = appointment.raw.estado?.toLowerCase() === "cita pagada";
  const isCancelled = appointment.raw.estado?.toLowerCase() === "cita cancelada";
  
  useEffect(() => {
    async function fetchGroup() {
      const groupId = (appointment.raw as any).appointment_id;
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .or(groupId ? `appointment_id.eq.${groupId}` : `id.eq.${appointment.id}`)
        .order("id", { ascending: true });
      if (data) setAssociatedServices(data);
    }
    fetchGroup();
  }, [appointment]);

  const updatePriceLocal = (id: number, val: string) => {
    setAssociatedServices(prev => 
      prev.map(s => s.id === id ? { ...s, price: val } : s)
    );
  };

  const currentTotal = associatedServices.reduce((acc, s) => acc + Number(s.price || 0), 0);

  const notifyN8N = async (action: "EDITED" | "CANCELLED") => {
    try {
      const rawPhone = String((appointment.raw as any).celular || "").replace(/\D/g, "");
      const rawIndicativo = String((appointment.raw as any).indicativo || "57").replace(/\D/g, "");
      const fullPhone = `+${rawIndicativo}${rawPhone}`;

      await fetch("/api/bookings/notify-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          appointmentId: appointment.id,
          customerName: appointment.raw.cliente,
          customerPhone: fullPhone,
          servicio: appointment.title,
          especialista: appointment.raw.especialista,
          fecha: format(appointment.start, "PPP", { locale: es }),
          // Cambio aplicado aquí para la notificación
          hora: format(appointment.start, "h:mm aa", { locale: es }),
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

      onCancel?.(appointment);
      onClose();
    } catch (error) {
      alert("No se pudo cancelar la cita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePayment = async () => {
    if (isPaid) {
      setIsSubmitting(true);
      await fetch("/api/bookings/unpay", { method: "POST", body: JSON.stringify({ appointmentId: appointment.id }) });
      onMarkAsPaid?.(appointment.id);
      setIsSubmitting(false);
      return;
    }

    if (!isEditingPrices) {
      setIsEditingPrices(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/bookings/mark-as-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          appointmentId: appointment.id,
          serviceUpdates: associatedServices.map(s => ({ id: s.id, price: Number(s.price) }))
        }),
      });

      if (!response.ok) throw new Error("Error al pagar");
      onMarkAsPaid?.(appointment.id);
      onClose();
    } catch (error) {
      alert("No se pudo procesar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
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

          <DetailItem icon={<DollarSign size={18} />} label="Servicios y Precios">
            <div className="space-y-2 mt-2">
              {associatedServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 truncate flex-1">{s.servicio}</span>
                  {isEditingPrices ? (
                    <div className="flex items-center bg-white dark:bg-zinc-900 border rounded-lg px-2 py-1 w-28">
                      <span className="text-[10px] font-bold mr-1 text-zinc-400">$</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={s.price}
                        onChange={(e) => updatePriceLocal(s.id, e.target.value)}
                        className="w-full bg-transparent text-xs font-black outline-none text-zinc-800 dark:text-zinc-100"
                        autoFocus={associatedServices[0].id === s.id}
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-black text-indigo-600">${Number(s.price).toLocaleString()}</span>
                  )}
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-2 border-t border-dashed dark:border-zinc-700">
                <span className="text-[10px] font-black uppercase text-zinc-400">Total a pagar</span>
                <span className="text-xl font-black text-emerald-600">${currentTotal.toLocaleString()}</span>
              </div>
            </div>
          </DetailItem>

          <DetailItem icon={<Scissors size={18} />} label="Especialista">
            {appointment.raw.especialista}
          </DetailItem>

          <DetailItem icon={<Tag size={18} />} label="Estado">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyles(appointment.raw.estado)}`}>
              {appointment.raw.estado}
            </span>
          </DetailItem>

          <DetailItem icon={<Calendar size={18} />} label="Fecha">
            {format(appointment.start, "PPP", { locale: es })}
          </DetailItem>

          <DetailItem icon={<Clock size={18} />} label="Hora">
            {/* Cambio aplicado aquí para la visualización del Modal */}
            {format(appointment.start, "h:mm aa", { locale: es })} – {format(appointment.end, "h:mm aa", { locale: es })}
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
              disabled={isSubmitting || isPaid || isCancelled}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isCancelled 
                  ? "bg-red-50 text-red-400 border border-red-100" 
                  : "text-zinc-800 hover:bg-zinc-100/60 dark:text-zinc-200 dark:hover:bg-zinc-800/30"
              }`}
            >
              <Ban size={15} />
              {isSubmitting ? "..." : isCancelled ? "Cancelada" : "Cancelar"}
            </button>

            <button
              onClick={handleTogglePayment}
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isPaid ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isPaid ? <Undo2 size={15} /> : <DollarSign size={15} />}
              {isSubmitting ? "..." : isPaid ? "Anular Pago" : isEditingPrices ? "Confirmar" : "Marcar Pago"}
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