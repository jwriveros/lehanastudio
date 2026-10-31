import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase administrativo
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      celular, 
      flowType, // "micro" | "limpieza" | "loyalty_reminder"
      customerPhone,
      customerName,
      targetVisits,
      benefitText
    } = body;

    if (!celular) {
      return NextResponse.json(
        { ok: false, error: "El número celular es obligatorio." },
        { status: 400 }
      );
    }

    const cleanPhone = String(celular).replace(/\D/g, "");

    /* =========================================================
       1️⃣ FORMATEO DE TELÉFONO INTERNACIONAL (+57...)
    ========================================================= */
    let fullPhoneWithPlus = customerPhone && String(customerPhone).trim().startsWith("+")
      ? String(customerPhone).trim()
      : `+57${cleanPhone}`;

    let resolvedClientName = customerName || "Cliente";

    if (!customerPhone || !customerName) {
      const { data: clientData, error: clientErr } = await supabaseAdmin
        .from("clients")
        .select("numberc, indicador, nombre")
        .eq("celular", cleanPhone)
        .maybeSingle();

      if (clientErr) {
        console.warn("Aviso consultando la tabla clients:", clientErr.message);
      }

      if (clientData) {
        if (clientData.nombre) resolvedClientName = clientData.nombre;

        if (clientData.numberc && clientData.numberc.trim() !== "") {
          fullPhoneWithPlus = clientData.numberc.trim().startsWith("+") 
            ? clientData.numberc.trim() 
            : `+${clientData.numberc.trim()}`;
        } else if (clientData.indicador) {
          const cleanIndicador = String(clientData.indicador).replace(/\D/g, "");
          fullPhoneWithPlus = `+${cleanIndicador}${cleanPhone}`;
        }
      }
    }

    /* =========================================================
       2️⃣ DISTINCIÓN CLARA ENTRE FLOW HSM Y HSM NORMAL
    ========================================================= */
    const isLoyalty = flowType === "loyalty_reminder";

    // 🌸 Si es fidelización, definimos la acción como plantilla normal (STANDARD)
    const actionType = isLoyalty ? "SEND_STANDARD_HSM" : "SEND_FLOW_HSM";

    const payload: Record<string, any> = {
      action: actionType, // 👈 n8n usará este campo para saber qué tipo de plantilla disparar
      messageType: isLoyalty ? "template" : "flow", // "template" = normal, "flow" = interactivo
      flowType: flowType || "general",
      customerPhone: fullPhoneWithPlus,
      rawPhone: cleanPhone,
      customerName: resolvedClientName,
      sentAt: new Date().toISOString(),
    };

    // Parámetros específicos para la plantilla regular de fidelización
    if (isLoyalty) {
      const target = Number(targetVisits) || 5;
      payload.templateParameters = {
        name: resolvedClientName,
        currentVisits: Math.max(1, target - 1),
        targetVisits: target,
        benefit: benefitText || "un descuento especial",
      };
    }

    /* =========================================================
       3️⃣ DISPARO AL WEBHOOK DE N8N
    ========================================================= */
    const webhookUrl = process.env.N8N_FLOW_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { ok: false, error: "No se encuentra configurada la URL de Webhook de n8n." },
        { status: 500 }
      );
    }

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
      message: `Mensaje (${isLoyalty ? "HSM Normal" : "Flow HSM"}) procesado correctamente para ${fullPhoneWithPlus}`,
      phoneSent: fullPhoneWithPlus,
    });

  } catch (err: any) {
    console.error("❌ SEND HSM ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error procesando el envío de mensaje." },
      { status: 500 }
    );
  }
}