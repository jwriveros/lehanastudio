import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface ProcessReceiptPayload {
  numero: string;
  text: string;
  imageUrl?: string;
  imageBase64?: string;
}

// 🎯 Helper para garantizar que la URL de la imagen sea pública y válida
function formatPublicStorageUrl(inputUrl?: string): string {
  if (!inputUrl) return "";
  
  const supabaseProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ijbmsdypiudovdnpwwzg.supabase.co";

  // Si ya es una URL pública completa, la devuelve limpia
  if (inputUrl.includes("/storage/v1/object/public/")) {
    return inputUrl;
  }

  // Si viene con la ruta interna 'comprobantes/filename.png' o similar
  if (inputUrl.includes("comprobantes/")) {
    const pathAfterBucket = inputUrl.split("comprobantes/")[1];
    return `${supabaseProjectUrl}/storage/v1/object/public/comprobantes/${pathAfterBucket}`;
  }

  return inputUrl;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessReceiptPayload = await request.json();
    const { numero, text, imageUrl, imageBase64 } = body;

    if (!numero) {
      return NextResponse.json(
        { ok: false, error: "El campo 'numero' es obligatorio." },
        { status: 400 }
      );
    }

    const cleanPhone = numero.replace(/\D/g, "");
    const fullPhoneWithPlus = `+${cleanPhone}`;

    /* =========================
       1️⃣ EXTRAER MONTO DEL TEXTO (OCR)
    ========================= */
    const textoIA = text || "";
    const valorMatch = textoIA.match(/\$\s?([\d\.]+)/);
    const montoLeido = valorMatch ? parseInt(valorMatch[1].replace(/\./g, ""), 10) : 0;

    if (montoLeido === 0) {
      return NextResponse.json({
        ok: true,
        accion: "IMAGEN_NO_VALIDA",
        pago_tipo: "invalido",
        monto_validado: 0,
        mensaje_final:
          "Recibí tu imagen, pero no logro identificar los datos del pago. 🧐 Por favor, asegúrate de enviar una captura de pantalla clara donde se vea el valor y la fecha de la transferencia.",
      });
    }

    /* =========================
       2️⃣ GESTIONAR RECEIPT_URL CON NORMALIZACIÓN AUTOMÁTICA
    ========================= */
    let finalReceiptUrl = formatPublicStorageUrl(imageUrl);

    // Si la imagen viene en Base64 desde el backend
    if (imageBase64) {
      try {
        const buffer = Buffer.from(imageBase64, "base64");
        const fileName = `${fullPhoneWithPlus}_${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from("comprobantes")
          .upload(fileName, buffer, { contentType: "image/png" });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("comprobantes")
            .getPublicUrl(fileName);
          finalReceiptUrl = publicUrlData.publicUrl;
        }
      } catch (storageErr) {
        console.error("Error subiendo imagen a Storage:", storageErr);
      }
    }

    /* =========================
       3️⃣ CONSULTAR CITAS (FUTURAS Y ÚLTIMOS 30 DÍAS)
    ========================= */
    const ahora = new Date();
    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: rawAppointments, error: appError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .or(`celular.eq."${cleanPhone}",indicativo.eq."${cleanPhone}"`)
      .in("estado", ["Nueva reserva creada", "Cita confirmada"])
      .gte("appointment_at", hace30Dias)
      .order("appointment_at", { ascending: true });

    if (appError) console.error("Error consultando citas:", appError);

    const appointments = rawAppointments || [];

    if (appointments.length === 0) {
      const pagoStatusNoCita = "sin_cita_asociada";

      await supabaseAdmin.from("payments").insert([
        {
          full_phone: fullPhoneWithPlus,
          amount_extracted: montoLeido.toString(),
          receipt_url: finalReceiptUrl,
          appointment_ids: [],
          status: pagoStatusNoCita,
          mensaje: textoIA,
          created_at: new Date().toISOString(),
        },
      ]);

      return NextResponse.json({
        ok: true,
        accion: "SIN_CITA_ENCONTRADA",
        pago_tipo: pagoStatusNoCita,
        monto_validado: montoLeido,
        receipt_url: finalReceiptUrl,
        mensaje_final: `Recibimos tu comprobante por $${montoLeido.toLocaleString("es-CO")}, pero no encuentro ninguna cita activa para este número de WhatsApp. 🧐 ¿La reserva se hizo con otro número o a nombre de otra persona? ¡Confírmanos para verificarlo manualmente! ✨`,
      });
    }

    /* =========================
       4️⃣ CLASIFICAR CITAS Y EVALUAR CONFLICTOS
    ========================= */
    const limitePasado = new Date(ahora.getTime() - 12 * 60 * 60 * 1000);
    const citasFuturas = appointments.filter((a: any) => new Date(a.appointment_at) >= limitePasado);
    const citasPasadasRecientes = appointments.filter((a: any) => new Date(a.appointment_at) < limitePasado);

    if (citasFuturas.length > 0 && citasPasadasRecientes.length > 0) {
      return NextResponse.json({
        ok: true,
        accion: "REQUIERE_SELECCION",
        pago_tipo: "requiere_seleccion",
        monto_validado: montoLeido,
        receipt_url: finalReceiptUrl,
        citas_futuras: citasFuturas.map((c: any) => ({ id: String(c.id), servicio: c.servicio, fecha: c.appointment_at, precio: c.price_final || c.price })),
        citas_pasadas: citasPasadasRecientes.map((c: any) => ({ id: String(c.id), servicio: c.servicio, fecha: c.appointment_at, precio: c.price_final || c.price })),
        mensaje_final: `Recibimos tu pago por $${montoLeido.toLocaleString("es-CO")}. Observo que tienes una cita pasada y una cita futura pendiente. 🧐 ¿A cuál de las dos citas deseas aplicar este abono/pago?`,
      });
    }

    const citasAProcesar = citasFuturas.length > 0 ? citasFuturas : citasPasadasRecientes;

    /* =========================
       5️⃣ CÁLCULO DE MONTOS Y PAGO_TIPO
    ========================= */
    let sumaPrecios = 0;
    let sumaAbonosRequeridos = 0;
    const idsCitasString: string[] = [];

    citasAProcesar.forEach((item: any) => {
      const precio = parseInt(item.price_final || item.price || 0, 10);
      const abonoMinimo = Math.round(precio * 0.3);

      sumaPrecios += precio;
      sumaAbonosRequeridos += abonoMinimo;
      idsCitasString.push(String(item.id));
    });

    let accion = "";
    let estadoNuevoCita = "";
    let pagoStatus = "";
    let mensajeFinal = "";

    if (montoLeido >= sumaPrecios) {
      accion = "PAGO_TOTAL";
      estadoNuevoCita = "Cita confirmada";
      pagoStatus = "completo";
      mensajeFinal = `¡Confirmado! Recibimos $${montoLeido.toLocaleString("es-CO")}. El pago de tus citas es TOTAL. Estaremos verificándolo ¡Te esperamos! ✨`;
    } else if (montoLeido >= sumaAbonosRequeridos) {
      accion = "ABONO_EXITOSO";
      estadoNuevoCita = "Cita confirmada";
      pagoStatus = "abono";
      mensajeFinal = `¡Listo! Recibimos el abono de $${montoLeido.toLocaleString("es-CO")}. Estaremos verificándolo. Tus cupos están asegurados. El saldo restante lo cancelas en el estudio. 😊`;
    } else {
      accion = "PAGO_INSUFFICIENTE";
      pagoStatus = "insuficiente";
      mensajeFinal = `Recibimos un comprobante por $${montoLeido.toLocaleString("es-CO")}, Muchas gracias por tu pago. Estaremos verificándolo.`;
    }

    /* =========================
       6️⃣ INSERTAR EN LA TABLA PAYMENTS
    ========================= */
    await supabaseAdmin.from("payments").insert([
      {
        full_phone: fullPhoneWithPlus,
        amount_extracted: montoLeido.toString(),
        receipt_url: finalReceiptUrl,
        appointment_ids: idsCitasString,
        status: pagoStatus,
        mensaje: textoIA,
        created_at: new Date().toISOString(),
      },
    ]);

    /* =========================
       7️⃣ ACTUALIZAR ESTADO DE CITAS
    ========================= */
    if (estadoNuevoCita && idsCitasString.length > 0) {
      await supabaseAdmin
        .from("appointments")
        .update({ estado: estadoNuevoCita })
        .in("id", idsCitasString);
    }

    return NextResponse.json({
      ok: true,
      accion,
      pago_tipo: pagoStatus,
      monto_validado: montoLeido,
      total_servicios: sumaPrecios,
      total_abonos: sumaAbonosRequeridos,
      ids: idsCitasString,
      receipt_url: finalReceiptUrl,
      mensaje_final: mensajeFinal,
    });
  } catch (error: any) {
    console.error("Error en API process-receipt:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}