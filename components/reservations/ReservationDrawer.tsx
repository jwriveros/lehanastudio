// components/reservations/ReservationDrawer.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import ReservationForm from "./ReservationForm";
import ReservationDetails from "./ReservationDetails";

export interface ReservationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData?: any | null;
}

const ReservationDrawer = ({
  isOpen,
  onClose,
  appointmentData,
}: ReservationDrawerProps) => {
  const [viewMode, setViewMode] = useState<"view" | "edit">("edit");

  // Determina el modo según si existe una reserva
  useEffect(() => {
    if (appointmentData && appointmentData.id) {
      setViewMode("view");
    } else {
      setViewMode("edit");
    }
  }, [appointmentData]);

  const handleEdit = useCallback(() => {
    setViewMode("edit");
  }, []);

  const title = appointmentData?.id
    ? viewMode === "edit"
      ? "Editar reserva"
      : "Detalles de la reserva"
    : "Nueva reserva";

  return (
    <div
      className={`fixed right-0 top-0 z-50 h-full w-96 max-w-full transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition"
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === "edit" ? (
            <ReservationForm appointmentData={appointmentData} />
          ) : (
            <ReservationDetails
              appointmentData={appointmentData}
              onEdit={handleEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReservationDrawer);
