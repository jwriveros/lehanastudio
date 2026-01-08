import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
    const payload = await request.json();
    const { appointmentId } = payload; 

    if (!supabaseAdmin) {
        return NextResponse.json({
            error: "Error de Configuración: supabaseAdmin no disponible."
        }, { status: 500 });
    }

    if (!appointmentId) {
        return NextResponse.json({ error: "Falta 'appointmentId' en el payload." }, { status: 400 });
    }

    try {
        // 1. Marcar como cancelada en la DB
        const { error, data } = await supabaseAdmin 
            .from("appointments")
            .update({
                estado: "Cita cancelada",
                updated_at: new Date().toISOString()
            })
            .eq("id", appointmentId)
            .select();

        if (error) {
            return NextResponse.json({ error: "Error en DB", details: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
        }

        const updatedAppointment = data[0];

        // 2. Notificar a n8n para avisar al cliente
        if (process.env.N8N_WEBHOOK_URL) {
            const rawPhone = String(updatedAppointment.celular || "").replace(/\D/g, "");
            const normalizedPhone = rawPhone.startsWith("57") ? `+${rawPhone}` : `+57${rawPhone}`;

            try {
                await fetch(process.env.N8N_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "CANCELLED", // Acción para el Switch en n8n
                        customerName: updatedAppointment.cliente,
                        customerPhone: normalizedPhone,
                        servicio: updatedAppointment.servicio,
                        especialista: updatedAppointment.especialista,
                        appointmentId: updatedAppointment.id,
                        fecha: updatedAppointment.appointment_at
                    }),
                });
            } catch (webhookError) {
                console.error("❌ Error enviando a n8n (Cancelación):", webhookError);
            }
        }

        return NextResponse.json({ success: true, message: "Cita cancelada y cliente notificado." });

    } catch (e: any) {
        return NextResponse.json({ error: "Error interno", details: e.message }, { status: 500 });
    }
}