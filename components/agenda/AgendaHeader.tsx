"use client";
import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FilterDropdown } from "./FilterDropdown";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  CalendarDays,
  X
} from "lucide-react";

interface Props {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateChange: (date: Date) => void;
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
  onDateChange,
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
  const [showPicker, setShowPicker] = useState(false);

  const label = useMemo(() => {
    if (view === "day") {
      const formattedDay = format(currentDate, "eeee d 'de' MMMM", { locale: es });
      return formattedDay.charAt(0).toUpperCase() + formattedDay.slice(1);
    }
    return format(currentDate, "MMMM yyyy", { locale: es }).toUpperCase();
  }, [currentDate, view]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Usamos ?. para que si no existe la función, no rompa la app
      onDateChange?.(date); 
      setShowPicker(false);
    }
  };

  return (
    <header className="flex flex-col gap-3 border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
      {/* Sección Izquierda */}
      <div className="flex w-full items-center justify-between md:w-auto md:justify-start md:gap-4">
        <button
          onClick={onToday}
          className="hidden items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex"
        >
          <CalendarDays size={16} />
          Hoy
        </button>

        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={onPrev}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white dark:hover:bg-gray-700 transition-all"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-black uppercase tracking-tighter text-gray-800 dark:text-white hover:text-indigo-600 transition-colors"
            >
              {label}
            </button>

            {showPicker && (
              <>
                <div className="fixed inset-0 z-[110]" onClick={() => setShowPicker(false)} />
                <div className="absolute top-12 left-0 z-[120] bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-2xl rounded-[2rem] p-4 animate-in fade-in zoom-in-95 duration-200 text-zinc-900 dark:text-zinc-100">
                  <DayPicker
                    mode="single"
                    selected={currentDate}
                    onSelect={handleDateSelect}
                    locale={es}
                    classNames={{
                      month_caption: "flex justify-between items-center mb-4 px-2",
                      caption_label: "text-xs font-black uppercase tracking-widest",
                      nav: "flex gap-1",
                      button_previous: "p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800",
                      button_next: "p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800",
                      weekday: "text-zinc-400 font-bold text-[10px] uppercase p-2",
                      day: "h-8 w-8 text-xs font-bold rounded-lg transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30",
                      selected: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
                      today: "text-indigo-600 font-black ring-1 ring-indigo-600/30 rounded-lg",
                    }}
                    // CORRECCIÓN PARA VERSIÓN 9:
                    components={{
                      Chevron: (props) => {
                        if (props.orientation === "left") return <ChevronLeft size={16} />;
                        return <ChevronRight size={16} />;
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <button
            onClick={onNext}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white dark:hover:bg-gray-700 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={onToggleAgendaSidebar}
          className="rounded-full bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 md:hidden"
        >
          <MessageSquareText size={20} />
        </button>
      </div>

      {/* Sección Derecha: Vista y Filtros */}
      <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-end">
        <div className="flex overflow-hidden rounded-full border border-gray-300 bg-white text-xs dark:border-gray-700">
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 transition-colors font-black uppercase ${
                view === v
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {v === "day" ? "Día" : v === "week" ? "Sem" : "Mes"}
            </button>
          ))}
        </div>

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
        </div>
      </div>
    </header>
  );
}