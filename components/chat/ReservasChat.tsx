"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { normalizePhone } from "@/lib/chatUtils";
import { useSessionStore } from "@/lib/sessionStore";
import {
  ArrowLeft, Send, Loader2, Calendar, Inbox, Clock,
  CheckCircle, ExternalLink
} from "lucide-react";

type Thread = {
  id: string;
  cliente: string;
  phone: string;
  lastMessage: string;
  updated_at?: string;
  isBookingOpen: boolean;
  status: string;
};

type Message = {
  id?: number;
  from: "client" | "staff";
  text: string;
  created_at: string;
};

export default function ReservasChat() {
  const { session } = useSessionStore();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeChat, setActiveChat] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  // --- OBTENER HILOS FILTRADOS ---
  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, bookingsRes] = await Promise.all([
        supabase
          .from("chat_sessions")
          .select("*")
          .neq("status", "resolved")
          .order("updated_at", { ascending: false }),
        supabase
          .from("booking_requests")
          .select("customer_phone")
          .eq("status", "OPEN")
      ]);

      const sessions = sessionsRes.data || [];
      const openBookings = bookingsRes.data || [];
      const openBookingPhones = new Set(
        openBookings.map(b => normalizePhone(b.customer_phone)).filter(Boolean)
      );

      const rawPhones = sessions.map((s) => normalizePhone(s.client_phone)).filter(Boolean) as string[];
      const { data: clients } = await supabase
        .from("clients")
        .select("nombre, numberc")
        .in("numberc", [...rawPhones, ...rawPhones.map(p => `+${p}`)]);

      const clientsMap = new Map<string, string>();
      clients?.forEach((c) => {
        const cleanKey = normalizePhone(c.numberc);
        if (cleanKey) clientsMap.set(cleanKey, c.nombre);
      });

      const mapped: Thread[] = sessions
        .map((s) => {
          const phone = normalizePhone(s.client_phone) || String(s.client_phone);
          return {
            id: phone,
            phone,
            cliente: clientsMap.get(phone) || s.client_name || phone,
            lastMessage: s.last_message || "",
            updated_at: s.updated_at,
            status: s.status,
            isBookingOpen: openBookingPhones.has(phone)
          };
        })
        .filter(t => t.isBookingOpen && t.status !== "resolved");

      setThreads(mapped);
    } finally { setLoading(false); }
  }, []);

  // --- CARGAR MENSAJES ---
  const fetchMessages = useCallback(async (phoneId: string) => {
    const clean = normalizePhone(phoneId);
    const { data } = await supabase
      .from("mensajes")
      .select("*")
      .or(`client_phone.eq.${clean},client_phone.eq.+${clean}`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data.map((m) => ({
        id: m.id,
        from: (m.sender_role === "agent" || m.sender_role === "bot") ? "staff" : "client",
        text: m.content || m.message || "",
        created_at: m.created_at,
      })));
      setTimeout(() => scrollBottom("auto"), 100);
    }
  }, [scrollBottom]);

  // --- RESOLVER CHAT ---
  const handleResolveChat = async () => {
    if (!activeChat) return;
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ status: "resolved", updated_at: new Date().toISOString() })
        .eq("client_phone", activeChat.phone);

      if (!error) {
        setActiveChat(null);
        fetchThreads();
      }
    } catch (err) {
      console.error("Error al resolver:", err);
    }
  };

  useEffect(() => { fetchThreads(); }, [fetchThreads]);
  useEffect(() => { if (activeChat) fetchMessages(activeChat.phone); }, [activeChat, fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel("reservas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "mensajes" }, (payload) => {
         const newMessage = payload.new as { client_phone: string };
         if (!newMessage?.client_phone) return;
         const phone = normalizePhone(newMessage.client_phone);
         if (activeChat && normalizePhone(activeChat.phone) === phone) fetchMessages(phone);
         else fetchThreads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchThreads, fetchMessages, activeChat]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    const phone = activeChat.phone;
    const textToSend = input;
    setInput("");
    setMessages(prev => [...prev, { from: "staff", text: textToSend, created_at: new Date().toISOString() }]);
    scrollBottom("smooth");

    await fetch("/api/whatsapp/outgoing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_phone: phone, content: textToSend }),
    });
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* HEADER CON NUEVOS BOTONES */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 z-10 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          {activeChat && (
            <button onClick={() => setActiveChat(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ArrowLeft size={20}/></button>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" />
              {activeChat ? activeChat.cliente : `Reservas Abiertas (${threads.length})`}
            </span>
            {activeChat && <span className="text-[10px] text-gray-500">{activeChat.phone}</span>}
          </div>
        </div>

        {activeChat && (
          <div className="flex items-center gap-1">
            <button 
              onClick={handleResolveChat}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
              title="Marcar como resuelto"
            >
              <CheckCircle size={20} />
            </button>
            <a 
              href={`https://wa.me/${activeChat.phone.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Abrir en WhatsApp"
            >
              <ExternalLink size={20} />
            </a>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {!activeChat ? (
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <Inbox size={40} className="opacity-20" />
                <p className="text-sm">No hay reservas pendientes.</p>
              </div>
            ) : (
              threads.map((t) => (
                <div key={t.id} onClick={() => setActiveChat(t)} className="p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-indigo-50/30 cursor-pointer transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{t.cliente}</div>
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter">Open</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{t.lastMessage}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-gray-950">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "client" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                    m.from === "client" ? "bg-white text-gray-800 rounded-bl-none" : "bg-indigo-600 text-white rounded-br-none"
                  }`}>
                    {m.text}
                    <div className={`text-[9px] mt-1 text-right ${m.from === "client" ? "text-gray-400" : "text-indigo-200"}`}>
                       {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 bg-white dark:bg-gray-900 border-t flex items-center gap-2">
              <input className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm focus:outline-none" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === "Enter") sendMessage(); }} placeholder="Responde al cliente..." />
              <button onClick={sendMessage} disabled={!input.trim()} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors"><Send size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}