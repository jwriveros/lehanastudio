"use client";

import React, { useState } from "react";
import AppSidebar from "./AppSidebar";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { Menu, X, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useSessionStore } from "@/lib/sessionStore";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Contraído por defecto
  const { session } = useSessionStore();

  const userInitial = session?.name ? session.name.charAt(0).toUpperCase() : "A";

  const toggleSidebarDesktop = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300">
      
      {/* OVERLAY PARA MÓVILES */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[290] bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* BARRA LATERAL DELGADA Y COMPACTA (md:w-16 contraída, md:w-52 expandida) */}
      <aside
        className={`fixed inset-y-0 left-0 z-[300] flex flex-col bg-white dark:bg-zinc-900/95 border-r border-zinc-200/80 dark:border-zinc-800 transition-all duration-300 ease-in-out md:static md:translate-x-0 overflow-hidden ${
          isSidebarOpen ? "translate-x-0 w-52 shadow-2xl" : "-translate-x-full md:translate-x-0"
        } ${
          isCollapsed ? "md:w-16" : "md:w-52"
        }`}
      >
        {/* CABECERA DE LA BARRA LATERAL */}
        <div className="flex h-14 items-center justify-between px-3.5 border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 shrink-0">
              <Sparkles size={14} />
            </div>
            
            <span
              className={`font-black text-[11px] tracking-wider uppercase text-zinc-900 dark:text-zinc-100 transition-opacity duration-200 whitespace-nowrap ${
                isCollapsed ? "md:opacity-0 md:w-0" : "opacity-100"
              }`}
            >
              LS <span className="text-rose-500">CRM</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors md:hidden cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* MENÚ DE ENLACES */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <AppSidebar isCollapsed={isCollapsed} />
        </div>

        {/* BOTÓN INFERIOR DELGADO */}
        <div className="hidden md:flex p-2 border-t border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
          <button
            type="button"
            onClick={toggleSidebarDesktop}
            className="w-full flex items-center justify-center p-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 text-zinc-400 hover:text-rose-500 transition-all cursor-pointer"
            title={isCollapsed ? "Expandir" : "Contraer"}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 w-full">
        <header className="relative z-10 flex h-14 items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors md:hidden cursor-pointer"
            >
              <Menu size={18} />
            </button>

            <button
              type="button"
              onClick={toggleSidebarDesktop}
              className="hidden md:flex p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Lehana Studio
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                CRM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggleButton />

            <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-xs font-black text-white shadow-xs shrink-0">
                {userInitial}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[120px]">
                  {session?.name || "Administrador"}
                </p>
                <p className="text-[9px] font-semibold text-rose-500 uppercase tracking-wider">
                  {session?.role || "ADMIN"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-zinc-50/50 dark:bg-zinc-950 w-full min-w-0">
          {children}
        </main>
      </div>

    </div>
  );
}