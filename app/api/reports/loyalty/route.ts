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

    const target = Number(targetVisits) || 5;
    const thresholdPrevio = target - 1; // Ej: 4 si la meta es 5

    // 1. Consultar TODAS las citas completadas o pagadas (paginando de 1,000 en 1,000)
    const appointments: any[] = [];
    const PAGE_SIZE = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabaseAdmin
        .from("appointments")
        .select("id, cliente, celular, appointment_at, servicio, price_final, price, estado, sede")
        .in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA", "Completada", "completada"])
        .order("appointment_at", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (startDate) query = query.gte("appointment_at", `${startDate}T00:00:00Z`);
      if (endDate) query = query.lte("appointment_at", `${endDate}T23:59:59-05:00`);
      if (sede) query = query.eq("sede", sede);

      const { data: batch, error: appErr } = await query;
      if (appErr) throw appErr;

      if (batch && batch.length > 0) {
        appointments.push(...batch);
        from += PAGE_SIZE;
        hasMore = batch.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    // 2. Agrupar citas por celular normalizado (últimos 10 dígitos)
    const clientsMap: Record<
      string,
      {
        celular: string;
        cliente: string;
        citas: any[];
      }
    > = {};

    appointments.forEach((apt) => {
      const rawDigits = String(apt.celular || "").replace(/\D/g, "");
      if (!rawDigits) return;

      // Normalizar a los últimos 10 dígitos estándar
      const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

      if (!clientsMap[cleanPhone]) {
        clientsMap[cleanPhone] = {
          celular: cleanPhone,
          cliente: apt.cliente || "Cliente",
          citas: [],
        };
      }

      clientsMap[cleanPhone].citas.push(apt);
    });

    const phonesList = Object.keys(clientsMap);

    // 3. Consultar datos de contacto desde la tabla clients
    const { data: clientsData } = await supabaseAdmin
      .from("clients")
      .select("celular, numberc, nombre");

    const numbercMap: Record<string, string> = {};
    const nameMap: Record<string, string> = {};

    (clientsData || []).forEach((c) => {
      const raw = String(c.celular || "").replace(/\D/g, "");
      const clean = raw.length >= 10 ? raw.slice(-10) : raw;
      if (clean) {
        numbercMap[clean] = c.numberc
          ? c.numberc.startsWith("+")
            ? c.numberc
            : `+${c.numberc}`
          : `+57${clean}`;
        if (c.nombre) nameMap[clean] = c.nombre;
      }
    });

    // 4. Evaluar el estado de fidelización contando CADA CITA (sin importar si fueron el mismo día)
    const closeToReward: any[] = [];
    const rewardAchieved: any[] = [];

    phonesList.forEach((phone) => {
      const item = clientsMap[phone];
      // Conteo directo por cantidad de citas completadas/pagadas
      const totalVisitas = item.citas.length;
      const fullPhone = numbercMap[phone] || `+57${phone}`;
      const resolvedName = nameMap[phone] || item.cliente;

      let currentCycleVisits = totalVisitas;
      let cyclesCompleted = 0;

      if (cycleAction === "restart") {
        cyclesCompleted = Math.floor(totalVisitas / target);
        currentCycleVisits = totalVisitas % target;
      }

      const lastApt = item.citas[item.citas.length - 1];

      const clientSummary = {
        cliente: resolvedName,
        celular: phone,
        fullPhone,
        totalCitasHistoricas: totalVisitas,
        currentCycleVisits: currentCycleVisits === 0 && totalVisitas >= target ? target : currentCycleVisits,
        targetVisits: target,
        ultimaCita: lastApt?.appointment_at || null,
        ultimoServicio: lastApt?.servicio || "General",
        ultimaSede: lastApt?.sede || "Marquetalia",
        cyclesCompleted,
      };

      // Si le falta exactamente 1 cita para cumplir la meta (ej: lleva 4 de 5)
      if (currentCycleVisits === thresholdPrevio) {
        closeToReward.push({
          ...clientSummary,
          mensajeSugerido: `¡Hola ${resolvedName}! Ya completaste ${thresholdPrevio} citas en Lehana Studio. Tu próxima cita número ${target} tendrá un beneficio especial.`,
        });
      }

      // Si alcanzó la meta de visitas
      if (
        (cycleAction === "restart" && currentCycleVisits === 0 && totalVisitas >= target) ||
        (cycleAction === "once" && totalVisitas >= target)
      ) {
        rewardAchieved.push({
          ...clientSummary,
          citaBeneficioNumero: totalVisitas,
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