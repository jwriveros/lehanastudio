"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { normalizePhone, getSenderRole } from "@/lib/chatUtils";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";

type Thread = {
  id: string;
  cliente: string;
  phone: string;
  lastMessage: string;
  updated_at?: string;
};

type Message = {
  id?: number;
  from: "client" | "staff";
  text: string;
  created_at: string;
};

function isNearBottom(el: HTMLElement, threshold = 120) {
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
  return distance < threshold;
}

export default function ReservasChat() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeChat, setActiveChat] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const listScrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  /* =========================
     FETCH THREADS (inicial)
  ========================= */
  const fetchThreads = useCallback(async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("status", "pending_agent")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching chat_sessions:", error);
      return;
    }

    const mapped: Thread[] =
      (data || []).map((s: any) => {
        const phone = normalizePhone(s.client_phone)!;
        return {
          id: phone,
          phone,
          cliente: `Cliente (${phone})`,
          lastMessage: s.last_message || "",
          updated_at: s.updated_at,
        };
      }) ?? [];

    setThreads(mapped);
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  /* =========================
     FETCH MESSAGES (inicial cuando abre chat)
  ========================= */
  const fetchMessages = useCallback(
    async (phoneOrId: string) => {
      const clean = normalizePhone(phoneOrId);

      const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .or(`client_phone.eq.${clean},client_phone.eq.+${clean},client_id.eq.${phoneOrId}`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching mensajes:", error);
        return;
      }

      setMessages(
        (data || []).map((m: any) => ({
          id: m.id,
          from: getSenderRole(m),
          text: m.content || m.message || "",
          created_at: m.created_at,
        }))
      );

      // al abrir chat, nos vamos al final
      setShouldAutoScroll(true);
      scrollBottom("auto");
    },
    [scrollBottom]
  );

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }
    fetchMessages(activeChat.phone);
  }, [activeChat, fetchMessages]);

  /* =========================
     REALTIME: chat_sessions (reservas)
  ========================= */
  useEffect(() => {
    const channel = supabase
      .channel("rt-reservas-chat-sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_sessions" },
        (payload) => {
          // Importante: algunos payload traen new/old
          const row: any = (payload as any).new || (payload as any).old;
          if (!row) return;

          const phone = normalizePhone(row.client_phone) || String(row.client_phone || "");
          if (!phone) return;

          const status = row.status;

          setThreads((prev) => {
            const existsIdx = prev.findIndex((t) => t.id === phone);

            // si ya NO es pending_agent => lo removemos de la lista
            if (status !== "pending_agent") {
              if (existsIdx === -1) return prev;
              const next = [...prev];
              next.splice(existsIdx, 1);
              return next;
            }

            // status == pending_agent => insert/update
            const nextItem: Thread = {
              id: phone,
              phone,
              cliente: prev[existsIdx]?.cliente || `Cliente (${phone})`,
              lastMessage: row.last_message || "",
              updated_at: row.updated_at,
            };

            let next = [...prev];
            if (existsIdx === -1) {
              next.unshift(nextItem);
            } else {
              next[existsIdx] = { ...next[existsIdx], ...nextItem };
            }

            // reordenar por updated_at desc si existe
            next.sort((a, b) => {
              const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
              const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
              return tb - ta;
            });

            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =========================
     REALTIME: mensajes (solo chat activo)
  ========================= */
  useEffect(() => {
    if (!activeChat) return;

    const clean = normalizePhone(activeChat.phone);

    const channel = supabase
      .channel(`rt-reservas-mensajes-${clean}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        (payload) => {
          const m: any = (payload as any).new;
          if (!m) return;

          // filtrar solo mensajes de este chat
          const p1 = normalizePhone(m.client_phone);
          const match =
            (p1 && p1 === clean) ||
            (typeof m.client_phone === "string" && m.client_phone === `+${clean}`) ||
            (m.client_id && String(m.client_id) === String(activeChat.id));

          if (!match) return;

          const newMsg: Message = {
            id: m.id,
            from: getSenderRole(m),
            text: m.content || m.message || "",
            created_at: m.created_at,
          };

          setMessages((prev) => {
            // evitar duplicados si llega 2 veces
            if (newMsg.id && prev.some((x) => x.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // actualizar lastMessage en threads (para vista lista)
          setThreads((prev) =>
            prev.map((t) =>
              t.id === activeChat.id
                ? { ...t, lastMessage: newMsg.text, updated_at: m.created_at }
                : t
            )
          );

          if (shouldAutoScroll) scrollBottom("smooth");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, shouldAutoScroll, scrollBottom]);

  /* =========================
     Scroll listener (auto-scroll inteligente)
  ========================= */
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;

    const onScroll = () => {
      setShouldAutoScroll(isNearBottom(el));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeChat]);

  /* =========================
     SEND
  ========================= */
  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;

    const phone = normalizePhone(activeChat.phone);
    const content = input;
    setInput("");

    await fetch("/api/whatsapp/outgoing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_phone: phone, content }),
    });

    // no forzamos scroll si el user está leyendo arriba
    if (shouldAutoScroll) scrollBottom("smooth");
  };

  /* =========================
     RESOLVER
  ========================= */
  const resolveChat = async () => {
    if (!activeChat) return;

    await fetch("/api/chat/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneId: activeChat.phone }),
    });

    // UI inmediata
    setThreads((prev) => prev.filter((t) => t.id !== activeChat.id));
    setActiveChat(null);
  };

  const badgeCount = useMemo(() => threads.length, [threads]);

  /* =========================
     UI
  ========================= */
  return (
    <div className="
        flex h-full min-h-0 flex-col
        bg-white
        shadow-[inset_-1px_0_0_rgba(0,0,0,0.06)]
      ">

      {/* HEADER */}
        <div
          className="
            shrink-0
            px-3 py-2
            flex items-center justify-between
            bg-white
            border-b border-zinc-200/60
            backdrop-blur
          "
        >

        <div className="flex items-center gap-2 min-w-0">
          {activeChat && (
            <button
              onClick={() => setActiveChat(null)}
              className="flex items-center gap-1 text-indigo-600
                        transition-all duration-200 hover:-translate-x-1"
              title="Volver"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          {/* TÍTULO */}
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-sm font-semibold truncate">
              {activeChat ? activeChat.cliente : "Reservas"}
            </span>

            {activeChat && (
              <span className="text-[11px] text-zinc-500 truncate">
                {activeChat.phone}
              </span>
            )}
          </div>

          {/* BADGE SOLO EN LISTA */}
          {!activeChat && (
            <span
              className="ml-2 rounded-full bg-indigo-600 text-white text-[11px]
                        px-2 py-0.5 transition-transform duration-200 hover:scale-105"
              title="Reservas pendientes"
            >
              {badgeCount}
            </span>
          )}
        </div>

        {/* ACCIONES */}
        {activeChat && (
          <div className="flex gap-2 shrink-0">
            <a
              href={`https://wa.me/${activeChat.phone}`}
              target="_blank"
              className="p-2 rounded-full bg-emerald-100 text-emerald-700
                        transition hover:scale-105"
              title="WhatsApp"
            >
              <MessageCircle size={16} />
            </a>

            <button
              onClick={resolveChat}
              className="p-2 rounded-full bg-green-600 text-white
                        transition hover:scale-105"
              title="Resolver"
            >
              <Check size={16} />
            </button>
          </div>
        )}
      </div>


      {/* BODY */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* LISTA */}
        {!activeChat && (
          <div ref={listScrollRef} className="h-full overflow-y-auto">
            {threads.length === 0 && (
              <div className="p-4 text-sm text-zinc-400">
                No hay reservas pendientes
              </div>
            )}

            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveChat(t)}
                className="
                  px-4 py-3
                  cursor-pointer
                  transition
                  hover:bg-zinc-100/60
                  active:bg-zinc-200/40
                "
              >
                <div className="font-medium truncate">{t.cliente}</div>
                <div className="text-xs text-zinc-500 truncate">
                  {t.lastMessage}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CHAT */}
        {activeChat && (
          <div className="flex h-full min-h-0 flex-col bg-zinc-50">
            <div
              ref={chatScrollRef}
              className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === "client" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      m.from === "client" ? "bg-white border" : "bg-indigo-600 text-white"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="shrink-0 border-t bg-white px-2 py-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl bg-zinc-100 px-4 py-3 text-sm focus:outline-none"
                  placeholder="Escribe un mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"
                  title="Enviar"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
