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
    /* CONTENEDOR SCROLLABLE */
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
      <div className="grid min-h-full grid-cols-7">
        {/* HEADERS */}
        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(
          (d) => (
            <div
              key={d}
              className="sticky top-0 z-10 border-b border-r border-gray-200 bg-gray-50 py-2 text-center text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
            >
              {d}
            </div>
          )
        )}
        {/* DÍAS */}
        {days.map((dayDate) => {
          const dayAppointments = appointments.filter((a) =>
            isSameDay(a.start, dayDate)
          );
          const isCurrentMonth = isSameMonth(dayDate, currentDate);
          const isToday = isSameDay(dayDate, new Date());
          return (
            <div
              key={dayDate.toISOString()}
              className={`relative min-h-[120px] border-b border-r p-2 text-xs transition-colors duration-300 ${
                isCurrentMonth
                  ? "bg-white dark:bg-gray-900"
                  : "bg-gray-50/50 text-gray-400 dark:bg-gray-900/50 dark:text-gray-500"
              }`}
            >
              {/* NÚMERO DEL DÍA */}
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  isToday
                    ? "bg-indigo-600 font-bold text-white"
                    : isCurrentMonth
                    ? "text-gray-700 dark:text-gray-300"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {format(dayDate, "d")}
              </div>
              {/* EVENTOS */}
              {dayAppointments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {dayAppointments.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{
                        backgroundColor: a.raw?.bg_color || "#4f46e5",
                      }}
                    >
                      <span className="font-bold">
                        {format(a.start, "HH:mm")}
                      </span>
                      <span className="flex-1 truncate">{a.title}</span>
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-center text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
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
