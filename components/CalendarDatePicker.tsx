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
          onClick={() => {
            onDateChange(cloneDay);
            setIsOpen(false);
          }}
          className={`h-9 w-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
            isSelected
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
              : isCurrentMonth
              ? "text-zinc-200 hover:bg-zinc-800"
              : "text-zinc-600 hover:bg-zinc-800/40"
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
    <div className="relative inline-block" ref={containerRef}>
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shadow-sm">
        <button
          onClick={() => onDateChange(addDays(currentDate, viewMode === "month" ? -30 : viewMode === "week" ? -7 : -1))}
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 rounded-lg text-xs font-extrabold uppercase tracking-wider text-zinc-100 transition-colors"
        >
          <CalendarIcon size={14} className="text-indigo-400" />
          <span>{format(currentDate, "MMMM yyyy", { locale: es })}</span>
        </button>

        <button
          onClick={() => onDateChange(addDays(currentDate, viewMode === "month" ? 30 : viewMode === "week" ? 7 : 1))}
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Popover con restricción de ancho para que no se corte en móviles */}
      {isOpen && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 z-50 w-72 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-200">
              {format(pickerMonth, "MMMM yyyy", { locale: es })}
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["LU", "MA", "MI", "JU", "VI", "SÁ", "DO"].map((d) => (
              <span key={d} className="text-[10px] font-bold text-zinc-500">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 place-items-center">
            {renderCalendarDays()}
          </div>
        </div>
      )}
    </div>
  );
};