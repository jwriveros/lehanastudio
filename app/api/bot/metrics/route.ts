import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export interface TodayClientDetail {
  phone: string;
  messageCount: number;
  lastTime: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // 1. Manejo dinámico de fechas por defecto en formato YYYY-MM-DD
    const now = new Date();
    const defaultToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const startDate = startDateParam || defaultToday;
    const endDate = endDateParam || startDate;

    const startISO = `${startDate}T00:00:00.000Z`;
    const endISO = `${endDate}T23:59:59.999Z`;

    // Rango UTC para n8n_chat_histories y appointments (Colombia UTC-5)
    let startUTC: string;
    let endUTC: string;

    if (startDateParam && endDateParam) {
      const [sYear, sMonth, sDay] = startDateParam.split("-").map(Number);
      const [eYear, eMonth, eDay] = endDateParam.split("-").map(Number);

      startUTC = new Date(Date.UTC(sYear, sMonth - 1, sDay, 5, 0, 0, 0)).toISOString();
      endUTC = new Date(Date.UTC(eYear, eMonth - 1, eDay + 1, 4, 59, 59, 999)).toISOString();
    } else {
      startUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 5, 0, 0, 0)).toISOString();
      endUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 4, 59, 59, 999)).toISOString();
    }

    // 2. Consulta de clientes atendidos en n8n_chat_histories
    const { data: n8nHistory, error: n8nError } = await supabase
      .from("n8n_chat_histories")
      .select("session_id, message, bot, created_at")
      .gte("created_at", startUTC)
      .lte("created_at", endUTC)
      .or('bot.ilike.%bot%,message->>type.eq.ai,message.cs.{"type":"ai"}')
      .order("created_at", { ascending: true });

    if (n8nError) console.error("Error en n8n_chat_histories:", n8nError);

    const clientsMap = new Map<string, { timestamps: string[]; count: number }>();
    const agentTransferSessionIds = new Set<string>();

    (n8nHistory || []).forEach((row) => {
      if (!row.session_id) return;

      const phone = String(row.session_id).trim();
      const messageStr = typeof row.message === "object" ? JSON.stringify(row.message) : String(row.message || "");

      if (!clientsMap.has(phone)) {
        clientsMap.set(phone, { timestamps: [], count: 0 });
      }

      const clientData = clientsMap.get(phone)!;
      clientData.count += 1;
      if (row.created_at) clientData.timestamps.push(row.created_at);

      if (messageStr.includes("Permíteme un momento por favor")) {
        agentTransferSessionIds.add(phone);
      }
    });

    const formatTime = (isoString: string) => {
      return new Date(isoString).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const todayClientsDetail: TodayClientDetail[] = Array.from(clientsMap.entries()).map(([phone, info]) => ({
      phone,
      messageCount: info.count,
      lastTime: info.timestamps.length > 0 ? formatTime(info.timestamps[info.timestamps.length - 1]) : "—",
    }));

    const allTimestamps = Array.from(clientsMap.values()).flatMap((c) => c.timestamps).sort();
    const firstInteractionTime = allTimestamps.length > 0 ? formatTime(allTimestamps[0]) : "—";
    const lastInteractionTime = allTimestamps.length > 0 ? formatTime(allTimestamps[allTimestamps.length - 1]) : "—";
    const totalClientsToday = todayClientsDetail.length;
    const agentTransfersCount = agentTransferSessionIds.size;

    // 3. CONSULTAS EN PARALELO (RESERVAS POR BOT, TOTALES Y SEGUIMIENTOS ENVIADOS)
    const [{ count: reservationsByBot }, { count: totalReservations }, { count: followupsSent }] = await Promise.all([
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("created_by", "BOT")
        .gte("last_synced_at", startUTC)
        .lte("last_synced_at", endUTC),

      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("last_synced_at", startUTC)
        .lte("last_synced_at", endUTC),

      supabase
        .from("seguimientos_enviados")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startISO)
        .lte("created_at", endISO)
    ]);

    // 4. CONSULTA A LA VISTA UNIFICADA (FILTRADA CON startISO Y endISO PARA FUNCIONAR EN PRODUCCIÓN)
    const { data: enrichedSessionsData, error: sessionsError } = await supabase
      .from("view_chat_sessions_full")
      .select("id, client_phone, status, active_agent, context_summary, updated_at")
      .gte("updated_at", startISO)
      .lte("updated_at", endISO)
      .order("updated_at", { ascending: false });

    if (sessionsError) console.error("Error al consultar view_chat_sessions_full:", sessionsError);

    const enrichedSessions = (enrichedSessionsData || []).map((session) => ({
      id: session.id,
      client_phone: session.client_phone,
      status: session.status,
      active_agent: session.active_agent,
      context_summary: session.context_summary,
      last_bot_message_at: session.updated_at ? formatTime(session.updated_at) : "—",
    }));

    const conversionRate = Number((((reservationsByBot || 0) / (totalClientsToday || 1)) * 100).toFixed(1));

    return NextResponse.json({
      ok: true,
      metrics: {
        totalClientsToday,
        firstInteractionTime,
        lastInteractionTime,
        agentTransfersCount,
        reservationsByBot: reservationsByBot || 0,
        totalReservations: totalReservations || 0,
        followupsSent: followupsSent || 0,
        conversionRate,
      },
      todayClientsDetail,
      sessions: enrichedSessions,
    });
  } catch (error: any) {
    console.error("Error al obtener métricas del bot:", error);
    return NextResponse.json({ ok: false, error: error.message || "Error al cargar métricas" }, { status: 500 });
  }
}