"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  User,
  Scissors,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Building,
  DollarSign,
  Ban,
  Undo2,
  ArrowLeft,
} from "lucide-react";

interface ReservationDetailsProps {
  appointmentData: any | null;
  onEdit: () => void;
  onSuccess?: () => void;
}

export default function ReservationDetails({
  appointmentData,
  onEdit,
  onSuccess,
}: ReservationDetailsProps) {
  const router = useRouter();
  const closeReservationDrawer = useUIStore((s) => s.closeReservationDrawer);
  const [associatedServices, setAssociatedServices] = useState<any[]>([]);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const data = appointmentData?.raw || {};
  const isPaid = data.estado?.toLowerCase() === "cita pagada";
  const isCancelled = data.estado?.toLowerCase() === "cita cancelada";

  useEffect(() => {
    async function fetchGroup() {
      if (!appointmentData?.id) return;
      const groupId = data.appointment_id;
      const { data: list } = await supabase
        .from("appointments")
        .select("*")
        .or(groupId ? `appointment_id.eq.${groupId}` : `id.eq.${appointmentData.id}`)
        .order("id", { ascending: true });
      if (list) setAssociatedServices(list);
    }
    fetchGroup();
  }, [appointmentData, data.appointment_id]);

  const currentTotal = associatedServices.reduce((acc, s) => acc + Number(s.price || 0), 0);

  const handleTogglePayment = async () => {
    if (isPaid) {
      setIsSubmitting(true);
      await fetch("/api/bookings/unpay", { 
        method: "POST", 
        body: JSON.stringify({ appointmentId: appointmentData.id }) 
      });
      onSuccess?.();
      closeReservationDrawer();
      return;
    }

    if (!isEditingPrices) {
      setIsEditingPrices(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch("/api/bookings/mark-as-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          appointmentId: appointmentData.id,
          serviceUpdates: associatedServices.map(s => ({ id: s.id, price: Number(s.price) }))
        }),
      });
      onSuccess?.();
      closeReservationDrawer();
    } catch (error) {
      alert("Error en el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAction = async () => {
    if (!confirm("¿Deseas cancelar esta cita?")) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointmentData.id }),
      });
      if (!res.ok) throw new Error();
      onSuccess?.();
      closeReservationDrawer();
    } catch (error) {
      alert("Error al cancelar");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FUNCIÓN ELIMINAR CORREGIDA ---
  const handleDelete = async () => {
    if (!confirm("⚠️ ¿Eliminar permanentemente esta reserva? Esta acción no se puede deshacer.")) return;
    
    setIsSubmitting(true);
    try {
      const groupId = data.appointment_id;
      
      // Creamos la consulta base
      let query = supabase.from("appointments").delete();
      
      if (groupId) {
        // Si hay un ID de grupo, borramos todos los servicios de esa reserva
        query = query.eq("appointment_id", groupId);
      } else {
        // Si no hay grupo, borramos solo este registro por ID
        query = query.eq("id", appointmentData.id);
      }

      const { error } = await query;

      if (error) throw error;

      // Si todo sale bien
      onSuccess?.(); // Refresca la agenda principal
      router.refresh();
      closeReservationDrawer(); // Cierra el drawer
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar la reserva: " + (error.message || "Error de conexión"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* SECCIÓN CLIENTE Y ESTADO */}
      <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 dark:bg-indigo-900/40">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold">Cliente</p>
            <p className="text-lg font-black dark:text-white">{data.cliente}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
          isPaid ? "bg-green-100 text-green-700" : isCancelled ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
        }`}>
          {data.estado?.replace("Cita ", "")}
        </div>
      </div>

      {/* DETALLES CITA */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-zinc-400" />
          <span className="text-sm font-medium">
            {appointmentData?.start ? format(appointmentData.start, "PPP", { locale: es }) : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-zinc-400" />
          <span className="text-sm font-medium">
            {appointmentData?.start ? format(appointmentData.start, "h:mm aa", { locale: es }) : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Building size={16} className="text-zinc-400" />
          <span className="text-sm font-medium">{data.sede}</span>
        </div>
      </div>

      {/* SERVICIOS Y PRECIOS */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <p className="text-[10px] font-black uppercase text-zinc-400 mb-3 tracking-widest">Servicios Contratados</p>
        <div className="space-y-4">
          {associatedServices.map((s) => (
            <div key={s.id} className="flex justify-between items-start">
              <div className="flex flex-col overflow-hidden mr-2">
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 truncate">{s.servicio}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Scissors size={10} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-500/70 uppercase tracking-tight">
                    {s.especialista || "Sin especialista"}
                  </span>
                </div>
              </div>
              {isEditingPrices ? (
                <div className="flex items-center bg-white dark:bg-zinc-900 border rounded-lg px-2 py-1 w-24 shrink-0">
                  <span className="text-[10px] font-bold mr-1 text-zinc-400">$</span>
                  <input 
                    type="number" 
                    value={s.price}
                    onChange={(e) => setAssociatedServices(prev => prev.map(item => item.id === s.id ? {...item, price: e.target.value} : item))}
                    className="w-full bg-transparent text-xs font-black outline-none text-zinc-800 dark:text-zinc-100"
                  />
                </div>
              ) : (
                <span className="text-sm font-black text-indigo-600 shrink-0">${Number(s.price).toLocaleString()}</span>
              )}
            </div>
          ))}
          <div className="pt-3 border-t border-dashed flex justify-between items-center">
            <span className="text-xs font-black uppercase text-zinc-500">Total a pagar</span>
            <span className="text-xl font-black text-emerald-600">${currentTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ACCIONES DEL PIE */}
      <div className="mt-auto pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {isEditingPrices && !isPaid && (
              <button
                type="button"
                onClick={() => setIsEditingPrices(false)}
                className="px-4 py-3 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 transition-all shadow-sm active:scale-[0.95]"
                title="Volver"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <button
              onClick={handleTogglePayment}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-[0.98] ${
                isPaid ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {isPaid ? <Undo2 size={18} /> : <DollarSign size={18} />}
              {isPaid ? "Anular Pago" : isEditingPrices ? "Confirmar Pago" : "Cobrar Cita"}
            </button>
            
            {!isEditingPrices && (
              <button
                onClick={onEdit}
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md active:scale-[0.98]"
              >
                <Edit size={20} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancelAction}
              disabled={isSubmitting || isPaid || isCancelled}
              className="flex-1 flex items-center justify-center gap-2 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 disabled:opacity-50"
            >
              <Ban size={16} /> Cancelar Cita
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}