"use client";

import React, { useState } from "react";
import AppSidebar from "./AppSidebar";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { Menu, X } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">
      
      {/* 1. Telón de fondo (Overlay) para móviles */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[290] bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Barra lateral adaptativa (Soporta modo Claro y Oscuro) */}
      <aside
        className={`fixed inset-y-0 left-0 z-[300] flex flex-col bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen 
            ? "translate-x-0 w-64 shadow-2xl" 
            : "-translate-x-full md:translate-x-0 md:w-20"
        }`}
      >
        {/* Cabecera interna del Sidebar */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <span className="font-black text-indigo-600 dark:text-indigo-400 tracking-wider text-sm uppercase">
            Lehana Studio
          </span>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-colors md:hidden"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menú de enlaces */}
        <div className="flex-1 overflow-y-auto">
          <AppSidebar />
        </div>
      </aside>

      {/* 3. Contenedor principal */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 w-full">
        
        {/* Encabezado superior global */}
        <header className="relative z-10 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Abrir o cerrar menú"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-base font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              Lehana Studio
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón selector de tema */}
            <ThemeToggleButton />

            {/* Avatar del usuario */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-md">
              A
            </div>
          </div>
        </header>

        {/* Vista activa */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-950 w-full min-w-0">
          {children}
        </main>
      </div>

    </div>
  );
}