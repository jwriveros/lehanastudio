import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        // 1. Extraemos el ID y el arreglo de actualizaciones de precios
        const { appointmentId, serviceUpdates } = payload; 

        // ASIGNACIÓN LOCAL PARA TS NARROWING
        const adminClient = supabaseAdmin;

        if (!adminClient) {
            return NextResponse.json({
                error: "Error de Configuración: La clave SUPABASE_SERVICE_ROLE_KEY no está configurada."
            }, { status: 500 });
        }

        if (!appointmentId) {
            return NextResponse.json({ error: "Falta 'appointmentId' en el payload." }, { status: 400 });
        }

        // 2. Si vienen actualizaciones de precios, las procesamos una por una usando adminClient
        if (serviceUpdates && Array.isArray(serviceUpdates)) {
            const updatePromises = serviceUpdates.map(item => 
                adminClient
                    .from("appointments")
                    .update({ 
                        price: Number(item.price), 
                        estado: "Cita pagada",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", item.id)
            );
            
            const results = await Promise.all(updatePromises);
            const errors = results.filter(r => r.error);
            
            if (errors.length > 0) {
                console.error("Errores al actualizar precios:", errors);
                return NextResponse.json({ error: "Error al actualizar algunos precios." }, { status: 500 });
            }
        } else {
            // Lógica de respaldo: Si no hay lista de precios, buscamos la cita para el grupo
            const { data: current } = await adminClient
                .from("appointments")
                .select("appointment_id")
                .eq("id", appointmentId)
                .single();

            const groupId = current?.appointment_id;

            await adminClient
                .from("appointments")
                .update({ estado: "Cita pagada", updated_at: new Date().toISOString() })
                .or(groupId ? `appointment_id.eq.${groupId}` : `id.eq.${appointmentId}`);
        }

        // 3. Obtenemos las filas actualizadas para la notificación
        const { data: updatedRows } = await adminClient
            .from("appointments")
            .select("*")
            .eq("id", appointmentId);

        // 4. Notificar a n8n
        if (process.env.N8N_WEBHOOK_URL && updatedRows && updatedRows.length > 0) {
            try {
                const mainAppt = updatedRows[0];
                const rawPhone = String(mainAppt.celular || "").replace(/\D/g, "");
                const normalizedPhone = rawPhone.startsWith("57") ? `+${rawPhone}` : `+57${rawPhone}`;

                await fetch(process.env.N8N_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        action: "PAID",
                        appointmentId: mainAppt.id,
                        customerName: mainAppt.cliente,
                        customerPhone: normalizedPhone,
                        servicio: mainAppt.servicio,
                        groupId: mainAppt.appointment_id,
                        appointment_at: mainAppt.appointment_at,
                    }),
                });
            } catch (webhookError) {
                console.error("⚠️ Webhook n8n falló, pero el pago se registró:", webhookError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("API Processing Error:", e);
        return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
    }
}