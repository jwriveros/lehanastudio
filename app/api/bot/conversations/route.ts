import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export interface ParsedMessage {
  id: number;
  role: "Cliente" | "Bot IA" | "Asesor Humano (Leslie)" | "Herramienta Interna";
  content: string;
  createdAt: string;
  toolDetails?: any;
}

export interface ConversationGroup {
  phone: string;
  totalMessages: number;
  firstMessageAt: string;
  lastMessageAt: string;
  messages: ParsedMessage[];
  transcriptFormatted: string; // Formato de texto continuo para Prompts de IA
}

/**
 * Limpia el contenido de mensajes que contienen prefijos como 'mensaje a responder:' u 'owner='
 */
function cleanMessageContent(rawContent: string): string {
  if (!rawContent) return "";
  let clean = rawContent.trim();

  // Limpiar prefijo 'mensaje a responder:'
  if (clean.toLowerCase().startsWith("mensaje a responder:")) {
    clean = clean.replace(/^mensaje a responder:\s*/i, "");
  }

  // Eliminar pie de teléfono al final del mensaje del cliente si existe
  clean = clean.replace(/\nteléfono:\s*\+?\d+/gi, "").trim();

  // Limpiar prefijo 'owner=' de intervenciones humanas
  if (clean.startsWith("owner=")) {
    clean = clean.replace(/^owner=/i, "").trim();
  }

  return clean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneParam = searchParams.get("phone");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const formatParam = searchParams.get("format"); // 'json' | 'text'

    let query = supabase
      .from("n8n_chat_histories")
      .select("id, session_id, message, created_at")
      .order("created_at", { ascending: true }); // Orden estricto cronológico

    // Filtro por número de teléfono
    if (phoneParam) {
      const cleanPhone = phoneParam.trim().replace(/\s+/g, "");
      query = query.ilike("session_id", `%${cleanPhone}%`);
    }

    // Filtro por rango de fechas
    if (startDateParam && endDateParam) {
      query = query
        .gte("created_at", `${startDateParam}T00:00:00.000Z`)
        .lte("created_at", `${endDateParam}T23:59:59.999Z`);
    }

    const { data: rawHistory, error } = await query;

    if (error) {
      console.error("Error al consultar la tabla n8n_chat_histories:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!rawHistory || rawHistory.length === 0) {
      return NextResponse.json({
        ok: true,
        count: 0,
        conversations: [],
        message: "No se encontraron conversaciones con los filtros proporcionados.",
      });
    }

    // Agrupación de mensajes por sesión / teléfono
    const conversationsMap = new Map<string, ParsedMessage[]>();

    rawHistory.forEach((row) => {
      if (!row.session_id) return;
      const phone = String(row.session_id).trim();

      let type = "";
      let rawContent = "";
      let toolName = "";

      // Parseo seguro de la propiedad message
      if (typeof row.message === "string") {
        try {
          const parsed = JSON.parse(row.message);
          type = parsed.type || "";
          rawContent = parsed.content || "";
          toolName = parsed.name || "";
        } catch {
          rawContent = row.message;
        }
      } else if (typeof row.message === "object" && row.message !== null) {
        const msgObj = row.message as any;
        type = msgObj.type || "";
        rawContent = msgObj.content || "";
        toolName = msgObj.name || "";
      }

      // Clasificación del rol de emisión
      let role: ParsedMessage["role"] = "Bot IA";
      const isOwner = rawContent.startsWith("owner=");

      if (type === "human" || type === "user") {
        role = "Cliente";
      } else if (isOwner) {
        role = "Asesor Humano (Leslie)";
      } else if (type === "tool" || type === "tool_call" || toolName) {
        role = "Herramienta Interna";
      } else {
        role = "Bot IA";
      }

      const cleanedContent = cleanMessageContent(rawContent);

      // Omitir llamadas a herramientas que solo contienen logs muy extensos
      if (role === "Herramienta Interna" && cleanedContent.length > 500) {
        return;
      }

      const parsedMsg: ParsedMessage = {
        id: row.id,
        role,
        content: cleanedContent,
        createdAt: row.created_at,
      };

      if (!conversationsMap.has(phone)) {
        conversationsMap.set(phone, []);
      }

      conversationsMap.get(phone)!.push(parsedMsg);
    });

    // Formatear el resultado final por conversación
    const conversations: ConversationGroup[] = Array.from(conversationsMap.entries()).map(
      ([phone, messages]) => {
        const firstMessageAt = messages[0]?.createdAt || "—";
        const lastMessageAt = messages[messages.length - 1]?.createdAt || "—";

        // Generar un diálogo en texto plano optimizado para LLMs / Agentes
        const transcriptLines = messages.map((m) => {
          const dateObj = new Date(m.createdAt);
          const timeFormatted = dateObj.toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          return `[${timeFormatted}] ${m.role}: ${m.content}`;
        });

        const transcriptFormatted = `--- INICIO CONVERSACIÓN CON: ${phone} ---\n` +
          transcriptLines.join("\n") +
          `\n--- FIN CONVERSACIÓN ---`;

        return {
          phone,
          totalMessages: messages.length,
          firstMessageAt,
          lastMessageAt,
          messages,
          transcriptFormatted,
        };
      }
    );

    // Si la llamada solicita format=text, devolvemos el diálogo directamente
    if (formatParam === "text") {
      const fullText = conversations.map((c) => c.transcriptFormatted).join("\n\n");
      return new NextResponse(fullText, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({
      ok: true,
      count: conversations.length,
      conversations,
    });
  } catch (error: any) {
    console.error("Error en API /api/bot/conversations:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al procesar conversaciones." },
      { status: 500 }
    );
  }
}