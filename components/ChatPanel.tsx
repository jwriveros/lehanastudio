"use client";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getSenderRole, normalizePhone } from "@/lib/chatUtils";
import {
  ChevronLeft,
  Send,
  ExternalLink,
  CheckCircle,
  Search,
  Inbox,
  Loader2,
} from "lucide-react";

/* =======================
    TIPOS
======================= */
type Tab = "active" | "reservations" | "abandoned";
type Mode = "default" | "reservations";
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
  isBookingOpen?: boolean;
};

export type ChatMessage = {
  id: string | number;
  from: "client" | "staff";
  text: string;
  created_at: string;
};

type BookingContext = {
  servicio: string;
  fecha: string;
  hora: string;
  especialista?: string;
  estado?: string;
} | null;

interface Props {
  mode?: Mode;
  initialThreads: ChatUser[];
}
const getDayLabel = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";
  
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
/* =======================
    COMPONENTE CORREGIDO
======================= */
export function ChatPanel({ mode = "default", initialThreads }: Props) {
  const [tab, setTab] = useState<Tab>("active");
  const [threads, setThreads] = useState<ChatUser[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [bookingContext, setBookingContext] = useState<BookingContext>(null);
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const groupedMessages = useMemo(() => {
  const groups: { [key: string]: ChatMessage[] } = {};
  
  messages.forEach((m) => {
    const label = getDayLabel(m.created_at);
    if (!groups[label]) groups[label] = [];
    groups[label].push(m);
  });
  
  return groups;
}, [messages]);

  // Scroll al fondo optimizado
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  // 1. CARGA DE HILOS (LISTA LATERAL)
const fetchThreads = useCallback(async () => {
  // 1. Obtener sesiones y solicitudes de reserva abiertas simultáneamente
  const [sessionsRes, bookingsRes] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("*")
      .in("status", ["agent_active", "pending_agent", "bot_active"])
      .order("updated_at", { ascending: false }),
    supabase
      .from("booking_requests")
      .select("customer_phone")
      .eq("status", "OPEN") // Filtro crucial: solo solicitudes abiertas
  ]);

  const sessions = sessionsRes.data;
  const openBookings = bookingsRes.data;

  if (!sessions) return;

  // 2. Obtener conteo de mensajes de clientes para cada sesión
  // Contamos los mensajes donde sender_role es 'client' 
  // Podrías filtrar por fecha si solo quieres los de hoy
  const { data: unreadData } = await supabase
    .from("mensajes")
    .select("client_phone, id")
    .eq("sender_role", "client"); 
    // Nota: Aquí lo ideal sería filtrar mensajes posteriores a la última respuesta del agente

  // Agrupamos para saber cuántos tiene cada uno
  const countsMap: Record<string, number> = {};
  unreadData?.forEach(m => {
    const p = normalizePhone(m.client_phone);
    countsMap[p] = (countsMap[p] || 0) + 1;
  });

  

  // Crear un Set de teléfonos con reservas OPEN para búsqueda rápida
  const openBookingPhones = new Set(
    openBookings?.map(b => normalizePhone(b.customer_phone)).filter(Boolean)
  );

  // 2. Obtener el último mensaje (fuente de verdad: tabla mensajes)
  const { data: lastMessagesData } = await supabase
    .from("mensajes")
    .select("client_phone, content, message, created_at")
    .order("created_at", { ascending: false });

  const lastMessagesMap = new Map<string, string>();
  lastMessagesData?.forEach((m) => {
    const phone = normalizePhone(m.client_phone);
    if (phone && !lastMessagesMap.has(phone)) {
      lastMessagesMap.set(phone, m.content || m.message || "");
    }
  });

  // 3. Lógica de nombres de clientes
  const phonesRaw = sessions.map((s) => String(s.client_phone));
  const { data: clients } = await supabase
    .from("clients")
    .select("nombre, numberc")
    .in("numberc", phonesRaw);

  const clientsMap = new Map<string, string>();
  clients?.forEach((c) => clientsMap.set(String(c.numberc), c.nombre));

  // 4. Construcción del resultado final incluyendo la marca de reserva
    const result = sessions.map((s) => {
      const phone = normalizePhone(s.client_phone);
    const rawPhone = String(s.client_phone);
    const cleanPhone = normalizePhone(rawPhone) || rawPhone;
    
    return {
      id: rawPhone,
      phone: rawPhone,
      cliente: clientsMap.get(rawPhone) || s.client_name || rawPhone,
      lastMessage: lastMessagesMap.get(cleanPhone) || s.last_message || "Sin mensajes",
      unread: activeId === s.client_phone ? 0 : (countsMap[phone] || 0),
      status: s.status as ChatStatus,
      lastActivity: s.updated_at,
      // Propiedad nueva para identificar si es una reserva pendiente
      isBookingOpen: openBookingPhones.has(cleanPhone)
    };
  });
  
  setThreads(result);
}, [activeId]);

// AGREGA ESTO JUSTO ARRIBA DEL "// 2. REAL-TIME..."
useEffect(() => {
  fetchThreads();
}, [fetchThreads]);

