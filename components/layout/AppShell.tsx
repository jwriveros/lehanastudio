"use client";

import React, { useState } from "react";
import AppSidebar from "./AppSidebar";
import { Menu, X } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-950 text-gray-100">
      
      {/* 1. TELÓN DE FONDO (Overlay): Tapa la agenda cuando el menú está desplegado */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[290] bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. BARRA LATERAL (Sidebar): Flotante y oculta por defecto para ahorrar espacio */}
      <aside
        className={`fixed inset-y-0 left-0 z-[300] flex flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-300 ${
          isSidebarOpen 
            ? "translate-x-0 w-64 shadow-2xl" 
            : "-translate-x-full w-64"
        }`}
      >
        {/* Cabecera del menú lateral con botón de cierre */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-800 bg-gray-900">
          <span className="font-black text-indigo-400 tracking-wider text-sm uppercase">
            Lehana Studio
          </span>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menú de navegación */}
        <div className="flex-1 overflow-y-auto">
          <AppSidebar />
        </div>
      </aside>

      {/* 3. ÁREA PRINCIPAL: Ocupa el 100% del ancho de la pantalla */}
      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0">
        
        {/* Barra superior global */}
        <header className="relative z-10 flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-300 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
              aria-label="Abrir o cerrar menú"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-base font-black text-indigo-400 tracking-tight">
              Lehana Studio
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-md">
              A
            </div>
          </div>
        </header>

        {/* Espacio donde se renderiza la agenda a pantalla completa */}
        <main className="flex-1 overflow-auto bg-gray-950 w-full">
          {children}
        </main>
      </div>

    </div>
  );
}