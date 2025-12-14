"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import AgendaShell from "./AgendaShell";
import { AgendaHeader } from "./AgendaHeader";
import AgendaSidebar from "./AgendaSidebar";

import WeeklyAgendaGrid from "./WeeklyAgendaGrid";
import MonthlyAgendaGrid from "./MonthlyAgendaGrid";
import ReservasChat from "../chat/ReservasChat";

/* =========================
   TIPOS
========================= */
type ViewMode = "day" | "week" | "month";

type AgendaAppointmentDB = {
  id: number;
  cliente: string;
  servicio: string;
  especialista: string;
  appointment_at: string;
  estado: string;
  bg_color: string;
  duration?: string | null;
};

export type CalendarAppointment = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  raw: AgendaAppointmentDB;
};

/* =========================
   FECHAS (SIN BUG UTC)
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

/* =========================
   COMPONENT
========================= */
export default function AgendaLayout() {
  const [appointments, setAppointments] = useState<AgendaAppointmentDB[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  /* FILTROS */
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [specialistFilter, setSpecialistFilter] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);

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
          `
          id,
          cliente,
          servicio,
          especialista,
          appointment_at,
          estado,
          bg_color,
          duration
        `
        )
        .gte("appointment_at", from.toISOString())
        .lt("appointment_at", to.toISOString())
        .order("appointment_at", { ascending: true });

      if (error) {
        console.error("❌ Error fetching appointments:", error);
        setAppointments([]);
      } else {
        setAppointments(data ?? []);
      }

      setLoading(false);
    };

    fetchAppointments();
  }, [currentDate, viewMode]);

  /* =========================
     FILTRADO
  ========================= */
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (statusFilter.length && !statusFilter.includes(a.estado)) return false;
      if (
        specialistFilter.length &&
        !specialistFilter.includes(a.especialista)
      )
        return false;
      if (serviceFilter.length && !serviceFilter.includes(a.servicio))
        return false;
      return true;
    });
  }, [appointments, statusFilter, specialistFilter, serviceFilter]);

  /* =========================
     TRANSFORMACIÓN
  ========================= */
  const calendarAppointments: CalendarAppointment[] = useMemo(() => {
    return filteredAppointments.map(a => {
      const start = parseLocalDate(a.appointment_at);
      const minutes = Number(a.duration || 60);
      const end = new Date(start.getTime() + minutes * 60000);

      return {
        id: String(a.id),
        title: a.servicio,
        start,
        end,
        raw: a,
      };
    });
  }, [filteredAppointments]);

  /* =========================
     RENDER
  ========================= */
  return (
    <AgendaShell
      header={
        <AgendaHeader
          currentDate={currentDate}
          onToday={() => setCurrentDate(new Date())}
          onPrev={() =>
            setCurrentDate(d =>
              viewMode === "month"
                ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
                : new Date(
                    d.getTime() -
                      86400000 * (viewMode === "week" ? 7 : 1)
                  )
            )
          }
          onNext={() =>
            setCurrentDate(d =>
              viewMode === "month"
                ? new Date(d.getFullYear(), d.getMonth() + 1, 1)
                : new Date(
                    d.getTime() +
                      86400000 * (viewMode === "week" ? 7 : 1)
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
      sidebar={
        <AgendaSidebar
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        >
          {/* 👇 CHAT DE RESERVAS */}
          <ReservasChat />
        </AgendaSidebar>
      }
      agenda={
        loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Cargando agenda…
          </div>
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
  );
}
