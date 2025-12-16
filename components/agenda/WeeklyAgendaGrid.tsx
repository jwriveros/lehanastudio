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
const SLOT_HEIGHT = 48; 
const HEADER_HEIGHT = 64; 
const VISUAL_GAP = 0;
const SPECIALIST_HEADER_HEIGHT = 32;
const SPECIALISTS = ["Leslie Gutierrez", "Nary Cabrales", "Yucelis Moscote"];
const SPECIALIST_TITLES = ["Leslie", "Nary", "Yuce"];

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

  // Ajuste de anchos para que quepa en móvil
  const timeColumnWidth = "w-10 sm:w-16"; // 40px en móvil, 64px en desktop
  const gridLayout = "grid-cols-[40px_repeat(7,1fr)] sm:grid-cols-[64px_repeat(7,1fr)]";

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900 overflow-x-hidden flex flex-col">
      {/* =====================
          HEADER DÍAS
      ===================== */}
      <div
        className={`sticky top-0 z-40 grid ${gridLayout} border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 w-full`}
        style={{ minHeight: HEADER_HEIGHT }}
      >
        <div className="border-r border-gray-200 dark:border-gray-800" />
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col items-center justify-center border-r border-gray-200 py-1 dark:border-gray-800 min-w-0"
            >
              <div className="text-[10px] sm:text-xs font-medium uppercase text-gray-500 dark:text-gray-400 truncate w-full text-center">
                {format(day, "EEE", { locale: es })}
              </div>
              <div
                className={`mt-1 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[10px] sm:text-sm font-semibold ${
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
        className={`grid ${gridLayout} flex-1 min-h-0 w-full overflow-x-hidden overflow-y-auto`}
      >
        {/* HORAS */}
        <div className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
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
                className="flex items-start justify-end pr-1 sm:pr-2 pt-1 text-[9px] sm:text-xs font-medium text-gray-400 dark:text-gray-500"
              >
                {format(
                  new Date(0, 0, 0, Math.floor(h), (h % 1) * 60),
                  "h:mm"
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
              {/* SLOTS VACÍOS */}
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

              {/* HEADER ESPECIALISTAS (Compacto en móvil) */}
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
                    className="flex items-center justify-center border-b border-r border-gray-200 text-[8px] sm:text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400 truncate"
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
                </div>
              )}

              {/* CITAS */}
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
                    new Date(appt.start.getFullYear(), appt.start.getMonth(), appt.start.getDate(), START_HOUR, 0)
                  );
                  const top = (minutesFromStart / SLOT_MINUTES) * SLOT_HEIGHT;
                  const height = (differenceInMinutes(appt.end, appt.start) / SLOT_MINUTES) * SLOT_HEIGHT;
                  
                  const specialistIndex = Math.max(0, SPECIALISTS.indexOf(appt.raw.especialista));
                  const width = 100 / SPECIALISTS.length;
                  const left = specialistIndex * width;

                  return (
                    <div 
                      key={appt.id} 
                      className="absolute pointer-events-auto"
                      style={{
                        top,
                        height,
                        width: `${width}%`,
                        left: `${left}%`,
                        padding: '1px', // Gap mínimo para móvil
                      }}
                    >
                      <AgendaEventCard
                        appointment={appt}
                        tooltip={tooltip}
                        onViewDetails={onViewDetails}
                        style={{
                          top: 0,
                          height: '100%',
                          width: '100%',
                          left: 0,
                          backgroundColor: appt.bg_color || "#6366f1",
                          fontSize: '8px', // Texto muy pequeño para móvil
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