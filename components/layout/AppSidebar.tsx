"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSessionStore } from "@/lib/sessionStore";
import {
  Home,
  Calendar,
  Bot,
  Briefcase,
  BarChart2,
  DollarSign,
  Settings,
  LogOut,
} from "lucide-react";

interface AppSidebarProps {
  isCollapsed?: boolean;
}

const MENU_ITEMS = [
  { name: "Inicio", href: "/inicio", icon: Home, roles: ["admin"] },
  { name: "Agenda", href: "/agenda", icon: Calendar, roles: ["admin"] },
  { name: "Bot", href: "/bot", icon: Bot, roles: ["admin"] },
  { name: "Negocio", href: "/business", icon: Briefcase, roles: ["admin"] },
  { name: "Informes", href: "/mis-informes", icon: BarChart2, roles: ["admin", "especialista"] },
  { name: "Finanzas", href: "/finanzas", icon: DollarSign, roles: ["admin"] },
  { name: "Ajustes", href: "/settings", icon: Settings, roles: ["admin", "especialista"] },
];

export default function AppSidebar({ isCollapsed = false }: AppSidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const emailAdmin = "lesliegutierrezpmu@gmail.com";
    let esAdministrador = false;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const content = localStorage.getItem(key) || "";
      if (content.toLowerCase().includes(emailAdmin)) {
        esAdministrador = true;
        break;
      }
    }

    setIsAdmin(esAdministrador);
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (error) {
      console.error("Error al cerrar sesión en Supabase:", error);
    } finally {
      try {
        const store = useSessionStore.getState() as any;
        if (typeof store.logout === "function") {
          await store.logout();
        } else if (typeof store.clearSession === "function") {
          await store.clearSession();
        }
      } catch (storeError) {
        console.log("Limpiando estado de sesión...");
      }

      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
      }
    }
  };

  const currentRole = isAdmin ? "admin" : "especialista";
  const visibleMenuItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <div className="flex flex-col justify-between h-full p-2 select-none">
      
      {/* NAVEGACIÓN COMPACTA Y MINIMALISTA */}
      <nav className="flex flex-col gap-1 pt-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-rose-500 text-white shadow-xs shadow-rose-500/30"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              }`}
            >
              {/* Ícono más pequeño (16px) y estilizado */}
              <div className="flex items-center justify-center w-5 h-5 shrink-0">
                <Icon 
                  size={16} 
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-zinc-400 dark:text-zinc-400 group-hover:text-rose-500"
                  }`} 
                />
              </div>

              {/* Texto de la opción con desvanecimiento */}
              <span
                className={`truncate text-[11px] tracking-wide transition-all duration-300 ${
                  isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* BOTÓN CIERRE DE SESIÓN COMPACTO */}
      <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="group flex w-full items-center gap-3 px-2.5 py-2 rounded-xl text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 transition-all duration-300 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-center w-5 h-5 shrink-0">
            <LogOut size={16} className="transition-transform duration-200 group-hover:rotate-12" />
          </div>
          <span
            className={`truncate tracking-wide transition-all duration-300 ${
              isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
            }`}
          >
            {isLoggingOut ? "..." : "Salir"}
          </span>
        </button>
      </div>

    </div>
  );
}