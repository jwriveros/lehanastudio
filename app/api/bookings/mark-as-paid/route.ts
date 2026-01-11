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

        // 1. Buscamos la cita para verificar si pertenece a un grupo
        const { data: current, error: fetchError } = await supabaseAdmin
            .from("appointments")
            .select("appointment_id, cliente, celular, servicio")
            .eq("id", appointmentId)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({
                error: "No se encontró la cita con el ID proporcionado.",
                details: fetchError?.message,
            }, { status: 404 });
        }

        const groupId = current.appointment_id;

        // 2. Definimos los datos de actualización
        const updateData = {
            estado: "Cita pagada", 
            updated_at: new Date().toISOString()
        };

        // 3. Ejecutar la actualización (Grupo o Individual)
        // Si hay groupId usamos ese filtro, si no, usamos el id individual (compatibilidad con filas viejas)
        const { error: updateError, data: updatedRows } = await supabaseAdmin
            .from("appointments")
            .update(updateData)
            .or(groupId ? `appointment_id.eq.${groupId}` : `id.eq.${appointmentId}`)
            .select();

        if (updateError) {
            console.error("DB Error al marcar como pagada:", updateError);
            return NextResponse.json({
                error: "Error en la base de datos al actualizar.",
                details: updateError.message,
            }, { status: 500 });
        }

        // 4. Notificar a n8n para disparar la encuesta de WhatsApp
        if (process.env.N8N_WEBHOOK_URL && updatedRows && updatedRows.length > 0) {
            try {
                // Usamos los datos de la primera fila actualizada para la notificación
                const mainAppt = updatedRows[0];
                const rawPhone = String(mainAppt.celular || "").replace(/\D/g, "");
                const normalizedPhone = rawPhone.startsWith("57") ? `+${rawPhone}` : `+57${rawPhone}`;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); 

                await fetch(process.env.N8N_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        action: "PAID",
                        appointmentId: mainAppt.id,
                        customerName: mainAppt.cliente,
                        customerPhone: normalizedPhone,
                        servicio: mainAppt.servicio,
                        groupId: mainAppt.appointment_id
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (webhookError) {
                console.error("⚠️ Webhook n8n falló, pero el pago se registró:", webhookError);
            }
        }

        return NextResponse.json({ 
            success: true, 
            updatedCount: updatedRows?.length || 0 
        });

    } catch (e: any) {
        console.error("API Processing Error:", e);
        return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
    }
}