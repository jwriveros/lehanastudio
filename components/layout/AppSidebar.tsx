"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Bot,
  Briefcase,
  BarChart2,
  DollarSign,
  Settings,
} from "lucide-react";

const MENU_ITEMS = [
  { name: "Inicio", href: "/inicio", icon: Home },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Bot", href: "/dashboard/bot", icon: Bot },
  { name: "Negocio", href: "/business", icon: Briefcase },
  { name: "Informes", href: "/mis-informes", icon: BarChart2 },
  { name: "Finanzas", href: "/finanzas", icon: DollarSign },
  { name: "Ajustes", href: "/settings", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {MENU_ITEMS.map((item) => {
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
  );
}