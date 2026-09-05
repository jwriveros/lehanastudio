"use client";

import React from "react";

// 1. Definición estricta de las propiedades requeridas
interface AgendaShellProps {
  header: React.ReactNode;
  agenda: React.ReactNode;
}

export default function AgendaShell({
  header,
  agenda,
}: AgendaShellProps) {
  return (
    // 2. Contenedor principal: Ocupa el alto disponible sin desbordar la ventana global
    <div className="flex flex-col h-full w-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300">
      
      {/* --- Encabezado Adaptativo (Controles de Fecha y Filtros) --- */}
      <header className="shrink-0 z-20 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md transition-colors">
        {header}
      </header>
      
      {/* --- Contenido Principal de la Agenda (Grilla Interactiva / Calendario) --- */}
      <main className="flex-1 min-h-0 w-full overflow-auto custom-scrollbar relative">
        {agenda}
      </main>
      
    </div>
  );
}