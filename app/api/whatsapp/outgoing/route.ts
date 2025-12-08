import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();

  return NextResponse.json({
    received: true,
    via: "outgoing",
    forward_to_n8n: true,
    instructions:
      "Usa n8n para enviar el mensaje por WhatsApp y guardar el registro en la tabla 'mensajes' con state SENT/DELIVERED.",
    echo: payload,
  });
}
