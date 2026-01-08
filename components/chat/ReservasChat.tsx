"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { normalizePhone, getSenderRole } from "@/lib/chatUtils";
import {
  ArrowLeft,
  Check,
  Send,
  Loader2,
  Calendar, 
  Inbox
} from "lucide-react";

type Thread = {
  id: string;
  cliente: string;
  phone: string;
  lastMessage: string;
  updated_at?: string;
  isBookingOpen: boolean; // Crucial para el filtro
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    
    // 1. Obtener sesiones y solicitudes de reserva OPEN simultáneamente
    const [sessionsRes, bookingsRes] = await Promise.all([
      supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("booking_requests")
        .select("customer_phone")
        .eq("status", "OPEN")
    ]);

    const sessions = sessionsRes.data || [];
    const openBookings = bookingsRes.data || [];

    // 2. Crear Set de teléfonos con reservas abiertas
    const openBookingPhones = new Set(
      openBookings.map(b => normalizePhone(b.customer_phone)).filter(Boolean)
    );

    // 3. Obtener nombres de clientes
    const phones = sessions.map((s) => normalizePhone(s.client_phone)).filter(Boolean) as string[];
    const { data: clients } = await supabase
      .from("clients")
      .select("nombre, numberc")
      .in("numberc", phones);

    const clientsMap = new Map<string, string>();
    clients?.forEach((c) => {
      if (c.numberc) clientsMap.set(String(c.numberc), c.nombre);
    });

    // 4. Mapear y Filtrar (Solo los que tienen isBookingOpen)
    const mapped: Thread[] = sessions
      .map((s) => {
        const phone = normalizePhone(s.client_phone) || String(s.client_phone);
        const name = clientsMap.get(phone) || s.client_name || `Cliente (${phone})`;
        
        return {
          id: phone,
          phone,
          cliente: name,
          lastMessage: s.last_message || "",
          updated_at: s.updated_at,
          isBookingOpen: openBookingPhones.has(phone)
        };
      })
      .filter(t => t.isBookingOpen); // <--- FILTRO DE RESERVAS ACTIVAS

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
      .or(`client_phone.eq.${clean},client_phone.eq.+${clean}`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data.map((m) => ({
        id: m.id,
        from: getSenderRole(m),
        text: m.content || m.message || "",
        created_at: m.created_at,
      })));
      setTimeout(() => scrollBottom("auto"), 100);
    }
  }, [scrollBottom]);

  useEffect(() => {
    if (!activeChat) return;
    fetchMessages(activeChat.phone);
  }, [activeChat, fetchMessages]);

  // REALTIME
  useEffect(() => {
    const channel = supabase
      .channel("reservas-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => fetchThreads())
      .on("postgres_changes", { event: "*", schema: "public", table: "booking_requests" }, () => fetchThreads())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, (payload) => {
         const phone = normalizePhone(payload.new.client_phone);
         if (activeChat && normalizePhone(activeChat.phone) === phone) {
            fetchMessages(phone);
         } else {
            fetchThreads();
         }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchThreads, fetchMessages, activeChat]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    const phone = activeChat.phone;
    const textToSend = input;
    setInput("");

    // Optimistic Update
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
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center gap-3">
          {activeChat && (
            <button onClick={() => setActiveChat(null)} className="p-1 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" />
              {activeChat ? activeChat.cliente : `Reservas Abiertas (${threads.length})`}
            </span>
            {activeChat && <span className="text-[10px] text-gray-500">{activeChat.phone}</span>}
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {loading && threads.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        )}
        
        {!activeChat ? (
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <Inbox size={40} className="opacity-20" />
                <p className="text-sm">No hay reservas con estado OPEN.</p>
              </div>
            ) : (
              threads.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => setActiveChat(t)} 
                  className="p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.cliente}</div>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">Open</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[280px]">{t.lastMessage}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-gray-950">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "client" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                    m.from === "client" 
                    ? "bg-white text-gray-800 rounded-bl-none" 
                    : "bg-indigo-600 text-white rounded-br-none"
                  }`}>
                    {m.text}
                    <div className={`text-[9px] mt-1 text-right ${m.from === "client" ? "text-gray-400" : "text-indigo-200"}`}>
                       {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t dark:border-gray-800 flex items-center gap-2">
              <input 
                className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if(e.key === "Enter") sendMessage(); }}
                placeholder="Escribe una respuesta..."
              />
              <button 
                onClick={sendMessage} 
                disabled={!input.trim()}
                className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}