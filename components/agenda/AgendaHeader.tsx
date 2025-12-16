"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FilterDropdown } from "./FilterDropdown";
import { ChevronLeft, ChevronRight, MessageSquareText } from "lucide-react";

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

  onToggleAgendaSidebar: () => void;
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
  onToggleAgendaSidebar,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between px-4 py-2 border-b bg-white gap-3 md:gap-0">
      
      {/* IZQUIERDA: Navegación y Fecha */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2">
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-xs rounded border hover:bg-zinc-50 transition-colors"
          >
            Hoy
          </button>

          <div className="flex items-center">
            <button onClick={onPrev} className="p-1 hover:bg-zinc-100 rounded">
              <ChevronLeft size={18} />
            </button>
            <button onClick={onNext} className="p-1 hover:bg-zinc-100 rounded">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="ml-1 md:ml-2 font-bold text-sm md:text-base capitalize truncate max-w-[120px] md:max-w-none">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </div>
        </div>

        {/* Botón Chat: Solo visible en Móvil */}
        <button 
          onClick={onToggleAgendaSidebar}
          className="md:hidden p-2 text-indigo-600 bg-indigo-50 rounded-full"
        >
          <MessageSquareText size={20} />
        </button>
      </div>

      {/* DERECHA: Vistas y Filtros */}
      <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 overflow-visible pb-1 md:pb-0">
        
        {/* SELECTOR DE VISTA */}
        <div className="flex rounded-full border overflow-hidden text-[10px] md:text-xs shrink-0 bg-white">
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 transition-colors ${
                view === v
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-white hover:bg-zinc-50 text-zinc-600"
              }`}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>

        {/* FILTROS: En móvil se verán compactos */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
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

          {/* Ocultamos el filtro de servicio en pantallas muy pequeñas para evitar desbordamiento */}
          <div className="hidden sm:block">
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
      </div>
    </div>
  );
}