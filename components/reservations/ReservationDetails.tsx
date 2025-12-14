// components/reservations/ReservationDetails.tsx
"use client";

import React, { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";

interface ReservationDetailsProps {
  appointmentData: any | null;
  onEdit: () => void;
}

const ReservationDetails = ({
  appointmentData,
  onEdit,
}: ReservationDetailsProps) => {
  const closeReservationDrawer = useUIStore(
    (state) => state.closeReservationDrawer
  );

  const [deleting, setDeleting] = useState(false);

  if (!appointmentData) {
    return null;
  }

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de eliminar esta reserva? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", appointmentData.id);

      if (error) throw error;

      closeReservationDrawer();
    } catch (err) {
      console.error("Error eliminando reserva:", err);
      alert("Ocurrió un error al eliminar la reserva.");
    } finally {
      setDeleting(false);
    }
  }, [appointmentData, closeReservationDrawer]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">
          Detalles de la reserva
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Información completa de la cita
        </p>
      </div>

      {/* Details */}
      <div className="divide-y rounded-md border">
        <DetailRow label="Cliente">
          {appointmentData.client?.name ?? "—"}
        </DetailRow>

        <DetailRow label="Servicio">
          {appointmentData.service?.name ?? "—"}
        </DetailRow>

        <DetailRow label="Especialista">
          {appointmentData.specialist?.name ?? "—"}
        </DetailRow>

        <DetailRow label="Fecha y hora">
          {appointmentData.start
            ? new Date(appointmentData.start).toLocaleString()
            : "—"}{" "}
          {appointmentData.end &&
            `– ${new Date(appointmentData.end).toLocaleString()}`}
        </DetailRow>

        <DetailRow label="Estado">
          {appointmentData.status ?? "—"}
        </DetailRow>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Eliminando…" : "Eliminar"}
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Editar
        </button>
      </div>
    </div>
  );
};

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
    <dt className="font-medium text-zinc-500">{label}</dt>
    <dd className="col-span-2 text-zinc-900">{children}</dd>
  </div>
);

export default React.memo(ReservationDetails);
