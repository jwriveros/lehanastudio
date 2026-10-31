import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: Request) {
  try {
    const { celular } = await req.json();

    if (!celular) {
      return NextResponse.json({ ok: false, error: "Celular requerido" }, { status: 400 });
    }

    // Extraemos solo los dígitos numéricos
    const rawDigits = String(celular).replace(/\D/g, "");
    // Tomamos los últimos 10 dígitos para evitar discrepancias de indicativo (+57)
    const phoneSearch = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    // 1. Obtener la campaña activa
    const { data: campaign, error: campErr } = await supabaseAdmin
      .from("loyalty_campaigns")
      .select("*")
      .eq("activa", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (campErr || !campaign) {
      return NextResponse.json({ ok: true, hasReward: false, reason: "No hay campaña activa" });
    }

    // 2. Consultar citas completadas del cliente con búsqueda flexible
    let query = supabaseAdmin
      .from("appointments")
      .select("id, appointment_at, estado", { count: "exact" })
      .in("estado", [
        "FINALIZADO", 
        "Finalizado", 
        "Cita pagada", 
        "CITA PAGADA", 
        "Completada", 
        "completada"
      ])
      .ilike("celular", `%${phoneSearch}%`);

    if (campaign.start_date) {
      query = query.gte("appointment_at", `${campaign.start_date}T00:00:00Z`);
    }
    if (campaign.end_date) {
      query = query.lte("appointment_at", `${campaign.end_date}T23:59:59Z`);
    }

    const { count, error: countErr } = await query;
    if (countErr) throw countErr;

    const totalCitas = count || 0;
    const target = Number(campaign.target_visits) || 5;

    // 3. Evaluar elegibilidad de recompensa:
    // Aplica si esta nueva cita es la cita meta (ej: lleva 4 y va para la 5ª)
    // O si ya tiene 5 o más citas en ciclo continuo
    const currentVisitsInCycle = totalCitas % target;
    const isRewardAppointment = currentVisitsInCycle === (target - 1) || (totalCitas >= target && campaign.cycle_action !== "once");

    let benefitDescription = "";
    if (campaign.benefit_type === "percent") {
      benefitDescription = `${campaign.benefit_value}% de descuento`;
    } else if (campaign.benefit_type === "fixed") {
      benefitDescription = `$${Number(campaign.benefit_value).toLocaleString()} COP de descuento`;
    } else {
      benefitDescription = `Regalo: ${campaign.benefit_value}`;
    }

    return NextResponse.json({
      ok: true,
      hasReward: isRewardAppointment,
      totalVisits: totalCitas,
      targetVisits: target,
      benefitType: campaign.benefit_type,
      benefitValue: campaign.benefit_value,
      benefitDescription,
      campaignName: campaign.nombre || "Citas Frecuentes",
    });
  } catch (err: any) {
    console.error("Error en check-client:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}