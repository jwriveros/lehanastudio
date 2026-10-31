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

    const cleanPhone = String(celular).replace(/\D/g, "");

    // 1. Obtener la campaña activa
    const { data: campaign, error: campErr } = await supabaseAdmin
      .from("loyalty_campaigns")
      .select("*")
      .eq("activa", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (campErr || !campaign) {
      // Si no hay campaña activa, no hay beneficio
      return NextResponse.json({ ok: true, hasReward: false });
    }

    // 2. Contar citas finalizadas dentro del rango de vigencia de la campaña
    let query = supabaseAdmin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA"])
      .ilike("celular", `%${cleanPhone}%`);

    if (campaign.start_date) {
      query = query.gte("appointment_at", `${campaign.start_date}T00:00:00Z`);
    }
    if (campaign.end_date) {
      query = query.lte("appointment_at", `${campaign.end_date}T23:59:59Z`);
    }

    const { count, error: countErr } = await query;
    if (countErr) throw countErr;

    const totalCitas = count || 0;
    const target = campaign.target_visits || 5;

    // Evaluamos si su próxima cita es la cita meta
    // (Ejemplo: si lleva 4 citas, la próxima cita que está agendando es la 5ª)
    const isRewardAppointment = (totalCitas % target) === (target - 1);

    // Texto descriptivo del beneficio
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
      campaignName: campaign.nombre,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}