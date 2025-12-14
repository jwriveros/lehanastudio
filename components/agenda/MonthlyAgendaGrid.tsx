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
    <div className="h-full overflow-y-auto bg-white">
      <div className="min-h-full grid grid-cols-7 border-t border-l">
        {/* HEADERS */}
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div
            key={d}
            className="sticky top-0 z-10 border-b border-r bg-zinc-50 text-center text-xs font-semibold py-2"
          >
            {d}
          </div>
        ))}

        {/* DÍAS */}
        {days.map((dayDate) => {
          const dayAppointments = appointments.filter((a) =>
            isSameDay(a.start, dayDate)
          );

          return (
            <div
              key={dayDate.toISOString()}
              className={`border-b border-r p-1 text-xs relative min-h-[110px] ${
                !isSameMonth(dayDate, currentDate)
                  ? "bg-zinc-50 text-zinc-400"
                  : "bg-white"
              }`}
            >
              {/* NÚMERO DEL DÍA */}
              <div
                className={`mb-1 flex justify-end ${
                  isSameDay(dayDate, new Date())
                    ? "font-bold text-indigo-600"
                    : ""
                }`}
              >
                {format(dayDate, "d", { locale: es })}
              </div>

              {/* EVENTOS */}
              <div className="space-y-1">
                {dayAppointments.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="truncate rounded px-1 py-[2px] text-[10px] text-white"
                    style={{
                      backgroundColor:
                        a.raw?.bg_color || "#6366f1",
                    }}
                  >
                    {format(a.start, "HH:mm")} {a.title}
                  </div>
                ))}

                {dayAppointments.length > 4 && (
                  <div className="text-[10px] text-zinc-500">
                    +{dayAppointments.length - 4} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
