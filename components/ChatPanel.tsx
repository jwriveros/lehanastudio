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
  id?: number;
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
    COMPONENTE
======================= */
export function ChatPanel({ mode = "default", initialThreads }: Props) {
  const [tab, setTab] = useState<Tab>("active");
  const [threads, setThreads] = useState<ChatUser[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [bookingContext, setBookingContext] =
    useState<BookingContext>(null);
  const [search, setSearch] = useState("");
  const knownNamesRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    initialThreads.forEach((t) => {
      if (t.cliente && !t.cliente.startsWith("Cliente (")) {
        knownNamesRef.current.set(t.id, t.cliente);
      }
    });
  }, [initialThreads]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);
  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    const { data: sessions } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!sessions) {
      setLoadingThreads(false);
      return;
    }
    const phones = sessions
      .map((s) => normalizePhone(s.client_phone))
      .filter(Boolean) as string[];
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
      let name = clientsMap.get(phone) || knownNamesRef.current.get(phone);
      if (clientsMap.get(phone)) knownNamesRef.current.set(phone, name!);
      return {
        id: phone,
        phone,
        cliente: name || `Cliente (${phone})`,
        lastMessage: s.last_message || "",
        unread: s.unread_count || 0,
        status: s.status,
        lastActivity: s.updated_at,
      };
    });
    setThreads(result);
    setLoadingThreads(false);
  }, []);
  const fetchBookingContext = useCallback(async (phone: string) => {
    const clean = normalizePhone(phone);
    if (!clean) {
      setBookingContext(null);
      return;
    }
    const { data } = await supabase
      .from("booking_request")
      .select("servicio, fecha, hora, especialista, estado")
      .eq("client_phone", clean)
      .order("created_at", { ascending: false })
      .limit(1);
    setBookingContext(data?.[0] ?? null);
  }, []);
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    const load = async () => {
      setLoadingMessages(true);
      const clean = normalizePhone(activeId);
      const { data } = await supabase
        .from("mensajes")
        .select("*")
        .or(
          `client_phone.eq.${clean},client_phone.eq.+${clean},client_id.eq.${activeId}`
        )
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            from: getSenderRole(m),
            text: m.content || m.message || "",
            created_at: m.created_at,
          }))
        );
      }
      setLoadingMessages(false);
      scrollToBottom();
    };
    load();
  }, [activeId, scrollToBottom]);
  const handleThreadClick = async (id: string) => {
    setActiveId(id);
    fetchBookingContext(id);
    await supabase
      .from("chat_sessions")
      .update({ status: "agent_active", unread_count: 0 })
      .eq("client_phone", id);
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t))
    );
  };
  const sendMessage = async () => {
    if (!inputText.trim() || !activeId) return;
    const phone = normalizePhone(activeId);
    const textToSend = inputText;
    setInputText("");
    await fetch("/api/whatsapp/outgoing", {
      method: "POST",
      body: JSON.stringify({ client_phone: phone, content: textToSend }),
      headers: { "Content-Type": "application/json" },
    });
    scrollToBottom("smooth");
  };
  const handleResolveChat = async () => {
    if (!activeId) return;
    await fetch("/api/chat/resolve", {
      method: "POST",
      body: JSON.stringify({ phoneId: activeId }),
      headers: { "Content-Type": "application/json" },
    });
    setActiveId(null);
    fetchThreads();
  };
  const effectiveTab: Tab = mode === "reservations" ? "reservations" : tab;
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (
        mode === "default" &&
        search &&
        !t.cliente.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (effectiveTab === "active")
        return ["active", "agent_active", "bot_active", "new"].includes(
          t.status
        );
      if (effectiveTab === "reservations") return t.status === "pending_agent";
      if (effectiveTab === "abandoned") return t.status === "resolved";
      return true;
    });
  }, [threads, effectiveTab, search, mode]);
  const currentChat = threads.find((t) => t.id === activeId) || null;
  return (
    <div className="flex h-full w-full max-w-[100vw] overflow-hidden bg-white dark:bg-gray-900">
      {/* SECCIÓN 1: LISTA DE CHATS */}
      <aside
        className={`
        ${activeId ? "hidden md:flex" : "flex"} 
        w-full flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 md:w-[360px]
      `}
      >
        {/* TABS */}
        {mode === "default" && (
          <div className="flex flex-wrap justify-start gap-2 p-3">
            {(["active", "reservations", "abandoned"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === t
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {t === "active"
                  ? "Activos"
                  : t === "reservations"
                  ? "Reservas"
                  : "Finalizados"}
              </button>
            ))}
          </div>
        )}
        {/* BUSCADOR */}
        {mode === "default" && (
          <div className="w-full px-3 pb-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                placeholder="Buscar chat…"
                className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Mensajes ({filteredThreads.length})
        </div>
        {/* LISTADO */}
        <div className="flex-1 overflow-y-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 md:pb-0">
          {loadingThreads ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin text-gray-400" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-gray-400 dark:text-gray-600">
              <Inbox size={32} className="mb-2 opacity-50" />
              <p>No hay conversaciones aquí.</p>
            </div>
          ) : (
            filteredThreads.map((c) => (
              <div
                key={c.id}
                onClick={() => handleThreadClick(c.id)}
                className={`cursor-pointer border-b border-gray-100 px-4 py-4 transition-colors dark:border-gray-800 ${
                  activeId === c.id
                    ? "bg-white dark:bg-gray-800"
                    : "hover:bg-white/70 dark:hover:bg-gray-800/50"
                }`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <div className="truncate pr-2 font-semibold text-sm text-gray-800 dark:text-gray-200">
                    {c.cliente}
                  </div>
                  {c.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {c.lastMessage || "Sin mensajes recientes"}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
      {/* SECCIÓN 2: ÁREA DE CHAT */}
      <main
        className={`
        ${!activeId ? "hidden md:flex" : "flex"} 
        relative flex-1 flex-col bg-white dark:bg-gray-800
      `}
      >
        {!currentChat ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-gray-600">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Send size={32} className="opacity-40" />
            </div>
            <p className="text-sm">
              Selecciona una conversación para comenzar
            </p>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="z-10 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setActiveId(null)}
                  className="-ml-1 rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex min-w-0 flex-col">
                  <div className="truncate font-bold text-sm text-gray-800 dark:text-gray-200">
                    {currentChat.cliente}
                  </div>
                  <div className="truncate text-xs text-gray-400 dark:text-gray-500">
                    {currentChat.phone}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleResolveChat}
                  title="Marcar como resuelto"
                  className="rounded-full p-2 text-green-600 transition-colors hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-500/10"
                >
                  <CheckCircle size={20} />
                </button>
                <a
                  href={`https://wa.me/${currentChat.phone}`}
                  target="_blank"
                  className="rounded-full p-2 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-500/10"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>
            {/* CONTEXTO DE RESERVA */}
            {bookingContext && (
              <div className="flex items-center justify-between bg-indigo-600 px-5 py-2 text-xs font-medium text-white">
                <span className="truncate pr-4">
                  ⚡️ {bookingContext.servicio} | {bookingContext.fecha} |{" "}
                  {bookingContext.hora}
                </span>
                <span className="flex-shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[9px] uppercase">
                  {bookingContext.estado}
                </span>
              </div>
            )}
            {/* MENSAJES */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-[#f0f2f5] p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:bg-gray-800/50 dark:scrollbar-thumb-gray-700">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="animate-spin text-gray-400" />
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.from === "client" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm md:max-w-[70%] ${
                        m.from === "client"
                          ? "rounded-bl-none bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          : "rounded-br-none bg-indigo-500 text-white"
                      }`}
                    >
                      {m.text}
                      <div className="mt-1 text-right text-[10px] opacity-60">
                        {new Date(m.created_at).toLocaleTimeString([], {
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
            {/* INPUT DE MENSAJE */}
            <div className="border-t border-gray-100 bg-white p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:border-gray-800 dark:bg-gray-900 md:p-4">
              <div className="mx-auto flex w-full max-w-4xl items-end gap-2">
                <textarea
                  rows={1}
                  className="max-h-32 w-full flex-1 resize-none rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200"
                  placeholder="Escribe un mensaje..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
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