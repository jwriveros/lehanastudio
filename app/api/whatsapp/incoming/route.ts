// app/api/whatsapp/incoming/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseClient";

/**
 * Normaliza el número de teléfono:
 * Quita el prefijo "whatsapp:", elimina espacios/guiones,
 * pero mantiene los números y el símbolo "+" inicial.
 */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/^whatsapp:/, "").replace(/[^\d+]/g, "");
}

export async function POST(request: Request) {
  // 1. Validar cliente de Supabase Admin
  if (!supabaseAdmin) {
    console.error("Supabase Admin client no inicializado.");
    return NextResponse.json({ error: "Configuración de Supabase incompleta." }, { status: 500 });
  }

  try {
    const payload = await request.json();
    const clientPhone = normalizePhoneNumber(payload.from);
    const messageContent = payload.text;
    const receivedAt = new Date(payload.timestamp || Date.now()).toISOString();

    console.log("--- PROCESANDO MENSAJE ENTRANTE ---");
    console.log("De:", clientPhone);
    console.log("Contenido:", messageContent);

    if (!clientPhone || !messageContent) {
      return NextResponse.json({ error: "Datos incompletos (from/text)." }, { status: 400 });
    }

    // --- PASO 1: BUSCAR O CREAR CLIENTE ---
    const { data: clientData, error: clientFetchError } = await supabaseAdmin
      .from("clients")
      .select("id, nombre")
      .eq("celular", clientPhone)
      .maybeSingle();

    if (clientFetchError) throw new Error(`Error buscando cliente: ${clientFetchError.message}`);

    let finalClientId;
    if (clientData) {
      finalClientId = clientData.id;
    } else {
      const { data: newClient, error: newClientError } = await supabaseAdmin
        .from("clients")
        .insert({
          celular: clientPhone,
          nombre: payload.profileName || `Cliente ${clientPhone}`,
          tipo: "WhatsApp",
          estado: "activo",
          indicador: "57",
          numberc: clientPhone.slice(-10),
          created_at: receivedAt,
        })
        .select("id")
        .single();

      if (newClientError) throw new Error(`Error creando cliente: ${newClientError.message}`);
      finalClientId = newClient.id;
    }

    // --- PASO 2: BUSCAR O CREAR SESIÓN DE CHAT ---
    const { data: existingSession, error: sessionFetchError } = await supabaseAdmin
      .from("chat_sessions")
      .select("*")
      .eq("client_phone", clientPhone)
      .maybeSingle();

    if (sessionFetchError) throw new Error(`Error buscando sesión: ${sessionFetchError.message}`);

    let newStatus: string = "pending_agent";

    if (existingSession) {
      // Determinar el nuevo estado
      newStatus = existingSession.status === "agent_active" ? "agent_active" : "pending_agent";

      console.log(`Ejecutando incremento RPC para: ${clientPhone}`);
      
      // A. INCREMENTO ATÓMICO (Usa la función SQL que creamos)
      const { error: rpcError } = await supabaseAdmin.rpc('increment_unread_count', { 
        phone_text: clientPhone 
      });

      if (rpcError) {
        console.error("Fallo en RPC increment_unread_count:", rpcError.message);
        // Fallback manual en caso de que el RPC falle
        const currentCount = Number(existingSession.unread_count || 0);
        await supabaseAdmin
          .from("chat_sessions")
          .update({ unread_count: currentCount + 1 })
          .eq("client_phone", clientPhone);
      }

      // B. ACTUALIZAR RESTO DE LA SESIÓN
      const { error: sessionUpdateError } = await supabaseAdmin
        .from("chat_sessions")
        .update({
          last_message: messageContent,
          last_activity: receivedAt,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("client_phone", clientPhone);

      if (sessionUpdateError) throw new Error(`Error update sesión: ${sessionUpdateError.message}`);

    } else {
      // CREAR SESIÓN NUEVA
      console.log(`Creando nueva sesión para: ${clientPhone}`);
      const { error: newSessionError } = await supabaseAdmin
        .from("chat_sessions")
        .insert({
          client_id: finalClientId,
          client_phone: clientPhone,
          last_message: messageContent,
          last_activity: receivedAt,
          status: "pending_agent",
          unread_count: 1,
        });

      if (newSessionError) throw new Error(`Error insert sesión: ${newSessionError.message}`);
    }

    // --- PASO 3: INSERTAR EL MENSAJE EN LA TABLA MENSAJES ---
    const { error: messageInsertError } = await supabaseAdmin.from("mensajes").insert({
      client_phone: clientPhone,
      content: messageContent,
      from_client: true,
      created_at: receivedAt,
      message_id: payload.messageId || null,
    });

    if (messageInsertError) throw new Error(`Error insert mensaje: ${messageInsertError.message}`);

    console.log("--- PROCESO COMPLETADO EXITOSAMENTE ---");
    return NextResponse.json({ ok: true, status: newStatus }, { status: 200 });

  } catch (err: any) {
    console.error("Error fatal en webhook incoming:", err.message);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}