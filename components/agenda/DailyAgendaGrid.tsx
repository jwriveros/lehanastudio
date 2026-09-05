"use client";

import { differenceInMinutes, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import AgendaEventCard from "./AgendaEventCard";
import type { CalendarAppointment } from "./types";

/* =========================================================
   🔹 CONFIGURACIÓN DE PARÁMETROS
========================================================= */
const START_HOUR = 7;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 42;
const HEADER_HEIGHT = 56;
const VISUAL_GAP = 0;

// Inclusión de las 4 especialistas del estudio
const SPECIALISTS = [
  "Leslie Gutierrez",
  "Nary Cabrales",
  "Yucelis Moscote",
  "Andrea Garcia",
];

/* =========================================================
   🔹 HELPERS PARA MANEJO DE COLISIONES (OVERLAP)
========================================================= */
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

/* =========================================================
   🔹 COMPONENTE PRINCIPAL
========================================================= */
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
    <div className="h-full w-full bg-zinc-50/50 dark:bg-zinc-950 overflow-x-auto text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      <div className="min-w-[700px] h-full flex flex-col">
        
        {/* ENCABEZADO DE ESPECIALISTAS */}
        <div
          className="sticky top-0 z-40 grid grid-cols-[64px_repeat(4,1fr)] border-b border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xs"
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="flex items-center justify-center text-[10px] font-black uppercase text-zinc-400 tracking-wider">
            Hora
          </div>
          {SPECIALISTS.map((s) => (
            <div
              key={s}
              className="flex items-center justify-center border-l border-zinc-200/80 dark:border-zinc-800 text-xs sm:text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-center px-2"
            >
              {s}
            </div>
          ))}
        </div>

        {/* CUERPO DE LA AGENDA DIARIA */}
        <div
          className="grid grid-cols-[64px_repeat(4,1fr)] relative flex-1"
          style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}
        >
          {/* COLUMNA DE HORAS */}
          <div className="overflow-y-auto border-r border-zinc-200/40 dark:border-zinc-800/40">
            <div className="relative" style={{ height: totalHeight }}>
              {hours.map((h, i) => (
                <div
                  key={i}
                  style={{ height: SLOT_HEIGHT }}
                  className="flex items-start justify-end pr-2.5 pt-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500"
                >
                  {format(
                    new Date(0, 0, 0, Math.floor(h), (h % 1) * 60),
                    "HH:mm"
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COLUMNAS DE ESPECIALISTAS */}
          {SPECIALISTS.map((spec) => {
            const layouts = layoutsBySpec.get(spec) || [];
            return (
              <div
                key={spec}
                className="relative border-l border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40"
              >
                {/* RANURAS VACÍAS (SLOTS DISPONIBLES) */}
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
                          className={
                            onCreateFromSlot 
                              ? "cursor-pointer transition-colors hover:bg-rose-500/5 dark:hover:bg-rose-500/10" 
                              : "cursor-default pointer-events-none"
                          }
                          style={{ height: SLOT_HEIGHT, borderBottom: '1px solid rgba(161, 161, 170, 0.12)' }}
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

                {/* INDICADOR DE HORA ACTUAL (LÍNEA ROSE CON EFECTO BRIGHT) */}
                {isSameDay(localCurrentDate, now) && nowTop > 0 && (
                  <div
                    className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                    style={{ top: nowTop - 1 }}
                  >
                    <div className="h-0.5 w-full bg-rose-500 shadow-xs shadow-rose-500/50" />
                    <div className="-ml-1 h-2.5 w-2.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/50 animate-pulse" />
                  </div>
                )}

                {/* TARJETAS DE CITAS SOBREPUESTAS */}
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
                            backgroundColor: appt.bg_color || "#f43f5e",
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
    </div>
  );
}