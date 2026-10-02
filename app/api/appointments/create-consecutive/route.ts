import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface FlowPayload {
  client_name: string;
  indicative: string;
  phone_number: string;
  full_phone: string;
  selected_services: string; // Puede ser string "lash_point, cejas_sombreado" o array
  selected_specialist: string; // "Cualquier profesional" o nombre de especialista
  selected_sede: string;
  appointment_at: string; // Formato ISO "2026-10-05T09:00:00+00:00"
  flow_token?: string;
}

// Convierte "HH:MM" o timestamp ISO a minutos transcurridos desde medianoche
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanTime = timeStr.trim().split(" ")[0].split("T").pop() || "";
  const parts = cleanTime.substring(0, 5).split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

// Convierte minutos acumulados a formato "HH:MM"
function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hh = hours < 10 ? `0${hours}` : `${hours}`;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hh}:${mm}`;
}

export async function POST(request: NextRequest) {
  try {
    const payload: FlowPayload = await request.json();

    const {
      client_name,
      full_phone,
      selected_services,
      selected_specialist,
      selected_sede,
      appointment_at,
    } = payload;

    if (!selected_services || !appointment_at) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (selected_services, appointment_at)." },
        { status: 400 }
      );
    }

    // 🌸 1. NORMALIZAR LA LISTA DE SERVICIOS SELECCIONADOS
    let servicesList: string[] = [];
    if (Array.isArray(selected_services)) {
      servicesList = selected_services;
    } else if (typeof selected_services === "string") {
      servicesList = selected_services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // 🌸 2. OBTENER INFORMACIÓN DE LOS SERVICIOS Y SUMAR LA DURACIÓN TOTAL
    const { data: dbServices, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .in("SKU", servicesList);

    if (servicesError || !dbServices || dbServices.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron los servicios especificados en la base de datos." },
        { status: 404 }
      );
    }

    const detailedServices = servicesList
      .map((sku) => dbServices.find((s) => s.SKU === sku || s.id === sku))
      .filter(Boolean);

    const totalDurationMinutes = detailedServices.reduce((acc, s) => {
      return acc + (parseInt(s.duracion || "60", 10) || 60);
    }, 0);

    // 🌸 3. DEFINIR VENTANA DE TIEMPO DEL BLOQUE SOLICITADO
    const startDateObj = new Date(appointment_at);
    const dateStr = startDateObj.toISOString().split("T")[0]; // YYYY-MM-DD
    const startMin = startDateObj.getUTCHours() * 60 + startDateObj.getUTCMinutes();
    const endMin = startMin + totalDurationMinutes;

    // 🌸 4. OBTENER ESPECIALISTAS Y FILTRAR HABILITADAS
    const { data: allSpecialists } = await supabase
      .from("app_users")
      .select("id, name, horario_semanal");

    let qualifiedSpecialists = (allSpecialists || []).filter((sp) => {
      return detailedServices.every((srv) => {
        let allowedList: string[] = [];
        if (typeof srv.especialistas === "string") {
          try { allowedList = JSON.parse(srv.especialistas); } catch { allowedList = [srv.especialistas]; }
        } else if (Array.isArray(srv.especialistas)) {
          allowedList = srv.especialistas;
        }
        return allowedList.includes(sp.name);
      });
    });

    const isAnySpecialist =
      !selected_specialist ||
      selected_specialist === "Cualquier profesional" ||
      selected_specialist === "undefined";

    if (!isAnySpecialist) {
      qualifiedSpecialists = qualifiedSpecialists.filter(
        (sp) => sp.name.toLowerCase() === selected_specialist.toLowerCase()
      );
    }

    if (qualifiedSpecialists.length === 0) {
      return NextResponse.json(
        { error: "No hay profesionales capacitadas disponibles para todos los servicios seleccionados." },
        { status: 400 }
      );
    }

    // 🌸 5. CONSULTAR TODAS LAS CITAS DEL DÍA EN LA SEDE
    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("appointment_at, duration, especialista, estado")
      .eq("sede", selected_sede)
      .neq("estado", "Cita cancelada")
      .gte("appointment_at", `${dateStr}T00:00:00`)
      .lte("appointment_at", `${dateStr}T23:59:59`);

    // 🌸 6. EVALUAR DISPONIBILIDAD Y CALCULAR SCORE DE PRIORIZACIÓN
    interface CandidateEvaluation {
      specialistName: string;
      score: number;
      hasApptsToday: boolean;
    }

    const candidateScores: CandidateEvaluation[] = [];

    for (const sp of qualifiedSpecialists) {
      const spAppts = (existingAppts || []).filter(
        (a) => a.especialista === sp.name
      );

      // A) Verificar si existe conflicto horario directo
      const hasConflict = spAppts.some((appt) => {
        const apptStartMin = timeToMinutes(appt.appointment_at);
        const apptDuration = parseInt(appt.duration || "60", 10);
        const apptEndMin = apptStartMin + apptDuration;

        return startMin < apptEndMin && endMin > apptStartMin;
      });

      if (hasConflict) {
        continue; // La especialista no está disponible en este bloque
      }

      // B) Calcular puntaje de prioridad si está disponible
      let score = 0;
      const hasApptsToday = spAppts.length > 0;

      if (hasApptsToday) {
        // Regla 1: Si ya está trabajando hoy, se le asigna prioridad base alta
        score += 10;

        // Regla 2: Bonificación si el horario solicitado se ancla/pega directamente a una cita existente
        const isDirectAnchor = spAppts.some((appt) => {
          const apptStartMin = timeToMinutes(appt.appointment_at);
          const apptDuration = parseInt(appt.duration || "60", 10);
          const apptEndMin = apptStartMin + apptDuration;

          const rightAfter = apptEndMin === startMin; // Cita termina exactamente donde empieza la nueva
          const rightBefore = endMin === apptStartMin; // Cita empieza exactamente donde termina la nueva
          return rightAfter || rightBefore;
        });

        if (isDirectAnchor) {
          score += 15; // Máxima preferencia por continuidad consecutiva sin huecos
        } else {
          // Regla 3: Bonificación si trabaja en la misma jornada (Mañana / Tarde)
          const isMorningSlot = startMin < 13 * 60;
          const hasApptInSameShift = spAppts.some((appt) => {
            const apptStartMin = timeToMinutes(appt.appointment_at);
            return isMorningSlot ? apptStartMin < 13 * 60 : apptStartMin >= 13 * 60;
          });

          if (hasApptInSameShift) {
            score += 5;
          }
        }
      } else {
        // La especialista NO tiene citas hoy.
        // Solo se permite agendar si es inicio de turno para no hacerla viajar en vano a deshoras
        const isStartOfShift = startMin === 9 * 60 || startMin === 14 * 60;
        if (!isStartOfShift) {
          score -= 5; // Penalización para no abrir turnos aislados a mitad de jornada
        }
      }

      candidateScores.push({
        specialistName: sp.name,
        score,
        hasApptsToday,
      });
    }

    if (candidateScores.length === 0) {
      return NextResponse.json(
        {
          error: "No hay disponibilidad consecutiva en el horario seleccionado para la duración requerida (" + totalDurationMinutes + " min).",
          duration_required: totalDurationMinutes,
        },
        { status: 409 }
      );
    }

    // 🌸 7. ORDENAR CANDIDATAS DE MAYOR A MENOR PUNTAJE
    candidateScores.sort((a, b) => b.score - a.score);

    const assignedSpecialistName = candidateScores[0].specialistName;

    // 🌸 8. GUARDAR LAS CITAS CONSECUTIVAS EN LA BASE DE DATOS SUPABASE
    let currentStartMin = startMin;
    const createdAppointments = [];

    for (const srv of detailedServices) {
      const srvDuration = parseInt(srv.duracion || "60", 10);
      const srvStartStr = `${dateStr}T${minutesToTime(currentStartMin)}:00+00:00`;
      const srvEndMin = currentStartMin + srvDuration;
      const srvEndStr = `${dateStr}T${minutesToTime(srvEndMin)}:00+00:00`;

      const newAppt = {
        cliente: client_name || "Sin Nombre",
        servicio: srv.Servicio || srv.nombre,
        sku: srv.SKU || srv.id,
        category: srv.Categoria || srv.category || "General",
        especialista: assignedSpecialistName,
        sede: selected_sede || "Marquetalia",
        full_phone: full_phone,
        appointment_at: srvStartStr,
        finished_at: srvEndStr,
        duration: String(srvDuration),
        price: String(srv.Precio || srv.price || 0),
        price_final: String(srv.Precio || srv.price || 0),
        estado: "Nueva reserva creada",
        created_by: "BOT",
      };

      const { data: inserted, error: insertError } = await supabase
        .from("appointments")
        .insert(newAppt)
        .select()
        .single();

      if (insertError) {
        throw new Error("Error guardando la cita consecutiva: " + insertError.message);
      }

      createdAppointments.push(inserted);
      currentStartMin = srvEndMin;
    }

    return NextResponse.json({
      success: true,
      message: "Citas consecutivas agendadas exitosamente priorizando la especialista activa.",
      assigned_specialist: assignedSpecialistName,
      prioritization_details: {
        score: candidateScores[0].score,
        has_other_appts_today: candidateScores[0].hasApptsToday,
      },
      total_duration_minutes: totalDurationMinutes,
      appointments: createdAppointments,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error creando citas consecutivas:", errorMessage);
    return NextResponse.json(
      { error: "Error interno del servidor", details: errorMessage },
      { status: 500 }
    );
  }
}