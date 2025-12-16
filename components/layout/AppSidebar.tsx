"use client";
import { useState } from "react";
import { useAgendaCollapse } from "./AgendaCollapseContext";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  LogOut,
  MessageSquare,
  Calendar,
  BriefcaseBusiness,
  BarChart,
  Settings,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggleButton } from "./ThemeToggleButton";

export default function AppSidebar() {
  const { toggle } = useAgendaCollapse();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // Redirige a la página de login o a la raíz
  };

  const menuItems = [
    { icon: MessageSquare, href: "/support", label: "Soporte" },
    { icon: Calendar, href: "/agenda", label: "Agenda" },
    { icon: BriefcaseBusiness, href: "/business", label: "Negocio" },
    { icon: BarChart, href: "/dashboard", label: "Dashboard" },
    { icon: Settings, href: "/settings", label: "Ajustes" },
  ];

  const toggleMobileMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* HEADER MÓVIL (Fijo arriba con Hamburguesa) */}
      <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 w-full shrink-0 z-50">
        <button onClick={toggleMobileMenu} className="p-2 text-zinc-600 dark:text-zinc-300">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="font-bold text-indigo-600 text-lg">Lehana Studio</div>
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
          L
        </div>
      </header>

      {/* OVERLAY PARA MÓVIL (Cierra el menú al tocar fuera) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden" 
          onClick={toggleMobileMenu}
        />
      )}

      {/* ASIDE (Desktop Fijo / Móvil Desplegable) */}
      <aside className={`
        fixed z-50 h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col items-center py-4 transition-transform duration-300
        ${isOpen ? "translate-x-0 w-20" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:w-14 lg:flex lg:shrink-0
      `}>
        {/* BOTÓN COLAPSAR AGENDA (Solo visible en Desktop) */}
        <button
          onClick={toggle}
          className="hidden md:flex p-2 mb-4 rounded hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Toggle agenda sidebar"
        >
          <Menu size={20} />
        </button>

        {/* LOGO (Solo Desktop) */}
        <div className="hidden md:flex w-8 h-8 rounded-full bg-indigo-600 text-white items-center justify-center font-bold mb-6">
          L
        </div>

        {/* NAV PRINCIPAL (Solo Iconos) */}
        <nav className="flex flex-col items-center gap-2 w-full px-3">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex justify-center items-center rounded-lg
                  transition-colors h-11 w-11
                  ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                      : "text-zinc-500 hover:bg-gray-100 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-indigo-500"
                  }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto w-full px-3 flex flex-col items-center gap-2">
          <ThemeToggleButton />
          <button
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/40 dark:hover:text-red-500"
          >
            <LogOut size={22} />
          </button>
        </div>
      </aside>
    </>
  );
}