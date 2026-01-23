import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

/* =========================
   🔥 FIX TIMEZONE (UTC-5)
========================= */
function toUTCTimestamp(localDateTime: string) {
  if (!localDateTime) return null;
  return new Date(localDateTime).toISOString();
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
    const normalizedCelular = String(celular).replace(/\D/g, "");

    /* =========================
       1️⃣ VERIFICAR / CREAR CLIENTE
    ========================= */
    const { data: existingClient } = await supabase
      .from("clients")
      .select("nombre")
      .or(`celular.eq.${normalizedCelular},numberc.eq.${normalizedCelular}`)
      .limit(1)
      .maybeSingle();

    if (!existingClient) {
      await supabase.from("clients").insert([
        {
          nombre: cliente,
          celular: normalizedCelular,
          indicador: indicativo,
          creado_desde: "CRM_BOOKING",
          tipo: "Contacto",
          estado: "Activo",
        },
      ]);
    }

    /* =========================
       2️⃣ CONSTRUIR FILAS (ROWS)
    ========================= */
    const rows: any[] = [];
    for (let personIndex = 0; personIndex < peopleCount; personIndex++) {
      const isPrimary = personIndex === 0;
      for (const s of items) {
        rows.push({
          cliente: isPrimary ? cliente : `Acompañante de ${cliente}`,
          servicio: s.servicio,
          especialista: s.especialista ?? null,
          appointment_at: toUTCTimestamp(s.appointment_at),
          duration: s.duration ?? null,
          celular: isPrimary ? normalizedCelular : null,
          sede,
          cantidad: peopleCount,
          price: s.price ?? 0,
          indicativo: isPrimary ? indicativo : null,
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

    if (insertError) throw insertError;

    /* =========================
       4️⃣ REGISTRAR EN BOOKING_REQUESTS
    ========================= */
    if (inserted && inserted.length > 0) {
      await supabase.from("booking_requests").insert([
        {
          status: "PENDING",
          appointment_id: inserted[0].id,
          client_phone: normalizedCelular,
          created_at: new Date().toISOString(),
        },
      ]);
    }

    const total = inserted.reduce(
      (acc: number, r: any) => acc + Number(r.price || 0),
      0
    );

    /* =========================
       5️⃣ NOTIFICAR A N8N (ENVÍO ÚNICO)
    ========================= */
    if (process.env.N8N_WEBHOOK_URL && inserted && inserted.length > 0) {
      // Tomamos el primer servicio del cliente principal como referencia
      const firstRow = inserted[0];
      const cleanIndicativo = String(indicativo || "57").replace(/\D/g, "");
      const fullPhone = `+${cleanIndicativo}${normalizedCelular}`;

      // Si hay más de un servicio, creamos un texto descriptivo
      const displayService = items.length > 1 
        ? `${firstRow.servicio} (+${items.length - 1} servicios adicionales)` 
        : firstRow.servicio;

      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          customerName: cliente,
          customerPhone: fullPhone,
          sede: firstRow.sede,
          servicio: displayService,
          especialista: firstRow.especialista,
          price: total, // Enviamos el total de la reserva
          appointment_at: firstRow.appointment_at, // Hora de inicio del primer servicio
          appointmentGroupId: firstRow.appointment_id,
          totalServices: items.length,
          // Nota para el bot/mensaje:
          mensaje_nota: `A partir de esta hora (${firstRow.appointment_at}) empezarán todos tus servicios.`
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      appointment_group_id: appointmentGroupId,
      total,
      rows_created: inserted.length,
    });

  } catch (err: any) {
    console.error("CREATE BOOKING ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}