import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface FlowPayload {
  client_name?: string;
  indicative?: string;
  phone_number?: string;
  full_phone?: string;
  selected_services?: string | string[];
  selected_specialist?: string;
  selected_sede?: string;
  appointment_at?: string;
  flow_token?: string;
}

// Convierte "HH:MM" o cadenas ISO a minutos transcurridos desde medianoche
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
      indicative,
      phone_number,
      selected_services,
      selected_specialist,
      selected_sede,
      appointment_at,
    } = payload;

    // 🌸 1. VALIDACIÓN DEFENSIVA DE ENTRADA
    if (!selected_services) {
      return NextResponse.json(
        { error: "El parámetro 'selected_services' es requerido." },
        { status: 400 }
      );
    }

    if (!appointment_at) {
      return NextResponse.json(
        { error: "El parámetro 'appointment_at' es requerido." },
        { status: 400 }
      );
    }

    // 🌸 2. NORMALIZAR LISTA DE SERVICIOS
    let servicesList: string[] = [];
    if (Array.isArray(selected_services)) {
      servicesList = selected_services;
    } else if (typeof selected_services === "string") {
      servicesList = selected_services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // 🌸 3. CONSULTAR TABLA DE SERVICIOS EN SUPABASE
    const { data: dbServices, error: servicesError } = await supabase
      .from("services")
      .select("*");

    if (servicesError) {
      return NextResponse.json(
        { error: "Error consultando la tabla 'services': " + servicesError.message },
        { status: 500 }
      );
    }

    const detailedServices = servicesList
      .map((item) =>
        (dbServices || []).find(
          (s) =>
            s.SKU === item ||
            s.id === item ||
            s.Servicio?.toLowerCase() === item.toLowerCase()
        )
      )
      .filter(Boolean);

    if (detailedServices.length === 0) {
      return NextResponse.json(
        {
          error: "No se encontraron los servicios especificados en la base de datos.",
          servicios_solicitados: servicesList,
        },
        { status: 404 }
      );
    }

    const totalDurationMinutes = detailedServices.reduce((acc, s) => {
      return acc + (parseInt(s.duracion || "60", 10) || 60);
    }, 0);

    // 🌸 4. VALIDAR Y CALCULAR FECHA/HORA
    const startDateObj = new Date(appointment_at);
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json(
        { error: "El formato de fecha en 'appointment_at' no es válido." },
        { status: 400 }
      );
    }

    const dateStr = startDateObj.toISOString().split("T")[0];
    const startMin = startDateObj.getUTCHours() * 60 + startDateObj.getUTCMinutes();

    // 🌸 5. OBTENER ESPECIALISTAS
    const { data: allSpecialists, error: specError } = await supabase
      .from("app_users")
      .select("id, name, horario_semanal");

    if (specError) {
      return NextResponse.json(
        { error: "Error consultando la tabla 'app_users': " + specError.message },
        { status: 500 }
      );
    }

    let qualifiedSpecialists = (allSpecialists || []).filter((sp) => {
      return detailedServices.every((srv) => {
        let allowedList: string[] = [];
        if (typeof srv.especialistas === "string") {
          try {
            allowedList = JSON.parse(srv.especialistas);
          } catch {
            allowedList = [srv.especialistas];
          }
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

    const assignedSpecialistName =
      qualifiedSpecialists[0]?.name || allSpecialists?.[0]?.name || "Nary Cabrales";

    // 🌸 6. INSERTAR CITAS CONSECUTIVAS EN SUPABASE
    let currentStartMin = startMin;
    const createdAppointments = [];

    // Limpieza de datos de teléfono para las columnas fuente
    const cleanCelular = (phone_number || "").replace(/\D/g, "");
    const cleanIndicativo = parseInt((indicative || "57").replace(/\D/g, ""), 10) || 57;

    for (const srv of detailedServices) {
      const srvDuration = parseInt(srv.duracion || "60", 10);
      const srvStartStr = `${dateStr} ${minutesToTime(currentStartMin)}:00+00`;
      const srvEndMin = currentStartMin + srvDuration;
      const srvEndStr = `${dateStr} ${minutesToTime(srvEndMin)}:00`;

      // 🚨 IMPORTANTE: Se elimina "full_phone" de la inserción ya que es una columna generada automáticamente por Supabase
      const newAppt = {
        cliente: client_name || "Sin Nombre",
        servicio: srv.Servicio || srv.nombre,
        sku: srv.SKU || srv.id,
        category: srv.Categoria || srv.category || "General",
        especialista: assignedSpecialistName,
        sede: selected_sede || "Marquetalia",
        celular: cleanCelular,
        indicativo: cleanIndicativo,
        appointment_at: srvStartStr,
        finished_at: srvEndStr,
        duration: String(srvDuration),
        price: String(srv.Precio || srv.price || 0),
        price_final: String(srv.Precio || srv.price || 0),
        descuento: "0",
        estado: "Nueva reserva creada",
        created_by: "BOT",
        is_primary_client: true,
        primary_client_name: client_name || "Sin Nombre",
        survey: false,
        dia: "false",
        "48h": "false",
        retoque: false,
        retoque_enviado: false,
        interes: "false",
      };

      const { data: inserted, error: insertError } = await supabase
        .from("appointments")
        .insert(newAppt)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: "Error al guardar en Supabase: " + insertError.message },
          { status: 500 }
        );
      }

      createdAppointments.push(inserted);
      currentStartMin = srvEndMin;
    }

    return NextResponse.json({
      success: true,
      message: "Citas consecutivas agendadas con éxito.",
      assigned_specialist: assignedSpecialistName,
      total_duration_minutes: totalDurationMinutes,
      appointments: createdAppointments,
    });
  } catch (error: any) {
    console.error("Error crítico en la API de agendamiento:", error);
    return NextResponse.json(
      {
        error: "Error en el procesamiento del servidor.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}