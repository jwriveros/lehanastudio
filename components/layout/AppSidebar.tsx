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

// 1. Agregamos onClose a las propiedades del componente
interface AppSidebarProps {
  isCollapsed?: boolean;
  onClose?: () => void; // 👈 Función para notificar el cierre al componente padre
}

const MENU_ITEMS = [
  { id: "inicio", name: "Inicio", href: "/inicio", icon: Home },
  { id: "agenda", name: "Agenda", href: "/agenda", icon: Calendar },
  { id: "bot", name: "Bot", href: "/bot", icon: Bot },
  { id: "business", name: "Negocio", href: "/business", icon: Briefcase },
  { id: "mis_informes", name: "Informes", href: "/mis_informes", icon: BarChart2 },
  { id: "finanzas", name: "Finanzas", href: "/finanzas", icon: DollarSign },
  { id: "settings", name: "Ajustes", href: "/settings", icon: Settings },
];

const FULL_PERMISSIONS: Record<string, boolean> = {
  inicio: true,
  agenda: true,
  bot: true,
  business: true,
  mis_informes: true,
  finanzas: true,
  settings: true,
};

const DEFAULT_PERMISSIONS: Record<string, boolean> = {
  inicio: true,
  agenda: false,
  bot: false,
  business: false,
  mis_informes: true,
  finanzas: false,
  settings: true,
};

function parsePermissions(rawPermissions: any): Record<string, boolean> {
  if (!rawPermissions) return DEFAULT_PERMISSIONS;
  if (typeof rawPermissions === "object") return rawPermissions;
  if (typeof rawPermissions === "string") {
    try {
      return JSON.parse(rawPermissions);
    } catch (e) {
      return DEFAULT_PERMISSIONS;
    }
  }
  return DEFAULT_PERMISSIONS;
}

export default function AppSidebar({ isCollapsed = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  const session = useSessionStore((state: any) => state.session);
  const logoutStore = useSessionStore((state: any) => state.logout);

  const [isAdmin, setIsAdmin] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>(DEFAULT_PERMISSIONS);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const syncRoleAndPermissions = async () => {
      try {
        setLoadingPermissions(true);

        if (session && session.email) {
          const cleanEmail = session.email.trim().toLowerCase();
          const mainAdminEmail = "lesliegutierrezpmu@gmail.com";
          const isMasterAdmin = cleanEmail === mainAdminEmail.toLowerCase();
          const isRoleAdmin = (session.role || "").toUpperCase() === "ADMIN";

          if (isMasterAdmin || isRoleAdmin) {
            setIsAdmin(true);
            setUserPermissions(FULL_PERMISSIONS);
            setLoadingPermissions(false);
            return;
          }

          const { data, error } = await supabase
            .from("app_users")
            .select("role, permissions")
            .ilike("email", cleanEmail)
            .maybeSingle();

          if (!error && data) {
            const roleUpper = (data.role || "").toString().toUpperCase();
            const esAdminBD = roleUpper === "ADMIN" || roleUpper === "ADMINISTRADOR";

            setIsAdmin(esAdminBD);

            if (esAdminBD) {
              setUserPermissions(FULL_PERMISSIONS);
            } else {
              setUserPermissions(parsePermissions(data.permissions));
            }
          } else {
            setIsAdmin(false);
            setUserPermissions(DEFAULT_PERMISSIONS);
          }
        }
      } catch (err) {
        console.error("Error al sincronizar permisos en AppSidebar:", err);
      } finally {
        setLoadingPermissions(false);
      }
    };

    syncRoleAndPermissions();
  }, [session]);

  // 2. Manejador para cerrar el menú cuando se hace clic en un ítem
  const handleItemClick = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    if (typeof onClose === "function") {
      onClose();
    }

    try {
      if (typeof logoutStore === "function") {
        await logoutStore();
      } else {
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = "/";
      }
    } catch (error) {
      window.location.href = "/";
    }
  };

  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    if (isAdmin) return true;
    return userPermissions[item.id] === true;
  });

  return (
    <div className="flex flex-col justify-between h-full p-2 select-none font-sans antialiased">
      
      {/* NAVEGACIÓN LATERAL */}
      <nav className="flex flex-col gap-1.5 pt-1 w-full">
        {!loadingPermissions && visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleItemClick} // 👈 Cerramos el menú automáticamente al hacer clic
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer w-full ${
                isActive
                  ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
              }`}
            >
              <div className="flex items-center justify-center w-5 h-5 shrink-0">
                <Icon 
                  size={18} 
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-rose-500"
                  }`} 
                />
              </div>

              <span className="text-xs tracking-wide font-medium text-zinc-200 whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* BOTÓN CIERRE DE SESIÓN */}
      <div className="pt-2 border-t border-zinc-800/80 w-full">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center justify-center w-5 h-5 shrink-0">
            <LogOut size={18} className="transition-transform duration-200 group-hover:rotate-12" />
          </div>
          <span className="text-xs tracking-wide font-medium whitespace-nowrap">
            {isLoggingOut ? "Cerrando..." : "Salir"}
          </span>
        </button>
      </div>

    </div>
  );
}