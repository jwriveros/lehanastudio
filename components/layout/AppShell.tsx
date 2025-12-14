"use client";

import AppSidebar from "./AppSidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-zinc-50">

      {/* CUERPO */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* SIDEBAR (chats / menú) */}
        <AppSidebar />

        {/* CONTENIDO */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
