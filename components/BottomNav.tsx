"use client";

import Link from "next/link";
import { useMemo } from "react";

export type BottomNavItem = {
  id: string;
  label: string;
  emoji?: string;
  href: string;
};

type Props = {
  currentPath: string;
  items: BottomNavItem[];
};

export function BottomNav({ currentPath, items }: Props) {
  const normalized = useMemo(() => items.filter(Boolean), [items]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur shadow-lg shadow-indigo-200/30 dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 text-xs font-medium text-zinc-600 dark:text-zinc-300">
        {normalized.map((item) => {
          const isActive = currentPath.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1 transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              aria-label={item.label}
            >
              <span className="text-base">{item.emoji ?? "•"}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
