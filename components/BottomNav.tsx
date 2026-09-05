"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronUp,
  ChevronDown,
  Calendar,
  BriefcaseBusiness,
  BarChart,
  Settings,
  Sparkles,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";

/* =========================================================
   🔹 MAPA DE ICONOS DE NAVEGACIÓN
========================================================= */
const iconMap: Record<string, React.ElementType> = {
  "/dashboard/bot": BriefcaseBusiness,
  "/agenda": Calendar,
  "/business": BriefcaseBusiness,
  "/dashboard": BarChart,
  "/settings": Settings,
};

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 transform flex-col items-center gap-1.5 font-sans antialiased">
      
      {/* BOTÓN PARA MINIMIZAR / MAXIMIZAR DE CÁPSULA SUAVE */}
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="h-7 w-7 rounded-full border border-zinc-200/80 bg-white/90 p-1 text-zinc-400 shadow-md backdrop-blur-md transition-all hover:text-rose-500 hover:border-rose-300 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-500 dark:hover:text-rose-400 cursor-pointer flex items-center justify-center"
        title={isVisible ? "Ocultar menú" : "Mostrar menú"}
        aria-label="Minimizar o maximizar barra de navegación"
      >
        {isVisible ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {/* CONTENEDOR FLOTANTE DE NAVEGACIÓN */}
      <nav
        className={`origin-bottom transition-all duration-300 ease-out ${
          isVisible
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <ul className="flex items-center gap-1.5 rounded-3xl border border-zinc-200/80 bg-white/90 p-2 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100">
          {items.map((item) => {
            const Icon = iconMap[item.href] || Calendar;
            const active = pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex h-13 w-13 flex-col items-center justify-center rounded-2xl px-2 py-1 transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 scale-105"
                      : "text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <Icon size={20} />
                  <span
                    className={`mt-0.5 text-[9px] font-black uppercase tracking-wider transition-all leading-none ${
                      active ? "opacity-100 text-white" : "opacity-75"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}