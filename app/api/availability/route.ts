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
}

// Formatea la fecha en formato YYYY-MM-DD en hora local
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const serviceId = searchParams.get("service_id");
  const sede = searchParams.get("sede") || "Marquetalia";
  const explicitSpecialist = searchParams.get("specialist");

  const filterDate = searchParams.get("date");
  const jornada = searchParams.get("jornada");
  const searchMode = searchParams.get("search_mode") || "strict";

  const customStartDate = searchParams.get("start_date");
  const customEndDate = searchParams.get("end_date");
  const daysAhead = parseInt(searchParams.get("days_ahead") || "30", 10);

  if (!serviceId) {
    return NextResponse.json(
      { error: "El parámetro service_id es requerido." },
      { status: 400 }
    );
  }

  try {
    // 1. Obtener la información del servicio
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .or(`id.eq.${serviceId},SKU.eq.${serviceId}`)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: "Servicio no encontrado." },
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

    // 2. Obtener especialistas desde app_users
    const { data: specialists } = await supabase
      .from("app_users")
      .select("id, name, horario_semanal");

    let qualifiedSpecialists = (specialists || []).filter((sp) =>
      serviceEspecialistas.includes(sp.name)
    );

    if (explicitSpecialist) {
      qualifiedSpecialists = qualifiedSpecialists.filter(
        (sp) => sp.name.toLowerCase() === explicitSpecialist.toLowerCase()
      );
    }

    if (qualifiedSpecialists.length === 0) {
      return NextResponse.json({
        service: service.Servicio,
        duration,
        available_dates: [],
        message: "No hay especialistas habilitadas para este servicio.",
      });
    }

    // 3. Definición del rango de fechas
    let startDate: Date;
    let endDate: Date;

    if (filterDate) {
      const [fY, fM, fD] = filterDate.split("-").map(Number);
      startDate = new Date(fY, fM - 1, fD, 0, 0, 0);
      endDate = new Date(fY, fM - 1, fD, 23, 59, 59);
    } else if (customStartDate && customEndDate) {
      const [sY, sM, sD] = customStartDate.split("-").map(Number);
      const [eY, eM, eD] = customEndDate.split("-").map(Number);
      startDate = new Date(sY, sM - 1, sD, 0, 0, 0);
      endDate = new Date(eY, eM - 1, eD, 23, 59, 59);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);
      endDate.setHours(23, 59, 59, 999);
    }

    const startDateStr = formatLocalDate(startDate);
    const endDateStr = formatLocalDate(endDate);

    // 4. Consultar reglas en specialist_overrides
    const { data: overrides } = await supabase
      .from("specialist_overrides")
      .select("*")
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    // 5. Consultar citas activas en appointments para la sede
    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("appointment_at, duration, especialista, sede, estado")
      .eq("sede", sede)
      .neq("estado", "Cita cancelada")
      .gte("appointment_at", `${startDateStr} 00:00:00`)
      .lte("appointment_at", `${endDateStr} 23:59:59`);

    const daysOfWeekEs = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

    let startMinOfDay = 9 * 60;
    let endMinOfDay = 18 * 60;

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

    // 6. Recorrer día a día
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatLocalDate(d);
      const dayName = daysOfWeekEs[d.getDay()];
      const daySlots: SlotDetail[] = [];

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
        const freeSpecialistsForSlot: string[] = [];

        for (const sp of qualifiedSpecialists) {
          const spOverrides = (overrides || []).filter((b) => {
            const isSameSp = b.specialist_id === sp.id || b.especialista === sp.name;
            return isSameSp && b.date === dateStr;
          });

          let isAvailableInSede = false;

          /* =========================================================
             🏢 REGLA DE SEDES: MARQUETALIA (BASE) VS OTARAS (OVERRIDE)
          ========================================================= */
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

              return slotStartMin >= bStartMin && slotEndMin <= bEndMin;
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

                if (isServiceAllowed) {
                  isAvailableInSede = true;
                }
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

          /* =========================================================
             🎯 APLICACIÓN DE MODO ESTRICTO O AMPLIO DE AGENDAMIENTO
          ========================================================= */
          if (searchMode === "broad" || explicitSpecialist || !hasAnyApptInDay) {
            freeSpecialistsForSlot.push(sp.name);
          } else {
            const spHasApptsToday = spAppts.length > 0;

            if (spHasApptsToday) {
              const isAllowedAnchor = spAppts.some((appt) => {
                const isRightAfter = appt.end === slotStartMin;
                const isRightBefore = slotEndMin === appt.start;
                const isOneHourAfter = slotStartMin === appt.end + 60;
                return isRightAfter || isRightBefore || isOneHourAfter;
              });

              if (isAllowedAnchor) {
                freeSpecialistsForSlot.push(sp.name);
              }
            }
          }
        }

        if (freeSpecialistsForSlot.length > 0) {
          daySlots.push({
            time: slot,
            assigned_specialist: freeSpecialistsForSlot[0],
            available_specialists: freeSpecialistsForSlot,
          });
        }
      }

      if (daySlots.length > 0) {
        availableDates.push({
          date: dateStr,
          day_name: dayName,
          slots: daySlots,
        });
      }
    }

    return NextResponse.json({
      service: service.Servicio,
      duration,
      query_filters: {
        sede,
        date: filterDate || "Rango general",
        jornada: jornada || "Completa",
        search_mode: searchMode,
      },
      available_dates: availableDates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error procesando disponibilidad", details: error.message },
      { status: 500 }
    );
  }
}