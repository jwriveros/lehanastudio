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

// Desempaqueta el objeto horario_semanal
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

// Convierte horas en formato HH:MM a minutos transcurridos desde medianoche
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
  
  // Parámetros de rango de fechas optimizados (Evita cargar todo el año de golpe)
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

    // 2. Obtener las especialistas desde app_users
    const { data: specialists } = await supabase
      .from("app_users")
      .select("id, name, horario_semanal");

    const qualifiedSpecialists = (specialists || []).filter((sp) =>
      serviceEspecialistas.includes(sp.name)
    );

    if (qualifiedSpecialists.length === 0) {
      return NextResponse.json({
        service: service.Servicio,
        duration,
        available_dates: [],
        message: "No hay especialistas habilitadas para este servicio.",
      });
    }

    // 3. Determinación optimizada del rango de fechas
    let startDate: Date;
    let endDate: Date;

    if (customStartDate && customEndDate) {
      startDate = new Date(`${customStartDate}T00:00:00`);
      endDate = new Date(`${customEndDate}T23:59:59`);
    } else {
      // Por defecto: desde mañana hasta N días adelante (30 días recomendados)
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // 4. Consultar bloqueos en specialist_overrides
    const { data: overrides } = await supabase
      .from("specialist_overrides")
      .select("*")
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    // 5. Consultar citas activas en appointments
    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("appointment_at, duration, especialista, sede, estado")
      .eq("sede", sede)
      .neq("estado", "Cita cancelada")
      .gte("appointment_at", `${startDateStr} 00:00:00`)
      .lte("appointment_at", `${endDateStr} 23:59:59`);

    const daysOfWeekEs = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    
    // Franjas candidatas cada 15 minutos (de 09:00 a 18:00)
    const candidateSlots: string[] = [];
    const startMinOfDay = 9 * 60; // 09:00
    const endMinOfDay = 18 * 60;  // 18:00

    for (let m = startMinOfDay; m <= endMinOfDay; m += 15) {
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      const hhStr = hh < 10 ? `0${hh}` : `${hh}`;
      const mmStr = mm < 10 ? `0${mm}` : `${mm}`;
      candidateSlots.push(`${hhStr}:${mmStr}`);
    }

    const availableDates: DateAvailability[] = [];

    // 6. Recorrer día por día en el rango solicitado
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayName = daysOfWeekEs[d.getDay()];
      const daySlots: SlotDetail[] = [];

      for (const slot of candidateSlots) {
        const slotStartMin = timeToMinutes(slot);
        const slotEndMin = slotStartMin + duration;
        const freeSpecialistsForSlot: string[] = [];

        for (const sp of qualifiedSpecialists) {
          const scheduleObj = safeParseSchedule(sp.horario_semanal);
          const dayConfig = scheduleObj[dayName];

          if (!dayConfig || dayConfig.estado === "cerrado") continue;

          const workStartMin = timeToMinutes(dayConfig.inicio || "09:00");
          const lastSlotAllowedMin = timeToMinutes(dayConfig.fin || "18:00");

          if (slotStartMin < workStartMin || slotStartMin > lastSlotAllowedMin) continue;

          // Verificar bloqueos en specialist_overrides
          const isBlocked = (overrides || []).some((b) => {
            const isSameSpecialist = b.specialist_id === sp.id || b.especialista === sp.name;
            if (!isSameSpecialist || b.date !== dateStr) return false;

            const bStartMin = timeToMinutes(b.start_time || "00:00");
            const bEndMin = timeToMinutes(b.end_time || "23:59");
            return slotStartMin < bEndMin && slotEndMin > bStartMin;
          });

          if (isBlocked) continue;

          // Verificar traslape con citas en appointments
          const isOccupied = (existingAppts || []).some((appt) => {
            if (appt.especialista !== sp.name) return false;
            
            const normalizedApptAt = (appt.appointment_at || "").replace(" ", "T");
            const [apptDate, apptTimePart] = normalizedApptAt.split("T");

            if (apptDate !== dateStr) return false;

            const apptStartMin = timeToMinutes(apptTimePart || "00:00");
            const apptDuration = parseInt(appt.duration || "60", 10);
            const apptEndMin = apptStartMin + apptDuration;

            return slotStartMin < apptEndMin && slotEndMin > apptStartMin;
          });

          if (!isOccupied) {
            freeSpecialistsForSlot.push(sp.name);
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
      evaluated_range: {
        from: startDateStr,
        to: endDateStr,
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