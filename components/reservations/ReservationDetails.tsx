"use client";
import React, { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";
import {
  User,
  Scissors,
  Calendar,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  Info,
  Building,
} from "lucide-react";

interface ReservationDetailsProps {
  appointmentData: any | null;
  onEdit: () => void;
}

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start">
    <div className="flex-shrink-0">{icon}</div>
    <div className="ml-4 flex-grow">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-base font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

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

  const { raw: data } = appointmentData;

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de eliminar esta reserva? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("appointments")
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
    <div className="space-y-8">
      {/* Details */}
      <div className="space-y-4 rounded-lg bg-gray-50 p-6 dark:bg-gray-700/50">
        <DetailRow
          icon={<User size={20} className="text-gray-500 dark:text-gray-400" />}
          label="Cliente"
          value={data.cliente}
        />
        <DetailRow
          icon={
            <Scissors size={20} className="text-gray-500 dark:text-gray-400" />
          }
          label="Servicio"
          value={data.servicio}
        />
        <DetailRow
          icon={
            <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
          }
          label="Fecha y hora"
          value={
            data.appointment_at
              ? new Date(data.appointment_at).toLocaleString("es-CO", {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : "—"
          }
        />
        <DetailRow
          icon={<Clock size={20} className="text-gray-500 dark:text-gray-400" />}
          label="Duración"
          value={`${data.duration || "N/A"} minutos`}
        />
        <DetailRow
          icon={
            <CheckCircle
              size={20}
              className="text-gray-500 dark:text-gray-400"
            />
          }
          label="Especialista"
          value={data.especialista}
        />
        <DetailRow
          icon={
            <Building size={20} className="text-gray-500 dark:text-gray-400" />
          }
          label="Sede"
          value={data.sede}
        />
        <DetailRow
          icon={<Info size={20} className="text-gray-500 dark:text-gray-400" />}
          label="Estado"
          value={data.status || "Confirmada"}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {deleting ? (
            "Eliminando…"
          ) : (
            <>
              <Trash2 size={16} />
              Eliminar
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Edit size={16} />
          Editar
        </button>
      </div>
    </div>
  );
};

export default React.memo(ReservationDetails);