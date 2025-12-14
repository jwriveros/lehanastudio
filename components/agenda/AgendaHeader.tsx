"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FilterDropdown } from "./FilterDropdown";

interface Props {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  view: "day" | "week" | "month";
  setView: (v: "day" | "week" | "month") => void;

  statusFilter: string[];
  setStatusFilter: (v: string[]) => void;

  specialistFilter: string[];
  setSpecialistFilter: (v: string[]) => void;

  serviceFilter: string[];
  setServiceFilter: (v: string[]) => void;
}

export function AgendaHeader({
  currentDate,
  onPrev,
  onNext,
  onToday,
  view,
  setView,
  statusFilter,
  setStatusFilter,
  specialistFilter,
  setSpecialistFilter,
  serviceFilter,
  setServiceFilter,
}: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
      {/* IZQUIERDA */}
      <div className="flex items-center gap-2">
        <button onClick={onToday} className="px-3 py-1.5 text-xs rounded border">
          Hoy
        </button>
        <button onClick={onPrev}>◀</button>
        <button onClick={onNext}>▶</button>

        <div className="ml-2 font-semibold capitalize">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </div>
      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-2">
        {/* VISTA */}
        <div className="flex rounded-full border overflow-hidden text-xs">
          {(["day", "week", "month"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 ${
                view === v
                  ? "bg-indigo-600 text-white"
                  : "bg-white hover:bg-zinc-50"
              }`}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>

        {/* FILTROS */}
        <FilterDropdown
          label="Estado"
          options={[
            { label: "Nueva reserva creada", value: "Nueva reserva creada" },
            { label: "Cita confirmada", value: "Cita confirmada" },
            { label: "Cita pagada", value: "Cita pagada" },
            { label: "Cita cancelada", value: "Cita cancelada" },
          ]}
          selected={statusFilter}
          onChange={setStatusFilter}
        />

        <FilterDropdown
          label="Especialista"
          options={[
            { label: "Leslie Gutierrez", value: "Leslie Gutierrez" },
            { label: "Nary Cabrales", value: "Nary Cabrales" },
            { label: "Yucelis Moscote", value: "Yucelis Moscote" },
          ]}
          selected={specialistFilter}
          onChange={setSpecialistFilter}
        />

        <FilterDropdown
          label="Servicio"
          options={[
            { label: "Lifting", value: "Lifting" },
            { label: "Micropigmentación", value: "Micro" },
          ]}
          selected={serviceFilter}
          onChange={setServiceFilter}
        />
      </div>
    </div>
  );
}
