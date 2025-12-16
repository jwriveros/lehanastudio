"use client";

import AppSidebar from "./AppSidebar";
import { AgendaCollapseProvider } from "./AgendaCollapseContext";

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <AgendaCollapseProvider>
      {/* h-screen y overflow-hidden son fundamentales para que el chat no se rompa en móvil */}
      <div className="min-h-[100dvh] h-screen flex flex-col md:flex-row bg-white overflow-hidden">
        
        {/* El sidebar ahora maneja su propio header móvil */}
        <AppSidebar />
        
        <main className="flex-1 min-h-0 relative overflow-hidden h-full">
          {children}
        </main>
        
      </div>
    </AgendaCollapseProvider>
  );
}