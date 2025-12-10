"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Tab = "active" | "abandoned" | "reservations";

type ChatUser = {
  id: string;
  cliente: string;
  phone: string;
  lastMessage: string;
  unread: number;
  status: Tab;
  lastActivity: string;
};

type ChatMessage = {
  id?: number;
  from: "client" | "staff";
  text: string;
  created_at: string;
};

export function ChatPanel() {
  const [tab, setTab] = useState<Tab>("active");
  const [threads, setThreads] = useState<ChatUser[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [clientCache, setClientCache] = useState<Map<string, string>>(new Map());

  // ---------------------- LOAD THREADS ----------------------
  useEffect(() => {
    const fetchThreads = async () => {
      setLoadingThreads(true);

      const { data: clientsData } = await supabase
        .from("clients")
        .select("Nombre, Celular, celular, numberc");

      const cache = new Map<string, string>();
      if (clientsData) {
        clientsData.forEach((c: any) => {
          const phone = String(c.Celular || c.celular || c.numberc).replace(/\D/g, "");
          if (phone) cache.set(phone, c.Nombre || c.nombre || phone);
        });
      }
      setClientCache(cache);

      const { data: messagesData } = await supabase
        .from("mensajes")
        .select("client_phone, content, message, created_at")
        .order("created_at", { ascending: false });

      const unique = new Map<string, ChatUser>();

      if (messagesData) {
        messagesData.forEach((m: any) => {
          const phone = String(m.client_phone).replace(/\D/g, "");
          if (!unique.has(phone)) {
            unique.set(phone, {
              id: phone,
              cliente: cache.get(phone) || `Cliente (+${phone.slice(-4)})`,
              phone,
              lastMessage: m.content || m.message || "",
              lastActivity: m.created_at,
              unread: 0,
              status: "active",
            });
          }
        });
      }

      const list = Array.from(unique.values()).sort((a, b) =>
        a.lastActivity > b.lastActivity ? -1 : 1
      );

      setThreads(list);
      if (list.length > 0 && !activeId) setActiveId(list[0].id);

      setLoadingThreads(false);
    };

    fetchThreads();
  }, []);

  // ---------------------- REALTIME LIST ----------------------
  useEffect(() => {
    const globalChannel = supabase
      .channel("mensajes_global_panel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        (payload) => {
          const n = payload.new as any;
          const phone = String(n.client_phone).replace(/\D/g, "");

          setThreads((prev) => {
            const exists = prev.find((t) => t.id === phone);

            if (!exists) {
              return [
                {
                  id: phone,
                  cliente: clientCache.get(phone) || `Cliente (+${phone.slice(-4)})`,
                  phone,
                  lastMessage: n.content || n.message,
                  lastActivity: n.created_at,
                  unread: 0,
                  status: "active",
                },
                ...prev,
              ];
            }

            const updated = prev.map((t) =>
              t.id === phone
                ? {
                    ...t,
                    lastMessage: n.content || n.message,
                    lastActivity: n.created_at,
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

  // ---------------------- REALTIME CHAT ----------------------
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);

      const activeThread = threads.find((t) => t.id === activeId);
      if (!activeThread) return;

      const cleanPhone = activeThread.phone.replace(/\D/g, "");

      const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .or(`client_phone.eq.${activeThread.phone},client_phone.eq.${cleanPhone},client_id.eq.${activeId}`)
        .order("created_at", { ascending: true });

      if (error) console.error(error);

      if (data) {
        const uiMessages: ChatMessage[] = data.map((m: any) => ({
          id: m.id,
          text: m.content || m.text || m.message || "",
          from: m.sender_role === "staff" || m.direction === "outbound" ? "staff" : "client",
          created_at: m.created_at,
        }));
        setMessages(uiMessages);
      }

      setLoadingMessages(false);
    };

    fetchMessages();

    const activeThread = threads.find((t) => t.id === activeId);
    if (!activeThread) return;

    const normalizedPhones = [activeThread.phone, activeThread.phone.replace(/\D/g, "")]
      .filter(Boolean)
      .map((p) => p.replace(/\D/g, ""));

    const channel = supabase
      .channel(`realtime:mensajes:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes" },
        (payload) => {
          const newMsg = payload.new as any;
          const incomingPhone = (newMsg.client_phone || "").replace(/\D/g, "");
          const belongsToChat =
            newMsg.client_id === activeId ||
            (incomingPhone && normalizedPhones.includes(incomingPhone));

          if (!belongsToChat) return;

          setMessages((prev) => [
            ...prev,
            {
              id: newMsg.id,
              text: newMsg.content || newMsg.text || newMsg.message,
              from: newMsg.sender_role === "staff" ? "staff" : "client",
              created_at: newMsg.created_at,
            },
          ]);

          setThreads((prev) =>
            prev.map((thread) =>
              thread.id === activeId
                ? {
                    ...thread,
                    lastMessage: newMsg.content || newMsg.text || thread.lastMessage,
                    lastActivity: newMsg.created_at || new Date().toISOString(),
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

  // ---------------------- SEND MESSAGE ----------------------
  const sendMessage = async () => {
    if (!inputText.trim() || !activeId) return;

    const activeThread = threads.find((t) => t.id === activeId);
    if (!activeThread) return;

    const tempMsg: ChatMessage = {
      from: "staff",
      text: inputText,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    const payload = {
      client_phone: activeThread.phone,
      content: inputText,
    };

    const msgToSend = inputText;
    setInputText("");

    await fetch("/api/whatsapp/outgoing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const currentChat = useMemo(
    () => threads.find((t) => t.id === activeId) ?? null,
    [activeId, threads]
  );

  // ---------------------- UI ----------------------
  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* TABS FIJOS */}
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

      {/* GRID */}
      <div className="grid flex-1 h-full w-full gap-4 grid-cols-1 lg:grid-cols-[1fr_1.3fr] overflow-hidden">
        {/* LISTA DE CHATS */}
        <div className="flex flex-col rounded-2xl border bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-zinc-500">
            <span>Chats Recientes ({threads.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {loadingThreads ? (
              <p className="p-4 text-sm text-zinc-400">Cargando chats...</p>
            ) : threads.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">No hay hilos.</p>
            ) : (
              threads.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setActiveId(chat.id)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                    activeId === chat.id
                      ? "bg-indigo-50 border-l-4 border-indigo-500"
                      : "border-l-4 border-transparent"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{chat.cliente}</div>
                    <div className="truncate text-xs text-zinc-500">
                      {chat.lastMessage}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {new Date(chat.last.lastActivity).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL DE MENSAJES */}
        {currentChat ? (
          <div className="flex flex-col rounded-2xl border bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <div className="text-lg font-semibold">{currentChat.cliente}</div>
                <p className="text-sm text-zinc-500">{currentChat.phone}</p>
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
