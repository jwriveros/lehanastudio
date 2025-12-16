import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

/* =========================
   🔥 FIX TIMEZONE (UTC-5)
========================= */
function toLocalTimestamp(localDateTime: string) {
  const date = new Date(localDateTime);
  date.setHours(date.getHours() - 5); // Colombia UTC-5
  return date.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const {
      cliente,
      celular,
      sede,
      cantidad,
      items, // 👈 cada item trae su appointment_at
    } = body;

    /* =========================
       VALIDACIONES
    ========================= */
    if (
      !cliente ||
      !celular ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { ok: false, error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // Validar que TODOS los servicios tengan fecha y hora
    const missingDate = items.some(
      (s: any) => !s.appointment_at
    );

    if (missingDate) {
      return NextResponse.json(
        { ok: false, error: "Cada servicio debe tener fecha y hora" },
        { status: 400 }
      );
    }

    const peopleCount = Number(cantidad || 1);
    const appointmentGroupId = randomUUID();

    /* =========================
       1️⃣ CONSTRUIR ROWS
    ========================= */
    const rows: any[] = [];

    for (let personIndex = 0; personIndex < peopleCount; personIndex++) {
      const isPrimary = personIndex === 0;

      for (const s of items) {
        rows.push({
          cliente: isPrimary ? cliente : "N/D",
          servicio: s.servicio,
          especialista: s.especialista ?? null,

          // ✅ HORA PROPIA POR SERVICIO
          appointment_at: toLocalTimestamp(s.appointment_at),

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
       2️⃣ INSERTAR
    ========================= */
    const { data: inserted, error } = await supabase
      .from("appointments")
      .insert(rows)
      .select();

    if (error) throw error;

    /* =========================
       3️⃣ TOTAL
    ========================= */
    const total = inserted.reduce(
      (acc: number, r: any) => acc + Number(r.price || 0),
      0
    );

    /* =========================
       4️⃣ N8N
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
        sede,
        services: inserted.map((r: any) => ({
          servicio: r.servicio,
          especialista: r.especialista,
          price: r.price,
          appointment_at: r.appointment_at,
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
