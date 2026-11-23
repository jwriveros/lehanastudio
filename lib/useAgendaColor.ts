"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "lehana_agenda_status_colors_v1";

export type StatusColorMap = Record<string, string>;

export const CUSTOMIZABLE_STATUSES = [
  { key: "Nueva reserva creada", label: "Nueva Reserva", dot: "bg-amber-400" },
  { key: "Cita confirmada", label: "Confirmada", dot: "bg-rose-500" },
  { key: "Cita pagada", label: "Pagada", dot: "bg-emerald-500" },
];

const DEFAULT_MAP: StatusColorMap = {
  "Nueva reserva creada": "default",
  "Cita confirmada": "default",
  "Cita pagada": "default",
};

// Helper seguro para leer localStorage fuera del ciclo de render
function getStoredColors(): StatusColorMap {
  if (typeof window === "undefined") return DEFAULT_MAP;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_MAP, ...JSON.parse(saved) } : DEFAULT_MAP;
  } catch {
    return DEFAULT_MAP;
  }
}

export function useAgendaColor() {
  const [statusColors, setStatusColors] = useState<StatusColorMap>(DEFAULT_MAP);

  // 1. Cargar mapa guardado al montar y suscribirse a cambios externos
  useEffect(() => {
    setStatusColors(getStoredColors());

    const handleStorageSync = () => {
      setStatusColors(getStoredColors());
    };

    window.addEventListener("lehana-agenda-color-updated", handleStorageSync);
    return () => {
      window.removeEventListener("lehana-agenda-color-updated", handleStorageSync);
    };
  }, []);

  // 2. Actualizar el color de un estado específico sin disparar eventos dentro de setState
  const updateStatusColor = useCallback((statusKey: string, colorOrDefault: string) => {
    const current = getStoredColors();
    const updated = { ...current, [statusKey]: colorOrDefault };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setStatusColors(updated);

    // Desacoplamos la notificación a otros componentes al siguiente microtask
    queueMicrotask(() => {
      window.dispatchEvent(new Event("lehana-agenda-color-updated"));
    });
  }, []);

  // 3. Restaurar todos los estados a "default" (color de cada especialista)
  const resetAllToDefault = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MAP));
    setStatusColors(DEFAULT_MAP);

    queueMicrotask(() => {
      window.dispatchEvent(new Event("lehana-agenda-color-updated"));
    });
  }, []);

  // 4. Resuelve el color final de una tarjeta
  // 4. Resuelve el color final de una tarjeta
  const resolveCardColor = useCallback(
    (estado?: string, specialistBgColor?: string | null, specialistName?: string | null) => {
      // Mapa de respaldo con los colores exactos de tu tabla app_users
      const getOfficialColorByName = (name?: string | null): string => {
        const lower = String(name || "").toLowerCase().trim();
        if (lower.includes("andrea")) return "#E2C974"; // Dorado Andrea Garcia
        if (lower.includes("nary")) return "#4FD1C5";   // Turquesa Nary Cabrales
        if (lower.includes("yucelis") || lower.includes("yuce")) return "#F687B3"; // Pink Yucelis Moscote
        if (lower.includes("leslie")) return "#9F7AEA"; // Lavanda Leslie Gutierrez
        return "#f43f5e"; // Respaldo general
      };

      // Si appointment.bg_color viene vacío o con el fallback genérico, buscamos por nombre
      const hasValidDbColor =
        specialistBgColor &&
        specialistBgColor.trim() !== "" &&
        specialistBgColor.toLowerCase() !== "#f43f5e";

      const fallbackSpecialist = hasValidDbColor
        ? specialistBgColor
        : getOfficialColorByName(specialistName);

      if (!estado) return fallbackSpecialist;

      const configured = statusColors[estado];
      if (!configured || configured === "default") {
        return fallbackSpecialist;
      }
      return configured;
    },
    [statusColors]
  );

  const hasAnyCustom = Object.values(statusColors).some((val) => val !== "default");

  return {
    statusColors,
    updateStatusColor,
    resetAllToDefault,
    resolveCardColor,
    hasAnyCustom,
  };
}