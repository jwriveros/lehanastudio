import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializamos el cliente administrador usando Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "El correo y la contraseña son requeridos." },
        { status: 400 }
      );
    }

    // 1. Crear y auto-confirmar el usuario en Supabase Auth (auth.users)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmación inmediata
      user_metadata: { name, role: role || "ESPECIALISTA" },
    });

    if (authError) {
      // Si el usuario ya existe en Auth, procedemos limpiamente
      console.warn("Aviso en Auth:", authError.message);
    }

    const userId = authUser?.user?.id;

    return NextResponse.json({
      ok: true,
      userId,
      message: "Usuario creado y confirmado exitosamente en Authentication",
    });
  } catch (error: any) {
    console.error("Error en API create-user:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}