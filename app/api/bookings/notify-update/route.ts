import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { appointmentId } = payload;

    console.log("📩 Payload recibido en API:", payload);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin client no configurado" }, { status: 500 });
    }

    if (!appointmentId) {
      return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
    }

    /* 1. FILTRADO ESTRICTO PARA LA BASE DE DATOS
       Solo extraemos los campos que REALMENTE existen en tu tabla de Supabase.
       Esto evita el error "Could not find the 'action' column".
    */
    const dbUpdateData = {
      cliente: payload.cliente,
      celular: payload.celular,
      indicativo: payload.indicativo,
      servicio: payload.servicio,
      especialista: payload.especialista,
      duration: payload.duration,
      appointment_at: payload.appointment_at,
      estado: payload.estado,
      sede: payload.sede,
      updated_at: new Date().toISOString()
    };

    // Eliminamos campos indefinidos para no sobreescribir con null por error
    Object.keys(dbUpdateData).forEach(key => 
      (dbUpdateData as any)[key] === undefined && delete (dbUpdateData as any)[key]
    );

    // 2. Ejecutar la actualización en Supabase
    const { data: updatedAppointment, error: dbError } = await supabaseAdmin
      .from("appointments")
      .update(dbUpdateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (dbError) {
      console.error("❌ Error real de Supabase:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 3. NOTIFICAR A n8n
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl && updatedAppointment) {
      
      // Normalización de teléfono
      const rawPhone = String(updatedAppointment.celular || "").replace(/\D/g, "");
      const rawIndicativo = String(updatedAppointment.indicativo || "57").replace(/\D/g, "");
      const normalizedPhone = `+${rawIndicativo}${rawPhone}`;

      // Formateo de fecha y hora para el WhatsApp
      const dateObj = new Date(updatedAppointment.appointment_at);
      const fechaEspanol = dateObj.toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
      });
      const horaEspanol = dateObj.toLocaleTimeString("es-CO", {
        hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" 
      }).toUpperCase();

      const n8nPayload = {
        action: updatedAppointment.estado === "Cita cancelada" ? "CANCELLED" : "EDITED",
        customerName: updatedAppointment.cliente,
        customerPhone: normalizedPhone,
        status: updatedAppointment.estado,
        servicio: updatedAppointment.servicio,
        especialista: updatedAppointment.especialista,
        fecha: fechaEspanol,
        hora: horaEspanol,
        sede: updatedAppointment.sede,
        appointmentId: updatedAppointment.id,
      };

      console.log("📤 Enviando limpio a n8n:", n8nPayload);

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n8nPayload),
      });
    }

    return NextResponse.json({ success: true, data: updatedAppointment });

  } catch (error: any) {
    console.error("❌ Error crítico en API:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}