"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ClientesReport, { ClientRecord } from "@/components/reports/ClientesReport";
import PagosReport, { PagoRecord } from "@/components/reports/PagosReport";
import ReservasReport, { ReservaRecord } from "@/components/reports/ReservasReport";
import AIChatReportes from "@/components/reports/AIChatReportes";

import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Calendar,
  Bot, 
  Loader2, 
  RefreshCw 
} from "lucide-react";

type ReportTabKey = "clientes" | "pagos" | "reservas" | "bot";

interface ReportTab {
  id: ReportTabKey;
  name: string;
  description: string;
  icon: React.ElementType;
}

const REPORT_TABS: ReportTab[] = [
  {
    id: "clientes",
    name: "Clientes & Captación",
    description: "Análisis de origen, anuncios, sedes y municipios.",
    icon: Users,
  },
  {
    id: "pagos",
    name: "Pagos & Comprobantes",
    description: "Montos, comprobantes Nequi/Bancos y reservas.",
    icon: DollarSign,
  },
  {
    id: "reservas",
    name: "Gestión de Reservas",
    description: "Citas agendadas, estados, rendimiento por especialista.",
    icon: Calendar,
  },
  {
    id: "bot",
    name: "Asistente IA del Bot", // 👈 Nombre actualizado
    description: "Pregunta a la IA sobre citas, clientes y métricas.",
    icon: Bot,
  },
];

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<ReportTabKey>("clientes");
  
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [pagos, setPagos] = useState<PagoRecord[]>([]);
  const [reservas, setReservas] = useState<ReservaRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadActiveData = async () => {
    setLoading(true);
    try {
      if (activeTab === "clientes") {
        let allClients: ClientRecord[] = [];
        let from = 0;
        const CHUNK_SIZE = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase.from("clients").select("*").range(from, from + CHUNK_SIZE - 1);
          if (error) throw error;
          if (data && data.length > 0) {
            allClients = [...allClients, ...data];
            from += CHUNK_SIZE;
            if (data.length < CHUNK_SIZE) hasMore = false;
          } else hasMore = false;
        }
        setClients(allClients);
      } else if (activeTab === "pagos") {
        const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setPagos(data || []);
      } else if (activeTab === "reservas") {
        // Consulta a la tabla appointments
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .order("appointment_at", { ascending: false });

        if (error) throw error;
        setReservas(data || []);
      }
    } catch (err: any) {
      console.error("Error al cargar reporte:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveData();
  }, [activeTab]);

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-zinc-800 dark:text-zinc-100 font-sans antialiased">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
            <BarChart3 size={16} />
            <span>Centro de Inteligencia & Analítica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Reportes
          </h1>
        </div>

        <button
          onClick={loadActiveData}
          disabled={loading}
          className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xs hover:border-rose-400 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-rose-500" : "text-zinc-400"} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs ${
                isActive
                  ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/50 text-zinc-900 dark:text-white"
                  : "bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2.5 rounded-xl ${isActive ? "bg-rose-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wide ${isActive ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-zinc-800 dark:text-zinc-200"}`}>
                  {tab.name}
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2 mt-0.5">
                  {tab.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* 🌸 AQUÍ VA COLOCADO EL CÓDIGO DE LAS PESTAÑAS */}
      <section className="pt-2">
        {/* Pestaña de Clientes */}
        {activeTab === "clientes" && (
          loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs">
              <Loader2 className="animate-spin text-rose-500" size={32} />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cargando reporte...</p>
            </div>
          ) : (
            <ClientesReport clientsData={clients} />
          )
        )}

        {/* Pestaña de Pagos */}
        {activeTab === "pagos" && (
          loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs">
              <Loader2 className="animate-spin text-rose-500" size={32} />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cargando reporte...</p>
            </div>
          ) : (
            <PagosReport pagosData={pagos} />
          )
        )}

        {/* Pestaña de Reservas */}
        {activeTab === "reservas" && (
          loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs">
              <Loader2 className="animate-spin text-rose-500" size={32} />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cargando reporte...</p>
            </div>
          ) : (
            <ReservasReport reservasData={reservas} />
          )
        )}

        {/* 🌸 2. AQUÍ VA EXACTAMENTE TU BLOQUE PARA LA IA */}
        {activeTab === "bot" && (
          <div className="space-y-6">
            <AIChatReportes />
          </div>
        )}
      </section>
    </main>
  );
}