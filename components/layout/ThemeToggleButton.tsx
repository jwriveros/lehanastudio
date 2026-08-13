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

  if (!mounted) {
    return <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  return (
    <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900">
      {/* Opción Modo Claro */}
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-lg p-1.5 transition-all ${
          theme === "light"
            ? "bg-white text-amber-500 shadow-sm dark:bg-gray-800"
            : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
        title="Modo Claro"
      >
        <Sun size={16} />
      </button>

      {/* Opción Sincronizar con Dispositivo/Sistema */}
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`rounded-lg p-1.5 transition-all ${
          theme === "system"
            ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400"
            : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
        title="Modo Dispositivo (Sistema)"
      >
        <Laptop size={16} />
      </button>

      {/* Opción Modo Oscuro */}
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-lg p-1.5 transition-all ${
          theme === "dark"
            ? "bg-white text-indigo-400 shadow-sm dark:bg-gray-800"
            : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
        title="Modo Oscuro"
      >
        <Moon size={16} />
      </button>
    </div>
  );
}