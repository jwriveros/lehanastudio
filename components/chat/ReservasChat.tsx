"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { normalizePhone, getSenderRole } from "@/lib/chatUtils";
import {
  ArrowLeft,
  Check,
  MessageCircle,
  Send,
  Inbox,
  Loader2
} from "lucide-react";

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

export default function ReservasChat() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeChat, setActiveChat] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const knownNamesRef = useRef<Map<string, string>>(new Map());
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    const { data: sessions } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("status", "pending_agent")
      .order("updated_at", { ascending: false });

    if (!sessions) {
      setLoading(false);
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

    const mapped: Thread[] = sessions.map((s) => {
      const phone = normalizePhone(s.client_phone) || String(s.client_phone);
      let name = clientsMap.get(phone) || knownNamesRef.current.get(phone) || s.client_name;
      
      if (clientsMap.get(phone)) {
        knownNamesRef.current.set(phone, name!);
      }

      return {
        id: phone,
        phone,
        cliente: name || `Cliente (${phone})`,
        lastMessage: s.last_message || "",
        updated_at: s.updated_at,
      };
    });

    setThreads(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const fetchMessages = useCallback(async (phoneId: string) => {
    const clean = normalizePhone(phoneId);
    const { data } = await supabase
      .from("mensajes")
      .select("*")
      .or(`client_phone.eq.${clean},client_phone.eq.+${clean},client_id.eq.${phoneId}`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data.map((m) => ({
        id: m.id,
        from: getSenderRole(m),
        text: m.content || m.message || "",
        created_at: m.created_at,
      })));
      scrollBottom("auto");
    }
  }, [scrollBottom]);

  useEffect(() => {
    if (!activeChat) return;
    fetchMessages(activeChat.phone);
  }, [activeChat, fetchMessages]);

  // REALTIME CON BROADCASTING
  useEffect(() => {
    const channel = supabase
      .channel("chat-updates")
      .on("broadcast", { event: "new-message" }, (payload) => {
        const { phone, status } = payload.payload;

        // 1. Siempre refrescar la lista de hilos para ver nuevos mensajes o cambios de estado
        fetchThreads();

        // 2. Si el mensaje es para el chat que tenemos abierto, refrescar mensajes
        if (activeChat && normalizePhone(activeChat.phone) === normalizePhone(phone)) {
          fetchMessages(phone);
        }
      })
      // Mantenemos postgres_changes como respaldo por si falla el broadcast
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => {
        fetchThreads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchThreads, fetchMessages, activeChat]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    const phone = activeChat.phone;
    const content = input;
    setInput("");
    await fetch("/api/whatsapp/outgoing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_phone: phone, content }),
    });
    // Opcional: Refrescar mensajes localmente después de enviar
    fetchMessages(phone);
    scrollBottom("smooth");
  };

  const resolveChat = async () => {
    if (!activeChat) return;
    await fetch("/api/chat/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneId: activeChat.phone }),
    });
    setActiveChat(null);
    fetchThreads();
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* HEADER */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 min-w-0">
          {activeChat && (
            <button onClick={() => setActiveChat(null)} className="p-1 text-indigo-500">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold truncate">
              {activeChat ? activeChat.cliente : `Reservas (${threads.length})`}
            </span>
          </div>
        </div>
        {activeChat && (
          <button onClick={resolveChat} className="bg-green-500 text-white p-1.5 rounded-full">
            <Check size={16} />
          </button>
        )}
      </div>

      {/* LISTA O CHAT */}
      <div className="flex-1 overflow-hidden relative">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10"><Loader2 className="animate-spin text-indigo-500" /></div>}
        
        {!activeChat ? (
          <div className="h-full overflow-y-auto">
            {threads.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">No hay reservas pendientes.</div>
            ) : (
              threads.map((t) => (
                <div key={t.id} onClick={() => setActiveChat(t)} className="p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <div className="text-sm font-semibold">{t.cliente}</div>
                  <div className="text-xs text-gray-500 truncate">{t.lastMessage}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-gray-950">
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "client" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] p-2 rounded-lg text-sm ${m.from === "client" ? "bg-white text-gray-800" : "bg-indigo-600 text-white"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 bg-white dark:bg-gray-900 border-t dark:border-gray-800 flex gap-2">
              <input 
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Responder..."
              />
              <button onClick={sendMessage} className="text-indigo-600 p-2"><Send size={20} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}