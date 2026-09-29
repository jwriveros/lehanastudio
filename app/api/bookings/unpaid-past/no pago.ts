import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { ok: false, error: "Error de configuración: supabaseAdmin no disponible." },
        { status: 500 }
      );
    }

    // 1. Obtener la fecha de inicio del día de hoy a las 00:00:00
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    ).toISOString();

    // 2. Consultar citas pasadas que estén estrictamente en 'Nueva reserva creada' o 'Cita confirmada'
    const { data: unpaidBookings, error } = await supabaseAdmin
      .from("appointments")
      .select("id, cliente, servicio, especialista, price, price_final, abono, appointment_at, estado, sede, celular")
      .lt("appointment_at", startOfToday) // Citas anteriores al inicio del día de hoy
      .in("estado", ["Nueva reserva creada", "Cita confirmada"]) // 👈 SOLO LEE ESTOS DOS ESTADOS
      .order("appointment_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      total_unpaid: unpaidBookings?.length || 0,
      bookings: unpaidBookings || [],
    });
  } catch (err: any) {
    console.error("Error consultando citas por pagar:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al obtener citas por pagar" },
      { status: 500 }
    );
  }
}