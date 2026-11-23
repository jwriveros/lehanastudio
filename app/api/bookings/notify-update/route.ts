import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      appointmentId,
      notifyOnEdit,
      // Nuevos parámetros opcionales para cuando se actualizan múltiples servicios juntos
      isMultiple = false,
      totalServicesCount = 1,
      skipWebhook = false, // Permite actualizar en BD cada fila pero disparar webhook solo 1 vez
      servicesList = [],   // Array con { servicio, hora, especialista } de todos los servicios
      firstAppointmentAt,
    } = payload;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Admin client no configurado" }, { status: 500 });
    }

    if (!appointmentId) {
      return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
    }

    /* 1. FILTRADO DE CAMPOS PARA LA BASE DE DATOS */
    const dbUpdateData: Record<string, any> = {
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
      updated_at: new Date().toISOString(),
    };

    Object.keys(dbUpdateData).forEach(
      (key) => dbUpdateData[key] === undefined && delete dbUpdateData[key]
    );

    // 2. Ejecutar la actualización en Supabase
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

    // 3. NOTIFICAR A n8n SOLO SI ESTÁ ACTIVO Y NO ESTÁ MARCADO COMO skipWebhook
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (notifyOnEdit && !skipWebhook && webhookUrl && updatedAppointment) {
      const rawPhone = String(updatedAppointment.celular || "").replace(/\D/g, "");
      const rawIndicativo = String(updatedAppointment.indicativo || "57").replace(/\D/g, "");
      const normalizedPhone = `+${rawIndicativo}${rawPhone}`;
      const referenceDateStr = firstAppointmentAt || updatedAppointment.appointment_at;
      const dateObj = new Date(referenceDateStr);
      const soloFechaEspanol = dateObj.toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });

      const horaInicialEspanol = dateObj
        .toLocaleTimeString("es-CO", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "UTC",
        })
        .toUpperCase();

      // 👈 Combinamos fecha y hora inicial en un solo string legible
      const fechaConHoraEspanol = `${soloFechaEspanol} a las ${horaInicialEspanol}`;

      // Determinamos si es actualización múltiple (> 1 servicio)
      const hasMultipleServices = isMultiple || totalServicesCount > 1 || servicesList.length > 1;

      // Construimos el resumen en una sola línea (requerido por variables HSM de WhatsApp)
      const detalleServicios =
        servicesList.length > 0
          ? servicesList
              .map((s: any) => `• ${s.servicio} (${s.hora}${s.especialista ? ` - ${s.especialista}` : ""})`)
              .join(" | ")
          : `• ${updatedAppointment.servicio} (${horaInicialEspanol})`;

      let actionType = "EDITED";
      if (updatedAppointment.estado === "Cita cancelada") {
        actionType = "CANCELLED";
      } else if (hasMultipleServices) {
        actionType = "EDITED_MULTIPLE";
      }

      const n8nPayload = {
        action: actionType,
        customerName: updatedAppointment.cliente,
        customerPhone: normalizedPhone,
        status: updatedAppointment.estado,
        servicio: updatedAppointment.servicio,
        detalleServicios, // 👈 Variable {{3}} para el HSM múltiple
        totalServicios: Math.max(totalServicesCount, servicesList.length, 1),
        especialista: updatedAppointment.especialista,
        fecha: fechaConHoraEspanol, // 👈 Ahora envía "lunes, 23 de noviembre de 2026 a las 10:00 AM"
        hora: horaInicialEspanol,
        sede: updatedAppointment.sede,
        appointmentId: updatedAppointment.id,
      };

      console.log(`📤 Enviando notificación (${actionType}) a n8n:`, n8nPayload);

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