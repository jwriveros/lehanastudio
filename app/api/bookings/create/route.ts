import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// 🎯 Cliente de administración para omitir restricciones RLS en la tabla 'clients'
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

/* =========================
   🔥 FIX TIMEZONE (UTC-5)
========================= */
function toUTCTimestamp(localDateTime: string) {
  if (!localDateTime) return null;
  return new Date(localDateTime).toISOString();
}

/* =========================
   🔹 HELPER CÁLCULO PRECIO FINAL
========================= */
function calculatePriceFinal(basePrice: number, discountPercentage: number): number {
  const safeBase = Math.max(0, Number(basePrice) || 0);
  const safePercent = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const discountAmount = Math.round((safeBase * safePercent) / 100);
  return Math.max(0, safeBase - discountAmount);
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const {
      cliente,
      celular,
      indicativo,
      sede,
      cantidad,
      items, 
    } = body;

    if (!cliente || !celular || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const missingDate = items.some((s: any) => !s.appointment_at);
    if (missingDate) {
      return NextResponse.json(
        { ok: false, error: "Cada servicio debe tener fecha y hora" },
        { status: 400 }
      );
    }

    const peopleCount = Number(cantidad || 1);
    const appointmentGroupId = randomUUID();
    
    // Normalización de teléfonos
    const cleanPhone = String(celular).replace(/\D/g, "");
    const cleanIndicativoNum = Number(String(indicativo || "57").replace(/\D/g, "")) || 57;
    const fullPhoneWithPlus = `+${cleanIndicativoNum}${cleanPhone}`;

    /* =========================
       1️⃣ VERIFICAR / CREAR CLIENTE AUTOMÁTICAMENTE
    ========================= */
    let clientStatus = "Inexistente";
    let clientInsertLog: any = null;

    try {
      // 1.1 Búsqueda por celular exacto
      const { data: clientByCelular, error: err1 } = await supabaseAdmin
        .from("clients")
        .select("id, nombre")
        .eq("celular", cleanPhone)
        .maybeSingle();

      if (err1) console.warn("Aviso búsqueda por celular:", err1.message);

      let foundClient = clientByCelular;

      // 1.2 Búsqueda por numberc (+57...)
      if (!foundClient) {
        const { data: clientByNumberc, error: err2 } = await supabaseAdmin
          .from("clients")
          .select("id, nombre")
          .eq("numberc", fullPhoneWithPlus)
          .maybeSingle();

        if (err2) console.warn("Aviso búsqueda por numberc:", err2.message);
        foundClient = clientByNumberc;
      }

      // 1.3 Inserción SIN incluir 'numberc' (ya que Postgres la calcula sola)
      if (!foundClient) {
        console.log(`[CLIENTS] Insertando cliente nuevo sin columna calculada: ${cliente} (${cleanPhone})`);

        const { data: insertedClient, error: insertError } = await supabaseAdmin
          .from("clients")
          .insert([
            {
              nombre: cliente.trim(),
              celular: cleanPhone,
              indicador: cleanIndicativoNum,
              sede: sede || "Marquetalia",
              creado_desde: "CRM_BOOKING",
              tipo: "Contacto",
              estado: "Activo",
            },
          ])
          .select();

        if (insertError) {
          console.error("❌ ERROR AL INSERTAR CLIENTE EN SUPABASE:", insertError);
          clientStatus = `Error al insertar: ${insertError.message}`;
          clientInsertLog = insertError;
        } else {
          console.log("✅ CLIENTE CREADO CON ÉXITO EN SUPABASE:", insertedClient);
          clientStatus = "Creado exitosamente";
          clientInsertLog = insertedClient;
        }
      } else {
        clientStatus = `Ya existía (ID: ${foundClient.id})`;
        console.log(`ℹ️ [CLIENTS] El cliente ya existe con ID: ${foundClient.id}`);
      }
    } catch (clientEx: any) {
      console.error("Excepción durante la verificación de cliente:", clientEx);
      clientStatus = `Excepción: ${clientEx.message}`;
    }
    /* =========================
       2️⃣ CONSTRUIR FILAS PARA APPOINTMENTS
    ========================= */
    const rows: any[] = [];
    for (let personIndex = 0; personIndex < peopleCount; personIndex++) {
      const isPrimary = personIndex === 0;
      for (const s of items) {
        const basePrice = Number(s.price || 0);
        const discountPct = Number(s.descuento || 0);
        const finalPrice = s.price_final !== undefined 
          ? Number(s.price_final) 
          : calculatePriceFinal(basePrice, discountPct);

        rows.push({
          cliente: isPrimary ? cliente : `Acompañante de ${cliente}`,
          servicio: s.servicio,
          especialista: s.especialista ?? null,
          appointment_at: toUTCTimestamp(s.appointment_at),
          duration: s.duration ?? null,
          celular: isPrimary ? cleanPhone : null,
          sede,
          cantidad: peopleCount,
          price: basePrice,
          descuento: discountPct,
          price_final: finalPrice,
          indicativo: isPrimary ? String(cleanIndicativoNum) : null,
          is_primary_client: isPrimary,
          primary_client_name: cliente,
          appointment_id: appointmentGroupId, 
          estado: "Nueva reserva creada",
        });
      }
    }

    /* =========================
       3️⃣ INSERTAR EN APPOINTMENTS
    ========================= */
    const { data: inserted, error: insertError } = await supabase
      .from("appointments")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("❌ ERROR INSERTANDO EN APPOINTMENTS:", insertError);
      throw insertError;
    }

    /* =========================
       4️⃣ REGISTRAR EN BOOKING_REQUESTS
    ========================= */
    if (inserted && inserted.length > 0) {
      await supabase.from("booking_requests").insert([
        {
          status: "PENDING",
          appointment_id: inserted[0].id,
          client_phone: cleanPhone,
          created_at: new Date().toISOString(),
        },
      ]);
    }

    const total = inserted.reduce(
      (acc: number, r: any) => acc + Number(r.price_final !== undefined ? r.price_final : r.price || 0),
      0
    );

    /* =========================
       5️⃣ NOTIFICAR A N8N
    ========================= */
    if (process.env.N8N_WEBHOOK_URL && inserted && inserted.length > 0) {
      const firstRow = inserted[0];

      const displayService = items.length > 1 
        ? `${firstRow.servicio} (+${items.length - 1} servicios adicionales)` 
        : firstRow.servicio;

      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          customerName: cliente,
          customerPhone: fullPhoneWithPlus,
          sede: firstRow.sede,
          servicio: displayService,
          especialista: firstRow.especialista,
          price: total,
          appointment_at: firstRow.appointment_at,
          appointmentGroupId: firstRow.appointment_id,
          totalServices: items.length,
          mensaje_nota: `A partir de esta hora (${firstRow.appointment_at}) empezarán todos tus servicios.`
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      appointment_group_id: appointmentGroupId,
      total,
      rows_created: inserted.length,
      client_creation_status: clientStatus,
      client_log: clientInsertLog,
    });

  } catch (err: any) {
    console.error("CREATE BOOKING ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}