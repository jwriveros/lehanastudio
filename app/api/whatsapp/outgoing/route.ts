// jwriveros/lehanastudio/lehanastudio-a8a570c007a1557a6ccd13baa5a39a3fe79a534a/app/api/whatsapp/outgoing/route.ts

import { NextResponse } from "next/server";

// URL completa de tu Webhook Saliente en n8n. 
// ¡DEBES REEMPLAZAR ESTE VALOR con la URL activa de tu Webhook de n8n!
const N8N_OUTGOING_WEBHOOK_URL = "https://n8n.srv1151368.hstgr.cloud/webhook/crm-outgoing"; 

export async function POST(request: Request) {
  const payload = await request.json();

  // El payload debe contener { client_phone: "+57...", content: "Mensaje" }

  if (!payload.client_phone || !payload.content) {
    return NextResponse.json({ error: "Datos incompletos para el envío." }, { status: 400 });
  }

  try {
    // Llama al webhook de n8n con los datos del mensaje
    const n8nResponse = await fetch(N8N_OUTGOING_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
        throw new Error(`n8n respondió con estado ${n8nResponse.status}`);
    }

    // Devuelve éxito al frontend del CRM (tu ChatPanel)
    return NextResponse.json({
        received: true,
        status: "SENT_TO_N8N_FOR_DELIVERY",
        instructions: "Mensaje enviado a n8n. La confirmación real se hará vía Realtime.",
        echo: payload,
    });

  } catch (error) {
    console.error("Error al llamar a n8n:", error);
    return NextResponse.json({ error: "Fallo en el flujo de envío (n8n/YCLOUD)." }, { status: 500 });
  }
}