"use client";

import React from "react";
import Link from "next/link";
import { Calendar, DollarSign, Clock, XCircle } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
}

// Componente reusable para cada tarjeta de métrica (KPI)
function MetricCard({ title, value, subtitle, icon: Icon }: MetricCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900/80">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
          <Icon size={18} />
        </div>
      </div>

      <div className="my-3">
        <span className="text-3xl font-black text-gray-900 dark:text-white">
          {value}
        </span>
      </div>

      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
        {subtitle}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full max-w-7xl mx-auto">
      
      {/* Saludo de bienvenida */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Bienvenido, Admin
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
          Rol: <span className="text-indigo-600 dark:text-indigo-400">ADMIN</span> | Sesión validada correctamente.
        </p>
      </div>

      {/* Grid de tarjetas KPI (4 columnas en escritorio, 1 en móviles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Citas hoy"
          value={11}
          subtitle="Agendadas para hoy"
          icon={Calendar}
        />
        <MetricCard
          title="Ingresos hoy"
          value="$ 0"
          subtitle="Pagos registrados hoy"
          icon={DollarSign}
        />
        <MetricCard
          title="Pendientes"
          value={7}
          subtitle="Por confirmar hoy"
          icon={Clock}
        />
        <MetricCard
          title="Citas canceladas"
          value={1}
          subtitle="Canceladas hoy"
          icon={XCircle}
        />
      </div>

      {/* Tarjeta de Resumen de hoy */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800/80 dark:bg-gray-900/80">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Resumen de hoy
        </h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Ve a la pestaña de{" "}
          <Link
            href="/agenda"
            className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Agenda
          </Link>{" "}
          para ver y gestionar todas tus citas.
        </p>
      </div>

    </div>
  );
}