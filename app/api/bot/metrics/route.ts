import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export interface TodayClientDetail {
  phone: string;
  messageCount: number;
  lastTime: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const defaultToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const startDate = startDateParam || defaultToday;
    const endDate = endDateParam || startDate;

    const startISO = `${startDate}T00:00:00.000Z`;
    const endISO = `${endDate}T23:59:59.999Z`;

    // 1. Consulta de historial de chats
    const { data: n8nHistory, error: n8nError } = await supabase
      .from("n8n_chat_histories")
      .select("session_id, message, created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: true });

    if (n8nError) {
      console.error("Error consultando n8n_chat_histories:", n8nError);
    }

    const clientsMap = new Map<string, { timestamps: string[]; count: number }>();
    const agentTransferSessionIds = new Set<string>();
    const targetPhraseNormalized = "permitame un momento por favor";

    (n8nHistory || []).forEach((row) => {
      if (!row.session_id) return;

      const phone = String(row.session_id).trim();
      let msgType = "";
      let msgContent = "";

      if (typeof row.message === "string") {
        try {
          const parsed = JSON.parse(row.message);
          msgType = parsed.type || "";
          msgContent = parsed.content || "";
        } catch {
          msgContent = row.message;
        }
      } else if (typeof row.message === "object" && row.message !== null) {
        const msgObj = row.message as any;
        msgType = msgObj.type || "";
        msgContent = msgObj.content || "";
      }

      const isAI = msgType === "ai" && !msgContent.startsWith("owner=");

      if (isAI) {
        if (!clientsMap.has(phone)) {
          clientsMap.set(phone, { timestamps: [], count: 0 });
        }

        const clientData = clientsMap.get(phone)!;
        clientData.count += 1;
        if (row.created_at) clientData.timestamps.push(row.created_at);

        const normalizedContent = normalizeText(msgContent);
        if (
          normalizedContent.includes(targetPhraseNormalized) ||
          normalizedContent.includes("enviar_asesor")
        ) {
          agentTransferSessionIds.add(phone);
        }
      }
    });

    const formatTime = (isoString: string) => {
      return new Date(isoString).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const { data: enrichedSessionsData, error: sessionsError } = await supabase
      .from("view_chat_sessions_full")
      .select("id, client_phone, status, active_agent, context_summary, updated_at")
      .gte("updated_at", startISO)
      .lte("updated_at", endISO)
      .order("updated_at", { ascending: false });

    if (sessionsError) {
      console.error("Error en view_chat_sessions_full:", sessionsError);
    }

    if (clientsMap.size === 0 && enrichedSessionsData && enrichedSessionsData.length > 0) {
      enrichedSessionsData.forEach((s) => {
        if (!s.client_phone) return;
        const phone = String(s.client_phone).trim();
        if (!clientsMap.has(phone)) {
          clientsMap.set(phone, { 
            timestamps: [s.updated_at || new Date().toISOString()], 
            count: 1 
          });
        }
        if (s.status === "agent_active" || s.active_agent) {
          agentTransferSessionIds.add(phone);
        }
      });
    }

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

    // 🌸 CONSULTAS A APPOINTMENTS (BOT, FLOW Y TOTALES)
    const [
      { count: reservationsByBot }, 
      { count: reservationsByFlow }, 
      { count: totalReservations }, 
      { count: followupsSent }
    ] = await Promise.all([
      // 1. Citas creadas por el BOT
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .ilike("created_by", "bot")
        .gte("last_synced_at", `${startDate} 00:00:00`)
        .lte("last_synced_at", `${endDate} 23:59:59`),

      // 2. Citas creadas por WHATSAPP FLOW (created_by = "FLOW")
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .ilike("created_by", "flow")
        .gte("last_synced_at", `${startDate} 00:00:00`)
        .lte("last_synced_at", `${endDate} 23:59:59`),

      // 3. Citas totales en el rango de fechas
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("last_synced_at", `${startDate} 00:00:00`)
        .lte("last_synced_at", `${endDate} 23:59:59`),

      // 4. Seguimientos enviados
      supabase
        .from("seguimientos_enviados")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startISO)
        .lte("created_at", endISO)
    ]);

    const enrichedSessions = (enrichedSessionsData || []).map((session) => ({
      id: session.id,
      client_phone: session.client_phone,
      status: session.status,
      active_agent: session.active_agent,
      context_summary: session.context_summary,
      last_bot_message_at: session.updated_at ? formatTime(session.updated_at) : "—",
    }));

    const botCount = reservationsByBot || 0;
    const flowCount = reservationsByFlow || 0;
    const totalCount = totalReservations || 0;

    // Cálculo del porcentaje de conversión combinado (Bot + Flow sobre clientes atendidos)
    const totalBotAndFlowReservations = botCount + flowCount;
    const conversionRate = totalClientsToday > 0 
      ? Number(((totalBotAndFlowReservations / totalClientsToday) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      ok: true,
      metrics: {
        totalClientsToday,
        firstInteractionTime,
        lastInteractionTime,
        agentTransfersCount,
        reservationsByBot: botCount,
        reservationsByFlow: flowCount, // 🌸 Nuevo campo
        totalReservations: totalCount,
        followupsSent: followupsSent || 0,
        conversionRate,
      },
      todayClientsDetail,
      sessions: enrichedSessions,
    });
  } catch (error: any) {
    console.error("Error obteniendo métricas del bot:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error cargando métricas" },
      { status: 500 }
    );
  }
}