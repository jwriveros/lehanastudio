import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializamos el cliente administrador de Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { id, name, email, role, telefono, color, comision_base, permissions } = payload;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Falta el ID del usuario." },
        { status: 400 }
      );
    }

    // 1. Actualizar la tabla pública app_users (SIN la columna updated_at)
    const { data: updatedUser, error: dbError } = await supabaseAdmin
      .from("app_users")
      .update({
        name,
        email,
        role: role || "ESPECIALISTA",
        telefono,
        color,
        comision_base,
        permissions: typeof permissions === "object" ? JSON.stringify(permissions) : permissions,
      })
      .eq("id", id)
      .select()
      .single();

    if (dbError) {
      console.error("Error actualizando en app_users:", dbError.message);
      return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 });
    }

    // 2. Actualizar metadatos en Supabase Auth
    await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { name, role: role || "ESPECIALISTA" },
    });

    return NextResponse.json({
      ok: true,
      user: updatedUser,
      message: "Usuario actualizado correctamente.",
    });

  } catch (error: any) {
    console.error("Error en API update-user:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}