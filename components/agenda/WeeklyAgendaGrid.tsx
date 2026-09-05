"use client";

import {
  addDays,
  differenceInMinutes,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import AgendaEventCard from "./AgendaEventCard";
import type { CalendarAppointment } from "./types";

type TooltipInfo = {
  cliente: string;
  servicio: string;
  estado?: string;
  hora?: string;
  especialista?: string;
};

/* =========================
   CONFIGURACIÓN DE LA REJILLA
========================= */
const START_HOUR = 7;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 52;
const HEADER_HEIGHT = 72;
const VISUAL_GAP = 2;

// Inclusión de especialistas
const ALL_SPECIALISTS = [
  "Leslie Gutierrez",
  "Yucelis Moscote",
  "Nary Cabrales",
  "Andrea Garcia",
];
const ALL_SPECIALIST_TITLES = ["Leslie", "Yuce", "Nary", "Andrea"];

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function WeeklyAgendaGrid({
  appointments = [],
  currentDate = new Date(),
  tooltip,
  onViewDetails,
  onCreateFromSlot,
  specialistFilter = [],
  weekBlock = "block1",
}: {
  appointments: CalendarAppointment[];
  currentDate: Date;
  tooltip?: TooltipInfo;
  onViewDetails?: (appt: CalendarAppointment) => void;
  onCreateFromSlot?: (data: { especialista: string; start: Date }) => void;
  specialistFilter?: string[];
  weekBlock?: "block1" | "block2";
}) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const validCurrentDate =
    currentDate instanceof Date && !isNaN(currentDate.getTime())
      ? currentDate
      : new Date();

  const weekStart = startOfWeek(validCurrentDate, { weekStartsOn: 1 });
  const allDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Segmentación de la semana según el bloque activo
  const days =
    weekBlock === "block1"
      ? allDays.slice(0, 4) // Lunes, Martes, Miércoles, Jueves
      : allDays.slice(4, 7); // Viernes, Sábado, Domingo

  const hours: number[] = [];
  for (let h = START_HOUR; h < END_HOUR; h += SLOT_MINUTES / 60) {
    hours.push(h);
  }

  const totalHeight = hours.length * SLOT_HEIGHT;

  const nowMinutesFromStart = differenceInMinutes(
    now,
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), START_HOUR, 0)
  );
  const safeNowMinutes = isNaN(nowMinutesFromStart) ? 0 : nowMinutesFromStart;
  const nowTop = (safeNowMinutes / SLOT_MINUTES) * SLOT_HEIGHT;

  const activeSpecialists =
    specialistFilter && specialistFilter.length > 0
      ? ALL_SPECIALISTS.filter((s) => specialistFilter.includes(s))
      : ALL_SPECIALISTS;

  const safeSpecialistCount = Math.max(1, activeSpecialists.length);

  const activeTitles = activeSpecialists.map(
    (s) => ALL_SPECIALIST_TITLES[ALL_SPECIALISTS.indexOf(s)] || "E"
  );

  return (
    /* 1. Contenedor principal con scroll horizontal */
    <div className="w-full overflow-x-auto pb-4 font-sans antialiased">
      
      {/* 2. Contenedor unificado con scroll vertical */}
      <div className="w-full min-w-[750px] lg:min-w-full border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 overflow-y-auto max-h-[calc(100vh-210px)]">
        
        {/* ENCABEZADO PEGAJOSO (Sticky Top) */}
        <div
          className="sticky top-0 z-15 grid border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 shadow-sm"
          style={{
            gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))`,
            minHeight: HEADER_HEIGHT,
          }}
        >
          <div className="border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-[10px] font-black text-gray-400">
            HORA
          </div>

          {days.map((day) => {
            const isToday = isSameDay(day, now);
            return (
              <div
                key={day.toISOString()}
                className="flex flex-col border-r border-gray-300 dark:border-gray-800 last:border-r-0 bg-gray-50 dark:bg-gray-900"
              >
                {/* Nombre y número del día */}
                <div className="flex flex-row items-center justify-center gap-1.5 py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-[10px] sm:text-xs font-bold uppercase text-gray-600 dark:text-gray-400 truncate">
                    {format(day, "EEEE", { locale: es })}
                  </span>
                  <div
                    className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold ${
                      isToday
                        ? "bg-rose-500 text-white"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {format(day, "dd")}
                  </div>
                </div>

                {/* Subcolumnas de Especialistas (Leslie, Yuce, Nary, Andrea) */}
                <div
                  className="grid flex-1 w-full"
                  style={{
                    gridTemplateColumns: `repeat(${safeSpecialistCount}, 1fr)`,
                  }}
                >
                  {activeTitles.map((title, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center border-r last:border-r-0 border-gray-200 text-[9px] sm:text-[10px] font-bold text-gray-500 bg-white dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300"
                    >
                      {title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CUERPO PRINCIPAL DE LA REJILLA */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))`,
          }}
        >
          {/* Columna con etiquetas de horas */}
          <div className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="relative" style={{ height: totalHeight }}>
              {hours.map((h, i) => (
                <div
                  key={i}
                  style={{ height: SLOT_HEIGHT }}
                  className="flex items-start justify-end pr-2 pt-1 text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500"
                >
                  {format(
                    new Date(0, 0, 0, Math.floor(h), (h % 1) * 60),
                    "h:mm a"
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Columnas para cada día visible */}
          {days.map((day) => {
            const dayAppointments = (appointments || []).filter(
              (a) =>
                a?.start &&
                a.start.getFullYear() === day.getFullYear() &&
                a.start.getMonth() === day.getMonth() &&
                a.start.getDate() === day.getDate() &&
                activeSpecialists.includes(a.raw?.especialista)
            );

            return (
              <div
                key={day.toISOString()}
                className="relative border-r border-gray-200 dark:border-gray-800 last:border-r-0 bg-white dark:bg-gray-950"
              >
                {/* Cuadrícula de slots disponibles por especialista */}
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    height: totalHeight,
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${
                      SLOT_HEIGHT - 1
                    }px, rgba(0,0,0,0.03) ${SLOT_HEIGHT}px)`,
                  }}
                >
                  <div
                    className="grid h-full"
                    style={{
                      gridTemplateColumns: `repeat(${safeSpecialistCount}, 1fr)`,
                    }}
                  >
                    {activeSpecialists.map((specialist) => (
                      <div
                        key={specialist}
                        className="border-r border-gray-200/50 dark:border-gray-700/50 last:border-r-0"
                      >
                        {hours.map((h, idx) => {
                          const slotStart = new Date(day);
                          slotStart.setHours(Math.floor(h), (h % 1) * 60, 0, 0);

                          return (
                            <div
                              key={idx}
                              className="cursor-pointer transition-colors hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                              style={{ height: SLOT_HEIGHT }}
                              onClick={() =>
                                onCreateFromSlot?.({
                                  especialista: specialist,
                                  start: slotStart,
                                })
                              }
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Marcador de hora actual */}
                {isSameDay(day, now) && nowTop > 0 && !isNaN(nowTop) && (
                  <div
                    className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                    style={{
                      top: nowTop,
                      transform: "translateY(-1px)",
                    }}
                  >
                    <div className="h-0.5 w-full bg-rose-500" />
                    <div className="-ml-1 h-2 w-2 rounded-full bg-rose-500" />
                  </div>
                )}

                {/* Tarjetas de citas con Cascada Delimitada (Sin invadir la siguiente columna) */}
                <div
                  className="relative z-10 pointer-events-none"
                  style={{ height: totalHeight }}
                >
                  {dayAppointments.map((appt) => {
                    const rawMinutes = differenceInMinutes(
                      appt.start,
                      new Date(
                        appt.start.getFullYear(),
                        appt.start.getMonth(),
                        appt.start.getDate(),
                        START_HOUR,
                        0
                      )
                    );
                    const minutesFromStart = isNaN(rawMinutes) ? 0 : rawMinutes;

                    const calculatedTop =
                      (minutesFromStart / SLOT_MINUTES) * SLOT_HEIGHT +
                      VISUAL_GAP / 2;
                    const top = isNaN(calculatedTop) ? 0 : calculatedTop;

                    const rawDuration = differenceInMinutes(appt.end, appt.start);
                    const durationMinutes =
                      isNaN(rawDuration) || rawDuration <= 0 ? 30 : rawDuration;

                    const calculatedHeight =
                      (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT - VISUAL_GAP;
                    const height = isNaN(calculatedHeight) ? SLOT_HEIGHT : calculatedHeight;

                    // 1. Citas en conflicto exacto dentro de la MISMA especialista
                    const collidingAppts = dayAppointments
                      .filter((a) => a.raw?.especialista === appt.raw?.especialista)
                      .filter((a) => appt.start < a.end && a.start < appt.end)
                      .sort((a, b) => a.start.getTime() - b.start.getTime());

                    const collisionIndex = Math.max(
                      0,
                      collidingAppts.findIndex((a) => a.id === appt.id)
                    );
                    const totalCollisions = Math.max(1, collidingAppts.length);

                    const rawSpecialistIndex = activeSpecialists.indexOf(
                      appt.raw?.especialista
                    );
                    const specialistIndex = Math.max(0, rawSpecialistIndex);

                    // 2. Ancho base de una columna de especialista
                    const baseWidth = 100 / safeSpecialistCount;
                    const leftBase = specialistIndex * baseWidth;

                    // 3. CASCADA CONTENIDA DENTRO DE LA MISMA COLUMNA
                    // Si no hay colisión, toma el 96% de la columna. Si hay colisión, toma el 68%.
                    const cardWidthPercent = totalCollisions > 1 
                      ? baseWidth * 0.68 
                      : baseWidth * 0.96;

                    // Desplazamiento máximo controlado de 15% por cada colisión
                    const offsetShift = totalCollisions > 1 
                      ? Math.min(collisionIndex * (baseWidth * 0.15), baseWidth * 0.28) 
                      : 0;

                    const itemLeft = leftBase + offsetShift;

                    return (
                      <div
                        key={appt.id}
                        className="absolute pointer-events-auto transition-all duration-200 hover:z-50 hover:scale-[1.02]"
                        style={{
                          top,
                          height,
                          width: `${cardWidthPercent}%`,
                          left: `calc(${itemLeft}% + 2px)`,
                          maxWidth: `calc(${baseWidth}% - 4px)`,
                          zIndex: 10 + collisionIndex,
                        }}
                      >
                        <AgendaEventCard
                          appointment={appt}
                          onViewDetails={onViewDetails}
                          style={{
                            top: 0,
                            height: "100%",
                            width: "100%",
                            left: 0,
                            backgroundColor: appt.bg_color || "#f43f5e",
                            boxShadow:
                              totalCollisions > 1
                                ? "-3px 4px 10px rgba(0,0,0,0.2)"
                                : "none",
                          }}
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