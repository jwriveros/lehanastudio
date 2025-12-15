import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

/* =========================
   🔥 FIX TIMEZONE (UTC-5)
   Convierte "YYYY-MM-DDTHH:mm"
   a timestamp correcto para Supabase
========================= */
function toLocalTimestamp(localDateTime: string) {
  const date = new Date(localDateTime);
  // Colombia UTC-5
  date.setHours(date.getHours() - 5);
  return date.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const {
      cliente,
      celular,
      appointment_at, // YYYY-MM-DDTHH:mm (LOCAL)
      sede,
      cantidad,
      items, // 👈 VIENE DEL FRONT
    } = body;

    /* =========================
       VALIDACIONES
    ========================= */
    if (
      !cliente ||
      !celular ||
      !appointment_at ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { ok: false, error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const peopleCount = Number(cantidad || 1);
    const appointmentGroupId = randomUUID();

    /* =========================
       1️⃣ CONSTRUIR ROWS
       - 1 persona → todos los servicios al mismo cliente
       - >1 personas → cliente + N/D
    ========================= */
    const rows: any[] = [];

    for (let personIndex = 0; personIndex < peopleCount; personIndex++) {
      const isPrimary = personIndex === 0;

      for (const s of items) {
        rows.push({
          cliente: isPrimary ? cliente : "N/D",
          servicio: s.servicio,
          especialista: s.especialista ?? null,

          // ✅ FIX DEFINITIVO DE LA HORA
          appointment_at: toLocalTimestamp(appointment_at),

          duration: s.duration ?? null,
          celular: isPrimary ? celular : null,
          sede,
          cantidad: peopleCount,
          is_primary_client: isPrimary,
          primary_client_name: cliente,
          appointment_group_id: appointmentGroupId,
          estado: "Nueva reserva creada",
        });
      }
    }

    /* =========================
       2️⃣ INSERTAR EN SUPABASE
    ========================= */
    const { data: inserted, error } = await supabase
      .from("appointments")
      .insert(rows)
      .select();

    if (error) throw error;

    /* =========================
       3️⃣ TOTAL (price por trigger)
    ========================= */
    const total = inserted.reduce(
      (acc: number, r: any) => acc + Number(r.price || 0),
      0
    );

    /* =========================
       4️⃣ ENVIAR A N8N
       (se envía la hora ORIGINAL del usuario)
    ========================= */
    await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE",
        customerName: cliente,
        customerPhone: String(celular).startsWith("+")
          ? celular
          : `+57${celular}`,
        appointmentDate: appointment_at, // 👈 hora local del usuario
        sede,
        services: inserted.map((r: any) => ({
          servicio: r.servicio,
          especialista: r.especialista,
          price: r.price,
        })),
        total,
        appointmentGroupId,
      }),
    });

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
