"use client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FilterDropdown } from "./FilterDropdown";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  CalendarDays,
  Menu,
} from "lucide-react";
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
    <header className="flex flex-col gap-3 border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
      {/* Left Section */}
      <div className="flex w-full items-center justify-between md:w-auto md:justify-start md:gap-4">
        <div className="flex items-center gap-2">
          
          <button
            onClick={onToday}
            className="hidden items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex"
          >
            <CalendarDays size={16} />
            Hoy
          </button>
        </div>
        <div className="flex items-center">
          <button
            onClick={onPrev}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Previous Period"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={onNext}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Next Period"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <h2 className="w-40 truncate text-base font-semibold capitalize text-gray-800 dark:text-white md:w-auto md:text-lg">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </h2>
        {/* Mobile Chat Toggle */}
        <button
          onClick={onToggleAgendaSidebar}
          className="rounded-full bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 md:hidden"
          aria-label="Toggle Chat"
        >
          <MessageSquareText size={20} />
        </button>
      </div>
      {/* Right Section */}
      <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-end">
        {/* View Selector */}
        <div className="flex overflow-hidden rounded-full border border-gray-300 bg-white text-sm dark:border-gray-700">
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 transition-colors ${
                view === v
                  ? "bg-indigo-600 font-semibold text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
        {/* Filters */}
        <div className="flex items-center gap-2">
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
    </header>
  );
}