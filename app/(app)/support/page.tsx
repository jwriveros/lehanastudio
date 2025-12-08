"use client";

import { ChatPanel } from "@/components";

export default function SupportPage() {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Soporte · WhatsApp</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Responde clientes desde el inbox en tiempo real.</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Chats activos</span>
      </div>
      <div className="mt-4">
        <ChatPanel />
      </div>
    </section>
  );
}
