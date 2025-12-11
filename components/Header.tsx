"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { BottomNav } from "./BottomNav";
import type { NavItem } from "@/lib/nav";
import { useSessionStore } from "@/lib/sessionStore";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";

interface HeaderProps {
  navItems: NavItem[];
}

export function Header({ navItems }: HeaderProps) {
  const pathname = usePathname();
  const { session } = useSessionStore();
  const { openCalendar, openBookingModal } = useUIStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileNavItems = [
    { label: "Soporte", href: "/support" },
    { label: "Mi negocio", href: "/business" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Ajustes", href: "/settings" },
  ];

  const handleAgendaClick = () => {
    openCalendar();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="h-16 w-full flex items-center justify-between px-4 border-b bg-white dark:bg-zinc-900 relative z-30">
      {/* Botón de Menú Hamburguesa (Móvil) */}
      <div className="md:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Logo/Título */}
      <div className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0">
        <Link href="/dashboard">Lehana Studio</Link>
      </div>

      {/* Navegación de Escritorio */}
      <div className="hidden md:flex max-w-xl mx-auto justify-center h-full">
        <BottomNav currentPath={pathname} items={navItems} />
      </div>

      {/* Acciones y Usuario */}
      <div className="flex items-center gap-4 text-sm flex-shrink-0">
        {/* Botones de Agenda y Reserva (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={openCalendar}
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 rounded-lg hover:bg-zinc-700"
          >
            Agenda
          </button>
          <button
            onClick={openBookingModal}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-500 flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Nueva Reserva
          </button>
        </div>

        <span className="hidden sm:inline text-zinc-600 dark:text-zinc-300">
          {session?.name || session?.role}
        </span>
        <button
          className="text-red-500 hover:underline"
          onClick={() => {
            supabase.auth.signOut();
            useSessionStore.getState().logout();
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Menú Modal para Móvil */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-zinc-900 border-b md:hidden z-40">
          <nav>
            <ul>
              {/* Other items are Links */}
              {mobileNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {/* Agenda is a button */}
              <li>
                <button
                  className="w-full text-left block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
                  onClick={handleAgendaClick}
                >
                  Agenda
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}

