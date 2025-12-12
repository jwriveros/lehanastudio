// jwriveros/lehanastudio/lehanastudio-96f5232a8f8811af1eab69428dde275c2bc1a958/components/ChatPanel.tsx
"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isStaffMessage, getSenderRole, normalizePhone } from "@/lib/chatUtils";

type Tab = "active" | "abandoned" | "reservations";

export type ChatStatus =
  | "active"
  | "new"
  | "bot_active"
  | "agent_active"
  | "pending_agent"
  | "resolved";

export type ChatUser = {
  id: string;
  cliente: string;
  phone: string;
  lastMessage: string;
  unread: number;
  status: ChatStatus;
  lastActivity: string;
};


export type ChatMessage = {
  id?: number;
  from: "client" | "staff";
  text: string;
  created_at: string;
};



interface ChatPanelProps {
}

export function ChatPanel() {
  const [tab, setTab] = useState<Tab>("active");
  const [threads, setThreads] = useState<ChatUser[]>([]); // Initialize as empty array
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  // --- MODO MÓVIL (solo vista tipo WhatsApp) ---
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads function
  const fetchThreads = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingThreads(true);
    const { data: chatSessions, error: sessionsError } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (sessionsError) {
      console.error("Error fetching chat sessions:", sessionsError.message || JSON.stringify(sessionsError));
      if (showLoading) setLoadingThreads(false);
      return;
    }    let fetchedThreads: ChatUser[] = [];

    if (chatSessions && chatSessions.length > 0) {
      const phones = chatSessions.map((s: any) => s.client_phone);
      const { data: clientsData } = await supabase
        .from("clients")
        .select("nombre, numberc")
        .in("numberc", phones);

      const clientsMap = new Map<string, string>();
      if (clientsData) {
        clientsData.forEach((c: any) => {
          if (c.numberc) clientsMap.set(c.numberc, c.nombre);
        });
      }

      fetchedThreads = chatSessions.map((session: any) => ({
        id: session.client_phone,
        cliente:
          clientsMap.get(session.client_phone) ||
          `Cliente (${session.client_phone})`,
        phone: session.client_phone,
        lastMessage: session.last_message || "",
        unread: session.unread_count || 0,
        status: session.status as ChatStatus,
        lastActivity: session.updated_at,
      }));
    }

    setThreads(fetchedThreads);
    if (showLoading) setLoadingThreads(false);
  }, []); // Empty dependency array as it only uses supabase and states set within the component, which are stable.
  
  // Detectar si la vista es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768); // < 768px = móvil
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initial fetch of threads on component mount
  useEffect(() => {
    fetchThreads();
  }, []);

  // ---------------------- 2. Realtime lista (unread + nuevos hilos) ----------------------
  useEffect(() => {
    const globalChannel = supabase
      .channel("mensajes_global_panel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mensajes" },
        (payload) => {
          console.log("CAMBIO EN MENSAJES:", payload);
          fetchThreads(false); // Re-fetch all threads silently
        }
      )
      .subscribe();

    // New Realtime listener for chat_sessions table status changes
    const sessionStatusChannel = supabase
      .channel("chat_sessions_status_panel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_sessions" },
        (payload) => {
          const updatedSession = payload.new as any;
          const phoneNorm = normalizePhone(updatedSession.client_phone);
          if (!phoneNorm) return;

          setThreads((prev) =>
            prev.map((thread) =>
              thread.id === phoneNorm
                ? {
                    ...thread,
                    status: updatedSession.status as ChatStatus,
                    lastActivity: updatedSession.updated_at || thread.lastActivity,
                  }
                : thread
            )
          );
        }
      )
      .subscribe();
    
    // New Realtime listener for booking_request table changes
    const bookingRequestChannel = supabase
      .channel("booking-request-updates")
      .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "booking_request",
      },
      (payload) => {
        console.log("CAMBIO EN RESERVACIONES:", payload);

        // vuelve a cargar las reservas
        fetchThreads(false);
      }
    )
    .subscribe();


    return () => {
      supabase.removeChannel(globalChannel);
      supabase.removeChannel(sessionStatusChannel); // Cleanup new channel
      supabase.removeChannel(bookingRequestChannel); // Cleanup booking request channel
    };
  }, [fetchThreads]); // Removed clientCache as it was unused

  // ---------------------- 3. Realtime del chat activo ----------------------
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);

      const activeThread = threads.find((t) => t.id === activeId);
      if (!activeThread) {
        setLoadingMessages(false);
        return;
      }

      const cleanPhone = activeThread.phone;
      const plusPhone = `+${cleanPhone}`;

      const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .or(
          `client_phone.eq.${cleanPhone},client_phone.eq.${plusPhone},client_id.eq.${activeId}`
        )
        .order("created_at", { ascending: true });

      if (error) console.error(error);

      if (data) {
        const uiMessages: ChatMessage[] = data.map((m: any) => ({
          id: m.id,
          from: getSenderRole(m),
          text: m.content || m.text || m.message || "",
          created_at: m.created_at,
        }));
        setMessages(uiMessages);
      }

      setLoadingMessages(false);
    };

    fetchMessages();

    const activeThread = threads.find((t) => t.id === activeId);
    if (!activeThread) return;

    const normalizedPhones = [
      activeThread.phone,
      activeThread.phone.replace(/\D/g, ""),
      `+${activeThread.phone}`,
    ]
      .filter(Boolean)
      .map((p) => normalizePhone(p));

    const channel = supabase
      .channel(`realtime:mensajes:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        (payload) => {
          const newMsg = payload.new as any;
          const incomingPhone = normalizePhone(newMsg.client_phone);

          const belongsToChat =
            newMsg.client_id === activeId ||
            (incomingPhone && normalizedPhones.includes(incomingPhone));

          if (!belongsToChat) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            return [
              ...prev,
              {
                id: newMsg.id,
                from: getSenderRole(newMsg),
                text: newMsg.content || newMsg.text || newMsg.message || "",
                created_at: newMsg.created_at,
              },
            ];
          });

          setThreads((prev) =>
            prev.map((thread) =>
              thread.id === activeId
                ? {
                    ...thread,
                    lastMessage:
                      newMsg.content || newMsg.text || thread.lastMessage,
                    lastActivity:
                      newMsg.created_at || new Date().toISOString(),
                    unread:
                      getSenderRole(newMsg) === "client"
                        ? thread.unread + 1
                        : thread.unread,
                  }
                : thread
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, threads]);

  // ---------------------- 4. Scroll automático ----------------------
  useEffect(() => {
    if (activeId && messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "instant",
          block: "end",
        });
      });
    }
  }, [activeId, messages.length, loadingMessages]);

  // ---------------------- 5. Enviar mensaje ----------------------
  const sendMessage = async () => {
    if (!inputText.trim() || !activeId) return;

    const activeThread = threads.find((t) => t.id === activeId);
    if (!activeThread) return;

    const payload = {
      client_phone: activeThread.phone,
      content: inputText,
    };

    setInputText("");
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });

    await fetch("/api/whatsapp/outgoing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 🔥 Actualizar session como agent_active
    await supabase
      .from("chat_sessions")
      .update({
        status: "agent_active",
        last_agent_message_at: new Date().toISOString()
      })
      .eq("client_phone", activeThread.phone);

  };

const handleThreadClick = async (id: string) => {
  setActiveId(id);

  // Si estoy en celular → abrir modo chat
  if (isMobileView) {
    setShowMobileChat(true);
  }

  // 🔥 Marcar sesión como agent_active
  await supabase
    .from("chat_sessions")
    .update({
      status: "agent_active",
      last_agent_message_at: new Date().toISOString()
    })
    .eq("client_phone", id);

  setThreads(prev =>
    prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t))
  );
};

  const handleResolveChat = async () => {
    if (
      !activeId ||
      !confirm(
        "¿Estás seguro de marcar este chat como resuelto? Desaparecerá de la lista activa."
      )
    ) return;

    // 🔥 LLAMADA AL ENDPOINT DE API (USANDO SERVICE ROLE KEY)
    const response = await fetch("/api/chat/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneId: activeId }), // activeId es el número de teléfono sin el '+'
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error de red o JSON inválido." }));
        console.error("Error al resolver chat:", errorData);
        alert(`Error al resolver chat. Revisa la consola del navegador para más detalles.`);
        return; 
    }

    const result = await response.json();
    
    if (result.success !== true) {
        alert("Error desconocido al resolver el chat en el servidor.");
        return;
    }
    
    // ** ESTA ES LA COMPROBACIÓN FINAL **
    // Si la API tuvo éxito, actualizamos el estado local de este hilo a 'resolved'.
    setThreads((prev) => 
        prev.map((t) => (t.id === activeId ? { ...t, status: "resolved" as ChatStatus, unread: 0 } : t))
    );
    setActiveId(null); // Deseleccionamos el chat
  };


  const currentChat = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [activeId, threads]
  );

  // ---------------------- 6. UI ----------------------
  // ---------------------- FILTRO DE THREADS ----------------------
const filteredThreads = threads.filter((t) => {
  if (tab === "active") {
    return (
      t.status === "active" ||
      t.status === "agent_active" ||
      t.status === "bot_active" ||
      t.status === "new"
    );
  }

  if (tab === "reservations") {
    return t.status === "pending_agent";
  }

  if (tab === "abandoned") {
    return (
      t.status === "resolved"
    );
  }

  return true;
});

  return (
    <div
        className="flex flex-col w-full h-full min-h-0 overflow-hidden"
      >
      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-white">
        {(["active", "reservations", "abandoned"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              tab === t
                ? "bg-indigo-200 text-indigo-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 w-full min-h-0 overflow-hidden p-4">
          {isMobileView ? (
            <>
              {/* 📱 Vista móvil: SOLO lista de chats */}
              {!showMobileChat && (
                // Usamos la estructura de lista de chats de escritorio adaptada a la vista móvil
                <div className="h-full min-h-0 flex flex-col rounded-2xl border bg-white overflow-hidden">
                  <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-zinc-500">
                      <span>Chats Recientes ({threads.length})</span>
                  </div>
                <div className="flex-1 overflow-y-auto divide-y">
                  {loadingThreads ? (
                    <p className="p-4 text-sm text-zinc-400">Cargando chats...</p>
                  ) : filteredThreads.length === 0 ? (
                    <p className="p-4 text-sm text-zinc-500">No hay hilos en esta pestaña.</p>
                  ) : (
                    filteredThreads.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleThreadClick(chat.id)}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                          activeId === chat.id
                            ? "bg-indigo-50 border-l-4 border-indigo-500"
                            : "border-l-4 border-transparent hover:bg-zinc-50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className={`truncate ${
                              chat.unread > 0
                                ? "font-bold text-indigo-800"
                                : "font-semibold"
                            }`}
                          >
                            {chat.cliente}
                          </div>
                          <div className="truncate text-xs text-zinc-500">
                            {chat.lastMessage}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {new Date(chat.lastActivity).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        {chat.unread > 0 && (
                          <span className="flex-shrink-0 ml-2 rounded-full bg-red-500 w-5 h-5 flex items-center justify-center text-white text-xs font-bold">
                            {chat.unread > 9 ? "9+" : chat.unread}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 📱 Vista móvil: SOLO el chat seleccionado */}
            {showMobileChat && currentChat ? (
              <div className="absolute inset-0 z-10 flex flex-col bg-white overflow-hidden"> {/* Usamos absolute inset-0 para la vista completa */}
                <div className="flex items-center justify-between border-b p-4 bg-white shadow-sm">
                  
                  {/* Botón de Atrás y Título */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowMobileChat(false)}
                      className="p-1 rounded-full text-zinc-600 hover:bg-zinc-100 transition"
                      title="Volver a la lista"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    
                    <div>
                      <div className="text-lg font-semibold">
                        {currentChat.cliente}
                      </div>
                      <p className="text-sm text-zinc-500">{currentChat.phone}</p>
                    </div>
                  </div>
                  
                  {/* Acciones (Resolver, WA Web) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResolveChat}
                      className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                      title="Marcar como Resuelto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-check"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <a
                      href={`https://wa.me/${currentChat.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800"
                    >
                      WA Web
                    </a>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 space-y-3">
                  {/* Mensajes (misma lógica de escritorio) */}
                  {loadingMessages ? (
                    <p className="text-center text-xs text-zinc-400">Cargando...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-zinc-400 py-10">
                      No hay mensajes previos.
                    </p>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.from === "client" ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow ${
                            msg.from === "client"
                              ? "bg-white border"
                              : "bg-indigo-600 text-white"
                          }`}
                        >
                          <div>{msg.text}</div>
                          <div className="text-[10px] mt-1 text-right opacity-60">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl border px-4 py-3 text-sm"
                      placeholder="Escribe un mensaje..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button
                      onClick={sendMessage}
                      className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Si no hay chat activo y estamos en vista móvil, se muestra un mensaje */
              showMobileChat && (
                <div className="flex items-center justify-center rounded-2xl border text-sm text-zinc-500 h-full">
                  Selecciona un cliente o usa el botón Atrás.
                  <button onClick={() => setShowMobileChat(false)} className="ml-2 text-indigo-600 underline">Volver</button>
                </div>
              )
            )}
          </>
        ) : (
    /* 🖥 Desktop: vista doble */
    <div className="grid h-full w-full gap-4 grid-cols-[1fr_1.3fr] overflow-hidden">
      {/* ⬇️ LISTA DE CHATS */}
     <div className="flex flex-col rounded-2xl border bg-white overflow-hidden h-full min-h-0">
          <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-zinc-500">
            <span>Chats Recientes ({threads.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {loadingThreads ? (
              <p className="p-4 text-sm text-zinc-400">Cargando chats...</p>
            ) : threads.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">No hay hilos.</p>
            ) : (
              
              filteredThreads.map((chat) => (
                
                <div
                  key={chat.id}
                  onClick={() => handleThreadClick(chat.id)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                    activeId === chat.id
                      ? "bg-indigo-50 border-l-4 border-indigo-500"
                      : "border-l-4 border-transparent hover:bg-zinc-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate ${
                        chat.unread > 0
                          ? "font-bold text-indigo-800"
                          : "font-semibold"
                      }`}
                    >
                      {chat.cliente}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {chat.lastMessage}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {new Date(chat.lastActivity).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {chat.unread > 0 && (
                    <span className="flex-shrink-0 ml-2 rounded-full bg-red-500 w-5 h-5 flex items-center justify-center text-white text-xs font-bold">
                      {chat.unread > 9 ? "9+" : chat.unread}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      {/* ⬇️ PANEL DE CHAT */}
      {/* Panel de mensajes */}
        {currentChat ? (
          <div className="flex flex-col rounded-2xl border bg-white overflow-hidden h-full min-h-0">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResolveChat}
                  className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                  title="Marcar como Resuelto"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-check"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </button>

                <div>
                  <div className="text-lg font-semibold">
                    {currentChat.cliente}
                  </div>
                  <p className="text-sm text-zinc-500">{currentChat.phone}</p>
                </div>
              </div>

              <a
                href={`https://wa.me/${currentChat.phone}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800"
              >
                Abrir WhatsApp Web
              </a>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 space-y-3">
              {loadingMessages ? (
                <p className="text-center text-xs text-zinc-400">Cargando...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-zinc-400 py-10">
                  No hay mensajes previos.
                </p>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.from === "client" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow ${
                        msg.from === "client"
                          ? "bg-white border"
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      <div>{msg.text}</div>
                      <div className="text-[10px] mt-1 text-right opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border px-4 py-3 text-sm"
                  placeholder="Escribe un mensaje..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="rounded-xl bg-indigo-600 px-6 py-2 text-sm text-white"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border text-sm text-zinc-500">
            Selecciona un cliente.
          </div>
        )}
      </div>
  )}
</div>
        

        
    </div>
  );
}