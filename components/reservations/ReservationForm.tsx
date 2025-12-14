// components/reservations/ReservationForm.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import AutocompleteInput from "./AutocompleteInput";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";

interface ReservationFormProps {
  appointmentData?: any | null;
}

type FormState = {
  client_id: string;
  service_id: string;
  specialist_id: string;
  start_time: string;
  end_time: string;
  status: string;
};

const EMPTY_FORM: FormState = {
  client_id: "",
  service_id: "",
  specialist_id: "",
  start_time: "",
  end_time: "",
  status: "pending",
};

const ReservationForm = ({ appointmentData }: ReservationFormProps) => {
  const closeReservationDrawer = useUIStore(
    (state) => state.closeReservationDrawer
  );

  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Inicializar formulario al editar / crear
  useEffect(() => {
    if (appointmentData && appointmentData.id) {
      setFormData({
        client_id: appointmentData.client?.id ?? "",
        service_id: appointmentData.service?.id ?? "",
        specialist_id: appointmentData.specialist?.id ?? "",
        start_time: appointmentData.start
          ? new Date(appointmentData.start).toISOString().slice(0, 16)
          : "",
        end_time: appointmentData.end
          ? new Date(appointmentData.end).toISOString().slice(0, 16)
          : "",
        status: appointmentData.status ?? "pending",
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [appointmentData]);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleAutocompleteSelect = useCallback(
    (field: keyof FormState, item: any) => {
      setFormData((prev) => ({ ...prev, [field]: item.id }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || !formData.service_id || !formData.start_time) {
      alert("Completa cliente, servicio y fecha.");
      return;
    }

    setSaving(true);

    const payload = {
      client_id: formData.client_id,
      service_id: formData.service_id,
      specialist_id: formData.specialist_id || null,
      start_time: formData.start_time,
      end_time: formData.end_time || null,
      status: formData.status,
    };

    try {
      if (appointmentData?.id) {
        const { error } = await supabase
          .from("bookings")
          .update(payload)
          .eq("id", appointmentData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bookings")
          .insert([payload]);

        if (error) throw error;
      }

      closeReservationDrawer();
    } catch (err) {
      console.error("Error guardando reserva:", err);
      alert("Ocurrió un error al guardar la reserva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AutocompleteInput
        label="Cliente"
        placeholder="Buscar cliente..."
        apiEndpoint="/api/autocomplete/clients"
        onSelect={(item) =>
          handleAutocompleteSelect("client_id", item)
        }
      />

      <AutocompleteInput
        label="Servicio"
        placeholder="Buscar servicio..."
        apiEndpoint="/api/autocomplete/services"
        onSelect={(item) =>
          handleAutocompleteSelect("service_id", item)
        }
      />

      <AutocompleteInput
        label="Especialista"
        placeholder="Buscar especialista..."
        apiEndpoint="/api/autocomplete/specialists"
        onSelect={(item) =>
          handleAutocompleteSelect("specialist_id", item)
        }
      />

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Inicio
        </label>
        <input
          type="datetime-local"
          name="start_time"
          value={formData.start_time}
          onChange={handleInputChange}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Fin
        </label>
        <input
          type="datetime-local"
          name="end_time"
          value={formData.end_time}
          onChange={handleInputChange}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Estado
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="cancelled">Cancelada</option>
          <option value="completed">Completada</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={closeReservationDrawer}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
};

export default React.memo(ReservationForm);
