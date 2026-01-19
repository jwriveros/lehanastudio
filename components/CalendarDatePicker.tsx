"use client";
import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function CalendarDatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setShowPicker(false);
    }
  };

  return (
    <div className="relative inline-block">
      {/* BOTÓN DISPARADOR (ESTILO APPLE) */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-5 py-2.5 rounded-2xl border dark:border-zinc-800 shadow-sm hover:shadow-md transition-all active:scale-95"
      >
        <CalendarIcon size={18} className="text-indigo-600" />
        <span className="text-sm font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-100">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
        </span>
      </button>

      {/* MODAL / POPOVER DEL CALENDARIO */}
      {showPicker && (
        <>
          {/* Backdrop para cerrar al hacer clic fuera */}
          <div 
            className="fixed inset-0 z-[110]" 
            onClick={() => setShowPicker(false)} 
          />
          
          <div className="absolute top-14 left-0 z-[120] bg-white dark:bg-zinc-900 border dark:border-zinc-800 shadow-2xl rounded-[2rem] p-4 animate-in fade-in zoom-in-95 duration-200">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              locale={es}
              className="apple-datepicker"
              classNames={{
                caption: "flex justify-between items-center mb-4 px-2",
                caption_label: "text-sm font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-100",
                nav: "flex gap-1",
                nav_button: "p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                table: "w-full border-collapse",
                head_cell: "text-zinc-400 font-bold text-[10px] uppercase p-2",
                cell: "p-0.5",
                day: "h-9 w-9 text-sm font-bold rounded-xl transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-zinc-700 dark:text-zinc-300",
                day_selected: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30",
                day_today: "text-indigo-600 font-black ring-1 ring-indigo-600/30 rounded-xl",
              }}
              components={{
                Chevron: ({ orientation, ...props }) => {
                  const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
                  return <Icon className="h-4 w-4" {...props} />;
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}