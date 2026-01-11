// [app/api/bookings/notify-update/route.ts]
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { appointmentId, updates } = payload;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin client no configurado" }, { status: 500 });
    }

    // 1. Actualizar en Supabase (Solo campos permitidos)
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

    // 2. Notificar a n8n
    if (process.env.N8N_WEBHOOK_URL && updatedAppointment) {
      // ✅ Lógica multi-país
      const rawPhone = String(updatedAppointment.celular || "").replace(/\D/g, "");
      const rawIndicativo = String(updatedAppointment.indicativo || "57").replace(/\D/g, "");
      const normalizedPhone = `+${rawIndicativo}${rawPhone}`;

      try {
        const dateObj = new Date(updatedAppointment.appointment_at);

        const fechaEspanol = dateObj.toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC" // Mantener consistencia con la hora
        });

        const horaEspanol = dateObj.toLocaleTimeString("es-CO", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC" 
        }).toUpperCase();

        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: updates.estado === "Cita cancelada" ? "CANCELLED" : "EDITED", // Dinámico
            customerName: updatedAppointment.cliente,
            customerPhone: normalizedPhone,
            status: updatedAppointment.estado,
            servicio: updatedAppointment.servicio,
            especialista: updatedAppointment.especialista,
            fecha: fechaEspanol,
            hora: horaEspanol,
            sede: updatedAppointment.sede,
            appointmentId: updatedAppointment.id,
          }),
        });
      } catch (webhookError) {
        console.error("⚠️ Error en n8n, pero DB actualizada.");
      }
    }

    return NextResponse.json({ success: true, data: updatedAppointment });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}