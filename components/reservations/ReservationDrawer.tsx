// components/reservations/ReservationDrawer.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import ReservationForm from "./ReservationForm";
import ReservationDetails from "./ReservationDetails";

export interface ReservationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData?: any | null;
  onSuccess?: () => void; // 👈 NUEVO
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

    if (appointmentData?.id) {
      setViewMode("edit"); // abrir directo en edición
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
    <div
      className={`fixed right-0 top-0 z-50 h-full w-96 max-w-full transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full flex-col">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === "edit" ? (
            <ReservationForm
              appointmentData={appointmentData}
              onSuccess={() => {
                onSuccess?.(); // 👈 AVISA AL PADRE
                onClose();
              }}
            />
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
