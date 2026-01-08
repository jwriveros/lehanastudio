// jwriveros/lehanastudio/lehanastudio-a8a570c007a1557a6ccd13baa5a39a3fe79a534a/app/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { NAV_ITEMS, navByRole } from "@/lib/nav";
import { useSessionStore } from "@/lib/sessionStore";
import type { Role } from "@/lib/sessionStore";
 
// =======================================================
// CORRECCIÓN: Función para centralizar la lógica de routing
// (Reduce la duplicación de código en handleLogin y useEffect)
// =======================================================
const getDestination = (session: { role?: Role | string | null } | null): string => {
  // 1. Determinar el rol, cayendo en 'ADMIN' como fallback seguro
  const userRole = (session?.role as Role) || "ADMIN";
  
  // 2. Obtener los ítems de navegación para ese rol
  // Usamos el rol como índice, con un fallback seguro a navByRole.ADMIN si fuera necesario, 
  // aunque el tipo Role de sessionStore ya debería asegurar la compatibilidad.
  const userNav = navByRole[userRole as keyof typeof navByRole];
  
  // 3. Devolver la primera ruta disponible, o la primera ruta general como fallback final
  return (userNav && userNav.length > 0) ? userNav[0].href : NAV_ITEMS[0].href;
};
// =======================================================


export default function Home() {
  const router = useRouter();
  const { login, error, session, isLoading } = useSessionStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return;
    
    const ok = await login(email, password);
    
    if (ok) {
      // Usamos el estado recién actualizado y la función auxiliar
      const currentSession = useSessionStore.getState().session;
      const destination = getDestination(currentSession);
      
      router.push(destination);
    }
  };

  useEffect(() => {
    if (session) {
      // Usamos la función auxiliar para determinar la ruta
      const destination = getDestination(session);
      router.replace(destination);
    }
  }, [session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="relative mx-auto mb-6 h-auto w-full max-w-[240px] aspect-[3/1]">
          <Image
            src="/images/logo.png"
            alt="Lehana Studio Logo"
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* Form Card */}
        <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-800">
          <h2 className="mb-6 text-center text-xl font-semibold text-zinc-800 dark:text-zinc-200">
            Iniciar Sesión
          </h2>

          {/* Form Fields */}
          <div className="grid gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                placeholder="nombre@lehanastudio.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                disabled={isLoading}
              />
            </div>
          </div>
          {error ? (
            <p className="mt-4 rounded-lg bg-rose-50 p-3 text-center text-sm font-medium text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </p>
          ) : null}
          <div className="mt-6">
            <button
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verificando...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}