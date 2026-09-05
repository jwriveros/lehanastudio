"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import FichaTecnicaEditor from "./FichaTecnicaEditor";
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
  Loader2,
  Sparkles,
} from "lucide-react";

interface ReservationDetailsProps {
  appointmentData: any | null;
  onEdit: (services?: any[]) => void;
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
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const data = appointmentData?.raw || {};
  const isPaid = data.estado?.toLowerCase() === "cita pagada";
  const isCancelled = data.estado?.toLowerCase() === "cita cancelada";

  /* PERMISOS DE USUARIO EN LOCALSTORAGE */
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
            if (jsonParseado?.state?.session?.email?.toLowerCase().trim() === emailObjetivo) {
              accesoConcedido = true;
              break;
            }
            if (jsonParseado?.user?.email?.toLowerCase().trim() === emailObjetivo) {
              accesoConcedido = true;
              break;
            }
          } catch (e) {}

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

  /* SELECCIÓN AUTOMÁTICA DE SERVICIOS */
  useEffect(() => {
    if (associatedServices.length > 0) {
      setSelectedServiceIds(associatedServices.map((s) => s.id));
    }
  }, [associatedServices]);

  const toggleSelectService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  /* CARGA DE SERVICIOS CONSOLIDADOS DEL CLIENTE */
  useEffect(() => {
    let isMounted = true;

    async function fetchAllCustomerServices() {
      if (!appointmentData?.id) return;

      setLoadingServices(true);
      try {
        const baseDate = new Date(appointmentData.start || data.appointment_at || new Date());
        const startOfDay = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          0, 0, 0
        ).toISOString();
        
        const endOfDay = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate(),
          23, 59, 59
        ).toISOString();

        const celularCliente = data?.celular;
        const nombreCliente = data?.cliente;
        const groupId = data?.appointment_id;

        let query = supabase.from("appointments").select("*");

        if (groupId) {
          query = query.eq("appointment_id", groupId);
        } else if (celularCliente) {
          query = query
            .eq("celular", celularCliente)
            .gte("appointment_at", startOfDay)
            .lte("appointment_at", endOfDay);
        } else if (nombreCliente) {
          query = query
            .eq("cliente", nombreCliente)
            .gte("appointment_at", startOfDay)
            .lte("appointment_at", endOfDay);
        } else {
          query = query.eq("id", appointmentData.id);
        }

        const { data: list, error } = await query.order("appointment_at", { ascending: true });

        if (error) throw error;

        if (isMounted) {
          if (list && list.length > 0) {
            setAssociatedServices(list);
          } else {
            setAssociatedServices([data]);
          }
        }
      } catch (err) {
        console.error("Error al cargar servicios consolidados:", err);
      } finally {
        if (isMounted) setLoadingServices(false);
      }
    }

    fetchAllCustomerServices();

    return () => {
      isMounted = false;
      setAssociatedServices([]);
      setSelectedServiceIds([]);
      setIsEditingPrices(false);
    };
  }, [appointmentData, data.appointment_id, data.celular, data.cliente]);

  /* CÁLCULO DINÁMICO DEL TOTAL */
  const currentTotal = associatedServices
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((acc, s) => acc + Number(s.price || 0), 0);

  /* COBRAR O ANULAR PAGO */
  const handleTogglePayment = async () => {
    if (!isAuthorized) return;

    const activeServices = associatedServices.filter((s) =>
      selectedServiceIds.includes(s.id)
    );

    if (activeServices.length === 0) {
      alert("Por favor, selecciona al menos un servicio para realizar la acción.");
      return;
    }

    if (isPaid) {
      setIsSubmitting(true);
      try {
        await Promise.all(
          activeServices.map((s) =>
            fetch("/api/bookings/unpay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ appointmentId: s.id }),
            })
          )
        );

        onSuccess?.();
        router.refresh();
        closeReservationDrawer();
      } catch (err) {
        alert("Error al anular el pago de los servicios seleccionados");
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
          serviceUpdates: activeServices.map((s) => ({
            id: s.id,
            price: Number(s.price),
          })),
        }),
      });

      if (!res.ok) throw new Error();

      onSuccess?.();
      router.refresh();
      closeReservationDrawer();
    } catch (error) {
      alert("Error al registrar el pago de los servicios seleccionados");
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
    <div className="flex h-full w-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      
      {/* PANEL IZQUIERDO DESLIZABLE (FICHA TÉCNICA) */}
      {showHistory && data.celular && (
        <div className="w-full md:w-[420px] border-r border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto animate-in slide-in-from-left duration-300 flex flex-col h-full shrink-0 custom-scrollbar">
          <div className="p-4 flex-1 overflow-y-auto">
            <FichaTecnicaEditor celular={String(data.celular)} />
          </div>
        </div>
      )}

      {/* PANEL DERECHO: DETALLES PRINCIPALES */}
      <div className="flex-1 flex flex-col gap-5 p-4 sm:p-6 overflow-y-auto h-full custom-scrollbar">
        
        {/* SECCIÓN CLIENTE Y ESTADO DE LA CITA */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
              <User size={18} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Cliente</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-base font-extrabold dark:text-white leading-none uppercase">{data.cliente}</p>
                {data.celular && (
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      showHistory 
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                        : "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20"
                    }`}
                  >
                    <History size={11} />
                    {showHistory ? "Ocultar Ficha" : "Ficha Técnica"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
            isPaid 
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30" 
              : isCancelled 
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700" 
              : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30"
          }`}>
            {data.estado?.replace("Cita ", "") || "Reserva"}
          </span>
        </div>

        {/* METADATOS DE LA CITA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-zinc-900/90 p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-rose-500 shrink-0" />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {appointmentData?.start ? format(appointmentData.start, "PPP", { locale: es }) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-rose-500 shrink-0" />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {appointmentData?.start ? format(appointmentData.start, "h:mm aa", { locale: es }) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building size={15} className="text-rose-500 shrink-0" />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{data.sede || "Santa Marta"}</span>
          </div>
        </div>

        {/* SERVICIOS Y DESGLOSE DE PRECIOS */}
        <div className="bg-white dark:bg-zinc-900/90 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-rose-500" />
              Servicios Contratados
            </p>
          </div>

          {loadingServices ? (
            <div className="flex items-center justify-center py-6 gap-2 text-zinc-400 text-xs italic">
              <Loader2 size={18} className="animate-spin text-rose-500" /> Cargando servicios...
            </div>
          ) : (
            <div className="space-y-3">
              {associatedServices.map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);

                return (
                  <div key={s.id} className="flex justify-between items-center gap-3 bg-zinc-50/80 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectService(s.id)}
                        className="w-4 h-4 rounded-md border-zinc-300 text-rose-500 focus:ring-rose-400 dark:bg-zinc-900 dark:border-zinc-700 cursor-pointer"
                      />

                      <div className="flex flex-col overflow-hidden">
                        <span
                          className={`text-xs font-extrabold truncate transition-opacity ${
                            isSelected
                              ? "text-zinc-800 dark:text-zinc-200"
                              : "text-zinc-400 dark:text-zinc-600 line-through"
                          }`}
                        >
                          {s.servicio}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Scissors size={11} className="text-rose-500" />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            {s.especialista || "Sin asignar"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isEditingPrices ? (
                      <div className="flex items-center bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-900/50 rounded-xl px-2.5 py-1 w-28 shrink-0 shadow-2xs">
                        <span className="text-[10px] font-bold mr-1 text-rose-500">$</span>
                        <input
                          type="number"
                          disabled={!isSelected}
                          value={s.price || 0}
                          onChange={(e) =>
                            setAssociatedServices((prev) =>
                              prev.map((item) =>
                                item.id === s.id
                                  ? { ...item, price: e.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-full bg-transparent text-xs font-black outline-none text-zinc-900 dark:text-zinc-100 disabled:opacity-40"
                        />
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-black shrink-0 ${
                          isSelected ? "text-rose-500" : "text-zinc-400 line-through"
                        }`}
                      >
                        ${Number(s.price || 0).toLocaleString("es-CO")}
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Total Seleccionado
                </span>
                <span className="text-lg font-black text-rose-500">
                  ${currentTotal.toLocaleString("es-CO")} COP
                </span>
              </div>
            </div>
          )}
        </div>

        {/* BOTONERA DE ACCIONES DEL PIE */}
        <div className="mt-auto pt-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2">
              {isEditingPrices && !isPaid && (
                <button
                  type="button"
                  onClick={() => setIsEditingPrices(false)}
                  className="px-3.5 py-3 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 rounded-2xl hover:bg-zinc-200 transition-all cursor-pointer active:scale-95"
                  title="Volver"
                >
                  <ArrowLeft size={16} />
                </button>
              )}

              {/* Cobrar Cita / Confirmar / Anular Pago */}
              <button
                onClick={handleTogglePayment}
                disabled={isSubmitting || associatedServices.length === 0 || !isAuthorized}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-95 cursor-pointer ${
                  isPaid 
                    ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" 
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isPaid ? <Undo2 size={15} /> : <DollarSign size={15} />}
                {isPaid ? "Anular Pago" : isEditingPrices ? "Confirmar Pago" : "Cobrar Cita"}
              </button>
              
              {/* Editar Cita */}
              {!isEditingPrices && (
                <button
                  onClick={() => onEdit(associatedServices)}
                  disabled={isSubmitting || !isAuthorized}
                  className="p-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-2xl shadow-md shadow-rose-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                  title="Editar Cita"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Edit size={16} />}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {/* Cancelar Cita */}
              <button
                onClick={handleCancelAction}
                disabled={isSubmitting || isPaid || isCancelled || !isAuthorized}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl text-xs font-bold text-zinc-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer active:scale-95"
              >
                <Ban size={14} /> Cancelar Cita
              </button>
              
              {/* Eliminar Reserva */}
              <button
                onClick={handleDelete}
                disabled={isSubmitting || !isAuthorized}
                className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Eliminar Reserva"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}