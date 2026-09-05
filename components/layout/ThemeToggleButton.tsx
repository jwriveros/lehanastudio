"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitamos errores de hidratación esperando a que el componente se monte en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Skeleton loader mientras se carga el tema en Next.js
  if (!mounted) {
    return <div className="h-9 w-28 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-0.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-950 p-1 shadow-2xs">
      
      {/* Opción Modo Claro */}
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-xl p-1.5 transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
          theme === "light"
            ? "bg-white text-rose-500 shadow-xs border border-zinc-200/60 font-bold"
            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        }`}
        title="Modo Claro"
      >
        <Sun size={15} />
      </button>

      {/* Opción Sincronizar con Dispositivo/Sistema */}
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`rounded-xl p-1.5 transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
          theme === "system"
            ? "bg-white dark:bg-zinc-800 text-rose-500 shadow-xs border border-zinc-200/60 dark:border-zinc-700 font-bold"
            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        }`}
        title="Modo Dispositivo (Sistema)"
      >
        <Laptop size={15} />
      </button>

      {/* Opción Modo Oscuro */}
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-xl p-1.5 transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
          theme === "dark"
            ? "bg-zinc-800 text-rose-400 shadow-xs border border-zinc-700 font-bold"
            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        }`}
        title="Modo Oscuro"
      >
        <Moon size={15} />
      </button>

    </div>
  );
}