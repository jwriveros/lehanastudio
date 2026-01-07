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

  // Scroll al fondo optimizado
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  // 1. CARGA DE HILOS (LISTA LATERAL)
const fetchThreads = useCallback(async () => {
  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("*")
    .neq("status", "resolved") // <--- AGREGA ESTA LÍNEA PARA FILTRAR "FINALIZADOS"
    .order("updated_at", { ascending: false });

  if (!sessions) return;

  const phones = sessions.map((s) => normalizePhone(s.client_phone)).filter(Boolean) as string[];
  const { data: clients } = await supabase
    .from("clients")
    .select("nombre, numberc")
    .in("numberc", phones);

  const clientsMap = new Map<string, string>();
  clients?.forEach((c) => {
    if (c.numberc) clientsMap.set(String(c.numberc), c.nombre);
  });

  const result: ChatUser[] = sessions.map((s) => {
    const phone = normalizePhone(s.client_phone) || String(s.client_phone);
    return {
      id: phone,
      phone,
      cliente: clientsMap.get(phone) || s.client_name || `Cliente (${phone})`,
      lastMessage: s.last_message || "",
      unread: s.unread_count || 0,
      status: s.status,
      lastActivity: s.updated_at,
    };
  });
  setThreads(result);
}, []);
// AGREGA ESTO JUSTO ARRIBA DEL "// 2. REAL-TIME..."
useEffect(() => {
  fetchThreads();
}, [fetchThreads]);

// 2. REAL-TIME: ESCUCHAR CAMBIOS EN SESIONES (LISTA)
// ... resto de tu código

  // 2. REAL-TIME: ESCUCHAR CAMBIOS EN SESIONES (LISTA)
  useEffect(() => {
    const channel = supabase
      .channel("global_sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_sessions" },
        () => fetchThreads()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchThreads]);

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
    } catch (error) {
      console.error("Error al enviar:", error);
    }
  };

  const handleThreadClick = async (id: string) => {
    setActiveId(id);
    // Limpiar notificaciones y actualizar estado a activo
    await supabase
      .from("chat_sessions")
      .update({ status: "agent_active", unread_count: 0 })
      .eq("client_phone", id);
    
    setThreads(prev => prev.map(t => t.id === id ? { ...t, unread: 0 } : t));
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
      if (mode === "default" && search && !t.cliente.toLowerCase().includes(search.toLowerCase())) return false;
      if (effectiveTab === "active") return ["active", "agent_active", "bot_active", "new"].includes(t.status);
      if (effectiveTab === "reservations") return t.status === "pending_agent";
      if (effectiveTab === "abandoned") return t.status === "resolved";
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
        <div className="flex-1 overflow-y-auto pb-2">
          {filteredThreads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-gray-400">
              <Inbox size={32} className="mb-2 opacity-50" />
              <p>No hay conversaciones.</p>
            </div>
          ) : (
            filteredThreads.map((c) => (
              <div
                key={c.id}
                onClick={() => handleThreadClick(c.id)}
                className={`cursor-pointer border-b border-gray-100 px-4 py-4 transition-colors dark:border-gray-800 ${activeId === c.id ? "bg-white dark:bg-gray-800" : "hover:bg-white/70 dark:hover:bg-gray-800/50"}`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <div className="truncate pr-2 font-semibold text-sm text-gray-800 dark:text-gray-200">{c.cliente}</div>
                  {c.unread > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">{c.unread}</span>}
                </div>
                <div className="truncate text-xs text-gray-500 dark:text-gray-400">{c.lastMessage || "Sin mensajes"}</div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className={`${!activeId ? "hidden md:flex" : "flex"} relative flex-1 flex-col bg-white dark:bg-gray-800`}>
        {!currentChat ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-400">
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

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#f0f2f5] p-4 dark:bg-gray-800/50">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === "client" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm md:max-w-[70%] ${m.from === "client" ? "rounded-bl-none bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-200" : "rounded-br-none bg-indigo-500 text-white"}`}>
                      {m.text}
                      <div className="mt-1 text-right text-[10px] opacity-60">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
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