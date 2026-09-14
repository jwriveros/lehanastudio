import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface SlotDetail {
  time: string;
  assigned_specialist: string;
  available_specialists: string[];
}

interface DateAvailability {
  date: string;
  day_name: string;
  slots: SlotDetail[];
  alternative_specialists_slots?: SlotDetail[];
}

// 🎯 HELPER 1: Obtiene la fecha actual en la zona horaria oficial de Colombia (America/Bogota)
function getColombiaNow(): Date {
  const now = new Date();
  const colStr = now.toLocaleString("en-US", { timeZone: "America/Bogota" });
  return new Date(colStr);
}

// 🎯 HELPER 2: Formatea un objeto Date a YYYY-MM-DD local de Colombia
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 🎯 HELPER 3: Normaliza texto eliminando acentos, símbolos y espacios para comparaciones exactas
function cleanText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina tildes
    .replace(/[^a-z0-9]/g, "");     // Elimina espacios y símbolos
}

// Desempaqueta el horario base semanal
function safeParseSchedule(rawSchedule: any): any {
  if (!rawSchedule) return {};
  let current = rawSchedule;

  while (typeof current === "string") {
    try {
      let trimmed = current.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        trimmed = trimmed.slice(1, -1);
      }
      current = JSON.parse(trimmed.replace(/\\"/g, '"'));
    } catch (e) {
      try {
        current = JSON.parse(current);
      } catch (err) {
        break;
      }
    }
  }

  return typeof current === "object" && current !== null ? current : {};
}

// Convierte HH:MM a minutos transcurridos desde medianoche
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanTime = timeStr.trim().split(" ")[0].split("T").pop() || "";
  const parts = cleanTime.substring(0, 5).split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Captura flexible del servicio por nombre ('Servicio'), SKU o ID
  const rawServiceInput =
    searchParams.get("servicio") ||
    searchParams.get("service_name") ||
    searchParams.get("service_id") ||
    searchParams.get("sku") ||
    "";

  const sede = searchParams.get("sede") || "Marquetalia";

  let explicitSpecialist = searchParams.get("specialist");
  if (
    explicitSpecialist === "undefined" ||
    explicitSpecialist === "null" ||
    explicitSpecialist === "Cualquier profesional" ||
    !explicitSpecialist?.trim()
  ) {
    explicitSpecialist = null;
  }

  const filterDate = searchParams.get("date");
  const jornada = searchParams.get("jornada");
  const searchMode = searchParams.get("search_mode") === "broad" ? "broad" : "strict";

  if (!rawServiceInput.trim()) {
    return NextResponse.json(
      { ok: false, error: "El parámetro de servicio (servicio, service_name, service_id o sku) es requerido." },
      { status: 400 }
    );
  }

  try {
    // 🎯 1. CONSULTA DE SERVICIOS Y BÚSQUEDA POR LA COLUMNA 'Servicio'
    const { data: allServices, error: allServicesError } = await supabase
      .from("services")
      .select("*");

    if (allServicesError || !allServices || allServices.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Error al acceder a la tabla de servicios en Supabase." },
        { status: 500 }
      );
    }

    // Búsqueda insensible a tildes, paréntesis o mayúsculas
    const targetClean = cleanText(rawServiceInput);

    const service = allServices.find((s) => {
      const nameClean = cleanText(s.Servicio || s.servicio || "");
      const skuClean = cleanText(s.SKU || "");
      const idClean = cleanText(s.id || "");

      return (
        nameClean === targetClean ||
        skuClean === targetClean ||
        idClean === targetClean ||
        nameClean.includes(targetClean) ||
        targetClean.includes(nameClean)
      );
    });

    if (!service) {
      return NextResponse.json(
        {
          ok: false,
          error: `Servicio '${rawServiceInput}' no encontrado.`,
          bot_instructions: {
            summary: `El servicio '${rawServiceInput}' no existe. Por favor verifica la lista oficial de servicios.`,
            has_primary_availability: false,
            has_alternative_options: false,
          },
        },
        { status: 404 }
      );
    }

    const duration = parseInt(service.duracion || "60", 10);
    const serviceSku = service.SKU || service.id;

    let serviceEspecialistas: string[] = [];
    if (typeof service.especialistas === "string") {
      try {
        serviceEspecialistas = JSON.parse(service.especialistas);
      } catch (e) {
        serviceEspecialistas = [service.especialistas];
      }
    } else if (Array.isArray(service.especialistas)) {
      serviceEspecialistas = service.especialistas;
    }

    // Obtener especialistas calificadas desde app_users
    const { data: specialists } = await supabase
      .from("app_users")
      .select("id, name, horario_semanal");

    const allQualifiedSpecialists = (specialists || []).filter((sp) =>
      serviceEspecialistas.includes(sp.name)
    );

    let targetSpecialists = allQualifiedSpecialists;

    if (explicitSpecialist) {
      targetSpecialists = allQualifiedSpecialists.filter(
        (sp) => sp.name.toLowerCase() === explicitSpecialist.toLowerCase()
      );
    }

    if (allQualifiedSpecialists.length === 0) {
      return NextResponse.json({
        ok: false,
        service: service.Servicio,
        duration_minutes: duration,
        available_dates: [],
        bot_instructions: {
          summary: "No hay especialistas habilitadas para este servicio.",
          has_primary_availability: false,
          has_alternative_options: false,
        },
      });
    }

    // 🎯 2. DEFINICIÓN DEL RANGO DE FECHAS (RESPECTANDO UTC-5 COLOMBIA)
    let startDate: Date;
    let endDate: Date;

    const colombiaToday = getColombiaNow();

    if (filterDate) {
      const [fY, fM, fD] = filterDate.split("-").map(Number);
      startDate = new Date(fY, fM - 1, fD, 0, 0, 0);
      endDate = new Date(fY, fM - 1, fD, 23, 59, 59);
    } else {
      // 🎯 SI NO HAY FECHA, TOMA LOS PRÓXIMOS 3 DÍAS A PARTIR DE MAÑANA (HORA COLOMBIA)
      startDate = new Date(colombiaToday);
      startDate.setDate(colombiaToday.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(colombiaToday);
      endDate.setDate(colombiaToday.getDate() + 3);
      endDate.setHours(23, 59, 59, 999);
    }

    const startDateStr = formatLocalDate(startDate);
    const endDateStr = formatLocalDate(endDate);

    // Consultar specialist_overrides y citas activas en la sede
    const { data: overrides } = await supabase
      .from("specialist_overrides")
      .select("*")
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("appointment_at, duration, especialista, sede, estado")
      .eq("sede", sede)
      .neq("estado", "Cita cancelada")
      .gte("appointment_at", `${startDateStr} 00:00:00`)
      .lte("appointment_at", `${endDateStr} 23:59:59`);

    const daysOfWeekEs = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

    let startMinOfDay = 9 * 60;  // 09:00 AM
    let endMinOfDay = 18 * 60;   // 06:00 PM

    if (jornada === "manana") {
      startMinOfDay = 9 * 60;
      endMinOfDay = 12 * 60;
    } else if (jornada === "tarde") {
      startMinOfDay = 12 * 60;
      endMinOfDay = 18 * 60;
    }

    const candidateSlots: string[] = [];
    for (let m = startMinOfDay; m <= endMinOfDay; m += 15) {
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      const hhStr = hh < 10 ? `0${hh}` : `${hh}`;
      const mmStr = mm < 10 ? `0${mm}` : `${mm}`;
      candidateSlots.push(`${hhStr}:${mmStr}`);
    }

    const availableDates: DateAvailability[] = [];
    const isMainSede = sede.toLowerCase() === "marquetalia";

    // Recorrer el rango día por día
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatLocalDate(d);
      const dayName = daysOfWeekEs[d.getDay()];
      const daySlots: SlotDetail[] = [];
      const alternativeSlots: SlotDetail[] = [];

      const dayAppts = (existingAppts || []).filter((appt) => {
        const normalizedApptAt = (appt.appointment_at || "").replace(" ", "T");
        const [apptDate] = normalizedApptAt.split("T");
        return apptDate === dateStr;
      });

      const hasAnyApptInDay = dayAppts.length > 0;

      const apptsBySpecialist: Record<string, { start: number; end: number }[]> = {};
      dayAppts.forEach((appt) => {
        const normalizedApptAt = (appt.appointment_at || "").replace(" ", "T");
        const [, apptTimePart] = normalizedApptAt.split("T");
        const apptStartMin = timeToMinutes(apptTimePart || "00:00");
        const apptDuration = parseInt(appt.duration || "60", 10);
        const apptEndMin = apptStartMin + apptDuration;

        if (!apptsBySpecialist[appt.especialista]) {
          apptsBySpecialist[appt.especialista] = [];
        }
        apptsBySpecialist[appt.especialista].push({ start: apptStartMin, end: apptEndMin });
      });

      for (const slot of candidateSlots) {
        const slotStartMin = timeToMinutes(slot);
        const slotEndMin = slotStartMin + duration;

        const freeTargetSpecialists: string[] = [];
        const freeAlternativeSpecialists: string[] = [];

        for (const sp of allQualifiedSpecialists) {
          const isTarget = targetSpecialists.some((t) => t.id === sp.id);

          const spOverrides = (overrides || []).filter((b) => {
            const isSameSp = b.specialist_id === sp.id || b.especialista === sp.name;
            return isSameSp && b.date === dateStr;
          });

          let isAvailableInSede = false;

          if (isMainSede) {
            const scheduleObj = safeParseSchedule(sp.horario_semanal);
            const dayConfig = scheduleObj[dayName];

            if (dayConfig && dayConfig.estado === "abierto") {
              const workStartMin = timeToMinutes(dayConfig.inicio || "09:00");
              const lastSlotAllowedMin = timeToMinutes(dayConfig.fin || "18:00");

              if (slotStartMin >= workStartMin && slotStartMin <= lastSlotAllowedMin) {
                isAvailableInSede = true;
              }
            }

            const hasConflictOverride = spOverrides.some((rule) => {
              const bStartMin = timeToMinutes(rule.start_time || "00:00");
              const bEndMin = timeToMinutes(rule.end_time || "23:59");
              const inTimeRange = slotStartMin < bEndMin && slotEndMin > bStartMin;

              if (!inTimeRange) return false;
              if (rule.type === "blocked") return true;
              if (rule.type === "assigned_sede" && rule.sede?.toLowerCase() !== "marquetalia") return true;

              return false;
            });

            if (hasConflictOverride) isAvailableInSede = false;

          } else {
            const assignedSedeOverride = spOverrides.find((rule) => {
              if (rule.type !== "assigned_sede") return false;
              if (!rule.sede || rule.sede.toLowerCase() !== sede.toLowerCase()) return false;

              const bStartMin = timeToMinutes(rule.start_time || "00:00");
              const bEndMin = timeToMinutes(rule.end_time || "23:59");

              return slotStartMin >= bStartMin && slotStartMin <= bEndMin;
            });

            if (assignedSedeOverride) {
              if (
                assignedSedeOverride.allowed_services &&
                Array.isArray(assignedSedeOverride.allowed_services) &&
                assignedSedeOverride.allowed_services.length > 0
              ) {
                const isServiceAllowed =
                  assignedSedeOverride.allowed_services.includes(serviceSku) ||
                  assignedSedeOverride.allowed_services.includes(service.id);

                if (isServiceAllowed) isAvailableInSede = true;
              } else {
                isAvailableInSede = true;
              }
            }
          }

          if (!isAvailableInSede) continue;

          const spAppts = apptsBySpecialist[sp.name] || [];
          const isOccupied = spAppts.some(
            (appt) => slotStartMin < appt.end && slotEndMin > appt.start
          );

          if (isOccupied) continue;

          // REGLAS DE DISPONIBILIDAD PARA EL BOT
          let isSlotValid = false;

          if (searchMode === "broad" || !hasAnyApptInDay) {
            isSlotValid = true;
          } else {
            const spHasApptsToday = spAppts.length > 0;

            if (explicitSpecialist && isTarget) {
              if (!spHasApptsToday) {
                isSlotValid = slotStartMin === 9 * 60 || slotStartMin === 14 * 60;
              } else {
                isSlotValid = spAppts.some((appt) => {
                  const isRightAfter = appt.end === slotStartMin;
                  const isRightBefore = slotEndMin === appt.start;
                  const isOneHourAfter = slotStartMin === appt.end + 60;
                  return isRightAfter || isRightBefore || isOneHourAfter;
                });
              }
            } else {
              if (spHasApptsToday) {
                const isMorningSlot = slotStartMin >= 9 * 60 && slotStartMin < 13 * 60;
                const isAfternoonSlot = slotStartMin >= 13 * 60 && slotStartMin <= 18 * 60;

                const hasApptInMorning = spAppts.some((a) => a.start < 13 * 60);
                const hasApptInAfternoon = spAppts.some((a) => a.end > 13 * 60);

                if ((isMorningSlot && hasApptInMorning) || (isAfternoonSlot && hasApptInAfternoon)) {
                  isSlotValid = true;
                } else {
                  isSlotValid = spAppts.some((appt) => {
                    const isRightAfter = appt.end === slotStartMin;
                    const isRightBefore = slotEndMin === appt.start;
                    const isOneHourAfter = slotStartMin === appt.end + 60;
                    return isRightAfter || isRightBefore || isOneHourAfter;
                  });
                }
              } else {
                isSlotValid = slotStartMin === 9 * 60 || slotStartMin === 14 * 60;
              }
            }
          }

          if (isSlotValid) {
            if (isTarget) {
              freeTargetSpecialists.push(sp.name);
            } else {
              freeAlternativeSpecialists.push(sp.name);
            }
          }
        }

        if (freeTargetSpecialists.length > 0) {
          daySlots.push({
            time: slot,
            assigned_specialist: freeTargetSpecialists[0],
            available_specialists: freeTargetSpecialists,
          });
        } else if (freeAlternativeSpecialists.length > 0) {
          alternativeSlots.push({
            time: slot,
            assigned_specialist: freeAlternativeSpecialists[0],
            available_specialists: freeAlternativeSpecialists,
          });
        }
      }

      if (daySlots.length > 0 || alternativeSlots.length > 0) {
        availableDates.push({
          date: dateStr,
          day_name: dayName,
          slots: daySlots,
          ...(explicitSpecialist && alternativeSlots.length > 0
            ? { alternative_specialists_slots: alternativeSlots }
            : {}),
        });
      }
    }

    // 🎯 ESTRUCTURA MASTICADA PARA EL AGENTE DE IA
    const botSummaryLines: string[] = [];
    if (availableDates.length > 0) {
      availableDates.forEach((d) => {
        const primaryTimes = d.slots.map((s) => s.time).join(", ");
        let line = `Fecha ${d.date} (${d.day_name}): Horarios libres con especialista principal: [${primaryTimes || "Ninguno"}]`;

        if (d.alternative_specialists_slots && d.alternative_specialists_slots.length > 0) {
          const altTimes = d.alternative_specialists_slots
            .map((s) => `${s.time} (con ${s.assigned_specialist})`)
            .join(", ");
          line += ` | Opciones alternativas con otras especialistas: [${altTimes}]`;
        }

        botSummaryLines.push(line);
      });
    } else {
      botSummaryLines.push("No hay horarios disponibles en el rango consultado.");
    }

    return NextResponse.json({
      ok: true,
      service: service.Servicio,
      duration_minutes: duration,
      sede: sede,
      search_mode: searchMode,
      explicit_specialist: explicitSpecialist || "Cualquier profesional",
      available_dates: availableDates,
      bot_instructions: {
        summary: botSummaryLines.join("\n"),
        has_primary_availability: availableDates.some((d) => d.slots.length > 0),
        has_alternative_options: availableDates.some(
          (d) => d.alternative_specialists_slots && d.alternative_specialists_slots.length > 0
        ),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Error procesando disponibilidad", details: error.message },
      { status: 500 }
    );
  }
}