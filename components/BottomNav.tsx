"use client";

import Link from "next/link";
import type { NavItem } from "@/lib/nav";

interface BottomNavProps {
  currentPath: string;
  items: NavItem[];
}

export function BottomNav({ currentPath, items }: BottomNavProps) {
  return (
    <nav className="flex h-full items-center justify-center">
      <ul className="flex h-full items-stretch justify-center gap-2 text-sm">
        {items.map((item) => {
          const active = currentPath.startsWith(item.href);
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                className={`flex h-full items-center justify-center rounded-md px-4 ${
                  active
                    ? "bg-indigo-100 font-semibold text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
