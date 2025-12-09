"use client";

import { type ReactNode, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { BottomNav } from "@/components/BottomNav";
import { navByRole, NAV_ITEMS } from "@/lib/nav";
import { useSessionStore } from "@/lib/sessionStore";

export function AppShell({ children }: { children: ReactNode }) {
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-20 pt-4 md:px-8">
        <main className="space-y-6 pb-4">{children}</main>
      </div>

      <BottomNav currentPath={pathname} items={navItems} />
    </div>
  );
}
