"use client";

import { type ReactNode, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "@/components";
import { navByRole, NAV_ITEMS } from "@/lib/nav";
import { useSessionStore } from "@/lib/sessionStore";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useSessionStore();

  const navItems = useMemo(() => {
    if (!session) return NAV_ITEMS;
    return navByRole[session.role];
  }, [session]);

  useEffect(() => {
    if (!session) {
      router.replace("/");
      return;
    }

    const allowed = navItems.map((item) => item.href);
    const firstAllowed = allowed[0];
    if (firstAllowed && !allowed.includes(pathname)) {
      router.replace(firstAllowed);
    }
  }, [navItems, pathname, router, session]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 pb-24 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-20 pt-6">
        <header className="rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-500">PWA · Full screen · Mobile first</p>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">CRM de reservas y chat</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Menú inferior con Soporte, Agenda, Mi negocio, Dashboard y Ajustes. Especialista solo ve Soporte y Agenda.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                Sesión: {session.role}
              </span>
              <span className="text-[11px]">{session.name}</span>
            </div>
          </div>
        </header>

        <main className="space-y-6 pb-4">{children}</main>
      </div>

      <BottomNav currentPath={pathname} items={navItems} />
    </div>
  );
}
