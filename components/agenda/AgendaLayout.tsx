"use client";

import { useAgendaCollapse } from "@/components/layout/AgendaCollapseContext";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

import AgendaShell from "./AgendaShell";
import { AgendaHeader } from "./AgendaHeader";
import AgendaSidebar from "./AgendaSidebar";

import WeeklyAgendaGrid from "./WeeklyAgendaGrid";
import MonthlyAgendaGrid from "./MonthlyAgendaGrid";
import DailyAgendaGrid from "./DailyAgendaGrid";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import ReservationDrawer from "@/components/reservations/ReservationDrawer";
import { useUIStore } from "@/lib/uiStore";
import { CalendarAppointment, AgendaAppointmentDB } from "./types";

/* =========================
   TIPOS
========================= */
type ViewMode = "day" | "week" | "month";

/* =========================
   FECHAS (Lógica original intacta)
========================= */
function parseLocalDate(dateString: string) {
  const [date, time = "00:00:00"] = dateString.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, ss || 0);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
}

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return startOfDay(date);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
}

function normalizeLocalDate(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

function toLocalDateTimeString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/* =========================
   COMPONENTE
========================= */
export default function AgendaLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { register } = useAgendaCollapse();
  const [appointments, setAppointments] = useState<AgendaAppointmentDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(
    normalizeLocalDate(new Date())
  );
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [specialistFilter, setSpecialistFilter] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<CalendarAppointment | null>(null);
  const isReservationDrawerOpen = useUIStore(
    (state) => state.isReservationDrawerOpen
  );
  const closeReservationDrawer = useUIStore(
    (state) => state.closeReservationDrawer
  );
  const openReservationDrawer = useUIStore(
    (state) => state.openReservationDrawer
  );
  const [editingAppointment, setEditingAppointment] =
    useState<CalendarAppointment | null>(null);
  const toggleSidebar = () => setSidebarCollapsed((v) => !v);
  /* =========================
      REGISTER COLLAPSE
  ========================= */
  useEffect(() => {
    register(toggleSidebar);
    return () => register(null);
  }, [register]);
  /* =========================
      FETCH (Lógica original)
  ========================= */
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    let from: Date;
    let to: Date;
    if (viewMode === "day") {
      from = startOfDay(currentDate);
      to = new Date(from.getTime() + 86400000);
    } else if (viewMode === "week") {
      from = startOfWeek(currentDate);
      to = new Date(from.getTime() + 86400000 * 7);
    } else {
      from = startOfMonth(currentDate);
      to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    }
    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, cliente, celular, servicio, especialista, appointment_at, estado, bg_color, duration"
      )
      .gte("appointment_at", toLocalDateTimeString(from))
      .lt("appointment_at", toLocalDateTimeString(to))
      .order("appointment_at", { ascending: true });
    setAppointments(error ? [] : data ?? []);
    setLoading(false);
  }, [currentDate, viewMode]);
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  /* =========================
      HANDLERS (Lógica original)
  ========================= */
  const handleCancelAppointment = async (appointment: CalendarAppointment) => {
    if (!confirm("¿Seguro que deseas cancelar esta cita?")) return;
    const { error } = await supabase
      .from("appointments")
      .update({ estado: "Cita cancelada" })
      .eq("id", Number(appointment.id));
    if (error) {
      alert("Error al cancelar la cita");
      return;
    }
    setSelectedAppointment(null);
    fetchAppointments();
  };
  const handleDeleteAppointment = async (appointment: CalendarAppointment) => {
    if (!confirm("⚠️ Esta acción eliminará la cita permanentemente.")) return;
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", Number(appointment.id));
    if (error) {
      alert("Error al eliminar la cita");
      return;
    }
    setSelectedAppointment(null);
    fetchAppointments();
  };
  const handleEditAppointment = (appointment: CalendarAppointment) => {
    setSelectedAppointment(null);
    setEditingAppointment(appointment);
    openReservationDrawer();
  };
  const handleCreateFromSlot = ({
    especialista,
    start,
  }: {
    especialista: string;
    start: Date;
  }) => {
    setEditingAppointment({
      id: "new",
      title: "",
      start,
      end: new Date(start.getTime() + 60 * 60000),
      raw: { especialista, appointment_at_local: start.toISOString() },
    });
    openReservationDrawer();
  };
  /* =========================
      MAP CALENDAR (Lógica original)
  ========================= */
  const calendarAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        const statusMatch =
          statusFilter.length === 0 || statusFilter.includes(a.estado);
        const specialistMatch =
          specialistFilter.length === 0 ||
          specialistFilter.includes(a.especialista);
        const serviceMatch =
          serviceFilter.length === 0 || serviceFilter.includes(a.servicio);
        return statusMatch && specialistMatch && serviceMatch;
      })
      .map((a) => {
        const start = parseLocalDate(a.appointment_at);
        const end = new Date(
          start.getTime() + Number(a.duration || 60) * 60000
        );
        return {
          id: String(a.id),
          title: a.servicio,
          start,
          end,
          bg_color: a.bg_color,
          raw: { ...a, appointment_at_local: start.toISOString() },
        };
      });
  }, [appointments, statusFilter, specialistFilter, serviceFilter]);
  return (
    <div className="min-h-[100dvh]flex h-full w-full flex-col overflow-hidden bg-white">
      <AgendaShell
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        header={
          <AgendaHeader
            onToggleAgendaSidebar={toggleSidebar}
            currentDate={currentDate}
            onToday={() => setCurrentDate(normalizeLocalDate(new Date()))}
            onPrev={() =>
              setCurrentDate((d) =>
                normalizeLocalDate(
                  new Date(
                    d.getTime() - 86400000 * (viewMode === "week" ? 7 : 1)
                  )
                )
              )
            }
            onNext={() =>
              setCurrentDate((d) =>
                normalizeLocalDate(
                  new Date(
                    d.getTime() + 86400000 * (viewMode === "week" ? 7 : 1)
                  )
                )
              )
            }
            view={viewMode}
            setView={setViewMode}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            specialistFilter={specialistFilter}
            setSpecialistFilter={setSpecialistFilter}
            serviceFilter={serviceFilter}
            setServiceFilter={setServiceFilter}
          />
        }
        sidebar={<AgendaSidebar collapsed={sidebarCollapsed} />}
        agenda={
          loading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Cargando agenda…
            </div>
          ) : (
            <div className="h-full w-full">
              {viewMode === "day" ? (
                <DailyAgendaGrid
                  appointments={calendarAppointments}
                  currentDate={currentDate}
                  onViewDetails={setSelectedAppointment}
                  onCreateFromSlot={handleCreateFromSlot}
                />
              ) : viewMode === "month" ? (
                <MonthlyAgendaGrid
                  appointments={calendarAppointments}
                  currentDate={currentDate}
                />
              ) : (
                <WeeklyAgendaGrid
                  appointments={calendarAppointments}
                  currentDate={currentDate}
                  onViewDetails={setSelectedAppointment}
                  onCreateFromSlot={handleCreateFromSlot}
                />
              )}
            </div>
          )
        }
      />
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCancel={handleCancelAppointment}
          onDelete={handleDeleteAppointment}
          onEdit={handleEditAppointment}
        />
      )}
      <ReservationDrawer
        isOpen={isReservationDrawerOpen}
        onClose={() => {
          closeReservationDrawer();
          setEditingAppointment(null);
        }}
        appointmentData={editingAppointment}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}