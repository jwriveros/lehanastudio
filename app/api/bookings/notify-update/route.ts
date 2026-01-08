import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { appointmentId, updates } = payload; // 'updates' contiene los campos a cambiar

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin client no configurado" }, { status: 500 });
    }

    // 1. Actualizar en Supabase
    const { data: updatedAppointment, error } = await supabaseAdmin
      .from("appointments")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw error;

    // 2. Notificar a n8n del cambio
    if (process.env.N8N_WEBHOOK_URL && updatedAppointment) {
      const rawPhone = String(updatedAppointment.celular || "").replace(/\D/g, "");
      const normalizedPhone = rawPhone.startsWith("57") ? `+${rawPhone}` : `+57${rawPhone}`;

      try {
        // 1. Convertimos la fecha técnica a un objeto de JavaScript
          const dateObj = new Date(updatedAppointment.appointment_at);

          // 2. Creamos la fecha en formato: "jueves, 8 de enero de 2026"
          const fechaEspanol = dateObj.toLocaleDateString("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });

          // 3. Creamos la hora en formato: "3:30 PM"
          const horaEspanol = dateObj.toLocaleTimeString("es-CO", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "UTC" // Esto garantiza que el "07:00" se mantenga como "7:00 AM"
          }).toUpperCase();

          // 4. Enviamos el fetch actualizado
          await fetch(process.env.N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "EDITED",
              customerName: updatedAppointment.cliente,
              customerPhone: normalizedPhone,
              status: updatedAppointment.estado,
              servicio: updatedAppointment.servicio,
              especialista: updatedAppointment.especialista,
              fecha: fechaEspanol, // Envía el texto listo para n8n
              hora: horaEspanol,   // Envía el texto listo para n8n
              sede: updatedAppointment.sede,
              appointmentId: updatedAppointment.id,
            }),
          });
      } catch (webhookError) {
        console.error("⚠️ Webhook n8n falló, pero la cita se actualizó.");
      }
    }

    return NextResponse.json({ success: true, data: updatedAppointment });

  } catch (error: any) {
    console.error("Error en update API:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}