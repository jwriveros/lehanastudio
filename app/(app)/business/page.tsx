"use client";

import { ClientsPanel, ServicesPanel, SpecialistsPanel } from "@/components";

export default function BusinessPage() {
  return (
    <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Mi negocio</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Clientes, especialistas y servicios en un solo panel.</p>
        </div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200">CRUD listo</span>
      </div>
      <ClientsPanel />
      <ServicesPanel />
      <SpecialistsPanel />
    </section>
  );
}
