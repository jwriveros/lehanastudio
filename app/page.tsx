"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NAV_ITEMS, navByRole } from "@/lib/nav";
import { useSessionStore } from "@/lib/sessionStore";

export default function Home() {
  const router = useRouter();
  const { login, error, session } = useSessionStore();
  const [email, setEmail] = useState("admin@lizto.demo");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const ok = login(email, password);
    if (!ok) return;

    const role = useSessionStore.getState().session?.role ?? "ADMIN";
    const destination = navByRole[role][0]?.href ?? NAV_ITEMS[0].href;
    router.push(destination);
  };

  if (session) {
    const destination = navByRole[session.role][0]?.href ?? NAV_ITEMS[0].href;
    router.replace(destination);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-12 pt-10">
        <header className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-wide text-indigo-500">PWA lista para instalar</p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Inicia sesión</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Admin y Especialista ingresan con su contraseña. Cada rol ve un menú inferior diferente (Soporte, Agenda, Mi negocio,
            Dashboard, Ajustes).
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white/95 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500">Correo</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="admin@lizto.demo"
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
              />
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              onClick={handleLogin}
            >
              Ingresar
            </button>
            <button
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:border-indigo-300 dark:border-zinc-700 dark:text-zinc-200"
              onClick={() => {
                setEmail("admin@lizto.demo");
                setPassword("admin123");
              }}
            >
              Autocompletar Admin
            </button>
            <button
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:border-indigo-300 dark:border-zinc-700 dark:text-zinc-200"
              onClick={() => {
                setEmail("rivera@lizto.demo");
                setPassword("especialista123");
              }}
            >
              Autocompletar Especialista
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          Funciona como PWA: instala en tu móvil desde el navegador para abrir a pantalla completa. El menú inferior mantiene todas
          las secciones accesibles.
        </section>
      </div>
    </div>
  );
}
