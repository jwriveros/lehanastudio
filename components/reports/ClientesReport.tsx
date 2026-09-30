"use client";

import React, { useMemo } from "react";
import {
  Users,
  Megaphone,
  Bot,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

export type ClientRecord = {
  id: number;
  nombre: string | null;
  nombre_comercial: string | null;
  celular: string | null;
  municipio: string | null;
  sede: string | null;
  creado_desde: string | null;
  type: string | null;
  last_incoming_at: string | null;
  BSUID: string | null;
};

export interface ClientesReportProps {
  clientsData: ClientRecord[];
}

const COLORS = ["#EC4899", "#6366F1", "#10B981", "#F59E0B", "#8B5CF6", "#64748B"];

export default function ClientesReport({ clientsData }: ClientesReportProps) {
  const stats = useMemo(() => {
    const total = clientsData.length;
    let fromAds = 0;
    let fromBot = 0;
    let fromCRM = 0;
    let withSede = 0;
    let withoutSede = 0;

    const municipiosCount: Record<string, number> = {};
    const sedesCount: Record<string, number> = {};
    const origenCount: Record<string, number> = {
      "Anuncios (Ads)": 0,
      "Bot WhatsApp": 0,
      "CRM Manual": 0,
      "Orgánico / Otro": 0,
    };

    clientsData.forEach((c) => {
      const isAd = c.type && c.type.toLowerCase().includes("ad");
      if (isAd) {
        fromAds++;
        origenCount["Anuncios (Ads)"]++;
      } else if (c.creado_desde === "BOT_WHATSAPP") {
        fromBot++;
        origenCount["Bot WhatsApp"]++;
      } else if (c.creado_desde === "CRM_BOOKING") {
        fromCRM++;
        origenCount["CRM Manual"]++;
      } else {
        origenCount["Orgánico / Otro"]++;
      }

      const sedeName = c.sede && c.sede !== "N/A" ? c.sede : "Sin Sede";
      if (c.sede && c.sede !== "N/A") {
        withSede++;
      } else {
        withoutSede++;
      }
      sedesCount[sedeName] = (sedesCount[sedeName] || 0) + 1;

      const munName = c.municipio && c.municipio !== "N/A" ? c.municipio : "No Especificado";
      municipiosCount[munName] = (municipiosCount[munName] || 0) + 1;
    });

    return {
      total,
      fromAds,
      fromBot,
      fromCRM,
      withSede,
      withoutSede,
      adsPercentage: total > 0 ? Math.round((fromAds / total) * 100) : 0,
      origenChartData: Object.entries(origenCount).map(([name, value]) => ({ name, value })),
      sedesChartData: Object.entries(sedesCount).map(([name, value]) => ({ name, value })),
      municipiosChartData: Object.entries(municipiosCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    };
  }, [clientsData]);

  const recentInteractions = useMemo(() => {
    return [...clientsData]
      .filter((c) => c.last_incoming_at)
      .sort((a, b) => new Date(b.last_incoming_at!).getTime() - new Date(a.last_incoming_at!).getTime())
      .slice(0, 8);
  }, [clientsData]);

  return (
    <div className="space-y-6 bg-white dark:bg-zinc-900/90 p-5 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-zinc-800 dark:text-zinc-100 font-sans">
      
      {/* ENCABEZADO REPORTE DE CLIENTES */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={15} />
            <span>Métricas de Captación de Clientes</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
            Reporte General de Base de Clientes
          </h2>
        </div>
      </div>

      {/* KPIS ADAPTABLES EN CLARO Y OSCURO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Clientes</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{stats.total}</div>
          <p className="text-[10px] text-zinc-400 font-semibold">Contactos sincronizados</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Captados por Ads</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl">
              <Megaphone size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.fromAds}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">({stats.adsPercentage}%)</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">Atribución por pauta</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Vía Bot WhatsApp</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Bot size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{stats.fromBot}</div>
          <p className="text-[10px] text-zinc-400 font-semibold">Ingreso automático por Bot</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Con Sede Asignada</span>
            <div className="p-2 bg-purple-500/10 text-purple-500 dark:text-purple-400 rounded-xl">
              <Building2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.withSede}</span>
            <span className="text-xs font-bold text-zinc-400">/ {stats.withoutSede} sin sede</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">Sedes asignadas</p>
        </div>

      </div>

      {/* SECCIÓN DE GRÁFICOS ANALÍTICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* ORIGEN DE CAPTACIÓN */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <PieIcon size={16} className="text-rose-500" />
            Canales de Captación
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.origenChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.origenChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {stats.origenChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold truncate">{item.name}:</span>
                <span className="text-[11px] text-zinc-900 dark:text-white font-black">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DISTRIBUCIÓN POR SEDE */}
        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <BarChart3 size={16} className="text-rose-500" />
            Volumen por Sede
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.sedesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#71717a" opacity={0.2} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="value" fill="#EC4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* TOP MUNICIPIOS */}
      <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
          <MapPin size={16} className="text-rose-500" />
          Concentración por Municipio / Territorio
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.municipiosChartData.map((m, idx) => (
            <div
              key={m.name}
              className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-xl font-mono text-xs font-black">
                  #{idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[100px]">{m.name}</h4>
                  <span className="text-[10px] text-zinc-400 font-medium">Municipio</span>
                </div>
              </div>
              <div className="text-xs font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ÚLTIMAS INTERACCIONES REGISTRADAS */}
      <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
          <Calendar size={16} className="text-rose-500" />
          Auditoría de Actividad Reciente
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400">
                <th className="py-2.5 px-3">Cliente / Nombre WhatsApp</th>
                <th className="py-2.5 px-3">Celular</th>
                <th className="py-2.5 px-3">Origen</th>
                <th className="py-2.5 px-3">Sede</th>
                <th className="py-2.5 px-3">Última Interacción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {recentInteractions.map((c) => {
                const isAd = c.type && c.type.toLowerCase().includes("ad");
                return (
                  <tr key={c.id} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-900 dark:text-white">{c.nombre || "Desconocido"}</div>
                      <div className="text-[10px] text-zinc-400">{c.nombre_comercial || "—"}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-600 dark:text-zinc-300">{c.celular || "—"}</td>
                    <td className="py-3 px-3">
                      {isAd ? (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                          ANUNCIO (Ad)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          {c.creado_desde || "Orgánico"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-zinc-700 dark:text-zinc-300">{c.sede || "N/A"}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-400">
                      {c.last_incoming_at ? new Date(c.last_incoming_at).toLocaleString("es-CO") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}