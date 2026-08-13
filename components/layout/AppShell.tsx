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
      
      {/* Telón de fondo oscuro para móviles */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[290] bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Menú lateral flotante en móviles / estático en escritorio */}
      <aside
        className={`fixed inset-y-0 left-0 z-[300] flex flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen 
            ? "translate-x-0 w-64 shadow-2xl" 
            : "-translate-x-full md:translate-x-0 md:w-20"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-800 bg-gray-900 md:hidden">
          <span className="font-black text-indigo-400 tracking-wider text-sm uppercase">
            Lehana Studio
          </span>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AppSidebar />
        </div>
      </aside>

      {/* Contenedor principal de contenido con min-w-0 para evitar desbordamientos */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 w-full">
        
        {/* Encabezado global */}
        <header className="relative z-10 flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-300 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
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

        {/* Área de la página activa con overflow controlado */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-950 w-full min-w-0">
          {children}
        </main>
      </div>

    </div>
  );
}