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

// Configuración de rutas y permisos por rol
const MENU_ITEMS = [
  { name: "Inicio", href: "/inicio", icon: Home, roles: ["admin"] },
  { name: "Agenda", href: "/agenda", icon: Calendar, roles: ["admin"] },
  { name: "Bot", href: "/dashboard/bot", icon: Bot, roles: ["admin"] },
  { name: "Negocio", href: "/business", icon: Briefcase, roles: ["admin"] },
  { name: "Informes", href: "/mis-informes", icon: BarChart2, roles: ["admin", "especialista"] },
  { name: "Finanzas", href: "/finanzas", icon: DollarSign, roles: ["admin"] },
  { name: "Ajustes", href: "/settings", icon: Settings, roles: ["admin", "especialista"] },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Verificamos si la cuenta iniciada es la administradora principal
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

  // Función para cerrar sesión limpiando Zustand, Supabase y LocalStorage
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

  // Determinamos el rol actual ("admin" o "especialista")
  const currentRole = isAdmin ? "admin" : "especialista";

  // Filtramos los ítems visibles según el rol del usuario
  const visibleMenuItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <div className="flex flex-col justify-between h-full p-3 min-h-[calc(100vh-3.5rem)]">
      {/* SECCIÓN SUPERIOR: Menú filtrado por rol */}
      <nav className="flex flex-col gap-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60"
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* SECCIÓN INFERIOR: Botón de Cierre de Sesión */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className="truncate">
            {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
          </span>
        </button>
      </div>
    </div>
  );
}