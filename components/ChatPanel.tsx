// jwriveros/lehanastudio/lehanastudio-a8a570c007a1557a6ccd13baa5a39a3fe79a534a/components/ChatPanel.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clients as mockClients } from "@/lib/mockData"; // Fallback por si acaso

type Tab = "active" | "abandoned" | "reservations";

// Tipos para la UI
type ChatUser = {
  id: string; // numberc o uuid
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

  // 1. Cargar lista de "Chats" (Clientes)
  useEffect(() => {
    const fetchThreads = async () => {
      setLoadingThreads(true);
      // Traemos clientes. Asumimos que la tabla 'clients' tiene los datos básicos.
      // En un futuro, podrías hacer un join con la tabla de mensajes para ver el último texto real.
      const { data, error } = await supabase
        .from("clients")
        .select("numberc, Nombre, Celular, lastIncomingAt, Tipo, notes");

      if (error) {
        console.error("Error loading chats:", error);
      } else if (data) {
        const mappedThreads: ChatUser[] = data.map((c: any) => ({
          id: c.numberc,
          cliente: c.Nombre,
          phone: c.Celular,
          // Si tienes un campo de último mensaje en clientes, úsalo. Si no, ponemos un placeholder.
          lastMessage: c.notes || "Haga clic para ver historial",
          unread: 0, // Podrías calcular esto con un count() de mensajes no leídos
          status: "active", // Por defecto activos. Podrías usar c.Tipo para filtrar (ej. 'Lead' -> 'active')
          lastActivity: c.lastIncomingAt || new Date().toISOString(),
        }));

        // Ordenar por actividad reciente
        mappedThreads.sort((a, b) => (a.lastActivity > b.lastActivity ? -1 : 1));
        setThreads(mappedThreads);
        if (mappedThreads.length > 0 && !activeId) {
            setActiveId(mappedThreads[0].id);
        }
      }
      setLoadingThreads(false);
    };

    fetchThreads();
  }, []);

  // 2. Cargar Mensajes del chat seleccionado
  useEffect(() => {
    if (!activeId) return;
    
    const fetchMessages = async () => {
        setLoadingMessages(true);
        // Buscamos mensajes donde el 'client_id' o 'phone' coincida con el chat activo
        // Asumiendo que tu tabla mensajes tiene columnas: content, sender_role ('client'|'staff'), client_reference
        const activeThread = threads.find(t => t.id === activeId);
        if (!activeThread) return;

        // Intentamos buscar por numero de celular (limpiando espacios) o por numberc
        const cleanPhone = activeThread.phone.replace(/\D/g, ''); 

        const { data, error } = await supabase
            .from("mensajes")
            .select("*")
            .or(`client_phone.eq.${activeThread.phone},client_phone.eq.${cleanPhone},client_id.eq.${activeId}`) // Busqueda flexible
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
        } else {
            // Mapear DB a UI
            const uiMessages: ChatMessage[] = (data || []).map((m: any) => ({
                id: m.id,
                text: m.content || m.text || "", 
                from: (m.sender_role === "staff" || m.direction === "outbound") ? "staff" : "client",
                created_at: m.created_at
            }));
            setMessages(uiMessages);
        }
        setLoadingMessages(false);
    };

    fetchMessages();

    // Opcional: Suscribirse a nuevos mensajes en tiempo real para este chat
    const channel = supabase.channel('realtime:mensajes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload) => {
        // Si el mensaje nuevo pertenece al chat activo, agregarlo
        const newMsg = payload.new as any;
        if (newMsg.client_id === activeId || newMsg.client_phone === threads.find(t=>t.id===activeId)?.phone) {
             setMessages((prev) => [...prev, {
                id: newMsg.id,
                text: newMsg.content || newMsg.text,
                from: newMsg.sender_role === 'staff' ? 'staff' : 'client',
                created_at: newMsg.created_at
             }]);
        }
    })
    .subscribe();

    return () => { supabase.removeChannel(channel); };

  }, [activeId, threads]);


 const sendMessage = async () => {
    if (!inputText.trim() || !activeId) return;
    
    const activeThread = threads.find(t => t.id === activeId);
    if (!activeThread) return;

    // 1. UI Optimista (mostrar mensaje inmediatamente en el frontend)
    const tempMsg: ChatMessage = { from: "staff", text: inputText, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);
    
    const payloadToSend = {
        client_phone: activeThread.phone,
        content: inputText,
    };
    
    const textToSend = inputText;
    setInputText(""); // Limpiar input DESPUÉS de capturar el texto

    // 2. Llamar a la API de Next.js, que a su vez llama a n8n
    const response = await fetch('/api/whatsapp/outgoing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSend),
    });

    // ... manejo de errores (opcional)
};

  const currentChat = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [activeId, threads]);

  return (
    <section id="chat" className="space-y-4">
      {/* Pestañas de estado (Visuales por ahora) */}
      <div className="flex items-center gap-2 text-xs">
        {["active", "reservations", "abandoned"].map((t) => (
             <button
             key={t}
             onClick={() => setTab(t as Tab)}
             className={`rounded-full px-3 py-1 font-semibold capitalize ${
               tab === t
                 ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200"
                 : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
             }`}
           >
             {t}
           </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        {/* Lista de Chats */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 h-[600px]">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800">
            <span>Chats Recientes</span>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
              {threads.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {loadingThreads ? <p className="p-4 text-sm text-zinc-400">Cargando chats...</p> : threads.map((chat) => (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveId(chat.id)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-indigo-50 dark:hover:bg-indigo-950/30 ${
                  activeId === chat.id ? "bg-indigo-50 dark:bg-indigo-950/20 border-l-4 border-l-indigo-500" : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{chat.cliente}</div>
                  </div>
                  <div className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{chat.lastMessage}</div>
                  <div className="mt-1 text-[10px] text-zinc-400">{new Date(chat.lastActivity).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zona de Conversación */}
        {currentChat ? (
          <div className="flex flex-col rounded-2xl border border-zinc-100 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 h-[600px]">
            {/* Header del Chat */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-4 dark:border-zinc-800">
              <div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{currentChat.cliente}</div>
                <p className="text-sm text-zinc-500">{currentChat.phone}</p>
              </div>
              <a
                href={`https://wa.me/${currentChat.phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200"
              >
                Abrir WhatsApp Web
              </a>
            </div>

            {/* Mensajes */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-zinc-50/50 dark:bg-black/20">
              {loadingMessages ? <p className="text-center text-xs text-zinc-400">Cargando historial...</p> : messages.length === 0 ? (
                 <p className="text-center text-sm text-zinc-400 py-10">No hay mensajes previos. ¡Inicia la conversación!</p>
              ) : (
                  messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.from === "client" ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          msg.from === "client"
                            ? "bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-50 rounded-bl-none border border-zinc-100 dark:border-zinc-700"
                            : "bg-indigo-600 text-white rounded-br-none"
                        }`}
                      >
                        <div>{msg.text}</div>
                        <div className={`text-[10px] mt-1 text-right ${msg.from === 'client' ? 'text-zinc-400' : 'text-indigo-200'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-indigo-900"
                  placeholder="Escribe un mensaje..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button 
                    onClick={sendMessage}
                    className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 shadow-md shadow-indigo-200/50"
                >
                    Enviar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-300">
            Selecciona un cliente para ver el chat.
          </div>
        )}
      </div>
    </section>
  );
}