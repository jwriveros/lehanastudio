import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

/* =========================
   🔥 FIX TIMEZONE (UTC-5)
========================= */
function toLocalTimestamp(localDateTime: string) {
  if (!localDateTime) return null;
  
  // Reemplazamos el espacio por 'T' si viene del input datetime-local
  let ISOStr = localDateTime.replace(" ", "T");

  // Si el string no tiene información de zona horaria (no termina en Z ni en +00:00)
  // le concatenamos el offset de Colombia (-05:00)
  if (!ISOStr.includes("Z") && !ISOStr.match(/[+-]\d{2}:\d{2}$/)) {
    // Aseguramos que tenga segundos para formato ISO completo
    if (ISOStr.split("T")[1]?.length === 5) {
      ISOStr += ":00";
    }
    return `${ISOStr}-05:00`;
  }
  
  return ISOStr;
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
      items, 
    } = body;

    /* =========================
        VALIDACIONES
    ========================= */
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
          // ✅ Aplicamos el fix de zona horaria aquí
          appointment_at: toLocalTimestamp(s.appointment_at),
          duration: s.duration ?? null,
          celular: isPrimary ? normalizedCelular : null,
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
       5️⃣ NOTIFICAR A N8N
    ========================= */
    if (process.env.N8N_WEBHOOK_URL) {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          customerName: cliente,
          customerPhone: normalizedCelular.startsWith("57") 
            ? `+${normalizedCelular}` 
            : `+57${normalizedCelular}`,
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