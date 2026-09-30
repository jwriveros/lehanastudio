"use client";

import React, { useState } from "react";
import { Sparkles, Send, Bot, User, Loader2, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export default function AIChatReportes() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "¡Hola! Soy tu asistente de inteligencia artificial para Lehana Studio. Puedes preguntarme sobre tus reservas, ver qué clientes no han vuelto en cierto rango de fechas o consultar cualquier métrica de la tabla de citas.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/reportes-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessageText }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.output || "No fue posible procesar la respuesta en este momento.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "Error de comunicación con la IA. Por favor, verifica la conexión.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col h-[550px] font-sans">
      
      {/* CABECERA */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-2xl">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white">
              Asistente Virtual de Reservas
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold">
              Integrado con n8n & Gemini AI
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          title="Reiniciar conversación"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ÁREA DE CONVERSACIÓN */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-rose-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-rose-500"
              }`}
            >
              {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs font-medium space-y-1 ${
                msg.sender === "user"
                  ? "bg-rose-500 text-white rounded-tr-none"
                  : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50"
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              <span
                className={`text-[9px] block text-right font-mono ${
                  msg.sender === "user" ? "text-rose-200" : "text-zinc-400"
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 italic">
            <Loader2 className="animate-spin text-rose-500" size={16} />
            <span>Consultando datos de las reservas en n8n...</span>
          </div>
        )}
      </div>

      {/* CAMPO DE TEXTO */}
      <form onSubmit={handleSendMessage} className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: ¿Qué clientes agendaron en mayo pero no han vuelto?"
          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold px-4 py-3 rounded-2xl outline-none focus:border-rose-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
        >
          <Send size={14} />
          <span className="hidden sm:inline">Consultar</span>
        </button>
      </form>

    </div>
  );
}