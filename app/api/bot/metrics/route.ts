import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export interface TodayClientDetail {
  phone: string;
  messageCount: number;
  lastTime: string;
}

/**
 * Normaliza un texto eliminando tildes y caracteres especiales
 */
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

    // 1. Configuración de rango de fechas (YYYY-MM-DD)
    const now = new Date();
    const defaultToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const startDate = startDateParam || defaultToday;
    const endDate = endDateParam || startDate;

    const startISO = `${startDate}T00:00:00.000Z`;
    const endISO = `${endDate}T23:59:59.999Z`;

    // 2. Consulta de historial de chats en n8n_chat_histories
    const { data: n8nHistory, error: n8nError } = await supabase
      .from("n8n_chat_histories")
      .select("session_id, message, bot, created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: true });

    if (n8nError) {
      console.error("Error consultando n8n_chat_histories:", n8nError);
    }

    const clientsMap = new Map<string, { timestamps: string[]; count: number }>();
    const agentTransferSessionIds = new Set<string>();

    const targetPhraseNormalized = "permitame un momento por favor";

    // 3. Procesar chats de n8n_chat_histories
    (n8nHistory || []).forEach((row) => {
      if (!row.session_id) return;

      const phone = String(row.session_id).trim();

      let msgType = "";
      let msgContent = "";

      // Extraer datos del JSON String
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

      // Evaluar si es interacción del Bot / IA
      const isAI = msgType === "ai" || Boolean(row.bot);

      if (isAI) {
        if (!clientsMap.has(phone)) {
          clientsMap.set(phone, { timestamps: [], count: 0 });
        }

        const clientData = clientsMap.get(phone)!;
        clientData.count += 1;
        if (row.created_at) clientData.timestamps.push(row.created_at);

        // Detectar si fue enviado a agente humano
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

    // 4. Consulta a la vista unificada de sesiones
    const { data: enrichedSessionsData, error: sessionsError } = await supabase
      .from("view_chat_sessions_full")
      .select("id, client_phone, status, active_agent, context_summary, updated_at")
      .gte("updated_at", startISO)
      .lte("updated_at", endISO)
      .order("updated_at", { ascending: false });

    if (sessionsError) console.error("Error en view_chat_sessions_full:", sessionsError);

    // 5. Respaldar clientes desde 'view_chat_sessions_full' si n8n_chat_histories no tiene registros en el rango
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

    // 6. Formatear lista final de clientes
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

    // 7. Consultar reservas de appointments
    const [{ count: reservationsByBot }, { count: totalReservations }, { count: followupsSent }] = await Promise.all([
      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("created_by", "BOT")
        .gte("created_at", startISO)
        .lte("created_at", endISO),

      supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startISO)
        .lte("created_at", endISO),

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
    console.error("Error obteniendo métricas del bot:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error cargando métricas" },
      { status: 500 }
    );
  }
}