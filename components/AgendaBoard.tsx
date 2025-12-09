"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { appointments, appointmentStatuses, services, sampleUsers } from "@/lib/mockData";

type AgendaBoardProps = {
  externalBookingSignal?: number;
};

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

export function AgendaBoard({ externalBookingSignal }: AgendaBoardProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [baseDate, setBaseDate] = useState<Date>(appointments[0] ? new Date(appointments[0].fecha) : new Date());
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [specialistFilter, setSpecialistFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [bookingForm, setBookingForm] = useState({
    open: false,
    customer: "",
    phone: "",
    guests: 1,
    service: services[0]?.Servicio ?? "",
    specialist: sampleUsers.find((u) => u.role === "SPECIALIST")?.name ?? "",
    price: services[0]?.Precio ?? 0,
    date: formatDateISO(baseDate),
    time: "09:00",
    location: "Miraflores",
    notes: "",
    status: "Nueva Reserva Creada",
  });

  useEffect(() => {
    if (externalBookingSignal === undefined) return;
    openBooking(formatDateISO(baseDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalBookingSignal]);

  const serviceOptions = useMemo(() => Array.from(new Set(appointments.map((a) => a.servicio))), []);
  const specialistOptions = useMemo(() => Array.from(new Set(appointments.map((a) => a.especialista))), []);

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

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const openBooking = (dateIso: string, time?: string) => {
    setBookingForm((prev) => ({
      ...prev,
      open: true,
      date: dateIso,
      time: time ?? prev.time,
    }));
  };

  const closeBooking = () => setBookingForm((prev) => ({ ...prev, open: false }));

  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    closeBooking();
  };

  return (
    <div className="flex h-full min-h-[720px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
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
            {serviceOptions.map((service) => (
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
            {specialistOptions.map((specialist) => (
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
        <div className="flex-1 overflow-auto">
          <div className="grid min-h-[520px] min-w-[1200px] grid-cols-7 gap-3 p-4 sm:p-6">
            {days.map((day, idx) => {
              const dayAppointments = filteredAppointments.filter((appt) => appt.fecha === day.iso);
              return (
                <div
                  key={day.iso}
                  onClick={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest("[data-appointment]") !== null) return;
                    openBooking(day.iso, "09:00");
                  }}
                  className={`flex min-h-[160px] cursor-pointer flex-col rounded-2xl border p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:hover:border-indigo-700/50 ${
                    day.date.getMonth() === baseDate.getMonth() ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900/50"
                  } ${idx % 7 === 0 ? "border-l-4 border-l-indigo-500" : ""}`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    <span className="uppercase text-[10px]">{day.label}</span>
                    <span className="text-sm">{day.dayNumber}</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {dayAppointments.length === 0 ? (
                      <p className="text-[11px] text-zinc-400">Toca para agendar</p>
                    ) : (
                      dayAppointments.map((appt) => (
                        <div
                          key={appt.id}
                          data-appointment
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg border border-zinc-200 bg-white/90 p-2 text-[11px] leading-tight shadow-sm transition hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-800"
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
        </div>
      ) : (
        <>
          <div className="relative flex-1 overflow-auto bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="min-w-[1900px]">
              <div className="sticky top-0 z-20 flex border-b border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                <div className="w-16 flex-shrink-0 border-r border-zinc-300 bg-white/95 text-[11px] font-semibold uppercase text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/95">
                  Hora
                </div>
                {days.map((day, idx) => (
                  <div
                    key={day.iso}
                    className={`flex min-w-[190px] flex-1 flex-col border-r border-zinc-300 px-3 py-3 last:border-r-0 ${idx === 0 ? "bg-indigo-50 dark:bg-indigo-950/30" : "bg-white dark:bg-zinc-900"}`}
                  >
                    <span className="text-[11px] font-bold uppercase text-zinc-400">{day.label}</span>
                    <div className={`text-lg font-bold leading-none ${idx === 0 ? "text-indigo-700 dark:text-indigo-200" : "text-zinc-800 dark:text-zinc-100"}`}>
                      {day.dayNumber}
                    </div>
                    <p className="text-[10px] text-zinc-400">{day.date.toLocaleString("es", { month: "short" })}</p>
                  </div>
                ))}
              </div>

              {slots.map((slot) => (
                <div
                  key={slot.minutes}
                  className={`flex min-h-[110px] border-b border-zinc-300 ${slot.dashed ? "border-dashed" : "border-solid"}`}
                >
                  <div className="sticky left-0 z-10 flex w-16 flex-shrink-0 items-center justify-center border-r border-zinc-300 bg-white/95 px-1 text-center text-[11px] font-medium leading-none text-zinc-500 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400">
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
                        onClick={() => openBooking(day.iso, minutesToTime(slot.minutes))}
                        className="relative flex min-w-[190px] flex-1 gap-1 overflow-hidden border-r border-zinc-300 p-1.5 transition-colors hover:bg-indigo-50/40 dark:border-zinc-800 dark:hover:bg-indigo-900/30"
                      >
                        {cellAppointments.map((appt) => (
                          <div
                            key={appt.id}
                            data-appointment
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-[140px] truncate rounded-xl border border-white/50 bg-gradient-to-br from-black/10 via-black/5 to-white/10 p-2 text-white shadow-md ring-1 ring-black/5 backdrop-blur transition hover:translate-y-0.5"
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

      {bookingForm.open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeBooking} aria-hidden />
          <div className="relative z-10 w-full max-w-xl animate-[fade-in-up_0.25s_ease] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between bg-indigo-600 p-4 text-white">
              <h2 className="text-lg font-bold">Nueva Reserva Creada</h2>
              <button className="rounded-full p-1 hover:bg-indigo-700" onClick={closeBooking} aria-label="Cerrar formulario">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x" aria-hidden="true">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>

            <form className="max-h-[78vh] space-y-4 overflow-y-auto p-6" onSubmit={submitBooking}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Cliente Principal</label>
                <input
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nombre del cliente"
                  value={bookingForm.customer}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, customer: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Celular (Para WhatsApp)</label>
                <input
                  className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+57 300 123 4567"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
                  type="tel"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">¿Para cuántas personas?</label>
                <div className="flex gap-4">
                  {[1, 2].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setBookingForm((prev) => ({ ...prev, guests: count }))}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                        bookingForm.guests === count
                          ? "border-indigo-500 bg-indigo-100 text-indigo-700"
                          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {count} Persona{count > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Servicio</label>
                <input
                  required
                  list="services-list"
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Escribe o selecciona un servicio..."
                  value={bookingForm.service}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, service: e.target.value }))}
                />
                <datalist id="services-list">
                  {services.map((service) => (
                    <option key={service.SKU} value={service.Servicio}>
                      ${service.Precio}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Especialista</label>
                  <select
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bookingForm.specialist}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, specialist: e.target.value }))}
                  >
                    <option value="">Seleccionar Especialista</option>
                    {sampleUsers
                      .filter((u) => u.role === "SPECIALIST")
                      .map((user) => (
                        <option key={user.id} value={user.name}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Valor Total</label>
                  <input
                    required
                    min={0}
                    step={10}
                    type="number"
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bookingForm.price}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hora</label>
                  <input
                    required
                    type="time"
                    className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Sede</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={bookingForm.location}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, location: e.target.value }))}
                >
                  <option value="Miraflores">Miraflores</option>
                  <option value="San Isidro">San Isidro</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Detalles adicionales..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Estado de la Reservación</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={bookingForm.status}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  {["Nueva Reserva Creada", "Cita Confirmada", "Cliente Llegando", "Cliente en Sala de Espera", "Cliente Llegó", "Comenzó", "Cita Completada", "Cita Pagada", "Reprogramar cita", "Cliente no se Presentó", "Cita Cancelada"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeBooking}
                  className="flex-1 rounded-xl bg-gray-100 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
