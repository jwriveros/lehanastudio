import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
    try {
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

        // 1. Buscamos la cita para verificar si pertenece a un grupo (appointment_id)
        const { data: current, error: fetchError } = await supabaseAdmin
            .from("appointments")
            .select("appointment_id, cliente, celular, servicio, especialista, appointment_at, indicativo")
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
            estado: "Cita cancelada",
            updated_at: new Date().toISOString()
        };

        // 3. Ejecutar la actualización (Grupo o Individual)
        // Usamos .or() para filtrar por el UUID de grupo si existe, o por el ID numérico si es una fila antigua
        const { error: updateError, data: updatedRows } = await supabaseAdmin
            .from("appointments")
            .update(updateData)
            .or(groupId ? `appointment_id.eq.${groupId}` : `id.eq.${appointmentId}`)
            .select();

        if (updateError) {
            console.error("DB Error al cancelar (Admin Client):", updateError);
            return NextResponse.json({ 
                error: "Error en DB", 
                details: updateError.message 
            }, { status: 500 });
        }

        // 4. Notificar a n8n para avisar al cliente
        if (process.env.N8N_WEBHOOK_URL && updatedRows && updatedRows.length > 0) {
            try {
                // Usamos los datos de la primera fila actualizada para la notificación
                const mainAppt = updatedRows[0];
                const rawPhone = String(mainAppt.celular || "").replace(/\D/g, "");
                const rawIndicativo = String(mainAppt.indicativo || "57").replace(/\D/g, "");
                const fullPhone = `+${rawIndicativo}${rawPhone}`;

                await fetch(process.env.N8N_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "CANCELLED",
                        customerName: mainAppt.cliente,
                        customerPhone: fullPhone,
                        servicio: mainAppt.servicio,
                        especialista: mainAppt.especialista,
                        appointmentId: mainAppt.id,
                        groupId: mainAppt.appointment_id,
                        fecha: mainAppt.appointment_at
                    }),
                });
            } catch (webhookError) {
                console.error("❌ Error enviando a n8n (Cancelación):", webhookError);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: groupId 
                ? "Grupo de citas cancelado y cliente notificado." 
                : "Cita cancelada y cliente notificado.",
            updatedCount: updatedRows?.length || 0
        });

    } catch (e: any) {
        console.error("API Processing Error (cancel):", e);
        return NextResponse.json({ error: "Error interno", details: e.message }, { status: 500 });
    }
}