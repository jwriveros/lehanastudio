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
  Sparkles,
} from "lucide-react";
import FichaTecnicaModal from "../FichaTecnicaModal";
import type { CalendarAppointment } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ==========================================================================
   HELPERS Y MAPEO DE ESTADOS (Fuera del componente)
   ========================================================================== */

const getStatusStyles = (status: string | undefined): string => {
  const defaultStyles = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-bold";
  if (!status) return defaultStyles;

  const statusMap: { [key: string]: string } = {
    "cita confirmada": "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 font-extrabold",
    "cita pagada": "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 font-extrabold",
    "cita cancelada": "bg-rose-50/60 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/20 font-bold",
    "nueva reserva creada": "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 font-extrabold",
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
  <div className="flex items-start gap-3.5">
    <div className="mt-0.5 flex-shrink-0 text-rose-500">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <dt className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-0.5">{label}</dt>
      <dd className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans antialiased animate-in zoom-in-95 duration-200">
        
        {/* ENCABEZADO */}
        <div className="mb-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-xl">
              <Sparkles size={16} />
            </div>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Detalle de la Cita
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL DE DETALLES */}
        <dl className="mb-6 space-y-4">
          
          {/* CLIENTE & FICHA TÉCNICA */}
          <DetailItem icon={<User size={16} />} label="Cliente">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate uppercase font-bold text-xs">{appointment.raw.cliente}</span>
              <button 
                onClick={() => setShowFicha(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200/60 dark:border-rose-900/30 rounded-xl text-[10px] font-extrabold hover:bg-rose-100 transition-all cursor-pointer shrink-0"
              >
                <ClipboardList size={12} />
                INFO
              </button>
            </div>
          </DetailItem>

          {/* SERVICIOS Y PRECIOS EDITABLES */}
          <DetailItem icon={<DollarSign size={16} />} label="Servicios y Precios">
            <div className="space-y-2 mt-1.5">
              {associatedServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate flex-1">{s.servicio}</span>
                  {isEditingPrices ? (
                    <div className="flex items-center bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-900/50 rounded-xl px-2 py-1 w-28 shadow-2xs">
                      <span className="text-[10px] font-bold mr-1 text-rose-500">$</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={s.price}
                        onChange={(e) => updatePriceLocal(s.id, e.target.value)}
                        className="w-full bg-transparent text-xs font-extrabold outline-none text-zinc-900 dark:text-zinc-100"
                        autoFocus={associatedServices[0].id === s.id}
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-extrabold text-rose-500">${Number(s.price).toLocaleString("es-CO")}</span>
                  )}
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-black uppercase text-zinc-400">Total a Pagar</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">${currentTotal.toLocaleString("es-CO")} COP</span>
              </div>
            </div>
          </DetailItem>

          {/* ESPECIALISTA */}
          <DetailItem icon={<Scissors size={16} />} label="Especialista">
            {appointment.raw.especialista}
          </DetailItem>

          {/* ESTADO */}
          <DetailItem icon={<Tag size={16} />} label="Estado">
            <span className={`inline-block rounded-full px-3 py-0.5 text-[10px] uppercase tracking-wider ${getStatusStyles(appointment.raw.estado)}`}>
              {appointment.raw.estado}
            </span>
          </DetailItem>

          {/* FECHA */}
          <DetailItem icon={<Calendar size={16} />} label="Fecha">
            {format(appointment.start, "PPP", { locale: es })}
          </DetailItem>

          {/* HORA */}
          <DetailItem icon={<Clock size={16} />} label="Hora">
            {format(appointment.start, "h:mm aa", { locale: es })} – {format(appointment.end, "h:mm aa", { locale: es })}
          </DetailItem>
        </dl>

        {/* ACCIONES Y BOTONES INFERIORES */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          
          {/* Eliminar Cita */}
          <button
            onClick={() => onDelete?.(appointment)}
            className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all cursor-pointer"
            title="Eliminar Cita"
          >
            <Trash2 size={16} />
          </button>

          <div className="flex items-center gap-2">
            
            {/* Cancelar Cita */}
            <button
              onClick={handleCancelAction}
              disabled={isSubmitting || isPaid || isCancelled}
              className={`inline-flex items-center justify-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 ${
                isCancelled 
                  ? "bg-rose-50 text-rose-400 border border-rose-200/50 dark:bg-rose-950/30 dark:border-rose-900/30" 
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <Ban size={14} />
              <span>{isSubmitting ? "..." : isCancelled ? "Cancelada" : "Cancelar"}</span>
            </button>

            {/* Marcar Pago / Anular Pago */}
            <button
              onClick={handleTogglePayment}
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 ${
                isPaid 
                  ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" 
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              }`}
            >
              {isPaid ? <Undo2 size={14} /> : <DollarSign size={14} />}
              <span>{isSubmitting ? "..." : isPaid ? "Anular Pago" : isEditingPrices ? "Confirmar" : "Marcar Pago"}</span>
            </button>

            {/* Editar Cita */}
            <button
              onClick={() => onEdit?.(appointment)}
              className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-xs shadow-rose-500/20 transition-all active:scale-95 cursor-pointer"
              title="Editar Cita"
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