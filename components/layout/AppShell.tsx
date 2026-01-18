"use client";

import AppSidebar from "./AppSidebar";
import { AgendaCollapseProvider } from "./AgendaCollapseContext";

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <AgendaCollapseProvider>
      {/* El contenedor principal se mantiene con overflow-hidden para evitar scroll doble */}
      <div className="min-h-[100dvh] h-screen flex flex-col md:flex-row bg-white overflow-hidden">
        
        <AppSidebar />
        
        {/* CAMBIO AQUÍ: 
           Cambiamos 'overflow-hidden' por 'overflow-y-auto' 
           para que el contenido de las páginas pueda desplazarse.
        */}
        <main className="flex-1 min-h-0 relative overflow-y-auto h-full bg-[#F8F9FC] dark:bg-zinc-950">
          {children}
        </main>
        
      </div>
    </AgendaCollapseProvider>
  );
}