"use client";
import { differenceInMinutes, format, isSameDay } from "date-fns";
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
const HEADER_HEIGHT = 56;
const VISUAL_GAP = 0;
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

function computeOverlapLayout(appts: CalendarAppointment[]): LayoutAppt[] {
  const sorted = [...appts].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  const active: { appt: CalendarAppointment; col: number }[] = [];
  const result: LayoutAppt[] = [];
  const colById = new Map<string, number>();
  let cluster: CalendarAppointment[] = [];
  const flushCluster = () => {
    if (!cluster.length) return;
    const maxCols =
      Math.max(...cluster.map((a) => colById.get(a.id) ?? 0)) + 1;
    cluster.forEach((a) => {
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
    const used = active.map((a) => a.col);
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
  onCreateFromSlot,
}: {
  appointments: CalendarAppointment[];
  currentDate: Date;
  onViewDetails?: (appt: CalendarAppointment) => void;
  onCreateFromSlot?: (data: { especialista: string; start: Date }) => void;
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
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), START_HOUR, 0)
  );
  const nowTop = (nowMinutesFromStart / SLOT_MINUTES) * SLOT_HEIGHT;

  const localCurrentDate = useMemo(() => {
    return makeLocalDate(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
  }, [currentDate]);

  const dayAppointments = useMemo(() => {
    return appointments.filter((a) => isSameDay(a.start, localCurrentDate));
  }, [appointments, localCurrentDate]);

  const bySpecialist = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    dayAppointments.forEach((a) => {
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
    <div className="h-full bg-white dark:bg-gray-900">
      {/* HEADER */}
      <div
        className="sticky top-0 z-40 grid grid-cols-[64px_repeat(3,1fr)] border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
        style={{ height: HEADER_HEIGHT }}
      >
        <div />
        {SPECIALISTS.map((s) => (
          <div
            key={s}
            className="flex items-center justify-center border-l border-gray-200 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
          >
            {s}
          </div>
        ))}
      </div>

      {/* BODY */}
      <div
        className="grid grid-cols-[64px_repeat(3,1fr)]"
        style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}
      >
        {/* HORAS */}
        <div className="overflow-y-auto">
          <div className="relative" style={{ height: totalHeight }}>
            {hours.map((h, i) => (
              <div
                key={i}
                style={{ height: SLOT_HEIGHT }}
                className="flex items-start justify-end pr-2 pt-1 text-xs text-gray-500 dark:text-gray-400"
              >
                {format(
                  new Date(0, 0, 0, Math.floor(h), (h % 1) * 60),
                  "HH:mm"
                )}
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNAS */}
        {SPECIALISTS.map((spec) => {
          const layouts = layoutsBySpec.get(spec) || [];
          return (
            <div
              key={spec}
              className="relative border-l border-gray-200 dark:border-gray-700"
            >
              {/* SLOTS VACÍOS (CLICK PARA CREAR RESERVA) */}
              <div
                className="absolute inset-0 z-0"
                style={{ height: totalHeight }}
              >
                <div className="grid h-full grid-cols-1">
                  {hours.map((h, idx) => {
                    const slotStart = new Date(
                      localCurrentDate.getFullYear(),
                      localCurrentDate.getMonth(),
                      localCurrentDate.getDate(),
                      Math.floor(h),
                      (h % 1) * 60
                    );
                    return (
                      <div
                        key={idx}
                        className="cursor-pointer transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20"
                        style={{ height: SLOT_HEIGHT, borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}
                        onClick={() =>
                          onCreateFromSlot?.({
                            especialista: spec,
                            start: slotStart,
                          })
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Línea ahora */}
              {isSameDay(localCurrentDate, now) && nowTop > 0 && (
                <div
                  className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                  style={{ top: nowTop - 1 }}
                >
                  <div className="h-0.5 w-full bg-red-500" />
                  <div className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                </div>
              )}

              {/* CITAS */}
              <div className="relative z-10 pointer-events-none" style={{ height: totalHeight }}>
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
                    (differenceInMinutes(appt.end, appt.start) / SLOT_MINUTES) *
                      SLOT_HEIGHT -
                    VISUAL_GAP;
                  const width = 100 / colCount;
                  const left = col * width;

                  return (
                    <div 
                      key={appt.id}
                      className="absolute pointer-events-auto"
                      style={{
                        top,
                        height,
                        width: `calc(${width}% - 4px)`,
                        left: `calc(${left}% + 2px)`,
                      }}
                    >
                      <AgendaEventCard
                        appointment={appt}
                        style={{
                          top: 0,
                          height: '100%',
                          width: '100%',
                          left: 0,
                          backgroundColor: appt.bg_color || "#6366f1",
                        }}
                        onViewDetails={onViewDetails}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}