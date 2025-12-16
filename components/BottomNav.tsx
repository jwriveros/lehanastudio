"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp, ChevronDown, MessageSquare, Calendar, BriefcaseBusiness, BarChart, Settings } from "lucide-react";
import type { NavItem } from "@/lib/nav";

interface BottomNavProps {
  items: NavItem[];
}

// Mapa de iconos para asociar con los hrefs de tu proyecto
const iconMap: Record<string, React.ElementType> = {
  "/support": MessageSquare,
  "/agenda": Calendar,
  "/business": BriefcaseBusiness,
  "/dashboard": BarChart,
  "/settings": Settings,
};

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {/* Botón para minimizar/maximizar */}
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="bg-white border shadow-lg rounded-full p-1 text-zinc-400 hover:text-indigo-600 transition-all"
      >
        {isVisible ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
      </button>

      {/* Contenedor del Menú */}
      <nav className={`
        transition-all duration-300 ease-in-out origin-bottom
        ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}
        bg-white/80 backdrop-blur-md border border-zinc-200 shadow-2xl rounded-2xl px-3 py-2
      `}>
        <ul className="flex items-center gap-1">
          {items.map((item) => {
            const Icon = iconMap[item.href] || Calendar;
            const active = pathname.startsWith(item.href);
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-all
                    ${active 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                      : "text-zinc-500 hover:bg-zinc-100"}
                  `}
                >
                  <Icon size={20} className={active ? "mb-0" : "mb-1"} />
                  {!active && <span className="text-[10px] font-medium uppercase tracking-tight">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}