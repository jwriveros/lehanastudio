"use client";

import { useState } from "react";
import { AgendaBoard } from "../components/AgendaBoard";
import { ChatPanel } from "../components/ChatPanel";
import { ClientsPanel } from "../components/ClientsPanel";
import { DashboardCards } from "../components/DashboardCards";
import { ProgressPanel } from "../components/ProgressPanel";
import { ServicesPanel } from "../components/ServicesPanel";
import { SettingsPanel } from "../components/SettingsPanel";
import { SpecialistsPanel } from "../components/SpecialistsPanel";
import { SurveysPanel } from "../components/SurveysPanel";
import { Sidebar } from "../components/Sidebar";
import { Role } from "@/lib/mockData";

export default function Home() {
  const [role, setRole] = useState<Role>("ADMIN");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <Sidebar role={role} onRoleChange={setRole} />

          <main className="space-y-8">
            <header className="rounded-3xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-500">Lizto + Supabase + n8n</p>
                  <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">CRM de reservas y chat</h1>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Rol: {role}</div>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Maqueta lista para conectar a tu base existente: app_users, appointments, booking_requests, clients, services,
                mensajes, n8n_chat_histories y encuestas. Los endpoints API responden JSON y están pensados para webhooks de n8n.
              </p>
            </header>

            <DashboardCards />
            <AgendaBoard />
            <ClientsPanel />
            <ServicesPanel />
            <SpecialistsPanel />
            <ProgressPanel />
            <ChatPanel />
            <SurveysPanel />
            <SettingsPanel />
          </main>
        </div>
      </div>
    </div>
  );
}
