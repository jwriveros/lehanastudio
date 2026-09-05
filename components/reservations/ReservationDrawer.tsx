"use client";

import React, { useEffect, useState, useCallback } from "react";
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

  /* =========================================================
     🔹 DEFINIR MODO LECTURA O EDICIÓN Y LIMPIEZA
  ========================================================= */
  useEffect(() => {
    if (!appointmentData) {
      setViewMode("edit");
      setServicesToEdit([]);
      return;
    }
    // Si la cita ya existe en base de datos, ir a modo lectura ("view")
    if (appointmentData?.id && appointmentData.id !== "new") {
      setViewMode("view"); 
    } else {
      setViewMode("edit");
      setServicesToEdit([]);
    }
  }, [appointmentData, isOpen]);
  
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

  const title = appointmentData?.id
    ? viewMode === "edit"
      ? "Editar Reserva"
      : "Detalles de la Reserva"
    : "Nueva Reserva";

  return (
    <>
      {/* 1. TELÓN DE FONDO (OVERLAY CON DESENFOQUE) */}
      <div
        className={`fixed inset-0 z-[290] bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleClose}
      />
      
      {/* 2. PANEL LATERAL (DRAWER EN ZINC Y ROSE) */}
      <div
        className={`fixed right-0 top-0 z-[300] flex h-full w-full max-w-2xl transform flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased shadow-2xl transition-transform duration-300 ease-in-out border-l border-zinc-200/80 dark:border-zinc-800 ${
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
    </>
  );
};

export default React.memo(ReservationDrawer);