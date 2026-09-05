"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarDatePickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: "day" | "week" | "month";
}

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  currentDate,
  onDateChange,
  viewMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(currentDate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPickerMonth(currentDate);
  }, [currentDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => setPickerMonth(subMonths(pickerMonth, 1));
  const handleNextMonth = () => setPickerMonth(addMonths(pickerMonth, 1));

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(pickerMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const cloneDay = day;
      const isSelected = isSameDay(day, currentDate);
      const isCurrentMonth = isSameMonth(day, pickerMonth);

      days.push(
        <button
          key={day.toISOString()}
          type="button"
          onClick={() => {
            onDateChange(cloneDay);
            setIsOpen(false);
          }}
          className={`h-8 w-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
            isSelected
              ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 font-black scale-105"
              : isCurrentMonth
              ? "text-zinc-800 dark:text-zinc-200 hover:bg-rose-500/10 hover:text-rose-500"
              : "text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          {format(day, "d")}
        </button>
      );
      day = addDays(day, 1);
    }
    return days;
  };

  return (
    <div className="relative inline-block font-sans antialiased" ref={containerRef}>
      
      {/* BARRA DE NAVEGACIÓN Y DISPARADOR DEL SELECTOR */}
      <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => onDateChange(addDays(currentDate, viewMode === "month" ? -30 : viewMode === "week" ? -7 : -1))}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 rounded-xl transition-all cursor-pointer"
          title="Anterior"
          aria-label="Anterior"
        >
          <ChevronLeft size={15} />
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100 transition-all cursor-pointer"
        >
          <CalendarIcon size={14} className="text-rose-500" />
          <span>{format(currentDate, "MMMM yyyy", { locale: es })}</span>
        </button>

        <button
          type="button"
          onClick={() => onDateChange(addDays(currentDate, viewMode === "month" ? 30 : viewMode === "week" ? 7 : 1))}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 rounded-xl transition-all cursor-pointer"
          title="Siguiente"
          aria-label="Siguiente"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* POPOVER FLOTANTE DEL CALENDARIO */}
      {isOpen && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 z-[150] w-72 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100">
          
          {/* CABECERA DEL MES EN EL POPOVER */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <button 
              type="button" 
              onClick={handlePrevMonth} 
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
              {format(pickerMonth, "MMMM yyyy", { locale: es })}
            </span>
            
            <button 
              type="button" 
              onClick={handleNextMonth} 
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* DÍAS DE LA SEMANA */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["LU", "MA", "MI", "JU", "VI", "SÁ", "DO"].map((d) => (
              <span key={d} className="text-[10px] font-black text-zinc-400">
                {d}
              </span>
            ))}
          </div>

          {/* MATRIZ DE DÍAS */}
          <div className="grid grid-cols-7 gap-1 place-items-center">
            {renderCalendarDays()}
          </div>
        </div>
      )}
    </div>
  );
};