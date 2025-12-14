"use client";

import { LogOut, MessageSquare, Calendar, BarChart, Settings } from "lucide-react";
import Link from "next/link";

export default function AppSidebar() {
  return (
    <aside className="w-14 bg-white border-r flex flex-col items-center py-4">
      
      {/* LOGO */}
      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold mb-6">
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
        <Link href="/dashboard" className="hover:text-indigo-600">
          <BarChart size={20} />
        </Link>
        <Link href="/settings" className="hover:text-indigo-600">
          <Settings size={20} />
        </Link>
      </nav>

      {/* LOGOUT */}
      <div className="mt-auto">
        <button
          onClick={() => {
            // aquí luego conectas supabase.auth.signOut()
            console.log("logout");
          }}
          className="text-red-500 hover:text-red-700"
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}
