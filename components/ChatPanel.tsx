// jwriveros/lehanastudio/lehanastudio-96f5232a8f8811af1eab69428dde275c2bc1a958/components/ChatPanel.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type Tab = "active" | "abandoned" | "reservations";

type ChatStatus =
  | "active"
  | "new"
  | "bot_active"
  | "agent_active"
  | "pending_agent"
  | "resolved";

type ChatUser = {
  id: string;
  cliente: string;
  phone: string;
  lastMessage: string;
  unread: number;
  status: ChatStatus;
  lastActivity: string;
};


type ChatMessage = {
  id?: number;
  from: "client" | "staff";
  text: string;
  created_at: string;
};

// ---------- Helpers de remitente ----------
const isStaffMessage = (m: any) =>
  m.sender_role === "staff" ||
  m.sender_role === "agent" ||
  m.direction === "outbound";

const getSenderRole = (m: any): "client" | "staff" =>
  isStaffMessage(m) ? "staff" : "client";

// ---------- Helper de normalización de teléfono ----------
const normalizePhone = (phone: any) =>
  String(phone || "")
    .replace(/\D/g, "") // quitar todo lo que no es número
    .replace(/^57/, "57"); // dejamos 57 al inicio si está, solo limpiamos símbolos

export function ChatPanel() {
  const [tab, setTab] = useState<Tab>("active");
  const [threads, setThreads] = useState<ChatUser[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // cache de clientes disponible para realtime
  const [clientCache, setClientCache] = useState<Map<string, string>>(
    () => new Map()
  );

  // ---------------------- 1. Cargar lista de hilos (CORREGIDO PARA INCLUIR PENDING_AGENT) ----------------------
  useEffect(() => {
    const fetchThreads = async () => {
      setLoadingThreads(true);

      // 1. Clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("nombre, nombre_comercial, numberc, celular, telefono");

      if (clientsError) {
        console.error("Error cargando clients:", clientsError);
      }

      const cache = new Map<string, string>();

      if (clientsData) {
        clientsData.forEach((c: any) => {
          const rawPhone =
            c.numberc ??
            c.celular ??
            c.telefono ??
            null;

          const phone = normalizePhone(rawPhone);
          if (!phone) return;

          const nombre: string =
            c.nombre ||
            c.nombre_comercial ||
            "";

          if (nombre) {
            cache.set(phone, nombre);
          }
        });
      }

      // guardamos el cache para realtime
      setClientCache(cache);

      // 2. Mensajes para construir hilos (solo necesitamos los más recientes)
      const { data: messagesData, error: messagesError } = await supabase
        .from("mensajes")
        .select("client_phone, content, message, created_at, sender_role")
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("Error cargando mensajes:", messagesError);
      }

      // 3. Obtener sesiones de chat (fuente de verdad del estado)
      const { data: sessions, error: sessionsError } = await supabase
        .from("chat_sessions")
        .select("*");

      if (sessionsError) console.error("Error cargando sesiones:", sessionsError);

      // Convertir en map para acceso rápido:
      const sessionMap = new Map<string, any>();
      const threadsMap = new Map<string, ChatUser>(); // Usaremos este mapa para construir la lista final

      if (sessions) {
        sessions.forEach((s) => {
          const phoneNorm = normalizePhone(s.client_phone);
          if (!phoneNorm) return;
          
          sessionMap.set(phoneNorm, s); 

          const realStatus = s.status as ChatStatus;

          // CORRECCIÓN CLAVE: Inicializamos el hilo con data de la sesión (status, cliente)
          if (realStatus !== 'resolved') {
             const clientName = cache.get(phoneNorm) || cache.get(phoneNorm.slice(-10));
             const finalName = clientName && clientName.length > 0 ? clientName : `+${phoneNorm}`;
             
             threadsMap.set(phoneNorm, {
                id: phoneNorm,
                cliente: finalName,
                phone: phoneNorm,
                lastMessage: s.last_menu_sent || "Esperando mensaje...", 
                lastActivity: s.updated_at, 
                unread: 0, 
                status: realStatus, 
             });
          }
        });
      }


      // 4. Recorrer los mensajes para ENRIQUECER los hilos y agregar nuevos si es necesario
      if (messagesData) {
        messagesData.forEach((m: any) => {
          const phoneNorm = normalizePhone(m.client_phone);
          if (!phoneNorm) return;

          const session = sessionMap.get(phoneNorm);
          const realStatus = session?.status as ChatStatus || "active" as ChatStatus;
          const isClientMsg = getSenderRole(m) === "client";
          
          if (realStatus === 'resolved') return;

          // Si el hilo ya existe (lo agregamos desde sessions)
          if (threadsMap.has(phoneNorm)) {
            const existing = threadsMap.get(phoneNorm)!;
            
            // Aseguramos que la última actividad y mensaje sea del mensaje más reciente
            // Usamos m.created_at ya que messagesData está ordenado descendente
            if (m.created_at > existing.lastActivity) {
                existing.lastMessage = m.content || m.message || "";
                existing.lastActivity = m.created_at;
                // Si el último mensaje es del cliente, marcamos como 1 no leído (luego Realtime lo acumula)
                existing.unread = isClientMsg ? 1 : 0; 
            }

          } else {
            // Si el hilo no existe (es un hilo muy nuevo sin sesión o que el default debe ser 'active')
            const clientName = cache.get(phoneNorm) || cache.get(phoneNorm.slice(-10));
            const finalName = clientName && clientName.length > 0 ? clientName : `+${phoneNorm}`;

            threadsMap.set(phoneNorm, {
                id: phoneNorm,
                cliente: finalName,
                phone: phoneNorm,
                lastMessage: m.content || m.message || "",
                lastActivity: m.created_at,
                unread: isClientMsg ? 1 : 0,
                status: realStatus, 
            });
          }
        });
      }


      const list = Array.from(threadsMap.values()).sort((a, b) =>
        a.lastActivity > b.lastActivity ? -1 : 1
      );

      setThreads(list);

      setLoadingThreads(false);
    };

    fetchThreads();
  }, [activeId]);

  // ---------------------- 2. Realtime lista (unread + nuevos hilos) ----------------------
  useEffect(() => {
    const globalChannel = supabase
      .channel("mensajes_global_panel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        (payload) => {
          const n = payload.new as any;
          const phoneNorm = normalizePhone(n.client_phone);
          if (!phoneNorm) return;

          setThreads((prev) => {
            const exists = prev.find((t) => t.id === phoneNorm);
            const isClientMsg = getSenderRole(n) === "client";

            const clientName =
              clientCache.get(phoneNorm) ||
              clientCache.get(phoneNorm.slice(-10));

            const finalName =
              clientName && clientName.length > 0
                ? clientName
                : `Cliente (${phoneNorm})`;

            // nuevo hilo
            if (!exists) {
              return [
                {
                  id: phoneNorm,
                  cliente: finalName,
                  phone: phoneNorm,
                  lastMessage: n.content || n.message,
                  lastActivity: n.created_at,
                  unread: isClientMsg ? 1 : 0,
                  status: "active" as ChatStatus,
                },
                ...prev,
              ];
            }

            // actualizar hilo existente
            const updated = prev.map((t) =>
              t.id === phoneNorm
                ? {
                    ...t,
                    cliente: finalName, // por si ahora sí tenemos el nombre
                    lastMessage: n.content || n.message,
                    lastActivity: n.created_at,
                    unread: isClientMsg ? t.unread + 1 : t.unread,
                  }
                : t
            );

            return updated.sort((a, b) =>
              a.lastActivity > b.lastActivity ? -1 : 1
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [clientCache]);

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

  // 🔥 Marcar sesión como agent_active
  await supabase
    .from("chat_sessions")
    .update({
      status: "agent_active",
      last_agent_message_at: new Date().toISOString()
    })
    .eq("client_phone", id);

  setThreads((prev) =>
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
    <div className="flex flex-col w-full h-full overflow-hidden">
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
      <div className="grid flex-1 w-full gap-4 grid-cols-1 lg:grid-cols-[1fr_1.3fr] overflow-hidden p-4">
        {/* Lista de chats */}
        <div className="flex flex-col rounded-2xl border bg-white overflow-hidden h-full">
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

        {/* Panel de mensajes */}
        {currentChat ? (
          <div className="flex flex-col rounded-2xl border bg-white overflow-hidden h-full">
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
    </div>
  );
}