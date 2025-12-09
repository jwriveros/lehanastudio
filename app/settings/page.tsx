"use client";

import { useRouter } from "next/navigation";
import { AppShell, SettingsPanel } from "@/components";
import { useSessionStore } from "@/lib/sessionStore";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useSessionStore();

  return (
    <AppShell>
      <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Ajustes</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Elige qué módulos mostrar y prepara el despliegue PWA.</p>
          </div>
          <button
            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200"
            onClick={() => {
              logout();
              router.replace("/");
            }}
          >
            Cerrar sesión
          </button>
        </div>
        <SettingsPanel />
      </section>
    </AppShell>
  );
}
