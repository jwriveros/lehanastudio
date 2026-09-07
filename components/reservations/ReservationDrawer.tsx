"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import ReservationForm from "./ReservationForm";
import ReservationDetails from "./ReservationDetails";
import { X, Sparkles } from "lucide-react";

export interface ReservationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData?: any | null;
  onSuccess?: () => void;
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

  // Aseguramos que el componente solo intente renderizarse en el DOM del cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Evaluamos estrictamente si la cita realmente existe en la base de datos
  const isExistingAppointment = Boolean(
    appointmentData?.id && 
    appointmentData.id !== "" && 
    appointmentData.id !== "new"
  );

  /* =========================================================
      🔹 CONTROL DE MODO DE VISTA (EDICIÓN / LECTURA)
  ========================================================= */
  useEffect(() => {
    if (!isOpen) return;

    if (isExistingAppointment) {
      setViewMode("view"); 
    } else {
      setViewMode("edit");
      setServicesToEdit([]);
    }
  }, [appointmentData, isOpen, isExistingAppointment]);
  
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
    onClose();
  }, [onClose]);

  const title = isExistingAppointment
    ? viewMode === "edit"
      ? "Editar Reserva"
      : "Detalles de la Reserva"
    : "Nueva Reserva";

  // Si no está montado en el navegador o no está abierto, no renderizamos nada
  if (!mounted) return null;

  // Renderizado mediante React Portal directamente en document.body
  return createPortal(
    <>
      {/* 1. TELÓN DE FONDO (OVERLAY CON Z-INDEX ELEVADO z-[999]) */}
      <div
        className={`fixed inset-0 z-[999] bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleClose}
      />
      
      {/* 2. PANEL LATERAL (DRAWER CON Z-INDEX MÁXIMO z-[1000]) */}
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

        {/* ÁREA DE CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {viewMode === "edit" ? (
            <ReservationForm
              appointmentData={appointmentData}
              associatedServices={servicesToEdit}
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