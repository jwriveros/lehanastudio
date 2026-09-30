"use client";

import React, { useMemo, useState } from "react";
import {
  DollarSign,
  Receipt,
  CheckCircle2,
  ExternalLink,
  CreditCard,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
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

export type PagoRecord = {
  id: string;
  created_at: string;
  full_phone: string;
  amount_extracted: string;
  reference_number: string | null;
  bank_name: string | null;
  receipt_url: string;
  appointment_ids: string[];
  status: string;
  mensaje: string;
};

export interface PagosReportProps {
  pagosData: PagoRecord[];
}

const COLORS = ["#10B981", "#F59E0B", "#6366F1", "#EC4899", "#8B5CF6", "#64748B"];

export default function PagosReport({ pagosData }: PagosReportProps) {
  // 🌸 ESTADOS PARA LA PAGINACIÓN DE LA TABLA
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25); // Opciones: 10, 25, 50, 100

  // 1. CÁLCULO DE MÉTRICAS GLOBALES
  const stats = useMemo(() => {
    let totalMonto = 0;
    let totalCompletos = 0;
    let totalAbonos = 0;
    let totalOtros = 0;
    let totalReservasVinculadas = 0;

    const bancosCount: Record<string, number> = {};

    pagosData.forEach((p) => {
      const monto = parseFloat(p.amount_extracted || "0");
      totalMonto += monto;

      const statusLower = (p.status || "").toLowerCase();
      if (statusLower === "completo") totalCompletos++;
      else if (statusLower === "abono") totalAbonos++;
      else totalOtros++;

      if (Array.isArray(p.appointment_ids)) {
        totalReservasVinculadas += p.appointment_ids.length;
      }

      const msg = (p.mensaje || "").toLowerCase();
      let banco = "Nequi";
      if (msg.includes("bancolombia")) banco = "Bancolombia";
      else if (msg.includes("bold")) banco = "Bold";
      else if (msg.includes("davivienda")) banco = "Davivienda";
      else if (msg.includes("bbva")) banco = "BBVA";
      else if (msg.includes("bre-b")) banco = "Bre-B";

      bancosCount[banco] = (bancosCount[banco] || 0) + 1;
    });

    const totalPagos = pagosData.length;
    const ticketPromedio = totalPagos > 0 ? Math.round(totalMonto / totalPagos) : 0;

    const statusChartData = [
      { name: "Pagos Completos", value: totalCompletos },
      { name: "Abonos", value: totalAbonos },
      { name: "Sin Clasificar", value: totalOtros },
    ].filter((item) => item.value > 0);

    const bancosChartData = Object.entries(bancosCount).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      totalMonto,
      totalPagos,
      ticketPromedio,
      totalCompletos,
      totalAbonos,
      totalReservasVinculadas,
      statusChartData,
      bancosChartData,
    };
  }, [pagosData]);

  // 🌸 2. LÓGICA DE CORTE/PAGINACIÓN DE LA TABLA
  const totalPages = Math.ceil(pagosData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return pagosData.slice(startIndex, startIndex + itemsPerPage);
  }, [pagosData, currentPage, itemsPerPage]);

  // Cambiar filas por página y reiniciar a la primera página
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 bg-white dark:bg-zinc-900/90 p-5 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs text-zinc-800 dark:text-zinc-100 font-sans">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={15} />
            <span>Métricas de Pagos & Transferencias</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
            Reporte General de Pagos Recibidos
          </h2>
        </div>
      </div>

      {/* KPIS FINANCIEROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Recaudado</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${stats.totalMonto.toLocaleString("es-CO")} COP
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">{stats.totalPagos} Comprobantes procesados</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Ticket Promedio</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">
            ${stats.ticketPromedio.toLocaleString("es-CO")} COP
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">Monto medio por transferencia</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Pagos Completos vs Abonos</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.totalCompletos}</span>
            <span className="text-xs font-bold text-amber-500">/ {stats.totalAbonos} Abonos</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">Estado de liquidación</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Reservas Cubiertas</span>
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">
            {stats.totalReservasVinculadas}
          </div>
          <p className="text-[10px] text-zinc-400 font-semibold">Citas vinculadas a los pagos</p>
        </div>
      </div>

      {/* GRÁFICOS ANALÍTICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <PieIcon size={16} className="text-emerald-500" />
            Distribución por Tipo de Pago
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-center">
            {stats.statusChartData.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">{item.name}</span>
                <span className="text-xs font-black text-zinc-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-500" />
            Bancos y Entidades Frecuentes
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.bancosChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#71717a" opacity={0.2} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABLA PAGINADA DE COMPROBANTES Y PAGOS */}
      <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-3xl space-y-4">
        
        {/* CABECERA DE LA TABLA + SELECTOR DE FILAS POR PÁGINA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            <Receipt size={16} className="text-emerald-500" />
            Historial de Comprobantes ({pagosData.length} registros)
          </h3>

          {/* 🌸 SELECTOR DE REGISTROS POR PÁGINA */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer focus:border-emerald-500 transition-colors"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
        </div>

        {/* CONTENIDO DE LA TABLA */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400">
                <th className="py-2.5 px-3">Cliente / Teléfono</th>
                <th className="py-2.5 px-3">Monto Pago</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Reservas Asociadas</th>
                <th className="py-2.5 px-3">Comprobante</th>
                <th className="py-2.5 px-3">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {paginatedData.length > 0 ? (
                paginatedData.map((p) => {
                  const monto = parseFloat(p.amount_extracted || "0");
                  const statusLower = (p.status || "").toLowerCase();

                  return (
                    <tr key={p.id} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {p.full_phone}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400 text-xs">
                        ${monto.toLocaleString("es-CO")} COP
                      </td>
                      <td className="py-3 px-3">
                        {statusLower === "completo" ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            COMPLETO
                          </span>
                        ) : statusLower === "abono" ? (
                          <span className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            ABONO
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                            PENDIENTE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {p.appointment_ids && p.appointment_ids.length > 0 ? (
                            p.appointment_ids.map((appId) => (
                              <span key={appId} className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                                #{appId}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-400 text-[10px]">Sin reservas</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {p.receipt_url ? (
                          <a
                            href={p.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] rounded-xl hover:bg-rose-100 transition-colors"
                          >
                            <Receipt size={12} />
                            <span>Ver Imagen</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-zinc-400 text-[10px]">No disponible</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-zinc-400">
                        {new Date(p.created_at).toLocaleString("es-CO")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs italic">
                    No se encontraron pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 🌸 CONTROLES DEL PAGINADOR NUMÉRICO */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Mostrando de{" "}
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              a{" "}
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {Math.min(currentPage * itemsPerPage, pagosData.length)}
              </span>{" "}
              de <span className="font-bold text-emerald-500">{pagosData.length}</span> pagos
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  if (pageNum <= 0) return null;
                  const isCurrent = currentPage === pageNum;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}