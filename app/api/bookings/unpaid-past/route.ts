import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // Definir la fecha de ayer a las 00:00:00 (Hora Colombia UTC-5)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayISO = yesterday.toISOString();

    // Consultar citas anteriores a ayer no pagadas ni canceladas
    const { data: unpaidBookings, error } = await supabase
      .from("appointments")
      .select("id, cliente, servicio, especialista, price, price_final, abono, appointment_at, estado, sede, celular")
      .lt("appointment_at", yesterdayISO)
      .neq("estado", "Cita pagada")
      .neq("estado", "Cita cancelada")
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