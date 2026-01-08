// app/api/bookings/mark-as-paid/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { appointmentId } = payload; 

        if (!supabaseAdmin) {
            return NextResponse.json({
                error: "Error de Configuración: La clave SUPABASE_SERVICE_ROLE_KEY no está configurada o es inválida."
            }, { status: 500 });
        }

        if (!appointmentId) {
            return NextResponse.json({ error: "Falta 'appointmentId' en el payload." }, { status: 400 });
        }

        // 1. Actualizar el estado en la base de datos
        const { error, data } = await supabaseAdmin 
            .from("appointments")
            .update({
                estado: "Cita pagada", 
                updated_at: new Date().toISOString()
            })
            .eq("id", appointmentId)
            .select();

        if (error) {
            console.error("DB Error al marcar como pagada (Admin Client):", error);
            return NextResponse.json({
                error: "Error en la base de datos al actualizar la cita.",
                details: error.message,
            }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({
                error: "No se encontró la cita con el ID proporcionado o no se pudo actualizar.",
                details: `ID: ${appointmentId}`,
            }, { status: 404 });
        }

        const updatedAppointment = data[0];

        // 2. Notificar a n8n para disparar la encuesta de WhatsApp
        if (process.env.N8N_WEBHOOK_URL) {
            try {
                // Usamos AbortController para que la API no se quede colgada si n8n no responde
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); 

                await fetch(process.env.N8N_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ /* tu payload */ }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (webhookError) {
                // Logeamos el error pero NO enviamos un error 500 al cliente
                // Así el pago queda guardado aunque el WhatsApp no se envíe
                console.error("⚠️ Webhook n8n falló, pero el pago se registró:", webhookError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("API Processing Error:", e);
        return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
    }
}