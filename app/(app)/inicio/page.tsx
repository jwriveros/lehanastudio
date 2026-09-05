"use client";

import React from "react";
import Link from "next/link";
// Importamos el componente de tarjetas de resumen
import DashboardCards from "@/components/DashboardCards";
// Importamos el package.json para leer la versión de la aplicación
import packageJson from "../../../package.json";
// Importamos íconos para mantener la línea gráfica
import { Sparkles, Calendar, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export default function InicioPage() {
  // Extraemos la versión del archivo
  const appVersion = packageJson.version;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-50/50 dark:bg-zinc-950 p-4 sm:p-6 md:p-8 text-zinc-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-300">
      
      {/* Contenedor del contenido principal */}
      <div className="flex-1 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        
        {/* Sección de Bienvenida */}
        <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6 space-y-2">
          <div className="flex items-center gap-2 text-rose-500">
            <Sparkles size={18} />
            <span className="text-xs font-bold tracking-wider uppercase text-rose-500">
              Panel de Control
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Bienvenido, Admin
              </h1>
              <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                Resumen de métricas principales e indicadores de Lehana Studio
              </p>
            </div>

            {/* Insignia de Sesión Validada */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs self-start sm:self-auto">
              <ShieldCheck size={14} />
              <span>Rol: ADMIN • Sesión activa</span>
            </div>
          </div>
        </header>

        {/* Contenido principal del Dashboard */}
        <main className="space-y-8">
          
          {/* Tarjetas de Resumen General */}
          <section>
            <DashboardCards />
          </section>

          {/* Tarjeta de Resumen y Acceso a la Agenda */}
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

      {/* Footer con la versión de la aplicación */}
      <footer className="mt-12 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">
        Lehana Studio CRM • v{appVersion}
      </footer>
      
    </div>
  );
}