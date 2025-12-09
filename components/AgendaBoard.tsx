// jwriveros/lehanastudio/lehanastudio-a8a570c007a1557a6ccd13baa5a39a3fe79a534a/components/AgendaBoard.tsx

"use client";

import { FormEvent, Fragment, MouseEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import {
  AppointmentStatus,
  appointmentStatuses,
  services as mockServices, 
  sampleUsers as mockUsers, 
} from "@/lib/mockData";

type AgendaBoardProps = {
  externalBookingSignal?: number | null;
  renderCalendarShell?: boolean;
};

// Tipo de Cita adaptado para la estructura de la base de datos
export type Appointment = {
  id: number;
  cliente: string;
  servicio: string;
  especialista: string;
  celular: string;
  appointment_at: string; // Única fuente de fecha y hora (ISO String)
  estado: AppointmentStatus;
  sede: string;
  bg_color: string;
  price: number;
  is_paid: boolean;
  notas: string;
  duration?: number; // Propiedad calculada/local
  fecha?: string; // Incluido para compatibilidad del formulario de edición
  hora?: string;  // Incluido para compatibilidad del formulario de edición
};


const MINUTES_START = 7 * 60; // 07:00
const MINUTES_END = 20 * 60; // 20:00
const STEP = 30; // 30 minutes
const ROW_HEIGHT = 52;
const TOTAL_MINUTES = MINUTES_END - MINUTES_START;
const COLUMN_HEIGHT = ((MINUTES_END - MINUTES_START) / STEP) * ROW_HEIGHT; 

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

// Función auxiliar para convertir hora (HH:MM) a minutos del día
function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Función auxiliar para extraer detalles de la cita desde el string ISO
function getAppointmentDetails(isoString: string) {
  const date = new Date(isoString);
  const dateISO = isoString.split("T")[0];
  // Convertir a hora local (HH:MM) sin segundos
  const timeString = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  const minutes = parseTimeToMinutes(timeString);
  
  return { date, timeString, minutes, dateISO };
}

function minutesToTimeString(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Función auxiliar para obtener la duración y rellenar fecha/hora de edición
function normalizeAppointment(appt: Appointment): Appointment {
  const matchedService = mockServices.find((service) => service.Servicio === appt.servicio);
  const duration = appt.duration ?? matchedService?.duracion ?? 60;
  
  const { dateISO, timeString } = getAppointmentDetails(appt.appointment_at);

  return { 
    ...appt, 
    duration,
    fecha: dateISO, 
    hora: timeString, 
  };
}

const dayFormatter = new Intl.DateTimeFormat("es", {
  weekday: "short",
});

export function AgendaBoard({ externalBookingSignal, renderCalendarShell = true }: AgendaBoardProps) {
  
  const [appointmentList, setAppointmentList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [baseDate, setBaseDate] = useState<Date>(new Date()); 
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [specialistFilter, setSpecialistFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const specialistOptions = useMemo(
    () => Array.from(new Set(mockUsers.filter((u: any) => u.role === 'ESPECIALISTA').map(u => u.name))), 
    [],
  );

  const [bookingForm, setBookingForm] = useState({
    open: false,
    customer: "",
    phone: "",
    guests: 1,
    service: mockServices[0]?.Servicio ?? "",
    specialist: specialistOptions[0] ?? "",
    price: mockServices[0]?.Precio ?? 0,
    date: formatDateISO(baseDate),
    time: "09:00",
    location: "Miraflores",
    notes: "",
    status: "Nueva Reserva Creada",
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);

  // *** useEffect para cargar las citas de Supabase ***
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*') 
        .order('appointment_at', { ascending: true })
        .returns<Appointment[]>();

      if (error) {
        console.error("Error fetching appointments:", error);
      } else {
        setAppointmentList(data.map(normalizeAppointment));
      }

      setLoading(false);
    };

    fetchAppointments();
  }, []);
  // -----------------------------------------------------

  useEffect(() => {
    if (externalBookingSignal === null || externalBookingSignal === undefined) return;
    openBooking(formatDateISO(baseDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalBookingSignal]);

  useEffect(() => {
    if (!selectedAppointment) return;
    setEditAppointment(selectedAppointment);
  }, [selectedAppointment]);

  const serviceOptions = useMemo(() => Array.from(new Set(appointmentList.map((a) => a.servicio))), [appointmentList]);

  const filteredAppointments = useMemo(
    () =>
      appointmentList.filter((appt) => {
        const matchesService = serviceFilter === "ALL" || appt.servicio === serviceFilter;
        const matchesSpecialist = specialistFilter === "ALL" || appt.especialista === specialistFilter;
        const matchesStatus = statusFilter === "ALL" || appt.estado === statusFilter;
        return matchesService && matchesSpecialist && matchesStatus;
      }),
    [appointmentList, serviceFilter, specialistFilter, statusFilter]
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

    const base = viewMode === "day" ? baseDate : startOfWeek(baseDate);
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

  const openBooking = (dateIso: string, time?: string) => {
    setBookingForm((prev) => ({
      ...prev,
      open: true,
      date: dateIso,
      time: time ?? prev.time,
    }));
  };

  const closeBooking = () => setBookingForm((prev) => ({ ...prev, open: false }));

  const updateAppointment = async (id: Appointment["id"], updater: (appt: Appointment) => Partial<Appointment>) => {
    const existing = appointmentList.find(a => a.id === id);
    if (!existing) return;

    const updates = updater(existing);

    // Separamos 'duration', 'fecha' y 'hora' que son solo para la UI
    const { duration, fecha, hora, ...dbUpdates } = updates as any; 

    const { error } = await supabase.from('appointments').update(dbUpdates).eq('id', id);

    if (error) {
      console.error("Error al actualizar la cita:", error);
      alert("Error al actualizar la cita.");
      return;
    }

    setAppointmentList((prev) =>
      prev.map((appt) => (appt.id === id ? normalizeAppointment({ ...appt, ...updates } as Appointment) : appt))
    );
  };
  
  const handleMarkPaid = () => {
    if (!selectedAppointment) return;
    updateAppointment(selectedAppointment.id, () => ({ is_paid: true })); 
    setSelectedAppointment((prev) => (prev ? { ...prev, is_paid: true } : prev));
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;
    updateAppointment(selectedAppointment.id, () => ({ estado: "CANCELLED" as AppointmentStatus }));
    setSelectedAppointment((prev) => (prev ? { ...prev, estado: "CANCELLED" as AppointmentStatus } : prev));
  };

  // Manejo de edición para usar appointment_at
  const saveEditedAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editAppointment) return;
    
    // Usamos casting aquí para acceder a fecha/hora que se rellenaron en normalizeAppointment
    const editAppt = editAppointment as Appointment; 
    
    // Combinar fecha y hora para crear appointment_at ISO String
    const appointmentDate = `${editAppt.fecha}T${editAppt.hora}:00.000Z`;

    const updates: Appointment = {
        ...editAppt,
        price: Number(editAppt.price),
        duration: Number(editAppt.duration),
        appointment_at: appointmentDate,
    };
    
    // Separamos 'duration', 'fecha' y 'hora' para la inserción en DB
    const { duration, fecha, hora, ...dbUpdates } = updates as any; 

    const { error } = await supabase.from('appointments').update(dbUpdates).eq('id', updates.id);

    if (error) {
        console.error("Error al guardar cambios en la cita:", error);
        alert("Error al guardar cambios en la cita.");
        return;
    }

    setAppointmentList((prev) =>
        prev.map((appt) => (appt.id === updates.id ? normalizeAppointment(updates) : appt))
    );
    setSelectedAppointment(normalizeAppointment(updates));
    setEditAppointment(null);
  };

  const getAppointmentEnd = (appt: Appointment) => {
    const { minutes } = getAppointmentDetails(appt.appointment_at);
    const endMinutes = Math.min(MINUTES_END, minutes + (appt.duration ?? 60));
    return minutesToTimeString(endMinutes);
  };

  const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const selectedService = mockServices.find(s => s.Servicio === bookingForm.service);
    
    // Combinar fecha y hora para crear appointment_at ISO String
    const appointmentDate = `${bookingForm.date}T${bookingForm.time}:00.000Z`;

    const newAppointment: Partial<Appointment> & { appointment_at: string } = {
      cliente: bookingForm.customer,
      celular: bookingForm.phone,
      servicio: bookingForm.service,
      especialista: bookingForm.specialist,
      price: bookingForm.price,
      appointment_at: appointmentDate, // Usamos la columna combinada
      sede: bookingForm.location,
      notas: bookingForm.notes,
      estado: 'Nueva Reserva Creada' as AppointmentStatus,
      bg_color: mockUsers.find((u: any) => u.name === bookingForm.specialist)?.color ?? '#94a3b8',
      is_paid: false,
    };

    const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
    });
    
    if (response.ok) {
        alert("¡Solicitud de reserva enviada! Pendiente de confirmación (vía n8n).");
        closeBooking();
    } else {
        alert("Error al enviar la solicitud de reserva.");
    }
  };


  return (
    <>
      {renderCalendarShell && (
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
          <div className="grid min-h-[520px] min-w-[1100px] sm:min-w-full grid-cols-7 gap-3 p-4 sm:p-6">
            {loading ? (
              <p className="col-span-7 py-12 text-center text-lg text-indigo-500">Cargando Agenda...</p>
            ) : (
              days.map((day, idx) => {
                // Filtra citas por el día ISO (parte de la fecha, no la hora)
                const dayAppointments = filteredAppointments.filter(
                  (appt) => getAppointmentDetails(appt.appointment_at).dateISO === day.iso,
                );
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
                        dayAppointments.map((appt) => {
                          const { timeString } = getAppointmentDetails(appt.appointment_at);
                          return (
                            <div
                              key={appt.id}
                              data-appointment
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg border border-zinc-200 bg-white/90 p-2 text-[11px] leading-tight shadow-sm transition hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-800"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{timeString}</span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                                  style={{ backgroundColor: appt.bg_color }}
                                >
                                  {appt.estado}
                                </span>
                              </div>
                              <div className="truncate text-zinc-700 dark:text-zinc-200">{appt.servicio}</div>
                              <div className="truncate text-[10px] text-zinc-500">{appt.cliente}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <Fragment>
          <div className="relative flex-1 overflow-auto bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="min-w-[900px] sm:min-w-full">
              <div className="sticky top-0 z-20 flex border-b border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                <div className="w-16 flex-shrink-0 border-r border-zinc-300 bg-white/95 text-[11px] font-semibold uppercase text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/95">
                  Hora
                </div>
                {days.map((day, idx) => (
                  <div
                    key={day.iso}
                    className={`flex min-w-[160px] sm:min-w-0 flex-1 flex-col border-r border-zinc-300 px-3 py-3 last:border-r-0 ${
                      idx === 0 ? "bg-indigo-50/40 dark:bg-indigo-950/30" : "bg-white dark:bg-zinc-900"
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase text-zinc-400">{day.label}</span>
                    <div
                      className={`text-lg font-bold leading-none ${
                        idx === 0 ? "text-indigo-700 dark:text-indigo-200" : "text-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      {day.dayNumber}
                    </div>
                    <p className="text-[10px] text-zinc-400">{day.date.toLocaleString("es", { month: "short" })}</p>
                  </div>
                ))}
              </div>

              <div className="relative flex" aria-label="Agenda detallada">
                <div className="sticky left-0 z-20 w-16 flex-shrink-0 border-r border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                  <div className="relative" style={{ height: COLUMN_HEIGHT }}>
                    {slots.map((slot, idx) => (
                      <div
                        key={slot.minutes}
                        className={`absolute inset-x-0 flex items-start justify-center border-b ${
                          slot.dashed ? "border-dashed" : "border-solid"
                        } border-zinc-200 px-1 text-[11px] font-medium leading-none text-zinc-500 dark:border-zinc-800 dark:text-zinc-400`}
                        style={{ top: idx * ROW_HEIGHT, height: ROW_HEIGHT }}
                      >
                        <span className="mt-1 block">{slot.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="flex-1 flex items-center justify-center" style={{ height: COLUMN_HEIGHT }}>
                    <p className="text-xl text-indigo-500">Cargando Citas...</p>
                  </div>
                ) : (
                  <div className="relative flex flex-1">
                    {days.map((day, idx) => {
                      // Filtra citas por el día ISO (parte de la fecha)
                      const dayAppointments = filteredAppointments
                        .filter((appt) => getAppointmentDetails(appt.appointment_at).dateISO === day.iso)
                        .map((appt) => normalizeAppointment(appt));

                      const handleColumnClick = (event: MouseEvent<HTMLDivElement>) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        const offsetY = event.clientY - rect.top;
                        const minutesFromStart = Math.min(Math.max(offsetY / COLUMN_HEIGHT, 0), 1) * TOTAL_MINUTES;
                        const roundedSlot = Math.floor(minutesFromStart / STEP) * STEP + MINUTES_START;
                        openBooking(day.iso, minutesToTimeString(roundedSlot));
                      };

                      return (
                        <div
                          key={day.iso}
                          onClick={handleColumnClick}
                          className={`relative flex min-w-[160px] sm:min-w-0 flex-1 border-r border-zinc-300 last:border-r-0 ${
                            idx === 0 ? "bg-indigo-50/40 dark:bg-indigo-950/30" : "bg-white dark:bg-zinc-900"
                          }`}
                          style={{ height: COLUMN_HEIGHT }}
                        >
                          <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                              backgroundImage: `repeating-linear-gradient(to bottom, ${idx === 0 ? "#e0e7ff" : "#e5e7eb"} 0, ${
                                idx === 0 ? "#e0e7ff" : "#e5e7eb"
                              } 1px, transparent 1px, transparent ${ROW_HEIGHT}px)`,
                            }}
                          />

                          {dayAppointments.map((appt) => {
                            const { minutes, timeString, dateISO } = getAppointmentDetails(appt.appointment_at);
                            const startMinutes = minutes;
                            const top = Math.max(0, ((startMinutes - MINUTES_START) / STEP) * ROW_HEIGHT);
                            const duration = appt.duration ?? 60;
                            const height = Math.min(
                              COLUMN_HEIGHT - top,
                              Math.max((duration / STEP) * ROW_HEIGHT, ROW_HEIGHT * 0.75),
                            );
                            const endMinutes = Math.min(MINUTES_END, startMinutes + duration);

                            return (
                              <button
                                key={appt.id}
                                type="button"
                                data-appointment
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Rellenamos los campos de fecha y hora que el formulario de edición espera
                                  setSelectedAppointment({
                                    ...appt,
                                    fecha: dateISO,
                                    hora: timeString,
                                  } as Appointment);
                                }}
                                className="group absolute left-1 right-1 flex flex-col gap-0.5 truncate rounded-xl border border-white/50 bg-gradient-to-br from-black/10 via-black/5 to-white/10 p-2 text-left text-white shadow-md ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
                                style={{ backgroundColor: appt.bg_color, top, height }}
                                title={`${appt.servicio} · ${appt.cliente}`}
                              >
                                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold leading-none uppercase">
                                  <span>
                                    {timeString} – {minutesToTimeString(endMinutes)}
                                  </span>
                                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-[9px] text-white">{appt.estado}</span>
                                </div>
                                <div className="truncate text-[11px] font-semibold leading-tight">{appt.servicio}</div>
                                <div className="truncate text-[10px] leading-tight opacity-90">{appt.cliente}</div>
                                <div className="truncate text-[9px] leading-tight opacity-75">{appt.especialista}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px] leading-tight opacity-85">
                                  <span className="rounded-full bg-black/15 px-2 py-0.5 text-white">${appt.price}</span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 ${
                                      appt.is_paid ? "bg-emerald-200/70 text-emerald-900" : "bg-amber-200/80 text-amber-900"
                                    }`}
                                  >
                                    {appt.is_paid ? "Pagado" : "Pendiente"}
                                  </span>
                                  <span className="rounded-full bg-black/15 px-2 py-0.5 text-white">{appt.sede}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  )}

      {selectedAppointment ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedAppointment(null)} aria-hidden />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-2 bg-zinc-900 px-5 py-4 text-white dark:bg-zinc-800">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Reserva</p>
                <h3 className="text-lg font-bold leading-tight">
                  {selectedAppointment.servicio} · {selectedAppointment.cliente}
                </h3>
                <p className="text-sm text-white/80">
                  {getAppointmentDetails(selectedAppointment.appointment_at).dateISO} · {getAppointmentDetails(selectedAppointment.appointment_at).timeString} – {getAppointmentEnd(selectedAppointment)}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white/15 px-3 py-1">{selectedAppointment.estado}</span>
                <span
                  className={`rounded-full px-3 py-1 ${
                    selectedAppointment.is_paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {selectedAppointment.is_paid ? "Pagado" : "Pendiente de pago"}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1">{selectedAppointment.especialista}</span>
              </div>
            </div>

            <div className="grid flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-3">
              <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-semibold uppercase text-zinc-500">Detalles</p>
                <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-500">Cliente</span>
                    <span className="font-semibold">{selectedAppointment.cliente}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-500">Celular</span>
                    <span className="font-semibold">{selectedAppointment.celular}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-500">Sede</span>
                    <span className="font-semibold">{selectedAppointment.sede}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-zinc-500">Notas</span>
                    <span className="max-w-[220px] text-right text-sm leading-snug text-zinc-600 dark:text-zinc-300">
                      {selectedAppointment.notas || "Sin notas"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Marcar como pagada
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAppointment}
                    className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700"
                  >
                    Cancelar cita
                  </button>
                </div>
              </div>

              <form className="lg:col-span-2 space-y-4" onSubmit={saveEditedAppointment}>
                <div className="grid grid-cols-2 gap-3">
                  <label className="col-span-2 text-xs font-semibold text-zinc-500">Servicio</label>
                  <input
                    className="col-span-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    value={(editAppointment as any)?.servicio ?? ""}
                    onChange={(e) =>
                      setEditAppointment((prev) => (prev ? { ...prev, servicio: e.target.value } : prev))
                    }
                  />

                  <label className="col-span-2 text-xs font-semibold text-zinc-500">Especialista</label>
                  <select
                    className="col-span-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    value={(editAppointment as any)?.especialista ?? ""}
                    onChange={(e) =>
                      setEditAppointment((prev) => (prev ? { ...prev, especialista: e.target.value } : prev))
                    }
                  >
                    {specialistOptions.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>

                  {/* Campos de fecha y hora para edición */}
                  <label className="text-xs font-semibold text-zinc-500">Fecha</label>
                  <label className="text-xs font-semibold text-zinc-500">Hora inicio</label>
                  <input
                    type="date"
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    value={(editAppointment as any)?.fecha ?? ""}
                    onChange={(e) =>
                      setEditAppointment((prev) => (prev ? { ...prev, fecha: e.target.value } : prev))
                    }
                  />
                  <input
                    type="time"
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    value={(editAppointment as any)?.hora ?? ""}
                    onChange={(e) =>
                      setEditAppointment((prev) => (prev ? { ...prev, hora: e.target.value } : prev))
                    }
                  />

                  <label className="text-xs font-semibold text-zinc-500">Duración (min)</label>
                  <label className="text-xs font-semibold text-zinc-500">Precio</label>
                  <input
                    type="number"
                    min={15}
                    step={5}
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    value={(editAppointment as any)?.duration ?? 60}
                    onChange={(e) =>
                      setEditAppointment((prev) => (prev ? { ...prev, duration: Number(e.target.value) } : prev))
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    step={10}
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    value={(editAppointment as any)?.price ?? 0}
                    onChange={(e) =>
                      setEditAppointment((prev) => (prev ? { ...prev, price: Number(e.target.value) } : prev))
                    }
                  />

                  <label className="text-xs font-semibold text-zinc-500">Estado</label>
                  <label className="text-xs font-semibold text-zinc-500">Pago</label>
                  <select
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    value={(editAppointment as any)?.estado ?? ""}
                    onChange={(e) =>
                      setEditAppointment((prev) => (prev ? { ...prev, estado: e.target.value as AppointmentStatus } : prev))
                    }
                  >
                    {appointmentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    value={(editAppointment as any)?.is_paid ? "yes" : "no"}
                    onChange={(e) =>
                      setEditAppointment((prev) => (prev ? { ...prev, is_paid: e.target.value === "yes" } : prev))
                    }
                  >
                    <option value="yes">Pagado</option>
                    <option value="no">Pendiente</option>
                  </select>

                  <label className="col-span-2 text-xs font-semibold text-zinc-500">Notas</label>
                  <textarea
                    className="col-span-2 min-h-[80px] rounded-lg border border-zinc-200 bg-white p-3 text-sm font-medium focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                    value={(editAppointment as any)?.notas ?? ""}
                    onChange={(e) =>
                      setEditAppointment((prev) => (prev ? { ...prev, notas: e.target.value } : prev))
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAppointment(null)}
                    className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

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
                  {mockServices.map((service) => (
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
                    {specialistOptions.map((user) => (
                      <option key={user} value={user}>
                        {user}
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
    </>
  );
}