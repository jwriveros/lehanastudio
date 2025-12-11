// app/api/chat/resolve/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function POST(request: Request) {
    const payload = await request.json();
    const { phoneId } = payload; 

    if (!supabaseAdmin) {
        return NextResponse.json({
            error: "Error de Configuración: La clave SUPABASE_SERVICE_ROLE_KEY no está configurada."
        }, { status: 500 });
    }

    if (!phoneId) {
        return NextResponse.json({ error: "Falta 'phoneId' en el payload." }, { status: 400 });
    }

    try {
        const normalizedPhone = phoneId.replace(/\D/g, ''); 
        const prefixedPhone = `+${normalizedPhone}`;      

        // CORRECCIÓN PRINCIPAL: Eliminamos la cadena .select() y la variable 'count'.
        // Confiamos en el chequeo del objeto 'error' para el éxito/fallo.
        const { error } = await supabaseAdmin 
            .from("chat_sessions")
            .update({
                status: "resolved",
                updated_at: new Date().toISOString()
            })
            // Mantenemos el OR clause para manejar inconsistencias de formato (+57 vs 57)
            .or(`client_phone.eq.${normalizedPhone},client_phone.eq.${prefixedPhone}`); 

        if (error) {
            console.error("DB Error al resolver chat (Admin Client):", error);
            return NextResponse.json({
                error: "Error al actualizar la tabla 'chat_sessions' con privilegios de administrador.",
                details: error.message,
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Estado de chat resuelto exitosamente." });

    } catch (e: any) {
        console.error("API Processing Error:", e);
        return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
    }
}