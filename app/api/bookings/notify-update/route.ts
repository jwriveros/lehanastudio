import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { appointmentId, notifyOnEdit } = payload; // 👈 1. Extraemos la variable del interruptor

    console.log("📩 Payload recibido en API:", payload);

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin client no configurado" }, { status: 500 });
    }

    if (!appointmentId) {
      return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
    }

    /* 2. FILTRADO DE CAMPOS PARA LA BASE DE DATOS */
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
      price: payload.price,
      descuento: payload.descuento,
      price_final: payload.price_final,
      abono: payload.abono,
      updated_at: new Date().toISOString()
    };

    // Eliminamos campos indefinidos
    Object.keys(dbUpdateData).forEach(key => 
      (dbUpdateData as any)[key] === undefined && delete (dbUpdateData as any)[key]
    );

    // 3. Ejecutar la actualización siempre en Supabase
    const { data: updatedAppointment, error: dbError } = await supabaseAdmin
      .from("appointments")
      .update(dbUpdateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (dbError) {
      console.error("❌ Error en Supabase:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 🎯 4. NOTIFICAR A n8n ÚNICAMENTE SI EL USUARIO TIENE 'notifyOnEdit' EN TRUE
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (notifyOnEdit && webhookUrl && updatedAppointment) { // 👈 Condicional controlado
      
      const rawPhone = String(updatedAppointment.celular || "").replace(/\D/g, "");
      const rawIndicativo = String(updatedAppointment.indicativo || "57").replace(/\D/g, "");
      const normalizedPhone = `+${rawIndicativo}${rawPhone}`;

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

      console.log("📤 Enviando notificación opcional a n8n:", n8nPayload);

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(n8nPayload),
      });
    } else {
      console.log("🤫 Notificación desactivada por el usuario o falta Webhook URL. Se actualizó solo en base de datos.");
    }

    return NextResponse.json({ success: true, data: updatedAppointment });

  } catch (error: any) {
    console.error("❌ Error crítico en API:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}