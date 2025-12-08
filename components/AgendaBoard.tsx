"use client";

import { useMemo, useState } from "react";

import { appointments, appointmentStatuses } from "@/lib/mockData";

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
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [baseDate, setBaseDate] = useState<Date>(appointments[0] ? new Date(appointments[0].fecha) : new Date());
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [specialistFilter, setSpecialistFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const services = useMemo(() => Array.from(new Set(appointments.map((a) => a.servicio))), []);
  const specialists = useMemo(() => Array.from(new Set(appointments.map((a) => a.especialista))), []);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appt) => {
        const matchesService = serviceFilter === "ALL" || appt.servicio === serviceFilter;
        const matchesSpecialist = specialistFilter === "ALL" || appt.especialista === specialistFilter;
        const matchesStatus = statusFilter === "ALL" || appt.estado === statusFilter;
        return matchesService && matchesSpecialist && matchesStatus;
      }),
    [serviceFilter, specialistFilter, statusFilter]
  );

  const days = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfWeek(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
      return Array.from({ length: 42 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return {
          date: d,
          iso: formatDateISO(d),
          label: dayFormatter.format(d).replace(".", ""),
          dayNumber: d.getDate(),
        };
      });
    }

    const base = startOfWeek(baseDate);
    const length = viewMode === "day" ? 1 : 7;

    return Array.from({ length }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        date: d,
        iso: formatDateISO(d),
        label: dayFormatter.format(d).replace(".", ""),
        dayNumber: d.getDate(),
      };
    });
  }, [baseDate, viewMode]);

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

  const handleNavigate = (direction: -1 | 1) => {
    const next = new Date(baseDate);
    if (viewMode === "day") {
      next.setDate(baseDate.getDate() + direction);
    } else if (viewMode === "week") {
      next.setDate(baseDate.getDate() + 7 * direction);
    } else {
      next.setMonth(baseDate.getMonth() + direction);
    }
    setBaseDate(next);
  };

  return (
    <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-gradient-to-r from-white via-indigo-50 to-white px-4 py-3 text-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/60 dark:to-zinc-900">
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            type="button"
            onClick={() => handleNavigate(-1)}
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            type="button"
            onClick={() => setBaseDate(new Date())}
          >
            Hoy
          </button>
          <button
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            type="button"
            onClick={() => handleNavigate(1)}
            aria-label="Siguiente"
          >
            →
          </button>
          <input
            type="date"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none transition hover:border-indigo-300 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={formatDateISO(baseDate)}
            onChange={(e) => setBaseDate(new Date(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2">
          {([
            { key: "day", label: "Día" },
            { key: "week", label: "Semana" },
            { key: "month", label: "Mes" },
          ] as const).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setViewMode(option.key)}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                viewMode === option.key
                  ? "bg-indigo-600 text-white shadow"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none transition hover:border-indigo-300 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="ALL">Todos los servicios</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>

          <select
            value={specialistFilter}
            onChange={(e) => setSpecialistFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none transition hover:border-indigo-300 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="ALL">Todos los especialistas</option>
            {specialists.map((specialist) => (
              <option key={specialist} value={specialist}>
                {specialist}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none transition hover:border-indigo-300 focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="ALL">Todos los estados</option>
            {appointmentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === "month" ? (
        <div className="grid flex-1 grid-cols-7 gap-3 p-4 sm:p-6">
          {days.map((day, idx) => {
            const dayAppointments = filteredAppointments.filter((appt) => appt.fecha === day.iso);
            return (
              <div
                key={day.iso}
                className={`flex min-h-[140px] flex-col rounded-2xl border p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:hover:border-indigo-700/50 ${
                  day.date.getMonth() === baseDate.getMonth() ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900/50"
                } ${idx % 7 === 0 ? "border-l-4 border-l-indigo-500" : ""}`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  <span className="uppercase text-[10px]">{day.label}</span>
                  <span className="text-sm">{day.dayNumber}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {dayAppointments.length === 0 ? (
                    <p className="text-[11px] text-zinc-400">Sin citas</p>
                  ) : (
                    dayAppointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="rounded-lg border border-zinc-200 bg-white/90 p-2 text-[11px] leading-tight shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-100">{appt.hora}</span>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: appt.bg_color }}>
                            {appt.estado}
                          </span>
                        </div>
                        <div className="truncate text-zinc-700 dark:text-zinc-200">{appt.servicio}</div>
                        <div className="truncate text-[10px] text-zinc-500">{appt.cliente}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="flex border-b border-zinc-300 bg-white/90 pl-16 text-center text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {days.map((day, idx) => (
              <div
                key={day.iso}
                className={`flex-1 min-w-[140px] py-3 border-r border-zinc-300 last:border-r-0 ${idx === 0 ? "bg-indigo-50 dark:bg-indigo-950/30" : "bg-white dark:bg-zinc-900"}`}
              >
                <span className="text-[11px] font-bold uppercase text-zinc-400">{day.label}</span>
                <div className={`text-lg font-bold leading-none ${idx === 0 ? "text-indigo-700 dark:text-indigo-200" : "text-zinc-800 dark:text-zinc-100"}`}>
                  {day.dayNumber}
                </div>
                <p className="text-[10px] text-zinc-400">{day.date.toLocaleString("es", { month: "short" })}</p>
              </div>
            ))}
          </div>

          <div className="relative flex-1 overflow-auto bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="min-w-[1400px]">
              {slots.map((slot) => (
                <div
                  key={slot.minutes}
                  className={`flex min-h-[88px] border-b border-zinc-300 ${slot.dashed ? "border-dashed" : "border-solid"}`}
                >
                  <div className="sticky left-0 z-10 flex w-16 flex-shrink-0 items-center justify-center bg-white/95 px-1 text-center text-[11px] font-medium leading-none text-zinc-500 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-400">
                    {slot.label}
                  </div>

                  {days.map((day) => {
                    const cellAppointments = filteredAppointments.filter((appt) => {
                      if (appt.fecha !== day.iso) return false;
                      const start = parseTimeToMinutes(appt.hora);
                      return start >= slot.minutes && start < slot.minutes + STEP;
                    });

                    return (
                      <div
                        key={`${day.iso}-${slot.minutes}`}
                        className="relative flex min-w-[180px] flex-1 gap-1 overflow-hidden border-r border-zinc-300 p-1.5 transition-colors hover:bg-indigo-50/40 dark:border-zinc-800 dark:hover:bg-indigo-900/30"
                      >
                        {cellAppointments.map((appt) => (
                          <div
                            key={appt.id}
                            className="flex-1 min-w-[120px] truncate rounded-xl border border-white/50 bg-gradient-to-br from-black/10 via-black/5 to-white/10 p-2 text-white shadow-md ring-1 ring-black/5 backdrop-blur transition hover:translate-y-0.5"
                            style={{ backgroundColor: appt.bg_color }}
                            title={`${appt.servicio} · ${appt.cliente}`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[10px] font-semibold leading-none uppercase">
                              <span>{appt.hora}</span>
                              <span className="rounded-full bg-black/20 px-2 py-0.5 text-[9px] text-white">{appt.estado}</span>
                            </div>
                            <div className="truncate text-[11px] font-semibold leading-tight">{appt.servicio}</div>
                            <div className="truncate text-[10px] leading-tight opacity-90">{appt.cliente}</div>
                            <div className="truncate text-[9px] leading-tight opacity-75">{appt.especialista}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px] leading-tight opacity-85">
                              <span className="rounded-full bg-black/15 px-2 py-0.5 text-white">${appt.price}</span>
                              <span className={`rounded-full px-2 py-0.5 ${appt.is_paid ? "bg-emerald-200/60 text-emerald-900" : "bg-amber-200/70 text-amber-900"}`}>
                                {appt.is_paid ? "Pagado" : "Pendiente"}
                              </span>
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
        </>
      )}
    </div>
  );
}
