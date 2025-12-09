import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();

  // Aquí podrías guardar en las tablas `mensajes` y `n8n_chat_histories`.
  return NextResponse.json({
    received: true,
    via: "incoming",
    echo: payload,
    instructions: "Persistir en Supabase y asociar por numberc / celular",
  });
}
