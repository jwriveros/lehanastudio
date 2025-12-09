"use client";

import { useMemo, useState } from "react";
import { chatThreads } from "@/lib/mockData";

type Tab = "active" | "abandoned";

type Props = {
  fillHeight?: boolean;
};

export function ChatPanel({ fillHeight = false }: Props) {
  const [tab, setTab] = useState<Tab>("active");
  const [threads, setThreads] = useState(chatThreads);
  const [activeId, setActiveId] = useState<string | null>(chatThreads[0]?.id ?? null);

  const visibleThreads = useMemo(() => {
    const filtered = threads.filter((chat) => {
      if (tab === "abandoned") return chat.status === "abandoned";
      return chat.status === "active";
    });

    return filtered.sort((a, b) => (a.startedAt ?? "") > (b.startedAt ?? "") ? 1 : -1);
  }, [tab, threads]);

  const currentChat = useMemo(
    () => visibleThreads.find((chat) => chat.id === activeId) ?? visibleThreads[0] ?? null,
    [activeId, visibleThreads],
  );

  const selectChat = (id: string) => {
    const found = threads.find((chat) => chat.id === id);
    if (found) setActiveId(found.id);
  };

  const closeChat = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((chat) => chat.id !== id);
      if (currentChat?.id === id) {
        const remaining = next.filter((chat) => {
          if (tab === "abandoned") return chat.status === "abandoned";
          return chat.status === "active";
        });
        setActiveId(remaining[0]?.id ?? null);
      }
      return next;
    });
  };

  const containerClass = fillHeight ? "space-y-4 flex h-full flex-col" : "space-y-4";
  const gridClass = fillHeight ? "grid gap-4 lg:grid-cols-[1fr_1.3fr] flex-1 min-h-0" : "grid gap-4 lg:grid-cols-[1fr_1.3fr]";

  return (
    <section id="chat" className={containerClass}>
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setTab("active")}
          className={`rounded-full px-3 py-1 font-semibold ${
            tab === "active"
              ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          }`}
        >
          Chats ({threads.filter((c) => c.status === "active").length})
        </button>
        <button
          onClick={() => setTab("abandoned")}
          className={`rounded-full px-3 py-1 font-semibold ${
            tab === "abandoned"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          }`}
        >
          Abandonados ({threads.filter((c) => c.status === "abandoned").length})
        </button>
      </div>

      <div className={gridClass}>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-800">
            <span>{tab === "abandoned" ? "Abandonados" : "Chats en curso"}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
              {visibleThreads.length} abiertos
            </span>
          </div>

          <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
            {visibleThreads.map((chat) => (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={() => selectChat(chat.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") selectChat(chat.id);
                }}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-indigo-50 dark:hover:bg-indigo-950/30 ${
                  currentChat?.id === chat.id ? "bg-indigo-50 dark:bg-indigo-950/20" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{chat.cliente}</div>
                    <span className="truncate text-[11px] text-zinc-500">{chat.phone}</span>
                  </div>
                  <div className="mt-1 truncate text-sm text-zinc-700 dark:text-zinc-200">“{chat.lastMessage}”</div>
                  <div className="text-[11px] text-zinc-400">Inició {chat.startedAt ?? "--:--"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${chat.phone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeChat(chat.id);
                    }}
                    className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-200"
                  >
                    Cerrar
                  </button>
                  {chat.unread ? (
                    <span className="rounded-full bg-rose-100 px-2 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
                      {chat.unread}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {currentChat ? (
          <div className="flex min-h-0 flex-col rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{currentChat.cliente}</div>
                <p className="text-sm text-zinc-500">numberc: {currentChat.numberc} · {currentChat.phone}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <a
                  href={`https://wa.me/${currentChat.phone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200"
                >
                  Abrir en WhatsApp
                </a>
                <button
                  onClick={() => closeChat(currentChat.id)}
                  className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-200"
                >
                  Cerrar chat
                </button>
              </div>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
              {currentChat.history.map((message, index) => (
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
              <button className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Enviar via n8n</button>
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              /api/whatsapp/outgoing envía a n8n; /api/whatsapp/incoming guarda la respuesta. Usa el número para asociar en Supabase.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-300">
            No hay chats abiertos en esta pestaña.
          </div>
        )}
      </div>
    </section>
  );
}
