// app/api/bookings/cancel/route.ts
console.log("🧪 SERVICE ROLE LOCAL:", process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("🧪 SERVICE ROLE PRESENT:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);


import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
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

    try {
        // Usamos supabaseAdmin para garantizar que la cita se marque como cancelada
        const { error, data } = await supabaseAdmin 
            .from("appointments")
            .update({
                estado: "Cita cancelada", 
                updated_at: new Date().toISOString()
            })
            .eq("id", appointmentId)
            .select(); // Devolvemos el registro para confirmar la actualización

        if (error) {
            console.error("DB Error al cancelar cita (Admin Client):", error);
            return NextResponse.json({
                error: "Error en la base de datos al actualizar la cita.",
                details: error.message,
            }, { status: 500 });
        }

        // Comprobamos si se actualizó alguna fila
        if (!data || data.length === 0) {
            return NextResponse.json({
                error: "No se encontró la cita con el ID proporcionado o no se pudo actualizar.",
                details: `ID: ${appointmentId}`,
            }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Cita cancelada exitosamente." });

    } catch (e: any) {
        console.error("API Processing Error:", e);
        return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
    }
}