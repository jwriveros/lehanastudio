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
   CONFIG
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
   COMPONENT
========================= */
export default function WeeklyAgendaGrid({
  appointments,
  currentDate,
  tooltip,
  onViewDetails,
  onCreateFromSlot,
  // ¡AQUÍ ESTÁ LA CLAVE! Nos aseguramos de recibir el filtro
  specialistFilter = [], 
}: {
  appointments: CalendarAppointment[];
  currentDate: Date;
  tooltip?: TooltipInfo;
  onViewDetails?: (appt: CalendarAppointment) => void;
  onCreateFromSlot?: (data: { especialista: string; start: Date }) => void;
  // Añadimos el tipo de dato aquí también
  specialistFilter?: string[]; 
}) {
  const [now, setNow] = useState(new Date());

  // DEBUG: Esto imprimirá en la consola de tu navegador el filtro actual
  console.log("Filtro recibido en la cuadrícula:", specialistFilter);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(i);
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

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

  // LÓGICA DINÁMICA: Si hay filtro, mostramos solo las seleccionadas. Si no, mostramos todas.
  const activeSpecialists = specialistFilter && specialistFilter.length > 0
    ? ALL_SPECIALISTS.filter((s) => specialistFilter.includes(s))
    : ALL_SPECIALISTS;

  const activeTitles = activeSpecialists.map(
    (s) => ALL_SPECIALIST_TITLES[ALL_SPECIALISTS.indexOf(s)]
  );

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
      
      {/* HEADER DÍAS Y ESPECIALISTAS */}
      <div
        className="sticky top-0 z-40 grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 shadow-sm"
        style={{ minHeight: HEADER_HEIGHT }}
      >
        <div className="border-r border-gray-200 dark:border-gray-800" />
        
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col border-r border-gray-200 dark:border-gray-800"
            >
              <div className="flex flex-row items-center justify-center gap-1.5 py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                  {format(day, "EEEE", { locale: es })}
                </span>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isToday
                      ? "bg-indigo-600 text-white"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {format(day, "dd")}
                </div>
              </div>

              {/* TÍTULOS DE ESPECIALISTAS (Dinámico) */}
              <div
                className="grid flex-1 w-full"
                style={{
                  gridTemplateColumns: `repeat(${activeSpecialists.length}, 1fr)`,
                }}
              >
                {activeTitles.map((title, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center border-r last:border-r-0 border-gray-200 text-[10px] font-bold text-gray-500 bg-white dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-400"
                  >
                    {title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* BODY SCROLL */}
      <div
        className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]"
        style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}
      >
        {/* HORAS */}
        <div className="overflow-y-auto border-r border-gray-200 dark:border-gray-800">
          <div className="relative" style={{ height: totalHeight }}>
            {hours.map((h, i) => (
              <div
                key={i}
                style={{ height: SLOT_HEIGHT }}
                className="flex items-start justify-end pr-2 pt-1 text-xs font-medium text-gray-400 dark:text-gray-500"
              >
                {format(
                  new Date(0, 0, 0, Math.floor(h), (h % 1) * 60),
                  "h:mm a"
                )}
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNAS DE LOS DÍAS */}
        {days.map((day) => {
          const dayAppointments = appointments.filter(
            (a) =>
              a.start.getFullYear() === day.getFullYear() &&
              a.start.getMonth() === day.getMonth() &&
              a.start.getDate() === day.getDate() &&
              activeSpecialists.includes(a.raw.especialista) // Filtro interno
          );

          return (
            <div
              key={day.toISOString()}
              className="relative border-r border-gray-200 dark:border-gray-800"
            >
              {/* SLOTS VACÍOS (Dinámicos) */}
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
                    gridTemplateColumns: `repeat(${activeSpecialists.length}, 1fr)`,
                  }}
                >
                  {activeSpecialists.map((specialist) => (
                    <div
                      key={specialist}
                      className="border-r border-gray-200/50 dark:border-gray-700/50"
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

              {/* LÍNEA DEL AHORA */}
              {isSameDay(day, now) && nowTop > 0 && (
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

              {/* CITAS (Ancho dinámico) */}
              <div
                className="relative z-10 pointer-events-none"
                style={{ height: totalHeight }}
              >
                {dayAppointments.map((appt) => {
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
                  
                  const collidingAppts = dayAppointments
                    .filter(a => a.raw.especialista === appt.raw.especialista)
                    .filter(a => (appt.start < a.end && a.start < appt.end))
                    .sort((a, b) => a.start.getTime() - b.start.getTime());

                  const collisionIndex = collidingAppts.findIndex(a => a.id === appt.id);
                  const totalCollisions = collidingAppts.length;

                  // Calcula el ancho en base a activeSpecialists
                  const specialistIndex = Math.max(
                    0,
                    activeSpecialists.indexOf(appt.raw.especialista)
                  );
                  const baseWidth = 100 / activeSpecialists.length;
                  const leftBase = specialistIndex * baseWidth;
                  const offsetStep = 4;

                  return (
                    <div 
                      key={appt.id} 
                      className="absolute pointer-events-auto transition-all duration-200"
                      style={{
                        top,
                        height,
                        width: `calc(${baseWidth}% - ${totalCollisions > 1 ? 8 : 4}px)`,
                        left: `calc(${leftBase}% + ${2 + (collisionIndex * offsetStep)}px)`,
                        zIndex: 10 + collisionIndex,
                      }}
                    >
                      <AgendaEventCard
                        appointment={appt}
                        onViewDetails={onViewDetails}
                        style={{
                          top: 0,
                          height: '100%',
                          width: '100%',
                          left: 0,
                          backgroundColor: appt.bg_color || "#6366f1",
                          boxShadow: totalCollisions > 1 ? ' -2px 0 8px rgba(0,0,0,0.15)' : 'none'
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
  );
}