import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAppointmentEvent } from "@/lib/calendarEvents";

function addMinutes(dateISO: string, durationText: string | null) {
  const minutes = Number(durationText);

  if (!minutes || isNaN(minutes)) {
    throw new Error("Duración inválida");
  }

  const date = new Date(dateISO);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient(); // 👈 AQUÍ

    const body = await req.json();

    const {
      cliente,
      servicio,
      especialista,
      celular,
      appointment_at,
      duration,
      sede,
      cantidad,
    } = body;

    // 1️⃣ Insertar cita
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        cliente,
        servicio,
        especialista,
        celular,
        appointment_at,
        duration,
        sede,
        cantidad,
        estado: "Confirmada",
      })
      .select()
      .single();

    if (error) throw error;

    // 2️⃣ Calcular hora final
    const endTime = addMinutes(
      appointment.appointment_at,
      appointment.duration
    );

    // 3️⃣ Crear evento en Google Calendar
    const googleEventId = await createAppointmentEvent({
      title: `Cita – ${appointment.servicio}`,
      start: appointment.appointment_at,
      end: endTime,
      specialist: appointment.especialista,
    });

    // 4️⃣ Guardar google_event_id
    await supabase
      .from("appointments")
      .update({ google_event_id: googleEventId })
      .eq("id", appointment.id);

    return NextResponse.json({
      ok: true,
      appointmentId: appointment.id,
      googleEventId,
    });
  } catch (err: any) {
    console.error("CREATE BOOKING ERROR:", err);

    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
