import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseClient";

// Helper para normalizar números de teléfono
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/^whatsapp:/, "").replace(/\D/g, "");
}

interface WhatsappWebhookPayload {
  from: string;
  text: string;
  timestamp: string;
  profileName?: string;
  messageId?: string;
}

export async function POST(request: Request) {
  const payload: WhatsappWebhookPayload = await request.json();

  if (!supabaseAdmin) {
    console.error("Supabase Admin client no inicializado.");
    return NextResponse.json({ error: "Configuración de Supabase incompleta." }, { status: 500 });
  }

  try {
    const clientPhone = normalizePhoneNumber(payload.from);
    const messageContent = payload.text;
    const receivedAt = new Date(payload.timestamp).toISOString();

    if (!clientPhone || !messageContent) {
      return NextResponse.json({ error: "Faltan datos obligatorios (from/text)." }, { status: 400 });
    }

    // 1. Buscar o Crear Cliente
    let clientData;
    const { data: existingClient, error: clientFetchError } = await supabaseAdmin
      .from("clients")
      .select("id, nombre, celular")
      .eq("celular", clientPhone)
      .maybeSingle();

    if (clientFetchError) throw new Error(clientFetchError.message);

    if (existingClient) {
      clientData = existingClient;
    } else {
      const { data: newClient, error: newClientError } = await supabaseAdmin
        .from("clients")
        .insert({
          celular: clientPhone,
          nombre: payload.profileName || `Cliente ${clientPhone}`,
          tipo: "WhatsApp",
          estado: "activo",
          indicador: clientPhone.length > 10 ? clientPhone.slice(0, -10) : "57",
          numberc: clientPhone.slice(-10),
          created_at: receivedAt,
        })
        .select("id, nombre, celular")
        .single();

      if (newClientError) throw new Error(newClientError.message);
      clientData = newClient;
    }

    // 2. Buscar o Crear Sesión de Chat
    let chatSession;
    const { data: existingSession, error: sessionFetchError } = await supabaseAdmin
      .from("chat_sessions")
      .select("*")
      .eq("client_phone", clientPhone)
      .maybeSingle();

    if (sessionFetchError) throw new Error(sessionFetchError.message);

    let newStatus: string = "active";
    
    if (existingSession) {
      chatSession = existingSession;
      // Lógica de estados corregida:
      // Si está en 'pending_active' (bot trabajando), un nuevo mensaje lo mueve a 'pending_agent' (Reservas)
      if (chatSession.status === "bot_active" || chatSession.status === "new" || chatSession.status === "pending_active") {
        newStatus = "pending_agent"; 
      } else {
        newStatus = chatSession.status;
      }

      const { error: sessionUpdateError } = await supabaseAdmin
        .from("chat_sessions")
        .update({
          last_message: messageContent,
          last_activity: receivedAt,
          status: newStatus,
          unread_count: (chatSession.unread_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("client_phone", clientPhone);

      if (sessionUpdateError) throw new Error(sessionUpdateError.message);
    } else {
      newStatus = "pending_agent"; // Nueva sesión directo a Reservas
      const { data: newSession, error: newSessionError } = await supabaseAdmin
        .from("chat_sessions")
        .insert({
          client_id: clientData.id,
          client_phone: clientPhone,
          last_message: messageContent,
          last_activity: receivedAt,
          status: newStatus,
          unread_count: 1,
        })
        .select("*")
        .single();

      if (newSessionError) throw new Error(newSessionError.message);
      chatSession = newSession;
    }

    // 3. Insertar el Mensaje
    const { error: messageInsertError } = await supabaseAdmin.from("mensajes").insert({
      client_id: clientData.id,
      client_phone: clientPhone,
      content: messageContent,
      from_client: true,
      created_at: receivedAt,
      message_id: payload.messageId || null,
    });

    if (messageInsertError) throw new Error(messageInsertError.message);

    // 4. REALTIME BROADCAST: Notificar al panel de chat inmediatamente
    await supabaseAdmin.channel("chat-updates").send({
      type: "broadcast",
      event: "new-message",
      payload: {
        phone: clientPhone,
        status: newStatus,
        text: messageContent,
        clientName: clientData.nombre
      },
    });

    return NextResponse.json({ received: true, newStatus }, { status: 200 });

  } catch (err: any) {
    console.error("Error fatal en webhook:", err.message);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}