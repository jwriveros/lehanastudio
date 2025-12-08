"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AgendaBoard,
  ChatPanel,
  ClientsPanel,
  DashboardCards,
  ProgressPanel,
  ServicesPanel,
  SettingsPanel,
  SpecialistsPanel,
  SurveysPanel,
  BottomNav,
} from "@/components";
import { Role, sampleUsers } from "@/lib/mockData";

const NAV_ITEMS = [
  { id: "support", label: "Soporte", emoji: "💬" },
  { id: "agenda", label: "Agenda", emoji: "📅" },
  { id: "business", label: "Mi negocio", emoji: "🏢" },
  { id: "dashboard", label: "Dashboard", emoji: "📊" },
  { id: "settings", label: "Ajustes", emoji: "⚙️" },
] as const;

const SPECIALIST_ALLOWED = new Set(["support", "agenda"]);

type NavId = (typeof NAV_ITEMS)[number]["id"];

type UserSession = {
  role: Role;
  name: string;
  email: string;
};

export default function Home() {
  const [activeSection, setActiveSection] = useState<NavId>("support");
  const [session, setSession] = useState<UserSession | null>(null);
  const [email, setEmail] = useState("admin@lizto.demo");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);

  const availableNav = useMemo(() => {
    if (session?.role === "SPECIALIST") {
      return NAV_ITEMS.filter((item) => SPECIALIST_ALLOWED.has(item.id)).slice();
    }
    return [...NAV_ITEMS];
  }, [session]);

  useEffect(() => {
    const handler = (id: NavId) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    handler(activeSection);
  }, [activeSection]);

  const handleLogin = () => {
    const user = sampleUsers.find((u) => u.email === email.trim());

    if (!user || user.password !== password.trim()) {
      setError("Correo o contraseña incorrectos");
      return;
    }

    setSession({ role: user.role, email: user.email, name: user.name });
    setActiveSection(user.role === "SPECIALIST" ? "agenda" : "support");
    setError(null);
  };

  const visibleSections: NavId[] = availableNav.map((item) => item.id as NavId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 pb-24 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-6">
        <header className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-500">PWA · Full screen · Mobile first</p>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">CRM de reservas y chat</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Inicia sesión como Administrador o Especialista. El menú inferior mantiene todo al alcance en móvil: Soporte (WhatsApp),
                Agenda, Mi negocio, Dashboard y Ajustes. La especialista solo ve Agenda y Soporte.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                {session ? `Sesión: ${session.role}` : "No autenticado"}
              </span>
              <span className="text-[11px]">PWA lista para instalar en Android / iOS</span>
            </div>
          </div>
        </header>

        {!session ? (
          <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Acceso con contraseña</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Admin y Especialista ingresan por separado con su correo y clave.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                  setError(null);
                }}
              >
                Autocompletar Admin
              </button>
              <button
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:border-indigo-300 dark:border-zinc-700 dark:text-zinc-200"
                onClick={() => {
                  setEmail("rivera@lizto.demo");
                  setPassword("especialista123");
                  setError(null);
                }}
              >
                Autocompletar Especialista
              </button>
            </div>
          </section>
        ) : null}

        <main className="space-y-6 pb-4">
          {session ? (
            <>
              {visibleSections.includes("support") ? (
                <section id="support" className="rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Soporte · WhatsApp</h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">Responde clientes desde el inbox en tiempo real.</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Chats activos</span>
                  </div>
                  <div className="mt-4">
                    <ChatPanel />
                  </div>
                </section>
              ) : null}

              {visibleSections.includes("agenda") ? (
                <section id="agenda" className="rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Agenda</h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">Gestiona reservas, cambia especialista y confirma por chat.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-200"
                        onClick={() => setShowCalendar((v) => !v)}
                      >
                        {showCalendar ? "Ocultar calendario" : "Ver calendario"}
                      </button>
                      <button className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                        Filtros
                      </button>
                    </div>
                  </div>
                  {showCalendar ? (
                    <div className="mt-4">
                      <AgendaBoard />
                    </div>
                  ) : null}
                  <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                    Panel de chat para reservas activas. Atiende cambios de hora, recordatorios y confirmaciones sin salir de Agenda.
                  </div>
                  <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 text-sm text-zinc-700 shadow-inner dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200">
                    Vista semanal compacta inspirada en Lizto. Arrastra y suelta con Supabase Realtime + n8n para confirmar.
                  </div>
                </section>
              ) : null}

              {visibleSections.includes("business") ? (
                <section id="business" className="space-y-4 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
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
              ) : null}

              {visibleSections.includes("dashboard") ? (
                <section id="dashboard" className="space-y-4 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
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
              ) : null}

              {visibleSections.includes("settings") ? (
                <section id="settings" className="rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Ajustes</h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">Elige qué módulos mostrar y prepara el despliegue PWA.</p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">Personaliza</span>
                  </div>
                  <SettingsPanel />
                </section>
              ) : null}
            </>
          ) : null}
        </main>
      </div>

      <BottomNav
        current={activeSection}
        items={availableNav}
        onNavigate={(id) => setActiveSection(id as NavId)}
      />
    </div>
  );
}
