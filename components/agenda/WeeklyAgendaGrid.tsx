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
const SLOT_HEIGHT = 42;
const HEADER_HEIGHT = 48;
const VISUAL_GAP = 2;
const SPECIALIST_HEADER_HEIGHT = 26;

const SPECIALISTS = [
  "Leslie Gutierrez",
  "Nary Cabrales",
  "Yucelis Moscote",
];
const SPECIALIST_TITLES = [
  "Leslie",
  "Nary",
  "Yuce",
];




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
onCreateFromSlot?: (data: {
    especialista: string;
    start: Date;
  }) => void;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(i);
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStart, i)
  );

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

  return (
    <div className="h-full bg-white">
      {/* =====================
          HEADER DÍAS
      ===================== */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-gray-200 bg-white">
        <div style={{ height: HEADER_HEIGHT }} />

        {days.map((day) => {
          const isToday = isSameDay(day, now);
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col items-center justify-center"
              style={{ height: HEADER_HEIGHT }}
            >
              <div className="text-xs text-zinc-500">
                {format(day, "EEE", { locale: es })}
              </div>
              <div
                className={`text-sm ${
                  isToday
                    ? "text-red-600 font-semibold"
                    : "text-zinc-800"
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
      <div className="grid grid-cols-[64px_repeat(7,1fr)] h-[calc(100%-48px)] overflow-y-auto">
        {/* HORAS */}
        <div className="text-xs text-zinc-500"
          style={{ paddingTop: SPECIALIST_HEADER_HEIGHT}}
        >
          {hours.map((h, i) => (
            <div
              key={i}
              style={{ height: SLOT_HEIGHT }}
              className="flex items-start justify-end pr-1 text-[11px] font-medium text-zinc-500"

            >
              {format(
                new Date(0, 0, 0, Math.floor(h), (h % 1) * 60),
                "h:mm a",
                { locale: es }
              )}
            </div>
          ))}
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
              className="relative hover:bg-indigo-50/20 transition-colors"
              style={{
                height: totalHeight + SPECIALIST_HEADER_HEIGHT,
                backgroundImage: `
                  repeating-linear-gradient(
                    to bottom,
                    transparent,
                    transparent ${SLOT_HEIGHT - 1}px,
                    rgba(0,0,0,0.05) ${SLOT_HEIGHT}px
                  ),
                  repeating-linear-gradient(
                      to right,
                      transparent,
                      transparent ${SLOT_HEIGHT - 1}px,
                    rgba(0,0,0,0.03) ${SLOT_HEIGHT}px
                    )
                `,
              }}
            >
              {/* ⏱ BLOQUE HORA ACTUAL */}
              {isSameDay(day, now) && nowTop > 0 && (
                <div
                  className="absolute left-0 right-0 z-10"
                  style={{
                    top: Math.floor(nowTop / SLOT_HEIGHT) * SLOT_HEIGHT,
                    height: SLOT_HEIGHT,
                    background:
                      "linear-gradient(to bottom, rgba(99,102,241,0.06), rgba(99,102,241,0.02))",
                  }}
                />
              )}
              {/* HEADER ESPECIALISTAS */}
              {/* SLOTS VACÍOS (CLICK PARA CREAR RESERVA) */}
                <div
                  className="absolute left-0 right-0 top-0"
                  style={{
                    height: totalHeight + SPECIALIST_HEADER_HEIGHT,
                    display: "grid",
                    gridTemplateColumns: `repeat(${SPECIALISTS.length}, 1fr)`,
                    marginTop: SPECIALIST_HEADER_HEIGHT,
                  }}
                >
                  {SPECIALISTS.map((specialist) => (
                    <div key={specialist}>
                      {hours.map((h, idx) => {
                        const slotStart = new Date(
                          day.getFullYear(),
                          day.getMonth(),
                          day.getDate(),
                          Math.floor(h),
                          (h % 1) * 60
                        );

                        return (
                          <div
                            key={idx}
                            className="cursor-pointer"
                            style={{
                              height: SLOT_HEIGHT,
                            }}
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

              <div
                className="absolute top-0 left-0 right-0 z-20
                          grid text-[11px] font-medium text-zinc-600
                          bg-white/90 backdrop-blur-sm border-b border-gray-200"
                style={{
                  height: SPECIALIST_HEADER_HEIGHT,
                  gridTemplateColumns: `repeat(${SPECIALISTS.length}, 1fr)`,
                }}
              >
                {SPECIALIST_TITLES.map((title, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center border-r last:border-r-0 border-gray-200/70"
                  >
                    {title}
                  </div>
                ))}
              </div>


              {/* 🔴 LÍNEA DEL AHORA */}
              {isSameDay(day, now) && nowTop > 0 && (
                <>
                  <div
                    className="absolute left-0 right-0 z-30"
                    style={{
                      top: nowTop,
                      height: 2,
                      backgroundColor: "#dc2626",
                    }}
                  />
                  <div
                    className="absolute z-30"
                    style={{
                      top: nowTop - 4,
                      left: -4,
                      width: 8,
                      height: 8,
                      backgroundColor: "#dc2626",
                      borderRadius: "50%",
                    }}
                  />
                </>
              )}

              {/* CITAS */}
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
                  SPECIALIST_HEADER_HEIGHT+(minutesFromStart / SLOT_MINUTES) *
                    SLOT_HEIGHT +
                  VISUAL_GAP / 2;

                const height =
                  (differenceInMinutes(
                    appt.end,
                    appt.start
                  ) /
                    SLOT_MINUTES) *
                    SLOT_HEIGHT -
                  VISUAL_GAP;

                const specialistIndex = Math.max(
                  0,
                  SPECIALISTS.indexOf(appt.raw.especialista)
                );

                const width = 100 / SPECIALISTS.length;
                const left = specialistIndex * width;

                return (
                  <AgendaEventCard
                    key={appt.id}
                    appointment={appt}
                    tooltip={tooltip}
                    onViewDetails={onViewDetails}
                    style={{
                      top,
                      height,
                      width: `${width}%`,
                      left: `${left}%`,
                      backgroundColor: appt.bg_color || "#6366f1",
                    }}
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
