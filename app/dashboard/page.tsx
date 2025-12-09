"use client";

import { AppShell, DashboardCards, ProgressPanel, SurveysPanel } from "@/components";

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard · Informes</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">KPIs, encuestas y reportes por servicio.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">Visión general</span>
        </div>
        <DashboardCards />
        <SurveysPanel />
        <ProgressPanel />
      </section>
    </AppShell>
  );
}
