"use client";
import { useState } from "react";
import { useAgendaCollapse } from "./AgendaCollapseContext";
import { usePathname } from "next/navigation";
import { useSessionStore } from "@/lib/sessionStore";
import {
  LogOut,
  MessageSquare,
  Calendar,
  BriefcaseBusiness,
  BarChart,
  Settings,
  Menu,
  X,
  DollarSign,
  Home
} from "lucide-react";
import Link from "next/link";
import { ThemeToggleButton } from "./ThemeToggleButton";

/**
 * Componente Sidebar principal.
 * Filtra las opciones del menú basándose en el rol del usuario almacenado en el Store.
 */
export default function AppSidebar() {
  const { toggle } = useAgendaCollapse();
  const { session, logout } = useSessionStore(); 
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Obtenemos el rol directamente del Store centralizado y normalizamos a mayúsculas.
  const currentRole = session?.role?.toUpperCase() || 'ESPECIALISTA';

  // Definición de ítems con sus roles permitidos.
  const menuItems = [
    { icon: Home, href: "/inicio", label: "Inicio", roles: ['ADMIN', 'ESPECIALISTA', 'SPECIALIST'] },
    { icon: Calendar, href: "/agenda", label: "Agenda", roles: ['ADMIN'] },
    { icon: DollarSign, href: "/mis-informes", label: "Mis informes", roles: ['SPECIALIST', 'ESPECIALISTA'] },
    { icon: MessageSquare, href: "/support", label: "Soporte", roles: ['ADMIN'] },
    { icon: BriefcaseBusiness, href: "/business", label: "Negocio", roles: ['ADMIN'] },
    { icon: BarChart, href: "/dashboard", label: "Dashboard", roles: ['ADMIN'] },
    { icon: Settings, href: "/settings", label: "Ajustes", roles: ['ADMIN'] },
  ];

  // Filtrado estricto: Solo muestra ítems que incluyan el rol actual del usuario.
  const filteredMenu = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <>
      {/* HEADER MÓVIL */}
      <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 w-full z-50">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-zinc-600 dark:text-zinc-300">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="font-bold text-indigo-600">Lehana Studio</div>
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] uppercase">
          {session?.name?.charAt(0) || 'U'}
        </div>
      </header>

      {/* OVERLAY MÓVIL */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* ASIDE BAR */}
      <aside className={`
        fixed z-50 h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col items-center py-4 transition-transform duration-300 
        ${isOpen ? "translate-x-0 w-16" : "-translate-x-full"} 
        lg:relative lg:translate-x-0 lg:w-14 lg:flex lg:shrink-0
      `}>
        {/* BOTÓN TOGGLE ESCRITORIO */}
        <button 
          onClick={toggle} 
          className="hidden md:flex p-2 mb-4 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-300"
        >
          <Menu size={20} />
        </button>

        {/* INDICADOR DE ROL (Avatar pequeño) */}
        <div className="hidden md:flex w-8 h-8 rounded-full bg-indigo-600 text-white items-center justify-center font-bold mb-6 text-[9px] uppercase">
          {currentRole === 'ADMIN' ? 'AD' : 'SP'}
        </div>

        {/* NAVEGACIÓN PRINCIPAL */}
        <nav className="flex flex-col items-center gap-2 w-full px-3">
          {filteredMenu.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                title={item.label}
                className={`
                  flex justify-center items-center rounded-lg transition-colors h-10 w-10 
                  ${isActive 
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" 
                    : "text-zinc-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }
                `}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}
        </nav>

        {/* ACCIONES INFERIORES (Tema y Salida) */}
        <div className="mt-auto w-full px-3 flex flex-col items-center gap-2">
          <ThemeToggleButton />
          <button 
            onClick={() => logout()} // Llama a la función logout que limpia cookies y redirige.
            title="Cerrar Sesión" 
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/40"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>
    </>
  );
}