"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/support", label: "Soporte" },
  { href: "/business", label: "Mi negocio" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Ajustes" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white md:hidden">
      <ul className="flex h-14 items-stretch justify-around text-xs">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex h-full flex-col items-center justify-center ${
                  active ? "text-indigo-600 font-semibold" : "text-gray-500"
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
