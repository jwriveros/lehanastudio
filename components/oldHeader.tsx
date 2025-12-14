"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { BottomNav } from "./BottomNav";
import type { NavItem } from "@/lib/nav";
import { useSessionStore } from "@/lib/sessionStore";
import { supabase } from "@/lib/supabaseClient";

interface HeaderProps {
  navItems: NavItem[];
}

export function Header({ navItems }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useSessionStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileNavItems = [
    { label: "Soporte", href: "/support" },
    { label: "Mi negocio", href: "/business" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Agenda", href: "/agenda" },
    { label: "Ajustes", href: "/settings" },
  ];

  return (
    <header className="h-12 w-full flex items-center justify-between px-3 border-b bg-white dark:bg-zinc-900 relative z-30">
      {/* Menú móvil */}
      <div className="md:hidden">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Logo */}
      <div className="font-semibold text-lg absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
        <Link href="/dashboard">Lehana Studio</Link>
      </div>

      {/* Navegación desktop */}
      <div className="hidden md:flex max-w-xl mx-auto justify-center h-full">
        <BottomNav currentPath={pathname} items={navItems} />
      </div>

      {/* Usuario */}
      <div className="flex items-center gap-4 text-sm">
        <span className="hidden sm:inline text-zinc-600 dark:text-zinc-300">
          {session?.name || session?.role}
        </span>

        <button
          className="text-red-500 hover:underline"
          onClick={async () => {
            await supabase.auth.signOut();
            useSessionStore.getState().logout(); // ✅ ESTE ES EL MÉTODO CORRECTO
            router.replace("/");
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-zinc-900 border-b md:hidden z-40">
          <nav>
            <ul>
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
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
