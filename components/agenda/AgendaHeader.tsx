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
  Calendar as CalendarIcon,
} from "lucide-react";

// 1. Interfaz actualizada con las propiedades de control de bloque semanal
interface Props {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateChange: (date: Date) => void;
  view: "day" | "week" | "month";
  setView: (v: "day" | "week" | "month") => void;
  weekBlock?: "block1" | "block2";
  setWeekBlock?: (block: "block1" | "block2") => void;
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
  weekBlock = "block1",
  setWeekBlock,
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
        
        {/* FILA SUPERIOR: Controles principales y filtros */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 1. Botón compacto '+' */}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 flex-shrink-0"
              title="Crear Reserva"
              aria-label="Crear Reserva"
            >
              <Plus size={20} />
            </button>

            {/* 2. Botón Hoy */}
            <button
              type="button"
              onClick={onToday}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs font-bold text-gray-700 transition-all hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
            >
              <CalendarDays size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Hoy</span>
            </button>

            {/* 3. Selector de Fecha */}
            <div className="flex h-9 items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={onPrev}
                className="rounded-lg p-1 text-gray-500 hover:bg-white dark:hover:bg-gray-700 transition-all"
                aria-label="Anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  className="px-2 py-1 text-xs sm:text-sm font-black uppercase tracking-tight text-gray-800 dark:text-white hover:text-indigo-600 transition-colors"
                >
                  {label}
                </button>

                {showPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-[190] bg-black/20 backdrop-blur-[1px]"
                      onClick={() => setShowPicker(false)}
                    />
                    <div className="fixed top-28 left-1/2 -translate-x-1/2 sm:absolute sm:top-full sm:mt-2 sm:left-auto sm:right-0 sm:translate-x-0 z-[200] w-[285px] max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-3 animate-in fade-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100">
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
                aria-label="Siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 4. Selector de Vista (DÍA / SEM / MES) */}
            <div className="flex h-9 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-0.5 text-xs dark:border-gray-700 dark:bg-gray-800 flex-shrink-0">
              {(["day", "week", "month"] as const).map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 transition-all font-black uppercase rounded-lg text-[11px] ${
                    view === v
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {v === "day" ? "Día" : v === "week" ? "Sem" : "Mes"}
                </button>
              ))}
            </div>
          </div>

          {/* FILTROS GLOBALES (Incluye a Andrea Garcia) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
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
                { label: "Andrea Garcia", value: "Andrea Garcia" },
              ]}
              selected={specialistFilter.length === 0 ? ["Todas"] : specialistFilter}
              onChange={handleSpecialistChange}
            />
          </div>
        </div>

        {/* 2. BANDA INFERIOR: Botones para conmutar entre Bloque 1 y Bloque 2 */}
        {view === "week" && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWeekBlock?.("block1")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  weekBlock === "block1"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <span>LUNES A JUEVES</span>
              </button>

              <button
                type="button"
                onClick={() => setWeekBlock?.("block2")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  weekBlock === "block2"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <span>VIERNES A DOMINGO</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <CreateBookingDrawer
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
}