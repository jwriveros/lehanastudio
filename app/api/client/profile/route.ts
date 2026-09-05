import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Convierte horas HH:MM a minutos transcurridos desde medianoche
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
  
  // Parámetro universal 'q' o parámetros de respaldo
  const query = searchParams.get("q") || searchParams.get("phone") || searchParams.get("bsuid");

  if (!query) {
    return NextResponse.json(
      { ok: false, error: "Se requiere el parámetro 'q', 'phone' o 'bsuid' para realizar la búsqueda." },
      { status: 400 }
    );
  }

  try {
    const rawSearch = query.trim();
    const cleanPhone = rawSearch.replace(/\D/g, "");

    let clientData: any = null;

    /* =========================================================
       1️⃣ BÚSQUEDA INTELIGENTE EN LA TABLA CLIENTS
    ========================================================= */
    // Si la entrada contiene números (teléfono de 7 a 15 dígitos), buscamos por celular/teléfono primero
    if (cleanPhone.length >= 7) {
      const { data: phoneMatch } = await supabase
        .from("clients")
        .select("*")
        .or(`celular.eq.${cleanPhone},telefono.eq.${cleanPhone}`)
        .limit(1)
        .maybeSingle();

      clientData = phoneMatch;
    }

    // Si no se encontró por teléfono o el query es un BSUID (texto alfanumérico)
    if (!clientData) {
      try {
        const { data: bsuidMatch } = await supabase
          .from("clients")
          .select("*")
          .eq("bsuid", rawSearch)
          .limit(1)
          .maybeSingle();

        clientData = bsuidMatch;
      } catch (e) {
        // En caso de que la columna bsuid aún no exista en Supabase, no romperá la API
        console.warn("Columna bsuid no encontrada en la tabla clients.");
      }
    }

    const targetPhone = clientData?.celular || clientData?.telefono || (cleanPhone.length >= 7 ? cleanPhone : null);

    /* =========================================================
       2️⃣ BUSCAR HISTORIAL DE CITAS EN APPOINTMENTS
    ========================================================= */
    let appointments: any[] = [];

    if (targetPhone) {
      const { data: apptsData, error: apptsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("celular", targetPhone)
        .order("appointment_at", { ascending: false });

      if (apptsError) throw apptsError;
      appointments = apptsData || [];
    }

    /* =========================================================
       3️⃣ CÁLCULO DE PREFERENCIAS E INDICADORES PARA EL BOT
    ========================================================= */
    const now = new Date().toISOString();

    const upcomingAppointments = appointments.filter(
      (a) => a.appointment_at >= now && a.estado !== "Cita cancelada"
    );
    const pastAppointments = appointments.filter(
      (a) => a.appointment_at < now || a.estado === "Finalizada"
    );

    const specialistCount: Record<string, number> = {};
    const serviceCount: Record<string, number> = {};
    let morningCount = 0;
    let afternoonCount = 0;
    const hourFrequency: Record<string, number> = {};
    let totalSpent = 0;

    appointments.forEach((appt) => {
      if (appt.estado !== "Cita cancelada" && appt.price) {
        totalSpent += Number(appt.price) || 0;
      }

      if (appt.especialista) {
        specialistCount[appt.especialista] = (specialistCount[appt.especialista] || 0) + 1;
      }

      if (appt.servicio) {
        serviceCount[appt.servicio] = (serviceCount[appt.servicio] || 0) + 1;
      }

      if (appt.appointment_at) {
        const timePart = appt.appointment_at.split("T")[1] || "";
        const minutes = timeToMinutes(timePart);
        const hourStr = timePart.substring(0, 5);

        if (minutes < 12 * 60) {
          morningCount++;
        } else {
          afternoonCount++;
        }

        if (hourStr) {
          hourFrequency[hourStr] = (hourFrequency[hourStr] || 0) + 1;
        }
      }
    });

    const getTopKey = (map: Record<string, number>): string => {
      let topKey = "Sin preferencia";
      let maxCount = 0;
      for (const [key, count] of Object.entries(map)) {
        if (count > maxCount) {
          maxCount = count;
          topKey = key;
        }
      }
      return topKey;
    };

    const preferredSpecialist = getTopKey(specialistCount);
    const favoriteService = getTopKey(serviceCount);
    const preferredHour = getTopKey(hourFrequency);

    let preferredJornada = "Sin preferencia";
    if (morningCount > afternoonCount) preferredJornada = "Mañana";
    if (afternoonCount > morningCount) preferredJornada = "Tarde";

    const lastAppointment = pastAppointments.length > 0 ? pastAppointments[0] : null;

    /* =========================================================
       4️⃣ RESPUESTA JSON ESTRUCTURADA
    ========================================================= */
    return NextResponse.json({
      ok: true,
      search_query: rawSearch,
      client: {
        id: clientData?.id || null,
        bsuid: clientData?.bsuid || (rawSearch.includes("_") ? rawSearch : null),
        nombre: clientData?.nombre || "Cliente Nuevo",
        celular: targetPhone || null,
        correo: clientData?.correo_electronico || null,
        municipio: clientData?.municipio || null,
        direccion: clientData?.direccion || null,
        genero: clientData?.genero || null,
        sede_frecuente: clientData?.sede || appointments[0]?.sede || "Marquetalia",
        tipo_cliente: appointments.length > 0 ? "Recurrente" : "Nuevo",
      },
      preferences: {
        especialista_preferida: preferredSpecialist,
        jornada_preferida: preferredJornada,
        hora_preferida: preferredHour,
        servicio_favorito: favoriteService,
      },
      metrics: {
        total_citas_historicas: appointments.length,
        citas_proximas_count: upcomingAppointments.length,
        total_invertido_cop: totalSpent,
        ultima_visita_fecha: lastAppointment ? lastAppointment.appointment_at : null,
      },
      appointments: {
        proximas: upcomingAppointments,
        historial_completo: appointments,
      },
    });
  } catch (error: any) {
    console.error("GET CLIENT PROFILE ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Error consultando el perfil del cliente.", details: error.message },
      { status: 500 }
    );
  }
}