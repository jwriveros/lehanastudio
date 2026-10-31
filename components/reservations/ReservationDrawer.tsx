"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import ReservationForm from "./ReservationForm";
import ReservationDetails from "./ReservationDetails";
import { X, Sparkles, Gift, CheckCircle2 } from "lucide-react";

export interface ReservationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData?: any | null;
  onSuccess?: () => void;
}

export interface LoyaltyBenefitInfo {
  hasReward: boolean;
  totalVisits: number;
  targetVisits: number;
  benefitType: "percent" | "fixed" | "gift";
  benefitValue: string;
  benefitDescription: string;
  campaignName: string;
}

const ReservationDrawer = ({
  isOpen,
  onClose,
  appointmentData,
  onSuccess,
}: ReservationDrawerProps) => {
  const [viewMode, setViewMode] = useState<"view" | "edit">("edit");
  const [servicesToEdit, setServicesToEdit] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // 🌸 Estado para registrar el beneficio de fidelización de la clienta
  const [loyaltyBenefit, setLoyaltyBenefit] = useState<LoyaltyBenefitInfo | null>(null);
  const [checkingLoyalty, setCheckingLoyalty] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isExistingAppointment = Boolean(
    appointmentData?.id && 
    appointmentData.id !== "" && 
    appointmentData.id !== "new"
  );

  /* =========================================================
      🌸 CONSULTAR BENEFICIO DE FIDELIZACIÓN AL CARGAR LA CITA
  ========================================================= */
  const checkLoyaltyBenefit = useCallback(async (phone?: string) => {
    if (!phone) {
      setLoyaltyBenefit(null);
      return;
    }

    setCheckingLoyalty(true);
    try {
      const res = await fetch("/api/loyalty/check-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ celular: phone }),
      });

      const json = await res.json();
      if (json.ok && json.hasReward) {
        setLoyaltyBenefit(json);
      } else {
        setLoyaltyBenefit(null);
      }
    } catch (err) {
      console.warn("No se pudo consultar beneficio de fidelización:", err);
      setLoyaltyBenefit(null);
    } finally {
      setCheckingLoyalty(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setLoyaltyBenefit(null);
      return;
    }

    if (isExistingAppointment) {
      setViewMode("view");
    } else {
      setViewMode("edit");
      setServicesToEdit([]);
    }

    // Si la cita tiene un número celular asociado, consultamos su fidelización
    if (appointmentData?.celular) {
      checkLoyaltyBenefit(appointmentData.celular);
    } else {
      setLoyaltyBenefit(null);
    }
  }, [appointmentData, isOpen, isExistingAppointment, checkLoyaltyBenefit]);
  
  const handleEdit = useCallback((associatedServices?: any[]) => {
    if (associatedServices && associatedServices.length > 0) {
      setServicesToEdit(associatedServices);
    } else {
      setServicesToEdit([]);
    }
    setViewMode("edit");
  }, []);

  const handleClose = useCallback(() => {
    setViewMode("view");
    setServicesToEdit([]);
    setLoyaltyBenefit(null);
    onClose();
  }, [onClose]);

  const title = isExistingAppointment
    ? viewMode === "edit"
      ? "Editar Reserva"
      : "Detalles de la Reserva"
    : "Nueva Reserva";

  if (!mounted) return null;

  return createPortal(
    <>
      {/* 1. TELÓN DE FONDO */}
      <div
        className={`fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleClose}
      />
      
      {/* 2. PANEL LATERAL (DRAWER) */}
      <div
        className={`fixed right-0 top-0 z-[1000] flex h-full w-full max-w-2xl transform flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased shadow-2xl transition-transform duration-300 ease-in-out border-l border-zinc-200/80 dark:border-zinc-800 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        {/* ENCABEZADO SUPERIOR */}
        <header className="flex flex-shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/90 dark:bg-zinc-900/90 dark:border-zinc-800 p-4 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider block leading-none">
                Lehana Studio CRM
              </span>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-2xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
            aria-label="Cerrar panel"
          >
            <X size={18} />
          </button>
        </header>

        {/* 🌸 BANNER DE BENEFICIO DE FIDELIZACIÓN ACTIVO */}
        {loyaltyBenefit && (
          <div className="bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-emerald-500/15 border-b border-rose-200 dark:border-rose-900/40 p-3.5 sm:px-6 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500 text-white rounded-xl shadow-xs shrink-0">
                <Gift size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                    ¡Beneficio de Fidelización Desbloqueado!
                  </span>
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-semibold">
                  Esta es la visita #{loyaltyBenefit.targetVisits} de la clienta. Corresponde:{" "}
                  <strong className="text-zinc-900 dark:text-white underline decoration-rose-400">
                    {loyaltyBenefit.benefitDescription}
                  </strong>
                </p>
              </div>
            </div>

            <span className="text-[10px] font-extrabold px-2.5 py-1 bg-white dark:bg-zinc-800 text-rose-500 rounded-full border border-rose-200 dark:border-rose-900/50 shadow-2xs shrink-0">
              {loyaltyBenefit.campaignName}
            </span>
          </div>
        )}

        {/* ÁREA DE CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {viewMode === "edit" ? (
            <ReservationForm
              appointmentData={appointmentData}
              associatedServices={servicesToEdit}
              loyaltyBenefit={loyaltyBenefit} // 👈 Pasamos el beneficio al formulario
              onPhoneChange={(phone: string) => checkLoyaltyBenefit(phone)} // 👈 Si escriben o seleccionan clienta, verifica en vivo
              onSuccess={() => {
                onSuccess?.();
                onClose();
              }}
            />
          ) : (
            <div className="p-4 sm:p-6">
              <ReservationDetails
                appointmentData={appointmentData}
                onEdit={handleEdit}
                onSuccess={onSuccess}
              />
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default React.memo(ReservationDrawer);