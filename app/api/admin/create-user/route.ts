import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializamos el cliente administrador exigiendo el Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    // Validamos los campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "El correo y la contraseña son requeridos." },
        { status: 400 }
      );
    }

    const assignedRole = role || "ESPECIALISTA";

    // 1. Crear y auto-confirmar el usuario en Supabase Auth (auth.users)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmación inmediata
      user_metadata: { name, role: assignedRole },
    });

    if (authError) {
      console.warn("Aviso al crear en Auth:", authError.message);
      return NextResponse.json(
        { ok: false, error: `Error en Authentication: ${authError.message}` },
        { status: 400 }
      );
    }

    const userId = authUser?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "No se pudo obtener el ID del usuario creado." },
        { status: 500 }
      );
    }

    // 2. Sincronizar el usuario en la tabla pública app_users con su rol correspondiente (MARKETING, ESPECIALISTA, ADMIN)
    const { error: dbError } = await supabaseAdmin
      .from("app_users")
      .upsert({
        id: userId,
        name: name || email,
        email: email,
        role: assignedRole,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Error guardando en app_users:", dbError.message);
      return NextResponse.json(
        { ok: false, error: `Usuario creado en Auth, pero falló en la BD: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      userId,
      role: assignedRole,
      message: "Usuario registrado y sincronizado exitosamente con el rol asignado.",
    });

  } catch (error: any) {
    console.error("Error en API create-user:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}