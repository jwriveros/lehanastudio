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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-12 pt-20">
        
        {/* --- SECCIÓN DEL LOGO --- */}
        <header className="flex justify-center rounded-3xl p-4 bg-transparent">
          <div className="relative w-full max-w-[280px] h-auto aspect-[3/1]">
             <Image
              src="/logo-login.png" // Asegúrate que la imagen esté en la carpeta /public con este nombre
              alt="Lehana Studio Logo"
              fill
              priority // Carga la imagen con prioridad para que aparezca rápido
              className="object-contain"
            />
          </div>
        </header>
        {/* ------------------------ */}

        <section className="rounded-3xl border border-zinc-200 bg-white/95 p-8 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-6 text-center text-lg font-medium text-zinc-700 dark:text-zinc-300">Ingresa a tu cuenta</h2>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10"
                placeholder="nombre@lehanastudio.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/10"
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                disabled={isLoading}
              />
            </div>
          </div>
          {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-center text-sm font-medium text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{error}</p> : null}
          <div className="mt-8">
            <button
              className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Verificando...
                </span>
              ) : "Iniciar Sesión"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}