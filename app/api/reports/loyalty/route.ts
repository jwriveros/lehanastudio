import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      startDate,
      endDate,
      targetVisits = 5,
      cycleAction = "restart", // "restart" (reiniciar ciclo) | "once" (beneficio único)
      sede = "",
    } = body;

    // 1. Consultar citas pagadas dentro del rango
    let query = supabaseAdmin
      .from("appointments")
      .select("id, cliente, celular, appointment_at, servicio, price_final, price, estado, sede")
      .in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA"])
      .order("appointment_at", { ascending: true });

    if (startDate) query = query.gte("appointment_at", `${startDate}T00:00:00Z`);
    if (endDate) query = query.lte("appointment_at", `${endDate}T23:59:59Z`);
    if (sede) query = query.eq("sede", sede);

    const { data: appointments, error: appErr } = await query;
    if (appErr) throw appErr;

    // 2. Agrupar citas por celular de cliente
    const clientsMap: Record<string, any> = {};

    (appointments || []).forEach((apt) => {
      const cleanPhone = String(apt.celular || "").replace(/\D/g, "");
      if (!cleanPhone) return;

      if (!clientsMap[cleanPhone]) {
        clientsMap[cleanPhone] = {
          celular: cleanPhone,
          cliente: apt.cliente,
          citas: [],
        };
      }
      clientsMap[cleanPhone].citas.push(apt);
    });

    const phonesList = Object.keys(clientsMap);

    // 3. Obtener el número completo numberc desde la tabla clients
    const { data: clientsData } = await supabaseAdmin
      .from("clients")
      .select("celular, numberc, nombre")
      .in("celular", phonesList);

    const numbercMap: Record<string, string> = {};
    (clientsData || []).forEach((c) => {
      const clean = String(c.celular || "").replace(/\D/g, "");
      numbercMap[clean] = c.numberc || `+57${clean}`;
    });

    // 4. Evaluar el estado de fidelización de cada cliente
    const closeToReward: any[] = [];
    const rewardAchieved: any[] = [];

    const thresholdPrevio = Number(targetVisits) - 1; // Ej: 4 si la meta es 5

    phonesList.forEach((phone) => {
      const item = clientsMap[phone];
      const totalCitas = item.citas.length;
      const fullPhone = numbercMap[phone] || `+57${phone}`;

      let currentCycleVisits = totalCitas;
      let cyclesCompleted = 0;

      if (cycleAction === "restart") {
        cyclesCompleted = Math.floor(totalCitas / targetVisits);
        currentCycleVisits = totalCitas % targetVisits;
      }

      const lastApt = item.citas[item.citas.length - 1];

      const clientSummary = {
        cliente: item.cliente,
        celular: phone,
        fullPhone,
        totalCitasHistoricas: totalCitas,
        currentCycleVisits: currentCycleVisits === 0 && totalCitas >= targetVisits ? targetVisits : currentCycleVisits,
        targetVisits: Number(targetVisits),
        ultimaCita: lastApt?.appointment_at || null,
        ultimoServicio: lastApt?.servicio || "General",
        ultimaSede: lastApt?.sede || "Marquetalia",
        cyclesCompleted,
      };

      // Si le falta exactamente 1 cita para el beneficio
      if (currentCycleVisits === thresholdPrevio) {
        closeToReward.push({
          ...clientSummary,
          mensajeSugerido: `¡Hola ${item.cliente}! Ya completaste ${thresholdPrevio} citas en Lehana Studio. Tu próxima cita número ${targetVisits} tendrá un beneficio especial.`,
        });
      }

      // Si ya cumplió la meta de visitas
      if (
        (cycleAction === "restart" && (currentCycleVisits === 0 && totalCitas >= targetVisits)) ||
        (cycleAction === "once" && totalCitas >= targetVisits)
      ) {
        rewardAchieved.push({
          ...clientSummary,
          citaBeneficioNumero: totalCitas,
        });
      }
    });

    return NextResponse.json({
      ok: true,
      totalClientesEvaluados: phonesList.length,
      closeToReward,
      rewardAchieved,
    });
  } catch (err: any) {
    console.error("LOYALTY REPORT ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}