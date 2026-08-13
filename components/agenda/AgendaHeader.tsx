"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FilterDropdown } from "./FilterDropdown";
import CreateBookingDrawer from "./CreateBookingDrawer";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
} from "lucide-react";

interface Props {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateChange: (date: Date) => void;
  view: "day" | "week" | "month";
  setView: (v: "day" | "week" | "month") => void;
  locationFilter: string[];
  setLocationFilter: (v: string[]) => void;
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
  onDateChange,
  view,
  setView,
  locationFilter,
  setLocationFilter,
  statusFilter,
  setStatusFilter,
  specialistFilter,
  setSpecialistFilter,
  serviceFilter,
  setServiceFilter,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const label = useMemo(() => {
    if (view === "day") {
      const formattedDay = format(currentDate, "eeee d 'de' MMMM", { locale: es });
      return formattedDay.charAt(0).toUpperCase() + formattedDay.slice(1);
    }
    return format(currentDate, "MMMM yyyy", { locale: es }).toUpperCase();
  }, [currentDate, view]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange?.(date);
      setShowPicker(false);
    }
  };

  const handleSpecialistChange = (newValues: string[]) => {
    if (newValues.length === 0) {
      setSpecialistFilter([]);
      return;
    }

    const hizoClicEnTodas = newValues.includes("Todas") && specialistFilter.length > 0;

    if (hizoClicEnTodas) {
      setSpecialistFilter([]);
    } else {
      const valoresReales = newValues.filter((val) => val !== "Todas");
      setSpecialistFilter(valoresReales);
    }
  };

  return (
    <>
      <header className="relative z-50 flex flex-col gap-3 border-b border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-800 dark:bg-gray-900">
        
        {/* FILA SUPERIOR: Botón Crear Reserva + Controles de Fecha */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3.5 text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Crear Reserva</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToday}
              className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-bold text-gray-700 transition-all hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <CalendarDays size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Hoy</span>
            </button>

            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={onPrev}
                className="rounded-lg p-1 text-gray-500 hover:bg-white dark:hover:bg-gray-700 transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  className="px-2 py-1 text-xs sm:text-sm font-black uppercase tracking-tight text-gray-800 dark:text-white hover:text-indigo-600 transition-colors"
                >
                  {label}
                </button>

                {/* Popover alineado con right-0 para evitar desbordamientos a la derecha */}
                {showPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-[190]"
                      onClick={() => setShowPicker(false)}
                    />
                    <div className="absolute top-full mt-2 right-0 z-[200] w-[290px] max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-3 animate-in fade-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100">
                      <DayPicker
                        mode="single"
                        selected={currentDate}
                        onSelect={handleDateSelect}
                        locale={es as any}
                        classNames={{
                          months: "flex flex-col space-y-4",
                          month: "space-y-4",
                          month_caption: "flex justify-between items-center px-1 mb-2",
                          caption_label: "text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200",
                          nav: "flex items-center gap-1",
                          button_previous: "p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
                          button_next: "p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
                          month_grid: "w-full border-collapse space-y-1",
                          weekdays: "flex justify-between border-b border-gray-100 dark:border-zinc-800 pb-1 mb-1",
                          weekday: "text-zinc-400 font-bold text-[10px] uppercase w-8 text-center",
                          weeks: "w-full flex flex-col gap-1",
                          week: "flex w-full justify-between gap-1",
                          day: "h-8 w-8 text-xs font-bold rounded-lg transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center justify-center text-center",
                          selected: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md font-extrabold",
                          today: "text-indigo-600 font-black ring-1 ring-indigo-600/40 rounded-lg",
                        }}
                        components={{
                          Chevron: (props) => {
                            if (props.orientation === "left") return <ChevronLeft size={16} />;
                            return <ChevronRight size={16} />;
                          },
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={onNext}
                className="rounded-lg p-1 text-gray-500 hover:bg-white dark:hover:bg-gray-700 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* FILA INFERIOR: Modos de Vista + Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800/60">
          
          <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-0.5 text-xs dark:border-gray-700 dark:bg-gray-800">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 transition-all font-black uppercase rounded-lg text-[11px] ${
                  view === v
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {v === "day" ? "Día" : v === "week" ? "Sem" : "Mes"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <FilterDropdown
              label="Sede"
              options={[
                { label: "Marquetalia", value: "Marquetalia" },
                { label: "Buga", value: "Buga" },
                { label: "Santa Marta", value: "Santa Marta" },
              ]}
              selected={locationFilter}
              onChange={setLocationFilter}
            />

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
                { label: "Todas", value: "Todas" },
                { label: "Leslie Gutierrez", value: "Leslie Gutierrez" },
                { label: "Nary Cabrales", value: "Nary Cabrales" },
                { label: "Yucelis Moscote", value: "Yucelis Moscote" },
              ]}
              selected={specialistFilter.length === 0 ? ["Todas"] : specialistFilter}
              onChange={handleSpecialistChange}
            />
          </div>
        </div>
      </header>

      <CreateBookingDrawer
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
}