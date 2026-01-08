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

        // 1. Revertir el estado en la base de datos
        const { error, data } = await supabaseAdmin 
            .from("appointments")
            .update({
                estado: "Nueva reserva creada", // Volvemos al estado inicial
                updated_at: new Date().toISOString()
            })
            .eq("id", appointmentId)
            .select();

        if (error) {
            return NextResponse.json({
                error: "Error al actualizar la base de datos.",
                details: error.message,
            }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
        }

        // 2. Opcional: Notificar a n8n de la anulación si fuera necesario
        // Aquí podrías enviar un webhook diferente si quieres cancelar la encuesta

        return NextResponse.json({ 
            success: true, 
            message: "Pago anulado y cita restablecida exitosamente." 
        });

    } catch (e: any) {
        return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
    }
}