import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
    try {
        const { appointmentId } = await request.json();

        if (!supabaseAdmin) {
            return NextResponse.json({
                error: "Error de Configuración: Admin client no disponible."
            }, { status: 500 });
        }

        if (!appointmentId) {
            return NextResponse.json({ error: "Falta 'appointmentId' en el payload." }, { status: 400 });
        }

        // 1. Buscamos la cita para verificar si pertenece a un grupo (appointment_id)
        const { data: current, error: fetchError } = await supabaseAdmin
            .from("appointments")
            .select("appointment_id")
            .eq("id", appointmentId)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({
                error: "No se encontró la cita con el ID proporcionado.",
                details: fetchError?.message,
            }, { status: 404 });
        }

        const groupId = current.appointment_id;

        // 2. Definimos los datos para revertir el estado
        const updateData = {
            estado: "Nueva reserva creada", // Volvemos al estado inicial
            updated_at: new Date().toISOString() //
        };

        // 3. Ejecutar la actualización (Grupo o Individual)
        // Usamos .or() para filtrar por el UUID de grupo si existe, o por el ID numérico si es una fila antigua
        const { error: updateError, data: updatedRows } = await supabaseAdmin
            .from("appointments")
            .update(updateData)
            .or(groupId ? `appointment_id.eq.${groupId}` : `id.eq.${appointmentId}`)
            .select();

        if (updateError) {
            console.error("DB Error al anular pago:", updateError);
            return NextResponse.json({
                error: "Error en la base de datos al actualizar la cita.",
                details: updateError.message,
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: groupId 
                ? "Pago anulado y grupo de citas restablecido exitosamente." 
                : "Pago anulado y cita restablecida exitosamente.",
            updatedCount: updatedRows?.length || 0 
        });

    } catch (e: any) {
        console.error("API Processing Error (unpay):", e);
        return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
    }
}