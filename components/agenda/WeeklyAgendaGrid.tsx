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

const ALL_SPECIALISTS = ["Leslie Gutierrez", "Nary Cabrales", "Yucelis Moscote"];
const ALL_SPECIALIST_TITLES = ["L", "N", "Y"];

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
}: {
  appointments: CalendarAppointment[];
  currentDate: Date;
  tooltip?: TooltipInfo;
  onViewDetails?: (appt: CalendarAppointment) => void;
  onCreateFromSlot?: (data: { especialista: string; start: Date }) => void;
  specialistFilter?: string[];
}) {
  const [now, setNow] = useState<Date>(() => new Date());

  // Actualización del indicador de hora actual cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Cálculo seguro del inicio de la semana
  const validCurrentDate = currentDate instanceof Date && !isNaN(currentDate.getTime()) 
    ? currentDate 
    : new Date();
    
  const weekStart = startOfWeek(validCurrentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Generación de lista de horas de la jornada
  const hours: number[] = [];
  for (let h = START_HOUR; h < END_HOUR; h += SLOT_MINUTES / 60) {
    hours.push(h);
  }

  const totalHeight = hours.length * SLOT_HEIGHT;

  // Cálculo defensivo de la posición de la línea de tiempo actual
  const nowMinutesFromStart = differenceInMinutes(
    now,
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), START_HOUR, 0)
  );
  const safeNowMinutes = isNaN(nowMinutesFromStart) ? 0 : nowMinutesFromStart;
  const nowTop = (safeNowMinutes / SLOT_MINUTES) * SLOT_HEIGHT;

  // Filtrado de especialistas activos
  const activeSpecialists =
    specialistFilter && specialistFilter.length > 0
      ? ALL_SPECIALISTS.filter((s) => specialistFilter.includes(s))
      : ALL_SPECIALISTS;

  const safeSpecialistCount = Math.max(1, activeSpecialists.length);

  const activeTitles = activeSpecialists.map(
    (s) => ALL_SPECIALIST_TITLES[ALL_SPECIALISTS.indexOf(s)] || "E"
  );

  return (
    <div className="w-full overflow-x-auto pb-4">
      {/* Contenedor con ancho mínimo para impedir que las columnas colapsen en móviles */}
      <div className="min-w-[850px] border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950">
        
        {/* ENCABEZADO DE DÍAS Y ESPECIALISTAS (z-20 para quedar bajo los menús emergentes del header) */}
        <div
          className="sticky top-0 z-20 grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 shadow-sm"
          style={{ minHeight: HEADER_HEIGHT }}
        >
          <div className="border-r border-gray-200 dark:border-gray-800" />

          {days.map((day) => {
            const isToday = isSameDay(day, now);
            return (
              <div
                key={day.toISOString()}
                className="flex flex-col border-r border-gray-200 dark:border-gray-800 last:border-r-0"
              >
                <div className="flex flex-row items-center justify-center gap-1 py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-[10px] sm:text-xs font-bold uppercase text-gray-600 dark:text-gray-400 truncate">
                    {format(day, "EEEE", { locale: es })}
                  </span>
                  <div
                    className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold ${
                      isToday
                        ? "bg-indigo-600 text-white"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {format(day, "dd")}
                  </div>
                </div>

                {/* Subcolumnas con iniciales de Especialistas */}
                <div
                  className="grid flex-1 w-full"
                  style={{
                    gridTemplateColumns: `repeat(${safeSpecialistCount}, 1fr)`,
                  }}
                >
                  {activeTitles.map((title, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center border-r last:border-r-0 border-gray-200 text-[9px] sm:text-[10px] font-bold text-gray-500 bg-white dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-400"
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
          className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]"
          style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}
        >
          {/* Columna con etiquetas de horas */}
          <div className="overflow-y-auto border-r border-gray-200 dark:border-gray-800">
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

          {/* Columnas correspondientes a cada día de la semana */}
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
                className="relative border-r border-gray-200 dark:border-gray-800 last:border-r-0"
              >
                {/* Filas interactivas para agregar reservas por celda */}
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
                              className="cursor-pointer transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20"
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

                {/* Línea roja marcadora de la hora actual */}
                {isSameDay(day, now) && nowTop > 0 && !isNaN(nowTop) && (
                  <div
                    className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                    style={{
                      top: nowTop,
                      transform: "translateY(-1px)",
                    }}
                  >
                    <div className="h-0.5 w-full bg-red-500" />
                    <div className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Renderizado defensivo de tarjetas de citas */}
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
                    const durationMinutes = isNaN(rawDuration) || rawDuration <= 0 ? 30 : rawDuration;

                    const calculatedHeight =
                      (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT - VISUAL_GAP;
                    const height = isNaN(calculatedHeight) ? SLOT_HEIGHT : calculatedHeight;

                    // Manejo de superposiciones entre citas
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

                    const baseWidth = 100 / safeSpecialistCount;
                    const leftBase = specialistIndex * baseWidth;
                    const offsetStep = 4;

                    return (
                      <div
                        key={appt.id}
                        className="absolute pointer-events-auto transition-all duration-200"
                        style={{
                          top,
                          height,
                          width: `calc(${baseWidth}% - ${
                            totalCollisions > 1 ? 8 : 4
                          }px)`,
                          left: `calc(${leftBase}% + ${
                            2 + collisionIndex * offsetStep
                          }px)`,
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
                            backgroundColor: appt.bg_color || "#6366f1",
                            boxShadow:
                              totalCollisions > 1
                                ? " -2px 0 8px rgba(0,0,0,0.15)"
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