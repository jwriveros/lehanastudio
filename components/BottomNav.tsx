"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Calendar,
  BriefcaseBusiness,
  BarChart,
  Settings,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
// Mapa de iconos para asociar con los hrefs de tu proyecto
const iconMap: Record<string, React.ElementType> = {
  "/support": MessageSquare,
  "/agenda": Calendar,
  "/business": BriefcaseBusiness,
  "/dashboard": BarChart,
  "/settings": Settings,
};
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 transform flex-col items-center gap-2">
      {/* Botón para minimizar/maximizar */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="h-8 w-8 rounded-full border border-gray-200 bg-white/80 p-1 text-gray-500 shadow-lg backdrop-blur-md transition-all hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        {isVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>
      {/* Contenedor del Menú */}
      <nav
        className={`origin-bottom transition-all duration-300 ease-in-out ${
          isVisible
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <ul className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/80 p-2 shadow-2xl backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/80">
          {items.map((item) => {
            const Icon = iconMap[item.href] || Calendar;
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex h-14 w-14 flex-col items-center justify-center rounded-xl px-2 py-1 transition-all duration-200 ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <Icon size={22} />
                  <span
                    className={`mt-1 text-[10px] font-bold uppercase tracking-wider transition-opacity ${
                      active ? "opacity-0" : "opacity-100"
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