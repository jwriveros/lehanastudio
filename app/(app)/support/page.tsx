"use client";

import { ChatPanel } from "@/components/ChatPanel";

export default function SupportPage() {
  return (
    <section className="relative h-full overflow-hidden bg-white flex flex-col">
      <div className="w-full flex-1 min-h-0">
        <ChatPanel />
      </div>
    </section>
  );
}

