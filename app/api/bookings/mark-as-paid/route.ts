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
                is_paid: true,
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
            // Normalizar el celular (asegurar formato +57...)
            const rawPhone = String(updatedAppointment.celular || "").replace(/\D/g, "");
            const normalizedPhone = rawPhone.startsWith("57") 
                ? `+${rawPhone}` 
                : `+57${rawPhone}`;

            try {
                // No usamos await aquí si no queremos bloquear la respuesta al cliente, 
                // pero es recomendable para asegurar que n8n reciba los datos.
                await fetch(process.env.N8N_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "PAID", // Acción para el Switch de n8n
                        customerName: updatedAppointment.cliente,
                        customerPhone: normalizedPhone,
                        servicio: updatedAppointment.servicio,
                        especialista: updatedAppointment.especialista,
                        appointmentId: updatedAppointment.id,
                        sede: updatedAppointment.sede
                    }),
                });
                console.log("✅ Notificación de pago enviada a n8n");
            } catch (webhookError) {
                console.error("❌ Error enviando a n8n:", webhookError);
                // Continuamos aunque falle el webhook para no afectar la experiencia del usuario
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: "Cita marcada como pagada exitosamente y notificación enviada." 
        });

    } catch (e: any) {
        console.error("API Processing Error:", e);
        return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
    }
}