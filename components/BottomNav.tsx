// jwriveros/lehanastudio/lehanastudio-910f6b2f23845520141757de8a19232a7486021d/components/BottomNav.tsx (Ajuste para Header)

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

  // CAMBIO 3: Eliminar bordes, fondos y sombreados innecesarios. Usamos h-full para alineación.
  return (
    <nav className="h-full flex items-center justify-center">
      
      {/* CAMBIO 4: Reducimos el padding y la separación para que encaje en una línea compacta. 
           Eliminamos flex-1 de este div para evitar que se estire demasiado. */}
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 h-full">
        {normalized.map((item) => {
          const isActive = currentPath.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              // CAMBIO 5: Cambiamos flex-col a flex-row (o simplemente flex) y removemos el emoji. 
              // Usamos items-center para centrar texto y emoji.
              className={`flex items-center justify-center gap-1 rounded-xl px-3 py-1 transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              aria-label={item.label}
            >
              {/* Eliminamos el span del emoji para una vista compacta si es necesario,
                 o lo cambiamos para que se muestre en línea. */}
              <span className="text-base">{item.emoji ?? "•"}</span>
              <span className="hidden sm:inline">{item.label}</span> {/* Ocultar label en móvil si es necesario, para mantener el emoji */}
              <span className="sm:hidden text-sm">{item.label}</span> {/* Dejar solo el label sin emoji en móvil */}

            </Link>
          );
        })}
      </div>
    </nav>
  );
}