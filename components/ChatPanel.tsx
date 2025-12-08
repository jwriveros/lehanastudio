"use client";

import { useState } from "react";
import { chatThreads } from "@/lib/mockData";

export function ChatPanel() {
  const [activeChat, setActiveChat] = useState(chatThreads[0]);

  return (
    <section id="chat" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Chat interno · WhatsApp</h2>
          <p className="text-sm text-zinc-500">Sincronizado con n8n y almacenando en mensajes + n8n_chat_histories</p>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Realtime on</div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white/90 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-xs uppercase text-zinc-500">Chats</div>
          <div className="space-y-2">
            {chatThreads.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                  chat.id === activeChat.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-zinc-200 hover:border-indigo-200"
                }`}
              >
                <div>
                  <div className="font-semibold">{chat.cliente}</div>
                  <div className="text-xs text-zinc-500">{chat.lastMessage}</div>
                </div>
                {chat.unread ? <span className="rounded-full bg-rose-100 px-2 text-[10px] text-rose-700">{chat.unread}</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{activeChat.cliente}</div>
                <p className="text-sm text-zinc-500">numberc: {activeChat.numberc} · Enviar plantillas y notas internas</p>
              </div>
              <button className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">Responder</button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              {activeChat.history.map((message, index) => (
                <div key={index} className={`flex ${message.from === "client" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                      message.from === "client"
                        ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-50"
                        : "bg-indigo-500 text-white"
                    }`}
                  >
                    <div>{message.text}</div>
                    <div className="text-[10px] opacity-70">{message.at}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Escribe un mensaje o pega una plantilla"
              />
              <button className="rounded-xl bg-indigo-600 px-3 py-2 text-sm text-white">Enviar via n8n</button>
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              El endpoint `/api/whatsapp/outgoing` recibe payloads para n8n, mientras `/api/whatsapp/incoming` captura el webhooks
              de mensajes entrantes. `n8n_chat_histories` guarda la conversación por sesión.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
