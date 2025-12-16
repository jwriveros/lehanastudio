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
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 w-full shrink-0 z-50">
        <button onClick={toggleMobileMenu} className="p-2 text-zinc-600">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="font-bold text-indigo-600 text-lg">Lehana</div>
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
          L
        </div>
      </header>

      {/* OVERLAY PARA MÓVIL (Cierra el menú al tocar fuera) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden" 
          onClick={toggleMobileMenu}
        />
      )}

      {/* ASIDE (Desktop Fijo / Móvil Desplegable) */}
      <aside className={`
        fixed md:relative z-50 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 transition-transform duration-300
        ${isOpen ? "translate-x-0 w-20" : "-translate-x-full md:translate-x-0 w-14"}
        md:flex shrink-0
      `}>
        {/* BOTÓN COLAPSAR AGENDA (Solo visible en Desktop) */}
        <button
          onClick={toggle}
          className="hidden md:flex p-2 mb-4 rounded hover:bg-zinc-100"
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
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-zinc-500 hover:bg-gray-100 hover:text-indigo-600"
                  }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto w-full px-3">
          <button
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={22} />
          </button>
        </div>
      </aside>
    </>
  );
}