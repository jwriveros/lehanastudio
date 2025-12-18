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
const HEADER_HEIGHT = 64; 
const VISUAL_GAP = 0;
const SPECIALIST_HEADER_HEIGHT = 32;
const SPECIALISTS = ["Leslie Gutierrez", "Nary Cabrales", "Yucelis Moscote"];
const SPECIALIST_TITLES = ["L", "N", "Y"];

/* =========================
   COMPONENT
========================= */
export default function WeeklyAgendaGrid({
  appointments,
  currentDate,
  tooltip,
  onViewDetails,
  onCreateFromSlot,
}: {
  appointments: CalendarAppointment[];
  currentDate: Date;
  tooltip?: TooltipInfo;
  onViewDetails?: (appt: CalendarAppointment) => void;
  onCreateFromSlot?: (data: { especialista: string; start: Date }) => void;
}) {
  const [now, setNow] = useState(new Date());

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

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
      {/* =====================
          HEADER DÍAS
      ===================== */}
      <div
        className="sticky top-0 z-40 grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
        style={{ minHeight: HEADER_HEIGHT }}
      >
        <div className="border-r border-gray-200 dark:border-gray-800" />
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col items-center justify-center border-r border-gray-200 py-2 dark:border-gray-800"
            >
              <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {format(day, "EEE", { locale: es })}
              </div>
              <div
                className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday
                    ? "bg-indigo-600 text-white"
                    : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {format(day, "dd")}
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================
          BODY SCROLL
      ===================== */}
      <div
        className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]"
        style={{ height: `calc(100% - ${HEADER_HEIGHT}px)` }}
      >
        {/* HORAS */}
        <div className="overflow-y-auto border-r border-gray-200 dark:border-gray-800">
          <div
            className="relative"
            style={{
              height: totalHeight,
              paddingTop: SPECIALIST_HEADER_HEIGHT,
            }}
          >
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

        {/* DÍAS */}
        {days.map((day) => {
          const dayAppointments = appointments.filter(
            (a) =>
              a.start.getFullYear() === day.getFullYear() &&
              a.start.getMonth() === day.getMonth() &&
              a.start.getDate() === day.getDate()
          );

          return (
            <div
              key={day.toISOString()}
              className="relative border-r border-gray-200 dark:border-gray-800"
            >
              {/* SLOTS VACÍOS (CLICK PARA CREAR RESERVA) */}
              <div
                className="absolute inset-0 z-0"
                style={{
                  height: totalHeight,
                  marginTop: SPECIALIST_HEADER_HEIGHT,
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${
                    SLOT_HEIGHT - 1
                  }px, rgba(0,0,0,0.03) ${SLOT_HEIGHT}px)`,
                }}
              >
                <div
                  className="grid h-full"
                  style={{
                    gridTemplateColumns: `repeat(${SPECIALISTS.length}, 1fr)`,
                  }}
                >
                  {SPECIALISTS.map((specialist) => (
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

              {/* HEADER ESPECIALISTAS */}
              <div
                className="sticky top-0 z-20 grid bg-white/80 backdrop-blur-sm dark:bg-gray-900/80"
                style={{
                  top: 0,
                  height: SPECIALIST_HEADER_HEIGHT,
                  gridTemplateColumns: `repeat(${SPECIALISTS.length}, 1fr)`,
                }}
              >
                {SPECIALIST_TITLES.map((title, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center border-b border-r border-gray-200 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400"
                  >
                    {title}
                  </div>
                ))}
              </div>

              {/* LÍNEA DEL AHORA */}
              {isSameDay(day, now) && nowTop > 0 && (
                <div
                  className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                  style={{
                    top: nowTop + SPECIALIST_HEADER_HEIGHT,
                    transform: "translateY(-1px)",
                  }}
                >
                  <div className="h-0.5 w-full bg-red-500" />
                  <div className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                </div>
              )}

              {/* CITAS CON LÓGICA DE CASCADA */}
              <div
                className="relative z-10 pointer-events-none"
                style={{
                  height: totalHeight,
                  marginTop: SPECIALIST_HEADER_HEIGHT,
                }}
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
                  
                  // Lógica de detección de colisiones por especialista
                  const collidingAppts = dayAppointments
                    .filter(a => a.raw.especialista === appt.raw.especialista)
                    .filter(a => (appt.start < a.end && a.start < appt.end))
                    .sort((a, b) => a.start.getTime() - b.start.getTime());

                  const collisionIndex = collidingAppts.findIndex(a => a.id === appt.id);
                  const totalCollisions = collidingAppts.length;

                  const specialistIndex = Math.max(
                    0,
                    SPECIALISTS.indexOf(appt.raw.especialista)
                  );
                  const baseWidth = 100 / SPECIALISTS.length;
                  const leftBase = specialistIndex * baseWidth;

                  // Efecto cascada: desplazamiento de 4px por cada cita colisionada
                  const offsetStep = 4;

                  return (
                    <div 
                      key={appt.id} 
                      className="absolute pointer-events-auto transition-all duration-200"
                      style={{
                        top,
                        height,
                        // Reducimos un poco el ancho si hay colisión para que se vea el fondo
                        width: `calc(${baseWidth}% - ${totalCollisions > 1 ? 8 : 4}px)`,
                        // Aplicamos el desplazamiento horizontal (cascada)
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
                          // Sombra para dar profundidad a las capas de la cascada
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