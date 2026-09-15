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
  ChevronDown,
} from "lucide-react";
import FichaTecnicaModal from "../FichaTecnicaModal";
import type { CalendarAppointment } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ==========================================================================
   HELPERS Y MAPEO DE ESTADOS
   ========================================================================== */

const getStatusStyles = (status: string | undefined): string => {
  const defaultStyles = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-bold";
  if (!status) return defaultStyles;

  const statusMap: { [key: string]: string } = {
    "cita confirmada": "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 font-extrabold",
    "cita pagada": "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 font-extrabold",
    "cita cancelada": "bg-rose-50/60 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/20 font-bold",
    "nueva reserva creada": "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 font-extrabold",
    "no se presentó": "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30 font-extrabold",
    "pago anulado": "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30 font-extrabold",
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
  const [showCancelMenu, setShowCancelMenu] = useState(false);

  const currentStatus = appointment.raw.estado?.toLowerCase();
  const isPaid = currentStatus === "cita pagada";
  const isInactive = ["cita cancelada", "no se presentó", "pago anulado"].includes(currentStatus || "");

  // Cargar grupo de servicios asociados
  useEffect(() => {
    async function fetchGroup() {
      const groupId = (appointment.raw as any).appointment_id;
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .or(groupId ? `appointment_id.eq.${groupId}` : `id.eq.${appointment.id}`)
        .order("id", { ascending: true });

      if (data) {
        // Inicializar campos de descuento y abono si vienen vacíos
        const initializedData = data.map(item => ({
          ...item,
          price: item.price || 0,
          descuento: item.descuento || 0,
          abono: item.abono || 0,
        }));
        setAssociatedServices(initializedData);
      }
    }
    fetchGroup();
  }, [appointment]);

  // Función para actualizar campos financieros locales de un servicio
  const updateServiceFinance = (id: number, field: string, val: string) => {
    setAssociatedServices(prev =>
      prev.map(s => {
        if (s.id === id) {
          const updated = { ...s, [field]: val };
          // Recalcular price_final para ese servicio individual
          const base = Number(updated.price) || 0;
          const descPercent = Number(updated.descuento) || 0;
          const abonoVal = Number(updated.abono) || 0;
          const descAmount = base * (descPercent / 100);
          updated.price_final = Math.max(0, base - descAmount - abonoVal);
          return updated;
        }
        return s;
      })
    );
  };

  // Cálculo del gran total a pagar en tiempo real
  const currentTotal = associatedServices.reduce((acc, s) => {
    const base = Number(s.price) || 0;
    const descPercent = Number(s.descuento) || 0;
    const abonoVal = Number(s.abono) || 0;
    const descAmount = base * (descPercent / 100);
    const finalPrice = Math.max(0, base - descAmount - abonoVal);
    return acc + finalPrice;
  }, 0);

  // Manejar el cambio de estado (Cancelar, No se presentó, Pago anulado)
  const handleStatusChange = async (targetStatus: string) => {
    if (!appointment?.id) return;
    if (!confirm(`¿Confirmas cambiar el estado a '${targetStatus}'?`)) return;

    setIsSubmitting(true);
    setShowCancelMenu(false);
    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          estado: targetStatus,
        }),
      });

      if (!response.ok) throw new Error("Error al cambiar estado");

      onCancel?.(appointment);
      onClose();
    } catch (error) {
      alert("No se pudo actualizar el estado de la cita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar Pago / Cobro de cita
  const handleTogglePayment = async () => {
    if (isPaid) {
      setIsSubmitting(true);
      await fetch("/api/bookings/unpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });
      onMarkAsPaid?.(String(appointment.id));
      setIsSubmitting(false);
      onClose();
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
          serviceUpdates: associatedServices.map(s => {
            const base = Number(s.price) || 0;
            const descPercent = Number(s.descuento) || 0;
            const abonoVal = Number(s.abono) || 0;
            const descAmount = base * (descPercent / 100);
            const priceFinal = Math.max(0, base - descAmount - abonoVal);

            return {
              id: s.id,
              price: base,
              descuento: descPercent,
              abono: abonoVal,
              price_final: priceFinal,
            };
          }),
        }),
      });

      if (!response.ok) throw new Error("Error al pagar");
      onMarkAsPaid?.(String(appointment.id));
      onClose();
    } catch (error) {
      alert("No se pudo procesar el cobro de la cita");
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

          {/* SERVICIOS, PRECIOS, DESCUENTOS Y ABONOS EDITABLES */}
          <DetailItem icon={<DollarSign size={16} />} label="Servicios y Finanzas">
            <div className="space-y-3 mt-1.5">
              {associatedServices.map((s) => (
                <div key={s.id} className="bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">{s.servicio}</span>
                  
                  {isEditingPrices ? (
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-200/40 dark:border-zinc-800">
                      <div>
                        <label className="text-[9px] font-black uppercase text-zinc-400 block mb-0.5">Precio Base</label>
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1">
                          <span className="text-[10px] text-zinc-400 mr-0.5">$</span>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={s.price}
                            onChange={(e) => updateServiceFinance(s.id, "price", e.target.value)}
                            className="w-full bg-transparent text-xs font-bold outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-zinc-400 block mb-0.5">Desc (%)</label>
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1">
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={s.descuento}
                            onChange={(e) => updateServiceFinance(s.id, "descuento", e.target.value)}
                            className="w-full bg-transparent text-xs font-bold outline-none text-center"
                          />
                          <span className="text-[10px] text-zinc-400">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-zinc-400 block mb-0.5">Abono ($)</label>
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1">
                          <span className="text-[10px] text-zinc-400 mr-0.5">$</span>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={s.abono}
                            onChange={(e) => updateServiceFinance(s.id, "abono", e.target.value)}
                            className="w-full bg-transparent text-xs font-bold outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 text-[10px] font-bold">
                        {Number(s.descuento) > 0 && `Desc: ${s.descuento}% `}
                        {Number(s.abono) > 0 && `Abono: $${Number(s.abono).toLocaleString("es-CO")}`}
                      </span>
                      <span className="font-extrabold text-rose-500">
                        ${(s.price_final ? Number(s.price_final) : Number(s.price)).toLocaleString("es-CO")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-black uppercase text-zinc-400">Total a Cobrar</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  ${currentTotal.toLocaleString("es-CO")} COP
                </span>
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

          <div className="flex items-center gap-2 relative">
            
            {/* Selector desplegable de Estados de Cancelación */}
            <div className="relative">
              <button
                onClick={() => setShowCancelMenu(!showCancelMenu)}
                disabled={isSubmitting || isPaid || isInactive}
                className={`inline-flex items-center justify-center gap-1 rounded-2xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 ${
                  isInactive 
                    ? "bg-rose-50 text-rose-400 border border-rose-200/50 dark:bg-rose-950/30 dark:border-rose-900/30" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <Ban size={14} />
                <span>{isSubmitting ? "..." : isInactive ? appointment.raw.estado : "Estado"}</span>
                {!isInactive && <ChevronDown size={12} />}
              </button>

              {/* Menú Flotante de Opciones */}
              {showCancelMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-44 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden z-50">
                  <button
                    onClick={() => handleStatusChange("Cita cancelada")}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    Cancelar Cita
                  </button>
                  <button
                    onClick={() => handleStatusChange("No se presentó")}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                  >
                    No se presentó
                  </button>
                  <button
                    onClick={() => handleStatusChange("Pago anulado")}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                  >
                    Pago anulado
                  </button>
                </div>
              )}
            </div>

            {/* Marcar Pago / Confirmar Cobro */}
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
              <span>{isSubmitting ? "..." : isPaid ? "Anular Pago" : isEditingPrices ? "Confirmar Cobro" : "Cobrar Cita"}</span>
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