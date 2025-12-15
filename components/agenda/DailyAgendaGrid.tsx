"use client";

import {  differenceInMinutes,  format,  isSameDay,} from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import AgendaEventCard from "./AgendaEventCard";
import type { CalendarAppointment } from "./types";


/* =========================
   CONFIG
========================= */
const START_HOUR = 7;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 42;
const HEADER_HEIGHT = 48;
const VISUAL_GAP = 6;

const SPECIALISTS = [
  "Leslie Gutierrez",
  "Nary Cabrales",
  "Yucelis Moscote",
];

/* =========================
   OVERLAP HELPERS
========================= */
type LayoutAppt = {
  appt: CalendarAppointment;
  col: number;
  colCount: number;
};

function makeLocalDate(y: number, m: number, d: number) {
  return new Date(y, m, d, 0, 0, 0, 0);
}


function overlaps(a: CalendarAppointment, b: CalendarAppointment) {
  return a.start < b.end && b.start < a.end;
}

function computeOverlapLayout(appts: CalendarAppointment[]): LayoutAppt[] {
  const sorted = [...appts].sort((a, b) =>
    a.start.getTime() - b.start.getTime()
  );

  const active: { appt: CalendarAppointment; col: number }[] = [];
  const result: LayoutAppt[] = [];
  const colById = new Map<string, number>();
  let cluster: CalendarAppointment[] = [];

  const flushCluster = () => {
    if (!cluster.length) return;
    const maxCols = Math.max(
      ...cluster.map(a => colById.get(a.id) ?? 0)
    ) + 1;

    cluster.forEach(a => {
      result.push({
        appt: a,
        col: colById.get(a.id) ?? 0,
        colCount: maxCols,
      });
    });

    cluster = [];
  };

  for (const appt of sorted) {
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].appt.end <= appt.start) {
        active.splice(i, 1);
      }
    }

    if (!active.length) flushCluster();

    const used = active.map(a => a.col);
    let col = 0;
    while (used.includes(col)) col++;

    active.push({ appt, col });
    colById.set(appt.id, col);
    cluster.push(appt);
  }

  flushCluster();
  return result;
}

/* =========================
   COMPONENT
========================= */
export default function DailyAgendaGrid({
  appointments,
  currentDate,
  onViewDetails,
}: {
  appointments: CalendarAppointment[];
  currentDate: Date;
  onViewDetails?: (appt: CalendarAppointment) => void;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(i);
  }, []);

  const hours: number[] = [];
  for (let h = START_HOUR; h < END_HOUR; h += SLOT_MINUTES / 60) {
    hours.push(h);
  }

  const totalHeight = hours.length * SLOT_HEIGHT;

  const nowMinutesFromStart = differenceInMinutes(
    now,
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      START_HOUR,
      0
    )
  );

  const nowTop =
    (nowMinutesFromStart / SLOT_MINUTES) * SLOT_HEIGHT;

  /* =========================
     CITAS DEL DÍA
  ========================= */
const localCurrentDate = useMemo(() => {
  return makeLocalDate(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );
}, [currentDate]);

const dayAppointments = useMemo(() => {
  return appointments.filter(a =>
    isSameDay(a.start, localCurrentDate)
  );
}, [appointments, localCurrentDate]);

console.log(localCurrentDate)

  const bySpecialist = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    dayAppointments.forEach(a => {
      const key = a.raw.especialista || "Sin asignar";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [dayAppointments]);

  const layoutsBySpec = useMemo(() => {
    const map = new Map<string, LayoutAppt[]>();
    for (const [spec, list] of bySpecialist.entries()) {
      map.set(spec, computeOverlapLayout(list));
    }
    return map;
  }, [bySpecialist]);

  return (
    <div className="h-full bg-white">
      {/* HEADER */}
      <div className="grid grid-cols-[64px_repeat(3,1fr)] border-b border-zinc-200 bg-white">
        <div style={{ height: HEADER_HEIGHT }} />

        {SPECIALISTS.map((s) => (
          <div
            key={s}
            className="flex items-center justify-center text-sm font-medium text-zinc-700"
            style={{ height: HEADER_HEIGHT }}
          >
            {s}
          </div>
        ))}
      </div>

      {/* BODY */}
      <div className="grid grid-cols-[64px_repeat(3,1fr)] h-[calc(100%-48px)] overflow-y-auto">
        {/* HORAS */}
        <div className="text-xs text-zinc-500">
          {hours.map((h, i) => (
            <div
              key={i}
              style={{ height: SLOT_HEIGHT }}
              className="flex items-start justify-end pr-1"
            >
              {format(
                new Date(0, 0, 0, Math.floor(h), (h % 1) * 60),
                "HH:mm",
                { locale: es }
              )}
            </div>
          ))}
        </div>

        {/* COLUMNAS */}
        {SPECIALISTS.map((spec) => {
          const layouts = layoutsBySpec.get(spec) || [];

          return (
            <div
              key={spec}
              className="relative"
              style={{
                height: totalHeight,
                backgroundImage: `
                  repeating-linear-gradient(
                    to bottom,
                    transparent,
                    transparent ${SLOT_HEIGHT - 1}px,
                    rgba(0,0,0,0.08) ${SLOT_HEIGHT}px
                  )
                `,
              }}
            >
              {/* Línea ahora */}
              {isSameDay(localCurrentDate, now) && nowTop > 0 && (
                <div
                  className="absolute left-0 right-0 z-30"
                  style={{
                    top: nowTop,
                    height: 2,
                    backgroundColor: "#dc2626",
                  }}
                />
              )}

              {layouts.map(({ appt, col, colCount }) => {
                const minutesFromStart = differenceInMinutes(
                  appt.start,
                  new Date(
                    appt.start.getFullYear(),
                    appt.start.getMonth(),
                    appt.start.getDate(),
                    START_HOUR,
                    0
                  )
                );

                const top =
                  (minutesFromStart / SLOT_MINUTES) * SLOT_HEIGHT +
                  VISUAL_GAP / 2;

                const height =
                  (differenceInMinutes(appt.end, appt.start) /
                    SLOT_MINUTES) *
                    SLOT_HEIGHT -
                  VISUAL_GAP;

                const width = 100 / colCount;
                const left = col * width;

                return (
                  <AgendaEventCard
                    key={appt.id}
                    appointment={appt}
                    style={{
                      top,
                      height,
                      width: `${width}%`,
                      left: `${left}%`,
                      backgroundColor: appt.bg_color || "#6366f1",
                    }}
                    onViewDetails={onViewDetails}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
