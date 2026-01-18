"use client";
import React, { useEffect, useState, useCallback } from "react";
import ReservationForm from "./ReservationForm";
import ReservationDetails from "./ReservationDetails";
import { X, CalendarPlus } from "lucide-react";

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

  /* =========================
      DEFINIR MODO
  ========================= */
  useEffect(() => {
    if (!appointmentData) {
      setViewMode("edit");
      return;
    }
    // Si es una cita nueva ("new") ir a edit, si ya existe ir a view (lectura)
    if (appointmentData?.id && appointmentData.id !== "new") {
      setViewMode("view"); 
    } else {
      setViewMode("edit");
    }
  }, [appointmentData, isOpen]);
  
  const handleEdit = useCallback(() => {
    setViewMode("edit");
  }, []);

  const title = appointmentData?.id
    ? viewMode === "edit"
      ? "Editar reserva"
      : "Detalles de la reserva"
    : "Nueva reserva";

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl transform flex-col bg-gray-50 shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        {/* HEADER */}
        <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700/80 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              <CalendarPlus size={22} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-offset-gray-800"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === "edit" ? (
            <ReservationForm
              appointmentData={appointmentData}
              onSuccess={() => {
                onSuccess?.();
                onClose();
              }}
            />
          ) : (
            <div className="p-6">
              <ReservationDetails
                appointmentData={appointmentData}
                onEdit={handleEdit}
                onSuccess={onSuccess} // <--- ESTA ES LA LÍNEA QUE FALTABA
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(ReservationDrawer);