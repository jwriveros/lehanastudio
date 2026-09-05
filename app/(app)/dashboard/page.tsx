"use client";

import React from "react";
import Link from "next/link";
import { Calendar, DollarSign, Clock, XCircle, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  variant?: "rose" | "emerald" | "amber" | "rose-dark";
}

// Componente reusable estilizado para cada tarjeta de métrica (KPI)
function MetricCard({ title, value, subtitle, icon: Icon, variant = "rose" }: MetricCardProps) {
  // Configuración de variantes de color para diferenciar visualmente los KPI
  const variantStyles = {
    rose: {
      bgIcon: "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/20",
    },
    emerald: {
      bgIcon: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20",
    },
    amber: {
      bgIcon: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20",
    },
    "rose-dark": {
      bgIcon: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20",
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.rose;

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 shadow-xs hover:shadow-md transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {title}
        </span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${currentVariant.bgIcon}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="my-4">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </span>
      </div>

      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        {subtitle}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto font-sans text-zinc-900 dark:text-zinc-100 antialiased animate-in fade-in duration-500">
      
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Bienvenido, Admin
            </h1>
            <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
              Resumen en tiempo real de operaciones para el día de hoy
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs self-start sm:self-auto">
            <ShieldCheck size={14} />
            <span>Rol: ADMIN • Sesión activa</span>
          </div>
        </div>
      </header>

      {/* GRID DE TARJETAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Citas hoy"
          value={11}
          subtitle="Agendadas para hoy"
          icon={Calendar}
          variant="rose"
        />
        <MetricCard
          title="Ingresos hoy"
          value="$ 0"
          subtitle="Pagos registrados hoy"
          icon={DollarSign}
          variant="emerald"
        />
        <MetricCard
          title="Pendientes"
          value={7}
          subtitle="Por confirmar hoy"
          icon={Clock}
          variant="amber"
        />
        <MetricCard
          title="Citas canceladas"
          value={1}
          subtitle="Canceladas hoy"
          icon={XCircle}
          variant="rose-dark"
        />
      </div>

      {/* TARJETA ACCESO RÁPIDO A LA AGENDA */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-rose-500">
            <Calendar size={20} />
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Resumen y Control de Citas
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Accede al módulo principal de la agenda para consultar los bloques horarios, gestionar citas confirmadas o modificar la disponibilidad del equipo.
          </p>
        </div>

        <Link
          href="/agenda"
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-2xl font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span>Ir a la Agenda</span>
          <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  );
}