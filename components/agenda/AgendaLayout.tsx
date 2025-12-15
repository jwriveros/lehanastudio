"use client";

import { useAgendaCollapse } from "@/components/layout/AgendaCollapseContext";
import { useEffect, useMemo, useState } from "react";
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


import type { CalendarAppointment, AgendaAppointmentDB } from "./types";

/* =========================
   TIPOS
========================= */
type ViewMode = "day" | "week" | "month";

/* =========================
   FECHAS
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
  const [collapsed, setCollapsed] = useState(false);
  const { register } = useAgendaCollapse(); // 👈 CONTEXTO

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


  /* ==================================================
     🔗 REGISTRAR EL TOGGLE PARA AppSidebar
  ================================================== */
  useEffect(() => {
    register(() => setCollapsed((v) => !v));
    return () => register(null); // 🔴 LIMPIEZA OBLIGATORIA
  }, [register]);

  /* =========================
     FETCH
  ========================= */
  useEffect(() => {
    const fetchAppointments = async () => {
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
          `id, cliente, servicio, especialista, appointment_at, estado, bg_color, duration`
        )
        .gte("appointment_at", toLocalDateTimeString(from))
        .lt("appointment_at", toLocalDateTimeString(to))
        .order("appointment_at", { ascending: true });

      setAppointments(error ? [] : data ?? []);
      setLoading(false);
    };

    fetchAppointments();
  }, [currentDate, viewMode]);

  const calendarAppointments = useMemo(() => {
    return appointments.map((a) => {
      const start = parseLocalDate(a.appointment_at);
      const end = new Date(start.getTime() + Number(a.duration || 60) * 60000);
      return {
        id: String(a.id),
        title: a.servicio,
        start,
        end,
        bg_color: a.bg_color,
        raw: a,
      };
    });
  }, [appointments]);

  return (
    <>
      <AgendaShell
        header={(toggleSidebar, collapsed) => (
          <AgendaHeader
            onToggleAgendaSidebar={toggleSidebar}
            currentDate={currentDate}
            onToday={() => setCurrentDate(normalizeLocalDate(new Date()))}
            onPrev={() =>
              setCurrentDate((d) =>
                normalizeLocalDate(
                  new Date(
                    d.getTime() -
                      86400000 * (viewMode === "week" ? 7 : 1)
                  )
                )
              )
            }
            onNext={() =>
              setCurrentDate((d) =>
                normalizeLocalDate(
                  new Date(
                    d.getTime() +
                      86400000 * (viewMode === "week" ? 7 : 1)
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
        )}
        sidebar={(collapsed) => <AgendaSidebar collapsed={collapsed} />}
        agenda={
          loading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Cargando agenda…
            </div>
          ) : viewMode === "day" ? (
            <DailyAgendaGrid
              appointments={calendarAppointments}
              currentDate={currentDate}
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
            />
          )
        }
      />

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
      <ReservationDrawer
        isOpen={isReservationDrawerOpen}
        onClose={closeReservationDrawer}
        appointmentData={null}
      />

    </>
  );
}
