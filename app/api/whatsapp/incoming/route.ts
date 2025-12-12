import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseClient";

// Helper to normalize phone numbers to a consistent format (e.g., just digits)
function normalizePhoneNumber(phone: string): string {
  // Remove "whatsapp:" prefix and any non-digit characters
  return phone.replace(/^whatsapp:/, "").replace(/\D/g, "");
}

interface WhatsappWebhookPayload {
  from: string; // e.g., "whatsapp:+1234567890"
  text: string;
  timestamp: string; // ISO string or Unix timestamp, assuming ISO string for now
  // Add other fields as they become relevant, e.g., media, message_id, profile_name
  profileName?: string;
  messageId?: string;
}

export async function POST(request: Request) {
  const payload: WhatsappWebhookPayload = await request.json();

  if (!supabaseAdmin) {
    console.error("Supabase Admin client not initialized.");
    return NextResponse.json({ error: "Supabase Admin client not configured." }, { status: 500 });
  }

  try {
    const clientPhone = normalizePhoneNumber(payload.from);
    const messageContent = payload.text;
    const receivedAt = new Date(payload.timestamp).toISOString(); // Ensure ISO format

    if (!clientPhone || !messageContent) {
      return NextResponse.json({ error: "Missing 'from' or 'text' in payload." }, { status: 400 });
    }

    // 1. Find or Create Client
    let clientData;
    const { data: existingClients, error: clientFetchError } = await supabaseAdmin
      .from("clients")
      .select("id, nombre, celular")
      .eq("celular", clientPhone)
      .single();

    if (clientFetchError && clientFetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error("Error fetching client:", clientFetchError);
      throw new Error(clientFetchError.message);
    }

    if (existingClients) {
      clientData = existingClients;
    } else {
      const newClientName = payload.profileName || `Cliente ${clientPhone}`;
      const { data: newClient, error: newClientError } = await supabaseAdmin
        .from("clients")
        .insert({
          celular: clientPhone,
          nombre: newClientName,
          tipo: "WhatsApp",
          estado: "activo",
          indicador: clientPhone.startsWith('+') ? clientPhone.substring(0, clientPhone.length - 10) : '+57', // Attempt to infer indicator
          numberc: clientPhone.slice(-10), // Last 10 digits
          created_at: receivedAt,
        })
        .select("id, nombre, celular")
        .single();

      if (newClientError) {
        console.error("Error creating new client:", newClientError);
        throw new Error(newClientError.message);
      }
      clientData = newClient;
    }

    // 2. Find or Create Chat Session
    let chatSession;
    const { data: existingSession, error: sessionFetchError } = await supabaseAdmin
      .from("chat_sessions")
      .select("*")
      .eq("client_phone", clientPhone)
      .single();

    if (sessionFetchError && sessionFetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error("Error fetching chat session:", sessionFetchError);
      throw new Error(sessionFetchError.message);
    }

    let newStatus: string = "active"; // Default status for incoming messages
    if (existingSession) {
      chatSession = existingSession;
      // Determine new status based on existing session status and message content
      // TODO: Implement more sophisticated status transition logic here.
      // For now, if it was 'bot_active' or 'new', it becomes 'active'.
      // If it was 'pending_agent' or 'agent_active', it remains so.
      // If client sends messages while bot is active, it should perhaps alert an agent
      // User's description: "it stays in pending_active and it should go to Reservations"
      // This implies if it's pending_active, it *should* go to 'pending_agent' on a new message,
      // which would put it in the 'Reservations' tab.
      if (chatSession.status === "bot_active" || chatSession.status === "new") {
          newStatus = "active";
      } else if (chatSession.status === "pending_active") {
          // If a client sends a message when the session is "pending_active",
          // it might mean they are trying to book or respond to a bot query.
          // This should likely trigger a human agent review.
          newStatus = "pending_agent"; // This maps to "Reservations" tab
      } else {
          newStatus = chatSession.status; // Maintain current status if already active/pending agent
      }

    } else {
      // New session
      newStatus = "new"; // Or "active" if it's the first message ever
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

      if (newSessionError) {
        console.error("Error creating new chat session:", newSessionError);
        throw new Error(newSessionError.message);
      }
      chatSession = newSession;
    }

    // 3. Insert Incoming Message
    const { error: messageInsertError } = await supabaseAdmin.from("mensajes").insert({
      client_id: clientData.id,
      client_phone: clientPhone,
      content: messageContent,
      from_client: true, // Mark as sent by client
      created_at: receivedAt,
      message_id: payload.messageId || null, // If available from webhook
    });

    if (messageInsertError) {
      console.error("Error inserting message:", messageInsertError);
      throw new Error(messageInsertError.message);
    }

    // 4. Update Chat Session (if existing)
    if (existingSession) {
      const { error: sessionUpdateError } = await supabaseAdmin
        .from("chat_sessions")
        .update({
          last_message: messageContent,
          last_activity: receivedAt,
          status: newStatus,
          unread_count: (chatSession.unread_count || 0) + 1, // Increment unread count
          updated_at: new Date().toISOString(),
        })
        .eq("client_phone", clientPhone);

      if (sessionUpdateError) {
        console.error("Error updating chat session:", sessionUpdateError);
        throw new Error(sessionUpdateError.message);
      }
    }

    return NextResponse.json({
      received: true,
      processed: true,
      clientPhone,
      newStatus,
      message: "Incoming WhatsApp message processed.",
    }, { status: 200 });

  } catch (err: any) {
    console.error("Fatal error in whatsapp/incoming webhook:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}