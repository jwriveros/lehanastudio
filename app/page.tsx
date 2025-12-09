// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NAV_ITEMS, navByRole } from "@/lib/nav";
import { useSessionStore } from "@/lib/sessionStore";
import type { Role } from "@/lib/sessionStore"; // Importamos el tipo Role del store

export default function Home() {
  const router = useRouter();
  const { login, error, session, isLoading } = useSessionStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return;
    
    const ok = await login(email, password);
    
    // Si el login es exitoso, redirigimos
    if (ok) {
      const currentSession = useSessionStore.getState().session;
      // Convertimos el rol a un tipo válido o usamos ADMIN por defecto
      const userRole = (currentSession?.role as Role) || "ADMIN";
      
      // Buscamos la ruta adecuada, con fallback a la primera ruta general
      const userNav = navByRole[userRole];
      const destination = userNav && userNav.length > 0 ? userNav[0].href : NAV_ITEMS[0].href;
      
      router.push(destination);
    }
  };

  // Si ya existe sesión, redirigir automáticamente
  useEffect(() => {
    if (session) {
      const userRole = (session.role as Role) || "ADMIN";
      const userNav = navByRole[userRole];
      const destination = userNav && userNav.length > 0 ? userNav[0].href : NAV_ITEMS[0].href;
      router.replace(destination);
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-12 pt-10">
        <header className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wide text-indigo-500">CRM Lehana Studio</p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Inicia sesión</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Ingresa con tus credenciales de especialista o administrador.
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white/95 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="usuario@lehanastudio.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                disabled={isLoading}
              />
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-600 font-medium">{error}</p> : null}
          <div className="mt-6">
            <button
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Ingresar"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}