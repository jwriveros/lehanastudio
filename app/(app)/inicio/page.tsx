"use client";

import React from "react";
import Link from "next/link";
import { useSessionStore } from "@/lib/sessionStore";
import DashboardCards from "@/components/DashboardCards";
import packageJson from "../../../package.json";
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

export default function InicioPage() {
  const appVersion = packageJson.version;

  // 🌸 Leemos la sesión directamente desde Zustand
  const session = useSessionStore((state: any) => state.session);
  const isLoading = useSessionStore((state: any) => state.isLoading);

  const isAdmin = (session?.role || "").toUpperCase() === "ADMIN";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-50/50 dark:bg-zinc-950 p-4 sm:p-6 md:p-8 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300">
      
      <div className="flex-1 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        
        {/* ENCABEZADO DE BIENVENIDA */}
        <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6 space-y-2">
          <div className="flex items-center gap-2 text-rose-500">
            <Sparkles size={18} />
            <span className="text-xs font-bold tracking-wider uppercase text-rose-500">
              Panel de Control
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {isLoading || !session ? (
                <div className="flex items-center gap-2 py-2 text-zinc-400">
                  <Loader2 size={20} className="animate-spin text-rose-500" />
                  <span className="text-xs font-bold">Cargando perfil...</span>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Bienvenido, {session.name}
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                    Resumen de métricas principales e indicadores de Lehana Studio
                  </p>
                </>
              )}
            </div>

            {/* INSIGNIA DE ROL DINÁMICA */}
            {!isLoading && session && (
              <div 
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase shadow-2xs self-start sm:self-auto border ${
                  isAdmin
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/40"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40"
                }`}
              >
                <ShieldCheck size={14} />
                <span>Rol: {session.role} • Sesión activa</span>
              </div>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="space-y-8">
          <section>
            <DashboardCards />
          </section>

          <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-rose-500">
                <Calendar size={20} />
                <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Gestión de Citas y Agenda
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Ingresa al módulo de agenda interactiva para revisar los turnos del día, programar citas de clientes o ajustar horarios de las especialistas.
              </p>
            </div>

            <Link
              href="/agenda"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span>Ir a la Agenda</span>
              <ArrowRight size={16} />
            </Link>
          </section>
        </main>
      </div>

      <footer className="mt-12 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">
        Lehana Studio CRM • v{appVersion}
      </footer>
    </div>
  );
}