// 2. REAL-TIME: ESCUCHAR CAMBIOS EN SESIONES (LISTA)
useEffect(() => {
  const channel = supabase
    .channel("sidebar_updates")
    // 1. Escucha cambios en SESIONES (Especialmente para la burbuja unread_count)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "chat_sessions" },
      (payload) => {
        const updated = payload.new;
        setThreads((prev) => {
          const newThreads = prev.map((t) =>
            normalizePhone(t.id) === normalizePhone(updated.client_phone)
              ? { 
                  ...t, 
                  unread: Number(updated.unread_count), // <--- Aquí llega el 1 de la DB
                  status: updated.status,
                  lastActivity: updated.updated_at 
                }
              : t
          );
          return [...newThreads].sort((a, b) => 
            new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
          );
        });
      }
    )
    // 2. Escucha MENSAJES (Para el texto de previsualización)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mensajes" },
      (payload) => {
        const newMessage = payload.new;
        const phone = normalizePhone(newMessage.client_phone);
        const text = newMessage.content || newMessage.message || "";

        setThreads((prev) => {
          return prev.map((t) => {
            if (normalizePhone(t.id) === phone) {
              const isFromClient = newMessage.sender_role === "client";
              const isNotActive = t.id !== activeId;

              return {
                ...t,
                lastMessage: newMessage.message || newMessage.content,
                lastActivity: newMessage.created_at,
                // Si el mensaje es del cliente y no tengo el chat abierto, sumo 1
                unread: (isFromClient && isNotActive) ? t.unread + 1 : t.unread
              };
            }
            return t;
          }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [fetchThreads, activeId]); // Agregamos activeId a las dependencias si lo usas dentro

  // 3. CARGA Y REAL-TIME DE MENSAJES
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    const cleanPhone = normalizePhone(activeId);

    const loadMessages = async () => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from("mensajes")
        .select("*")
        .or(`client_phone.eq.${cleanPhone},client_phone.eq.+${cleanPhone}`)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          from: getSenderRole(m),
          text: m.content || m.message || "",
          created_at: m.created_at,
        })));
      }
      setLoadingMessages(false);
      setTimeout(() => scrollToBottom("auto"), 100);
    };

    loadMessages();

    // Suscripción a mensajes nuevos para el chat activo
    const channel = supabase
      .channel(`chat_active_${cleanPhone}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        (payload) => {
          const newMessage = payload.new;
          const msgPhone = normalizePhone(newMessage.client_phone);

          if (msgPhone === cleanPhone) {
            setMessages((prev) => {
              // Evitar duplicados por ID (importante para evitar double-rendering)
              if (prev.some(m => m.id === newMessage.id)) return prev;
              const isStaff = getSenderRole(newMessage) === "staff";
                if (isStaff) {
                  return [
                    ...prev.filter(m => !String(m.id).startsWith("temp-")),
                    {
                      id: newMessage.id,
                      from: "staff",
                      text: newMessage.content || newMessage.message || "",
                      created_at: newMessage.created_at,
                    }
                  ];
                }
              return [...prev, {
                id: newMessage.id,
                from: getSenderRole(newMessage),
                text: newMessage.content || newMessage.message || "",
                created_at: newMessage.created_at,
              }];
            });
            setTimeout(() => scrollToBottom("smooth"), 50);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId, scrollToBottom]);

  // 4. ENVÍO DE MENSAJES CON OPTIMISTIC UI
  const sendMessage = async () => {
    if (!inputText.trim() || !activeId) return;

    const textToSend = inputText;
    const phone = normalizePhone(activeId);
    setInputText("");

    // Insertar localmente para respuesta instantánea
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      from: "staff",
      text: textToSend,
      created_at: new Date().toISOString()
    }]);
    
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      await fetch("/api/whatsapp/outgoing", {
        method: "POST",
        body: JSON.stringify({ client_phone: phone, content: textToSend }),
        headers: { "Content-Type": "application/json" },
      });
      // 2. AHORA SÍ: Actualizar estado de sesión en la DB
    // Esto limpia la burbuja para todos y marca el chat como activo con agente
    await supabase
      .from("chat_sessions")
      .update({ 
        unread_count: 0, 
        status: "agent_active",
        updated_at: new Date().toISOString() 
      })
      .eq("client_phone", activeId);
    } catch (error) {
      console.error("Error al enviar:", error);
    }
  };

    const handleThreadClick = async (id: string) => {
  setActiveId(id);
  
  // Actualización local inmediata para que la burbuja desaparezca de tu vista
  setThreads(prev => prev.map(t => t.id === id ? { ...t, unread: 0 } : t));

  // COMENTA O ELIMINA el update de la base de datos aquí
  // await supabase.from("chat_sessions").update({ unread_count: 0, status: "agent_active" }).eq("client_phone", id);
};

 const handleResolveChat = async () => {
  if (!activeId) return;

  try {
    // 1. Llamada a la API para resolver
    const response = await fetch("/api/chat/resolve", {
      method: "POST",
      body: JSON.stringify({ phoneId: activeId }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      // 2. Limpiar el chat activo inmediatamente
      setActiveId(null);
      // 3. Forzar recarga completa desde la base de datos para sincronizar el contador real
      await fetchThreads();
    }
  } catch (error) {
    console.error("Error al resolver el chat:", error);
  }
};

  const filteredThreads = useMemo(() => {
  const effectiveTab: Tab = mode === "reservations" ? "reservations" : tab;
  
  return threads.filter((t) => {
    // Buscador global
    if (mode === "default" && search && !t.cliente.toLowerCase().includes(search.toLowerCase())) return false;

    // Lógica por pestañas
    if (effectiveTab === "active") {
      // Activos: Mostrar chats operativos que NO tienen una reserva OPEN
      return (t.status === "agent_active" || t.status === "pending_agent" || t.status === "bot_active") && !t.isBookingOpen;
    }

    if (effectiveTab === "reservations") {
      // Reservas: Únicamente si tiene status OPEN en la tabla booking_requests
      return t.isBookingOpen;
    }

    if (effectiveTab === "abandoned") {
      return t.status === "resolved";
    }

    return true;
  });
}, [threads, tab, search, mode]);

  const currentChat = threads.find((t) => t.id === activeId) || null;

  return (
    <div className="flex h-full w-full max-w-[100vw] overflow-hidden bg-white dark:bg-gray-900">
      <aside className={`${activeId ? "hidden md:flex" : "flex"} w-full flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 md:w-[360px]`}>
        {mode === "default" && (
          <div className="flex flex-wrap gap-2 p-3">
            {(["active", "reservations", "abandoned"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === t ? "bg-indigo-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {t === "active" ? "Activos" : t === "reservations" ? "Reservas" : "Finalizados"}
              </button>
            ))}
          </div>
        )}
        {mode === "default" && (
          <div className="w-full px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                placeholder="Buscar chat…"
                className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">Mensajes ({filteredThreads.length})</div>
        <div className="flex-1 overflow-y-auto pb-2 custom-scroll">
          {filteredThreads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-gray-400">
              <Inbox size={32} className="mb-2 opacity-50" />
              <p>No hay conversaciones.</p>
            </div>
          ) : (
            filteredThreads.map((c) => (
              <div
                key={c.id}
                onClick={(e) => handleThreadClick(c.id)}
                className={`cursor-pointer border-b border-gray-100 px-4 py-4 transition-colors dark:border-gray-800 ${activeId === c.id ? "bg-white dark:bg-gray-800" : "hover:bg-white/70 dark:hover:bg-gray-800/50"}`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <div className="truncate pr-2 font-semibold text-sm text-gray-800 dark:text-gray-200">{c.cliente}</div>
                  {c.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white animate-in zoom-in">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">{c.lastMessage || "Sin mensajes"}</div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className={`${!activeId ? "hidden md:flex" : "flex"} relative flex-1 flex-col bg-white dark:bg-gray-800`}>
        {!currentChat ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-400 ">
            <Send size={32} className="mb-4 opacity-40" />
            <p className="text-sm">Selecciona una conversación</p>
          </div>
        ) : (
          <>
            <div className="z-10 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveId(null)} className="rounded-full p-1 text-gray-500 md:hidden"><ChevronLeft size={24} /></button>
                <div className="flex flex-col">
                  <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{currentChat.cliente}</div>
                  <div className="text-xs text-gray-400">{currentChat.phone}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={handleResolveChat} className="rounded-full p-2 text-green-600 hover:bg-green-50"><CheckCircle size={20} /></button>
                <a href={`https://wa.me/${currentChat.phone}`} target="_blank" className="rounded-full p-2 text-emerald-600 hover:bg-emerald-50"><ExternalLink size={20} /></a>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto custom-scroll relative bg-[#f0f2f5] p-4 dark:bg-gray-800/50">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
              ) : (
                Object.entries(groupedMessages).map(([day, msgs]) => (
                  <div key={day} className="space-y-4">

                    {/* Etiqueta de Día Estilo WhatsApp */}
                    <div className="sticky top-2 z-20 flex justify-center my-4 pointer-events-none">
                      <span className="bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-500 dark:text-gray-300 text-[11px] font-bold px-4 py-1.5 rounded-full shadow-sm uppercase tracking-wider border border-gray-100 dark:border-gray-600 pointer-events-auto">
                        {day}
                      </span>
                    </div>

                    {msgs.map((m) => (
                      <div key={m.id} className={`flex ${m.from === "client" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm md:max-w-[70%] ${
                          m.from === "client" 
                            ? "rounded-bl-none bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-200" 
                            : "rounded-br-none bg-indigo-500 text-white"
                        }`}>
                          {m.text}
                          <div className="mt-1 text-right text-[10px] opacity-60">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 md:p-4">
              <div className="mx-auto flex w-full max-w-4xl items-end gap-2">
                <textarea
                  rows={1}
                  className="w-full flex-1 resize-none rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200"
                  placeholder="Escribe un mensaje..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}