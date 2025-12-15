"use client";
import { useAgendaCollapse } from "./AgendaCollapseContext";

import {
  LogOut,
  MessageSquare,
  Calendar,
  BriefcaseBusiness,
  BarChart,
  Settings,
  Menu,
} from "lucide-react";
import Link from "next/link";

interface Props {
  onToggleAgendaSidebar?: () => void;
}

export default function AppSidebar() {
  const { toggle } = useAgendaCollapse();
  
  return (
    <aside className="w-14 bg-white border-r flex flex-col items-center py-4">
      {/* ☰ MENÚ HAMBURGUESA (ÚNICO Y CORRECTO) */}
        <button
          onClick={toggle}
          className="p-2 rounded hover:bg-zinc-100"
          aria-label="Toggle agenda sidebar"
        >
          <Menu size={20} />
        </button>
      {/* LOGO */}
      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mb-2">
        L
      </div>
      {/* NAV */}
      <nav className="flex flex-col gap-4 text-zinc-500">
        <Link href="/support" className="hover:text-indigo-600">
          <MessageSquare size={20} />
        </Link>
        <Link href="/agenda" className="hover:text-indigo-600">
          <Calendar size={20} />
        </Link>
        <Link href="/business" className="hover:text-indigo-600">
          <BriefcaseBusiness size={20} />
        </Link>
        <Link href="/dashboard" className="hover:text-indigo-600">
          <BarChart size={20} />
        </Link>
        <Link href="/settings" className="hover:text-indigo-600">
          <Settings size={20} />
        </Link>
      </nav>

      <div className="mt-auto">
        <button className="text-red-500 hover:text-red-700">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}
