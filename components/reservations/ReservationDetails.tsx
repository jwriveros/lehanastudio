"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import FichaTecnicaEditor from "./FichaTecnicaEditor"; // Importación del editor de fichas
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
  History,
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

  // CONTROL DEL PANEL LATERAL
  const [showHistory, setShowHistory] = useState(false);

  // ESTADO DE AUTORIZACIÓN BASADO EN TU LOCAL STORAGE
  const [isAuthorized, setIsAuthorized] = useState(false);

  const data = appointmentData?.raw || {};
  const isPaid = data.estado?.toLowerCase() === "cita pagada";
  const isCancelled = data.estado?.toLowerCase() === "cita cancelada";

  /* LECTOR BLINDADO PARA EL PATH: state.session.email */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const verificarPermisosLocalStorage = () => {
      const emailObjetivo = "lesliegutierrezpmu@gmail.com";
      let accesoConcedido = false;

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const llave = localStorage.key(i);
          if (!llave) continue;

          const contenido = localStorage.getItem(llave);
          if (!contenido) continue;

          try {
            const jsonParseado = JSON.parse(contenido);
            
            // 1. Ir directo al path exacto de tu persistencia
            if (jsonParseado?.state?.session?.email?.toLowerCase().trim() === emailObjetivo) {
              accesoConcedido = true;
              break;
            }

            // Fallback por si acaso estuviera en el formato por defecto de Supabase
            if (jsonParseado?.user?.email?.toLowerCase().trim() === emailObjetivo) {
              accesoConcedido = true;
              break;
            }
          } catch (e) {
            // Ignorar errores de parseo si la llave actual no almacena un JSON válido
          }

          // 2. Candado maestro: Si el texto crudo contiene el correo, le damos acceso inmediato
          if (contenido.toLowerCase().includes(emailObjetivo)) {
            accesoConcedido = true;
            break;
          }
        }
      } catch (error) {
        console.error("Error leyendo permisos en localStorage:", error);
      }

      setIsAuthorized(accesoConcedido);
    };

    verificarPermisosLocalStorage();
  }, [appointmentData]);

  /* CARGAR SERVICIOS ASOCIADOS A LA CITA ACTUAL */
  useEffect(() => {
    async function fetchGroup() {
      if (!appointmentData?.id) return;
      
      const groupId = data.appointment_id;
      let query = supabase.from("appointments").select("*");
      
      if (groupId) {
        query = query.eq("appointment_id", groupId);
      } else {
        query = query.eq("id", appointmentData.id);
      }

      const { data: list, error } = await query.order("id", { ascending: true });
      
      if (error) {
        console.error("Error al cargar servicios asociados:", error);
      } else if (list) {
        setAssociatedServices(list);
      }
    }
    fetchGroup();
  }, [appointmentData, data.appointment_id]);

  const currentTotal = associatedServices.reduce((acc, s) => acc + Number(s.price || 0), 0);

  const handleTogglePayment = async () => {
    if (!isAuthorized) return; 
    if (isPaid) {
      setIsSubmitting(true);
      try {
        await fetch("/api/bookings/unpay", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: appointmentData.id })
        });
        onSuccess?.();
        router.refresh();
        closeReservationDrawer();
      } catch (err) {
        alert("Error al anular el pago");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!isEditingPrices) {
      setIsEditingPrices(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings/mark-as-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          appointmentId: appointmentData.id,
          serviceUpdates: associatedServices.map(s => ({ id: s.id, price: Number(s.price) }))
        }),
      });
      
      if (!res.ok) throw new Error();
      
      onSuccess?.();
      router.refresh();
      closeReservationDrawer();
    } catch (error) {
      alert("Error al registrar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAction = async () => {
    if (!isAuthorized) return;
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
      router.refresh();
      closeReservationDrawer();
    } catch (error) {
      alert("Error al cancelar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthorized) return;
    if (!confirm("⚠️ ¿Eliminar permanentemente esta reserva? Esta acción no se puede deshacer.")) return;
    setIsSubmitting(true);
    try {
      const groupId = data.appointment_id;
      let query = supabase.from("appointments").delete();
      if (groupId) query = query.eq("appointment_id", groupId);
      else query = query.eq("id", appointmentData.id);

      const { error } = await query;
      if (error) throw error;

      onSuccess?.();
      router.refresh();
      closeReservationDrawer();
    } catch (error: any) {
      alert("Error al eliminar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl">
      
      {/* PANEL IZQUIERDO DESLIZABLE */}
      {showHistory && data.celular && (
        <div className="w-full md:w-[400px] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto animate-in slide-in-from-left duration-300 flex flex-col h-full shrink-0">
          <div className="p-4 flex-1 overflow-y-auto">
            <FichaTecnicaEditor celular={String(data.celular)} />
          </div>
        </div>
      )}

      {/* PANEL DERECHO: DETALLES PRINCIPALES DE LA RESERVA */}
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto h-full">
        {/* SECCIÓN CLIENTE Y ESTADO */}
        <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 dark:bg-indigo-900/40">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold">Cliente</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-lg font-black dark:text-white leading-none">{data.cliente}</p>
                {data.celular && (
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${
                      showHistory 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                        : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 hover:bg-indigo-100"
                    }`}
                  >
                    <History size={11} />
                    {showHistory ? "Ocultar" : "Historial"}
                  </button>
                )}
              </div>
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
          <p className="text-[10px] font-black uppercase text-zinc-400 mb-3 tracking-widest">Services Contratados</p>
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
                  <div className="flex items-center bg-white dark:bg-zinc-900 border rounded-lg px-2 py-1 w-28 shrink-0">
                    <span className="text-[10px] font-bold mr-1 text-zinc-400">$</span>
                    <input 
                      type="number" 
                      value={s.price || 0}
                      onChange={(e) => setAssociatedServices(prev => 
                        prev.map(item => item.id === s.id ? {...item, price: e.target.value} : item)
                      )}
                      className="w-full bg-transparent text-xs font-black outline-none text-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                ) : (
                  <span className="text-sm font-black text-indigo-600 shrink-0">
                    ${Number(s.price || 0).toLocaleString("es-CO")}
                  </span>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-dashed flex justify-between items-center">
              <span className="text-xs font-black uppercase text-zinc-500">Total a pagar</span>
              <span className="text-xl font-black text-emerald-600">${currentTotal.toLocaleString("es-CO")}</span>
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
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              {/* Cobrar Cita */}
              <button
                onClick={handleTogglePayment}
                disabled={isSubmitting || associatedServices.length === 0 || !isAuthorized}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all shadow-md active:scale-[0.98] ${
                  isPaid ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isPaid ? <Undo2 size={18} /> : <DollarSign size={18} />}
                {isPaid ? "Anular Pago" : isEditingPrices ? "Confirmar Pago" : "Cobrar Cita"}
              </button>
              
              {/* Editar Cita */}
              {!isEditingPrices && (
                <button
                  onClick={onEdit}
                  disabled={!isAuthorized}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Edit size={20} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {/* Cancelar Cita */}
              <button
                onClick={handleCancelAction}
                disabled={isSubmitting || isPaid || isCancelled || !isAuthorized}
                className="flex-1 flex items-center justify-center gap-2 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                <Ban size={16} /> Cancelar Cita
              </button>
              
              {/* Eliminar Reserva */}
              <button
                onClick={handleDelete}
                disabled={isSubmitting || !isAuthorized}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Eliminar reserva"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}