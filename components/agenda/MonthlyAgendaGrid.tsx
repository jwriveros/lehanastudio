"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

type CalendarAppointment = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  raw: {
    cliente?: string;
    especialista?: string;
    estado?: string;
    bg_color?: string;
  };
};

export default function MonthlyAgendaGrid({
  appointments,
  currentDate,
}: {
  appointments: CalendarAppointment[];
  currentDate: Date;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days: Date[] = [];
  let day = gridStart;
  while (day <= gridEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    /* CONTENEDOR PRINCIPAL CON SCROLL SUAVE */
    <div className="h-full w-full overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased custom-scrollbar">
      <div className="grid min-h-full grid-cols-7 border-l border-t border-zinc-200/80 dark:border-zinc-800">
        
        {/* ENCABEZADOS DE DÍAS DE LA SEMANA */}
        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(
          (d) => (
            <div
              key={d}
              className="sticky top-0 z-10 border-b border-r border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md py-2.5 text-center text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shadow-2xs"
            >
              {d}
            </div>
          )
        )}

        {/* CELDAS DE DÍAS DEL MES */}
        {days.map((dayDate) => {
          const dayAppointments = appointments.filter((a) =>
            isSameDay(a.start, dayDate)
          );
          const isCurrentMonth = isSameMonth(dayDate, currentDate);
          const isToday = isSameDay(dayDate, new Date());

          return (
            <div
              key={dayDate.toISOString()}
              className={`relative min-h-[130px] border-b border-r border-zinc-200/80 dark:border-zinc-800/80 p-2 text-xs transition-colors duration-200 ${
                isCurrentMonth
                  ? "bg-white dark:bg-zinc-900/90 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                  : "bg-zinc-100/50 dark:bg-zinc-950/60 text-zinc-400 dark:text-zinc-600"
              }`}
            >
              {/* NÚMERO DEL DÍA */}
              <div className="flex items-center justify-between mb-1">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isToday
                      ? "bg-rose-500 font-black text-white shadow-md shadow-rose-500/30"
                      : isCurrentMonth
                      ? "text-zinc-800 dark:text-zinc-200"
                      : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {format(dayDate, "d")}
                </div>

                {/* Indicador discreto si hay eventos en un día de otro mes */}
                {!isCurrentMonth && dayAppointments.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                )}
              </div>

              {/* LISTA DE CITAS Y EVENTOS DEL DÍA */}
              {dayAppointments.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {dayAppointments.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-1.5 truncate rounded-lg px-2 py-1 text-[10px] font-extrabold text-white shadow-2xs transition-transform hover:scale-[1.02] cursor-pointer"
                      style={{
                        backgroundColor: a.raw?.bg_color || "#f43f5e",
                      }}
                      title={`${format(a.start, "HH:mm")} - ${a.title}`}
                    >
                      <span className="font-black opacity-90 shrink-0">
                        {format(a.start, "HH:mm")}
                      </span>
                      <span className="flex-1 truncate uppercase tracking-tighter">
                        {a.title}
                      </span>
                    </div>
                  ))}

                  {/* INDICADOR DE CITAS ADICIONALES */}
                  {dayAppointments.length > 3 && (
                    <div className="pt-0.5 text-center text-[10px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-400">
                      + {dayAppointments.length - 3} más
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}