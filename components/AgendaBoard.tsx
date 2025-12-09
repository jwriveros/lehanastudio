// jwriveros/lehanastudio/lehanastudio-a8a570c007a1557a6ccd13baa5a39a3fe79a534a/components/AgendaBoard.tsx

"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
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

export type Appointment = {
  id: number;
  cliente: string;
  servicio: string;
  especialista: string;
  celular: string;
  appointment_at: string;
  estado: AppointmentStatus;
  sede: string;
  bg_color: string;
  price: number;
  is_paid: boolean;
  notas: string;
  duration?: number;
  fecha?: string;
  hora?: string;
};

const MINUTES_START = 7 * 60; // 07:00
const MINUTES_END = 20 * 60; // 20:00
const STEP = 30; // 30 minutes
const ROW_HEIGHT = 52;
const TOTAL_MINUTES = MINUTES_END - MINUTES_START;
const COLUMN_HEIGHT = ((MINUTES_END - MINUTES_START) / STEP) * ROW_HEIGHT;

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
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

function getAppointmentDetails(isoString: string) {
  const date = new Date(isoString);
  const dateISO = isoString.split("T")[0];
  const timeString = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  const minutes = parseTimeToMinutes(timeString);
  return { date, timeString, minutes, dateISO };
}

function minutesToTimeString(minutes: number) {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function normalizeAppointment(appt: Appointment): Appointment {
  const matchedService = mockServices.find((service) => service.Servicio === appt.servicio);
  const duration = appt.duration ?? matchedService?.duracion ?? 60;
  const { dateISO, timeString } = getAppointmentDetails(appt.appointment_at);
  return { ...appt, duration, fecha: dateISO, hora: timeString };
}

const dayFormatter = new Intl.DateTimeFormat("es", { weekday: "short" });

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
    []
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
    if (viewMode === "day") next.setDate(baseDate.getDate() + direction);
    else if (viewMode === "week") next.setDate(baseDate.getDate() + 7 * direction);
    else next.setMonth(baseDate.getMonth() + direction);
    setBaseDate(next);
  };

  const openBooking = (dateIso: string, time?: string) => {
    setBookingForm((prev) => ({ ...prev, open: true, date: dateIso, time: time ?? prev.time }));
  };

  const closeBooking = () => setBookingForm((prev) => ({ ...prev, open: false }));

  const updateAppointment = async (id: Appointment["id"], updater: (appt: Appointment) => Partial<Appointment>) => {
    const existing = appointmentList.find(a => a.id === id);
    if (!existing) return;
    const updates = updater(existing);
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

  const saveEditedAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editAppointment) return;
    const editAppt = editAppointment as Appointment; 
    const appointmentDate = `${editAppt.fecha}T${editAppt.hora}:00.000Z`;
    const updates: Appointment = { ...editAppt, price: Number(editAppt.price), duration: Number(editAppt.duration), appointment_at: appointmentDate };
    const { duration, fecha, hora, ...dbUpdates } = updates as any; 
    const { error } = await supabase.from('appointments').update(dbUpdates).eq('id', updates.id);
    if (error) {
        console.error("Error al guardar cambios:", error);
        alert("Error al guardar cambios.");
        return;
    }
    setAppointmentList((prev) => prev.map((appt) => (appt.id === updates.id ? normalizeAppointment(updates) : appt)));
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
    const appointmentDate = `${bookingForm.date}T${bookingForm.time}:00.000Z`;
    const newAppointment = {
      cliente: bookingForm.customer,
      celular: bookingForm.phone,
      servicio: bookingForm.service,
      especialista: bookingForm.specialist,
      price: bookingForm.price,
      appointment_at: appointmentDate,
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
        alert("¡Solicitud de reserva enviada! Pendiente de confirmación.");
        closeBooking();
    } else {
        alert("Error al enviar la solicitud.");
    }
  };

  if (!renderCalendarShell) return null;

  return (
    <>
      <div className="flex h-full min-h-[720px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-gradient-to-r from-white via-indigo-50 to-white px-4 py-3 text-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/60 dark:to-zinc-900">
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" onClick={() => handleNavigate(-1)}>←</button>
            <button className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" onClick={() => setBaseDate(new Date())}>Hoy</button>
            <button className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" onClick={() => handleNavigate(1)}>→</button>
            <input type="date" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" value={formatDateISO(baseDate)} onChange={(e) => setBaseDate(new Date(e.target.value))} />
          </div>
          <div className="flex items-center gap-2">
            {([{ key: "day", label: "Día" }, { key: "week", label: "Semana" }, { key: "month", label: "Mes" }] as const).map((option) => (
              <button key={option.key} onClick={() => setViewMode(option.key)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${viewMode === option.key ? "bg-indigo-600 text-white shadow" : "border border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"}`}>{option.label}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              <option value="ALL">Todos los servicios</option>
              {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={specialistFilter} onChange={(e) => setSpecialistFilter(e.target.value)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              <option value="ALL">Todos los especialistas</option>
              {specialistOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              <option value="ALL">Todos los estados</option>
              {appointmentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {viewMode === "month" ? (
          <div className="flex-1 overflow-auto">
            <div className="grid min-h-[520px] min-w-[1100px] sm:min-w-full grid-cols-7 gap-3 p-4 sm:p-6">
              {loading ? (
                  <p className="col-span-7 text-center py-12 text-lg text-indigo-500">Cargando Agenda...</p>
              ) : (
                  days.map((day, idx) => {
                    const dayAppointments = filteredAppointments.filter((appt) => getAppointmentDetails(appt.appointment_at).dateISO === day.iso);
                    return (
                      <div key={day.iso} onClick={(e) => { if (!(e.target as HTMLElement).closest("[data-appointment]")) openBooking(day.iso, "09:00"); }} className={`flex min-h-[160px] cursor-pointer flex-col rounded-2xl border p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:hover:border-indigo-700/50 ${day.date.getMonth() === baseDate.getMonth() ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900/50"} ${idx % 7 === 0 ? "border-l-4 border-l-indigo-500" : ""}`}>
                        <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          <span className="uppercase text-[10px]">{day.label}</span>
                          <span className="text-sm">{day.dayNumber}</span>
                        </div>
                        <div className="mt-2 space-y-2">
                          {dayAppointments.map((appt) => {
                            const { timeString } = getAppointmentDetails(appt.appointment_at);
                            return (
                              <div key={appt.id} data-appointment onClick={(e) => e.stopPropagation()} className="rounded-lg border border-zinc-200 bg-white/90 p-2 text-[11px] leading-tight shadow-sm transition hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-800">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">{timeString}</span>
                                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: appt.bg_color }}>{appt.estado}</span>
                                </div>
                                <div className="truncate text-zinc-700 dark:text-zinc-200">{appt.servicio}</div>
                                <div className="truncate text-[10px] text-zinc-500">{appt.cliente}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex-1 overflow-auto bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="min-w-[900px] sm:min-w-full">
              <div className="sticky top-0 z-20 flex border-b border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                <div className="w-16 flex-shrink-0 border-r border-zinc-300 bg-white/95 text-[11px] font-semibold uppercase text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/95">Hora</div>
                {days.map((day, idx) => (
                  <div key={day.iso} className={`flex min-w-[160px] sm:min-w-0 flex-1 flex-col border-r border-zinc-300 px-3 py-3 last:border-r-0 ${idx === 0 ? "bg-indigo-50/40 dark:bg-indigo-950/30" : "bg-white dark:bg-zinc-900"}`}>
                    <span className="text-[11px] font-bold uppercase text-zinc-400">{day.label}</span>
                    <div className={`text-lg font-bold leading-none ${idx === 0 ? "text-indigo-700 dark:text-indigo-200" : "text-zinc-800 dark:text-zinc-100"}`}>{day.dayNumber}</div>
                    <p className="text-[10px] text-zinc-400">{day.date.toLocaleString("es", { month: "short" })}</p>
                  </div>
                ))}
              </div>
              <div className="relative flex" aria-label="Agenda detallada">
                <div className="sticky left-0 z-20 w-16 flex-shrink-0 border-r border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                  <div className="relative" style={{ height: COLUMN_HEIGHT }}>
                    {slots.map((slot, idx) => (
                      <div key={slot.minutes} className={`absolute inset-x-0 flex items-start justify-center border-b ${slot.dashed ? "border-dashed" : "border-solid"} border-zinc-200 px-1 text-[11px] font-medium leading-none text-zinc-500 dark:border-zinc-800 dark:text-zinc-400`} style={{ top: idx * ROW_HEIGHT, height: ROW_HEIGHT }}>
                        <span className="mt-1 block">{slot.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {loading ? (
                    <div className="flex-1 flex items-center justify-center" style={{ height: COLUMN_HEIGHT }}><p className="text-xl text-indigo-500">Cargando Citas...</p></div>
                ) : (
                    days.map((day, idx) => {
                      const dayAppointments = filteredAppointments.filter((appt) => getAppointmentDetails(appt.appointment_at).dateISO === day.iso).map(normalizeAppointment);
                      const handleColumnClick = (event: MouseEvent<HTMLDivElement>) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        const offsetY = event.clientY - rect.top;
                        const minutesFromStart = Math.min(Math.max(offsetY / COLUMN_HEIGHT, 0), 1) * TOTAL_MINUTES;
                        const roundedSlot = Math.floor(minutesFromStart / STEP) * STEP + MINUTES_START;
                        openBooking(day.iso, minutesToTimeString(roundedSlot));
                      };
                      return (
                        <div key={day.iso} onClick={handleColumnClick} className={`relative flex min-w-[160px] sm:min-w-0 flex-1 border-r border-zinc-300 last:border-r-0 ${idx === 0 ? "bg-indigo-50/40 dark:bg-indigo-950/30" : "bg-white dark:bg-zinc-900"}`} style={{ height: COLUMN_HEIGHT }}>
                          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(to bottom, ${idx === 0 ? "#e0e7ff" : "#e5e7eb"} 0, ${idx === 0 ? "#e0e7ff" : "#e5e7eb"} 1px, transparent 1px, transparent ${ROW_HEIGHT}px)` }} />
                          {dayAppointments.map((appt) => {
                            const { minutes, timeString, dateISO } = getAppointmentDetails(appt.appointment_at);
                            const top = Math.max(0, ((minutes - MINUTES_START) / STEP) * ROW_HEIGHT);
                            const height = Math.min(COLUMN_HEIGHT - top, Math.max((appt.duration! / STEP) * ROW_HEIGHT, ROW_HEIGHT * 0.75));
                            const endMinutes = Math.min(MINUTES_END, minutes + appt.duration!);
                            return (
                              <button key={appt.id} type="button" data-appointment onClick={(e) => { e.stopPropagation(); setSelectedAppointment({ ...appt, fecha: dateISO, hora: timeString } as Appointment); }} className="group absolute left-1 right-1 flex flex-col gap-0.5 truncate rounded-xl border border-white/50 bg-gradient-to-br from-black/10 via-black/5 to-white/10 p-2 text-left text-white shadow-md ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: appt.bg_color, top, height }} title={`${appt.servicio} · ${appt.cliente}`}>
                                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold leading-none uppercase">
                                  <span>{timeString} – {minutesToTimeString(endMinutes)}</span>
                                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-[9px] text-white">{appt.estado}</span>
                                </div>
                                <div className="truncate text-[11px] font-semibold leading-tight">{appt.servicio}</div>
                                <div className="truncate text-[10px] leading-tight opacity-90">{appt.cliente}</div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedAppointment(null)} aria-hidden />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-2 bg-zinc-900 px-5 py-4 text-white dark:bg-zinc-800">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Reserva</p>
                <h3 className="text-lg font-bold leading-tight">{selectedAppointment.servicio} · {selectedAppointment.cliente}</h3>
              </div>
              <button className="rounded-full bg-white/20 px-3 py-1 text-xs hover:bg-white/30" onClick={() => setSelectedAppointment(null)}>Cerrar</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Detalles de la cita aquí...</p>
              {/* Aquí iría el formulario de edición completo si se requiere, simplificado para asegurar compilación */}
            </div>
          </div>
        </div>
      )}

      {bookingForm.open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeBooking} aria-hidden />
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
             <div className="bg-indigo-600 p-4 text-white"><h2 className="text-lg font-bold">Nueva Reserva</h2></div>
             <form className="p-6 space-y-4" onSubmit={submitBooking}>
                <input required className="w-full border p-2 rounded" placeholder="Cliente" value={bookingForm.customer} onChange={e => setBookingForm({...bookingForm, customer: e.target.value})} />
                <div className="flex gap-2">
                   <button type="button" onClick={closeBooking} className="flex-1 bg-gray-100 p-2 rounded">Cancelar</button>
                   <button type="submit" className="flex-1 bg-indigo-600 text-white p-2 rounded">Guardar</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </>
  );
}