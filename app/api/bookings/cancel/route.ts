import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        // Recibimos 'estado' opcionalmente. Si no viene, usamos "Cita cancelada"
        const { appointmentId, estado } = payload; 

        const targetStatus = estado || "Cita cancelada";

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

        // 2. Definimos los datos de actualización dinámicamente con el estado recibido
        const updateData = {
            estado: targetStatus,
            updated_at: new Date().toISOString()
        };

        // 3. Ejecutar la actualización (Grupo o Individual)
        const { error: updateError, data: updatedRows } = await supabaseAdmin
            .from("appointments")
            .update(updateData)
            .or(groupId ? `appointment_id.eq.${groupId}` : `id.eq.${appointmentId}`)
            .select();

        if (updateError) {
            console.error("DB Error al actualizar estado (Admin Client):", updateError);
            return NextResponse.json({ 
                error: "Error en DB", 
                details: updateError.message 
            }, { status: 500 });
        }

        // 4. Notificar a n8n para avisar al cliente
        if (process.env.N8N_WEBHOOK_URL && updatedRows && updatedRows.length > 0) {
            try {
                const mainAppt = updatedRows[0];
                const rawPhone = String(mainAppt.celular || "").replace(/\D/g, "");
                const rawIndicativo = String(mainAppt.indicativo || "57").replace(/\D/g, "");
                const fullPhone = `+${rawIndicativo}${rawPhone}`;

                await fetch(process.env.N8N_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "STATUS_CHANGED", // Notificamos el cambio de estado
                        nuevoEstado: targetStatus,
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
                console.error("❌ Error enviando a n8n:", webhookError);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: groupId 
                ? `Grupo de citas actualizado a '${targetStatus}' y cliente notificado.` 
                : `Cita actualizada a '${targetStatus}' y cliente notificado.`,
            updatedCount: updatedRows?.length || 0
        });

    } catch (e: any) {
        console.error("API Processing Error (cancel):", e);
        return NextResponse.json({ error: "Error interno", details: e.message }, { status: 500 });
    }
}