import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase con rol de servicio para consulta segura
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { celular, flowType } = body; // flowType: "micro" | "limpieza"

    if (!celular) {
      return NextResponse.json(
        { ok: false, error: "El número celular es obligatorio." },
        { status: 400 }
      );
    }

    const cleanPhone = String(celular).replace(/\D/g, "");

    /* =========================
       1️⃣ OBTENER 'numberc' DE LA TABLA CLIENTS
    ========================= */
    let fullPhoneWithPlus = `+57${cleanPhone}`;

    const { data: clientData, error: clientErr } = await supabaseAdmin
      .from("clients")
      .select("numberc, indicador, nombre")
      .eq("celular", cleanPhone)
      .maybeSingle();

    if (clientErr) {
      console.warn("Error consultando la tabla clients:", clientErr.message);
    }

    if (clientData) {
      if (clientData.numberc && clientData.numberc.trim() !== "") {
        fullPhoneWithPlus = clientData.numberc.trim().startsWith("+") 
          ? clientData.numberc.trim() 
          : `+${clientData.numberc.trim()}`;
      } else if (clientData.indicador) {
        const cleanIndicador = String(clientData.indicador).replace(/\D/g, "");
        fullPhoneWithPlus = `+${cleanIndicador}${cleanPhone}`;
      }
    }

    /* =========================
       2️⃣ ENVIAR PETICIÓN WEBHOOK A N8N
    ========================= */
    const webhookUrl = process.env.N8N_FLOW_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { ok: false, error: "No se encuentra configurada la URL de Webhook de n8n." },
        { status: 500 }
      );
    }

    const payload = {
      action: "SEND_FLOW_HSM",
      flowType: flowType, // "micro" o "limpieza"
      customerPhone: fullPhoneWithPlus,
      rawPhone: cleanPhone,
      customerName: clientData?.nombre || "Cliente",
      sentAt: new Date().toISOString(),
    };

    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!n8nRes.ok) {
      throw new Error(`Error en servidor n8n: HTTP ${n8nRes.status}`);
    }

    return NextResponse.json({
      ok: true,
      message: `HSM de ${flowType} enviado correctamente a ${fullPhoneWithPlus}`,
      phoneSent: fullPhoneWithPlus,
    });

  } catch (err: any) {
    console.error("❌ SEND FLOW HSM ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error procesando el envío de HSM." },
      { status: 500 }
    );
  }
}