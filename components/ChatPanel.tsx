"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getSenderRole, normalizePhone } from "@/lib/chatUtils";

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
  mode?: Mode; // 👈 NUEVO
  initialThreads: ChatUser[];
}

/* =======================
   COMPONENTE
======================= */

export function ChatPanel({
  mode = "default",
  initialThreads,
}: Props) {

  const [tab, setTab] = useState<Tab>("active");
  const [threads, setThreads] = useState<ChatUser[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [bookingContext, setBookingContext] = useState<BookingContext>(null);
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* =======================
     SCROLL ROBUSTO
  ======================= */

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  /* =======================
     FETCH THREADS
  ======================= */

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
      return {
        id: phone,
        phone,
        cliente: clientsMap.get(phone) || `Cliente (${phone})`,
        lastMessage: s.last_message || "",
        unread: s.unread_count || 0,
        status: s.status,
        lastActivity: s.updated_at,
      };
    });

    setThreads(result);
    setLoadingThreads(false);
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  /* =======================
     CONTEXTO RESERVA
  ======================= */

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

  /* =======================
     MENSAJES
  ======================= */

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

  /* =======================
     CLICK CHAT
  ======================= */

  const handleThreadClick = async (id: string) => {
    setActiveId(id);
    fetchBookingContext(id);

    await supabase
      .from("chat_sessions")
      .update({ status: "agent_active" })
      .eq("client_phone", id);

    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t))
    );
  };

  /* =======================
     SEND
  ======================= */

  const sendMessage = async () => {
    if (!inputText || !activeId) return;

    const phone = normalizePhone(activeId);
    setInputText("");

    await fetch("/api/whatsapp/outgoing", {
      method: "POST",
      body: JSON.stringify({ client_phone: phone, content: inputText }),
      headers: { "Content-Type": "application/json" },
    });

    scrollToBottom("smooth");
  };

  /* =======================
     RESOLVER
  ======================= */

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

  /* =======================
     FILTROS
  ======================= */

  const effectiveTab: Tab =
    mode === "reservations" ? "reservations" : tab;

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (
        mode === "default" &&
        search &&
        !t.cliente.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      if (effectiveTab === "active")
        return ["active", "agent_active", "bot_active", "new"].includes(t.status);
      if (effectiveTab === "reservations") return t.status === "pending_agent";
      if (effectiveTab === "abandoned") return t.status === "resolved";
      return true;
    });
  }, [threads, effectiveTab, search, mode]);

  const currentChat = threads.find((t) => t.id === activeId) || null;

  /* =======================
     UI
  ======================= */

  return (
    <div className="flex h-full w-full bg-white">
      {/* LISTA */}
      <div className="w-[360px] flex flex-col bg-zinc-50/60">

        {/* TABS (solo modo default) */}
        {mode === "default" && (
          <div className="flex gap-2 p-3">
            {(["active", "reservations", "abandoned"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition
                  ${
                    tab === t
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-transparent text-zinc-500 hover:bg-zinc-200/50"
                  }`}
              >
                {t === "active"
                  ? "Active"
                  : t === "reservations"
                  ? "Reservations"
                  : "Abandoned"}
              </button>
            ))}
          </div>
        )}

        {/* BUSCADOR (solo modo default) */}
        {mode === "default" && (
          <div className="px-3 pb-2">
            <input
              placeholder="Buscar chat…"
              className="w-full rounded-full border px-3 py-1.5 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        <div className="px-4 text-xs text-zinc-500">
          Chats ({filteredThreads.length})
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map((c) => (
            <div
              key={c.id}
              onClick={() => handleThreadClick(c.id)}
              className={`px-4 py-3 cursor-pointer ${
                activeId === c.id ? "bg-indigo-50" : "hover:bg-zinc-50"
              }`}
            >
              <div className="font-semibold truncate">{c.cliente}</div>
              <div className="text-xs text-zinc-500 truncate">
                {c.lastMessage}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col">
        {!currentChat ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400">
            Selecciona un chat
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b flex justify-between">
              <div>
                <div className="font-semibold">{currentChat.cliente}</div>
                <div className="text-xs text-zinc-500">
                  {currentChat.phone}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResolveChat}
                  className="px-3 py-1 rounded-full bg-green-600 text-white text-xs"
                >
                  Resolver
                </button>
                <a
                  href={`https://wa.me/${currentChat.phone}`}
                  target="_blank"
                  className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs"
                >
                  WhatsApp Web
                </a>
              </div>
            </div>

            {bookingContext && (
              <div className="px-5 py-2 bg-indigo-50 text-xs text-indigo-900">
                {bookingContext.servicio} · {bookingContext.fecha} ·{" "}
                {bookingContext.hora}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 bg-zinc-50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-2 flex ${
                    m.from === "client" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-xl text-sm max-w-[70%] ${
                      m.from === "client"
                        ? "bg-white border"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t px-4 py-3">
              <div className="flex w-full items-center gap-3">
                <input
                  className="w-full flex-1 rounded-2xl bg-zinc-100 px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Escribe un mensaje..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="shrink-0 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Enviar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
