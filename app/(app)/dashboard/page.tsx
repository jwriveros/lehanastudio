"use client";

import { DashboardCards, ProgressPanel, SurveysPanel } from "@/components";
import ExpensesManager from "@/components/ExpensesManager";
import DailyPaymentsReport from "@/components/DailyPaymentsReports"; // Asegúrate de que la ruta sea correcta
import { LayoutDashboard, Zap, PieChart } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 min-h-screen text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER COMPACTO */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} className="text-indigo-600" />
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Dashboard</h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium ml-7">KPIs y liquidación diaria de especialistas.</p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 px-4 rounded-2xl border dark:border-zinc-700">
          <Zap size={14} className="text-amber-500 fill-amber-500" />
          <span className="text-[10px] font-black uppercase italic tracking-wider">Hoy: {new Date().toLocaleDateString()}</span>
        </div>
      </header>

      {/* KPI CARDS (Citas hoy, Ingresos hoy, etc) */}
      <DashboardCards />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA LATERAL: INFORME DE PAGOS (25-30% del ancho) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-2 mb-4 px-1">
               <PieChart size={16} className="text-indigo-500" />
               <span className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500">Cierre de Caja</span>
            </div>
            <div className="flex items-center gap-2 mb-4 px-1">
               <ExpensesManager  />
            </div>
            <DailyPaymentsReport />
          </div>
        </aside>

        {/* COLUMNA PRINCIPAL: PROGRESO Y ENCUESTAS (70% del ancho) */}
        <div className="lg:col-span-8 space-y-6">
          <ProgressPanel />
          <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2rem] shadow-sm">
            <SurveysPanel />
          </div>
        </div>
        
      </div>
    </main>
  );
}