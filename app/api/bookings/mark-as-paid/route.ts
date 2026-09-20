import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        // 1. Extraemos el ID de la cita y la lista de servicios actualizados
        const { appointmentId, serviceUpdates } = payload; 

        // Asignación local para evitar problemas de tipos con Supabase Admin
        const adminClient = supabaseAdmin;

        if (!adminClient) {
            return NextResponse.json({
                error: "Error de Configuración: La clave SUPABASE_SERVICE_ROLE_KEY no está configurada."
            }, { status: 500 });
        }

        if (!appointmentId) {
            return NextResponse.json({ error: "Falta 'appointmentId' en el payload." }, { status: 400 });
        }

        // 2. Procesamiento de actualización con desglose financiero
        if (serviceUpdates && Array.isArray(serviceUpdates)) {
            const updatePromises = serviceUpdates.map(item => {
                // Preparamos los valores financieros recibidos
                const priceBase = item.price !== undefined ? String(item.price) : undefined;
                const descuentoVal = item.descuento !== undefined ? String(item.descuento) : "0";
                const abonoVal = item.abono !== undefined ? String(item.abono) : "0";
                
                // 🎯 CÁLCULO AJUSTADO: Calculamos el Precio Final (Base - Descuento) SIN restar el Abono
                let finalPrice = item.price_final;
                if (finalPrice === undefined && item.price !== undefined) {
                    const base = Number(item.price) || 0;
                    const desc = Number(item.descuento) || 0;
                    const descMonto = base * (desc / 100);
                    
                    // El precio final es el valor con descuento aplicado
                    finalPrice = Math.max(0, base - descMonto);
                }

                return adminClient
                    .from("appointments")
                    .update({ 
                        price: priceBase,
                        descuento: descuentoVal,
                        abono: abonoVal, // Guardamos el abono solo como dato informativo
                        price_final: finalPrice !== undefined ? String(finalPrice) : priceBase,
                        estado: "Cita pagada",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", item.id);
            });
            
            const results = await Promise.all(updatePromises);
            const errors = results.filter(r => r.error);
            
            if (errors.length > 0) {
                console.error("Errores al actualizar cobro de servicios:", errors);
                return NextResponse.json({ error: "Error al actualizar algunos cobros." }, { status: 500 });
            }
        } else {
            // Lógica de respaldo: Actualizar la cita o el grupo completo a "Cita pagada"
            const { data: current } = await adminClient
                .from("appointments")
                .select("appointment_id")
                .eq("id", appointmentId)
                .single();

            const groupId = current?.appointment_id;

            await adminClient
                .from("appointments")
                .update({ 
                    estado: "Cita pagada", 
                    updated_at: new Date().toISOString() 
                })
                .or(groupId ? `appointment_id.eq.${groupId}` : `id.eq.${appointmentId}`);
        }

        // 3. Obtenemos las filas actualizadas para construir la notificación a n8n
        const { data: updatedRows } = await adminClient
            .from("appointments")
            .select("*")
            .eq("id", appointmentId);

        // 4. Notificar al webhook de n8n para enviar la confirmación por WhatsApp
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
                        price_final: mainAppt.price_final, // Refleja el total con descuento
                        abono: mainAppt.abono,              // Muestra el abono registrado
                        descuento: mainAppt.descuento
                    }),
                });
            } catch (webhookError) {
                console.error("⚠️ Webhook n8n falló, pero el pago se registró en la base de datos:", webhookError);
            }
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("API Processing Error (mark-as-paid):", e);
        return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
    }
}