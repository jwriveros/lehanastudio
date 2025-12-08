import { useMemo } from "react";

import { appointments } from "@/lib/mockData";

const MINUTES_START = 7 * 60; // 07:00
const MINUTES_END = 20 * 60; // 20:00
const STEP = 30; // 30 minutes

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function formatDateISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

const dayFormatter = new Intl.DateTimeFormat("es", {
  weekday: "short",
});

export function AgendaBoard() {
  const days = useMemo(() => {
    const base = appointments[0]
      ? startOfWeek(new Date(appointments[0].fecha))
      : startOfWeek(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        date: d,
        iso: formatDateISO(d),
        label: dayFormatter.format(d).replace(".", ""),
        dayNumber: d.getDate(),
      };
    });
  }, []);

  const slots = useMemo(() => {
    const items: { label: string; minutes: number; dashed: boolean }[] = [];
    for (let m = MINUTES_START; m <= MINUTES_END; m += STEP) {
      const hours = Math.floor(m / 60);
      const minutes = m % 60;
      const label = `${hours % 12 === 0 ? 12 : hours % 12}:${minutes === 0 ? "00" : minutes.toString().padStart(2, "0")}`;
      const suffix = hours < 12 ? "AM" : "PM";
      items.push({ label: `${label} ${suffix}`, minutes: m, dashed: minutes === 30 });
    }
    return items;
  }, []);

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex border-b border-zinc-300 bg-white/90 pl-14 text-center text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {days.map((day, idx) => (
          <div
            key={day.iso}
            className={`flex-1 min-w-[100px] py-2 border-r border-zinc-300 last:border-r-0 ${idx === 0 ? "bg-indigo-50 dark:bg-indigo-950/30" : "bg-white dark:bg-zinc-900"}`}
          >
            <span className="text-[10px] font-bold uppercase text-zinc-400">{day.label}</span>
            <div className={`text-sm font-bold leading-none ${idx === 0 ? "text-indigo-700 dark:text-indigo-200" : "text-zinc-800 dark:text-zinc-100"}`}>
              {day.dayNumber}
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex-1 overflow-auto bg-white dark:bg-zinc-950">
        <div className="min-w-[900px]">
          {slots.map((slot) => (
            <div
              key={slot.minutes}
              className={`flex border-b border-zinc-300 ${slot.dashed ? "border-dashed" : "border-solid"}`}
            >
              <div className="sticky left-0 z-10 flex w-14 flex-shrink-0 items-center justify-center bg-white/95 px-1 text-center text-[10px] font-medium leading-none text-zinc-500 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-400">
                {slot.label}
              </div>

              {days.map((day) => {
                const cellAppointments = appointments.filter((appt) => {
                  if (appt.fecha !== day.iso) return false;
                  const start = parseTimeToMinutes(appt.hora);
                  return start >= slot.minutes && start < slot.minutes + STEP;
                });

                return (
                  <div
                    key={`${day.iso}-${slot.minutes}`}
                    className="relative flex min-w-[110px] flex-1 gap-1 overflow-hidden border-r border-zinc-300 p-1 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  >
                    {cellAppointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="flex-1 min-w-[80px] truncate rounded border-l-2 p-1 text-white shadow-sm transition hover:opacity-90"
                        style={{ backgroundColor: appt.bg_color, borderColor: "rgba(0,0,0,0.1)" }}
                        title={`${appt.servicio} · ${appt.cliente}`}
                      >
                        <div className="truncate text-[9px] font-bold leading-none">{appt.cliente}</div>
                        <div className="truncate text-[8px] leading-tight opacity-90">{appt.servicio}</div>
                        <div className="truncate text-[7px] leading-tight opacity-75 uppercase">{appt.especialista}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-[7px] leading-tight opacity-80">
                          <span>${appt.price}</span>
                          <span>{appt.is_paid ? "Pagado" : "Pendiente"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
