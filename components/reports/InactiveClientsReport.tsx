"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  UserX,
  UserPlus,
  Download,
  FileSpreadsheet,
  Search,
  RefreshCcw,
  Loader2,
  CalendarClock,
  Sparkles,
  Users,
  ChevronDown,
  Check,
  Layers,
  Clock,
} from "lucide-react";

type ClientActivityRow = {
  celular: string;
  fullPhone: string;
  nombre: string;
  nuncaVino: boolean;
  ultimaCita: string | null;
  ultimoServicio: string;
  ultimaSede: string;
  serviciosRealizados: string[];
  categoriasRealizadas?: string[];
  totalCitasPagadas: number;
  diasInactivo: number | null;
};

/* =========================================================
   🌸 SELECTOR MODERNO CON BUSCADOR INTERNO
========================================================= */
function ModernFilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  icon: Icon,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  icon?: any;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full space-y-1.5" ref={ref}>
      <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          open
            ? "bg-white dark:bg-zinc-900 border-rose-400 ring-2 ring-rose-400/15 text-zinc-900 dark:text-white"
            : "bg-zinc-50/80 dark:bg-zinc-950 border-zinc-200/90 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 hover:border-rose-300"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-rose-500 shrink-0" />}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-zinc-400 transition-transform duration-200 shrink-0 ${
            open ? "rotate-180 text-rose-500" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {options.length > 6 && (
            <div className="relative mb-1.5">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar opciones..."
                className="w-full pl-7 pr-2.5 py-1.5 text-[11px] font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 outline-none focus:border-rose-400"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <p className="text-[11px] text-zinc-400 text-center py-3 font-medium">
                Sin coincidencias
              </p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-rose-500/10 hover:text-rose-500"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={13} className="text-rose-500 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🌸 COMPONENTE PRINCIPAL
========================================================= */
export default function InactiveClientsReport() {
  const [loading, setLoading] = useState(true);
  const [allClients, setAllClients] = useState<ClientActivityRow[]>([]);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Filtros
  const [audienceMode, setAudienceMode] = useState<"inactive" | "never">("inactive");
  const [minDaysInactive, setMinDaysInactive] = useState<number>(60);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/inactive-clients");
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo cargar el reporte");
      }
      setAllClients(json.clients || []);
      setAvailableServices(json.availableServices || []);
      setAvailableCategories(json.availableCategories || []);
    } catch (err) {
      console.error("Error cargando clientes inactivos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Opciones formateadas para los selectores modernos
  const categoryOptions = useMemo(() => {
    return [
      { label: "Todas las categorías", value: "ALL" },
      ...availableCategories.map((cat) => ({ label: cat, value: cat })),
    ];
  }, [availableCategories]);

  const serviceOptions = useMemo(() => {
    return [
      { label: "Todos los servicios", value: "ALL" },
      ...availableServices.map((srv) => ({ label: srv, value: srv })),
    ];
  }, [availableServices]);

  // Filtrado dinámico en memoria
  const filteredClients = useMemo(() => {
    return allClients
      .filter((c) => {
        if (audienceMode === "never") {
          if (!c.nuncaVino) return false;
        } else {
          if (c.nuncaVino) return false;
          if (c.diasInactivo === null || c.diasInactivo < minDaysInactive) return false;

          // Filtro por Categoría
          if (selectedCategory !== "ALL") {
            const hasCat = (c.categoriasRealizadas || []).some(
              (cat) => cat.toLowerCase() === selectedCategory.toLowerCase()
            );
            if (!hasCat) return false;
          }

          // Filtro por Servicio específico
          if (selectedService !== "ALL") {
            const hasService = c.serviciosRealizados.some(
              (s) => s.toLowerCase() === selectedService.toLowerCase()
            );
            if (!hasService) return false;
          }
        }

        if (searchTerm.trim() !== "") {
          const q = searchTerm.toLowerCase().trim();
          const matchName = c.nombre.toLowerCase().includes(q);
          const matchPhone = c.fullPhone.includes(q) || c.celular.includes(q);
          if (!matchName && !matchPhone) return false;
        }

        return true;
      })
      .sort((a, b) => (b.diasInactivo ?? 99999) - (a.diasInactivo ?? 99999));
  }, [allClients, audienceMode, minDaysInactive, selectedCategory, selectedService, searchTerm]);

  const totalNeverVisited = useMemo(
    () => allClients.filter((c) => c.nuncaVino).length,
    [allClients]
  );

  // Descarga Plantilla YCloud (.xlsx)
  const handleDownloadYCloudXlsx = () => {
    if (filteredClients.length === 0) return;

    const rows = filteredClients.map((c) => ({
      "phone ": c.fullPhone,
      name: c.nombre || "Desconocido",
      value1: "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ["phone ", "name", "value1"],
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Campaña YCloud");

    const todayStr = new Date().toISOString().split("T")[0];
    const tag = audienceMode === "never" ? "SinCitas" : `Inactivos_${minDaysInactive}d`;
    XLSX.writeFile(workbook, `campaignTemplate_YCloud_${tag}_${todayStr}.xlsx`);
  };

  // Descarga Toda la Data (.csv)
  const handleDownloadFullCsv = () => {
    if (filteredClients.length === 0) return;

    const headers = [
      "Nombre",
      "Telefono",
      "Estado Audiencia",
      "Dias Sin Venir",
      "Ultima Visita",
      "Ultimo Servicio",
      "Categorias Realizadas",
      "Todos los Servicios Realizados",
      "Total Citas Pagadas",
      "Ultima Sede",
    ];

    const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    const csvRows = [
      headers.join(","),
      ...filteredClients.map((c) =>
        [
          escapeCsv(c.nombre),
          escapeCsv(c.fullPhone),
          escapeCsv(c.nuncaVino ? "Jamas ha tenido citas" : "Inactivo"),
          escapeCsv(c.nuncaVino ? "N/A" : c.diasInactivo),
          escapeCsv(c.ultimaCita ? c.ultimaCita.split("T")[0] : "Nunca"),
          escapeCsv(c.ultimoServicio),
          escapeCsv((c.categoriasRealizadas || []).join(" | ") || "General"),
          escapeCsv(c.serviciosRealizados.join(" | ") || "Ninguno"),
          escapeCsv(c.totalCitasPagadas),
          escapeCsv(c.ultimaSede),
        ].join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const todayStr = new Date().toISOString().split("T")[0];
    link.href = url;
    link.setAttribute("download", `Reporte_Retencion_Lehana_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans antialiased text-zinc-900 dark:text-zinc-100">
      {/* PANEL DE CONTROL Y FILTROS ESTILIZADOS */}
      <section className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-6">
        
        {/* ENCABEZADO CON ACCIONES DE DESCARGA */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
              <CalendarClock size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight">
                Reporte de Retención e Inactividad
              </h2>
              <p className="text-xs font-semibold text-zinc-400">
                Segmenta por días sin venir, categoría o servicio y exporta directo para YCloud
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadYCloudXlsx}
              disabled={loading || filteredClients.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl text-xs font-extrabold shadow-sm shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
            >
              <FileSpreadsheet size={15} />
              <span>Plantilla YCloud (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFullCsv}
              disabled={loading || filteredClients.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-2xl text-xs font-extrabold border border-zinc-700 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
            >
              <Download size={15} />
              <span>Data Completa (.csv)</span>
            </button>

            <button
              type="button"
              onClick={fetchReportData}
              disabled={loading}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 transition-all cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCcw size={15} className={loading ? "animate-spin text-rose-500" : ""} />
            </button>
          </div>
        </div>

        {/* SELECTOR SEGMENTADO DE AUDIENCIA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAudienceMode("inactive")}
            className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              audienceMode === "inactive"
                ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-400/60 text-rose-600 dark:text-rose-400 shadow-2xs"
                : "bg-zinc-50/70 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${audienceMode === "inactive" ? "bg-rose-500 text-white" : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-400"}`}>
                <UserX size={18} />
              </div>
              <div>
                <span className="text-xs font-black uppercase block">Clientas Inactivas</span>
                <span className="text-[11px] font-medium opacity-80">
                  Con citas pagadas previas pero sin volver hace {minDaysInactive}+ días
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setAudienceMode("never")}
            className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              audienceMode === "never"
                ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-400/60 text-amber-600 dark:text-amber-400 shadow-2xs"
                : "bg-zinc-50/70 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${audienceMode === "never" ? "bg-amber-500 text-white" : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-400"}`}>
                <UserPlus size={18} />
              </div>
              <div>
                <span className="text-xs font-black uppercase block">
                  Jamás Han Tenido Citas ({totalNeverVisited})
                </span>
                <span className="text-[11px] font-medium opacity-80">
                  Registrados en base de datos sin ninguna cita pagada
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* BARRA DE FILTROS MODERNIZADA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          
          {/* 1. PÍLDORAS RÁPIDAS + DÍAS EXACTOS */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
              Tiempo Mínimo Sin Venir
            </label>
            <div className="flex items-center gap-1.5 bg-zinc-50/80 dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 p-1 rounded-2xl">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  disabled={audienceMode === "never"}
                  onClick={() => setMinDaysInactive(days)}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer disabled:opacity-40 ${
                    minDaysInactive === days && audienceMode === "inactive"
                      ? "bg-rose-500 text-white shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {days}d
                </button>
              ))}
              <div className="relative w-20 shrink-0">
                <Clock size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-rose-500" />
                <input
                  type="number"
                  min={1}
                  disabled={audienceMode === "never"}
                  value={minDaysInactive}
                  onChange={(e) => setMinDaysInactive(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 py-1.5 pl-6 pr-1.5 rounded-xl text-[11px] font-black text-center outline-none focus:border-rose-400 disabled:opacity-40"
                  title="Días exactos"
                />
              </div>
            </div>
          </div>

          {/* 2. SELECTOR MODERNO DE CATEGORÍA */}
          <ModernFilterSelect
            label="Categoría de Servicio"
            value={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val);
              setSelectedService("ALL"); // Resetea el servicio específico al cambiar categoría
            }}
            options={categoryOptions}
            icon={Layers}
            disabled={audienceMode === "never"}
          />

          {/* 3. SELECTOR MODERNO DE SERVICIO */}
          <ModernFilterSelect
            label="Servicio Específico"
            value={selectedService}
            onChange={(val) => setSelectedService(val)}
            options={serviceOptions}
            icon={Sparkles}
            disabled={audienceMode === "never"}
          />

          {/* 4. BUSCADOR RÁPIDO */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
              Buscar Clienta o Celular
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o teléfono..."
                className="w-full bg-zinc-50/80 dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 py-2.5 pl-9 pr-3 rounded-2xl text-xs font-bold outline-none focus:border-rose-400 focus:bg-white dark:focus:bg-zinc-900 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TARJETAS DE MÉTRICAS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              Clientas Filtradas Listas para Campaña
            </span>
            <span className="text-3xl font-extrabold text-rose-500 mt-1 block">
              {loading ? "..." : filteredClients.length}
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              Total Contactos en Base de Datos
            </span>
            <span className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1 block">
              {loading ? "..." : allClients.length}
            </span>
          </div>
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl border border-zinc-200/60 dark:border-zinc-700">
            <Sparkles size={24} />
          </div>
        </div>
      </section>

      {/* TABLA DE RESULTADOS */}
      <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden p-6">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Loader2 size={24} className="animate-spin text-rose-500" />
            <span className="text-xs font-bold uppercase">Analizando historial de citas...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <p className="text-center py-14 text-zinc-400 text-xs font-medium italic">
            No se encontraron clientas con los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-[520px] custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[780px]">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-700">
                <tr>
                  <th className="py-3 px-4">Clienta</th>
                  <th className="py-3 px-4">Teléfono (YCloud)</th>
                  <th className="py-3 px-4 text-center">Inactividad</th>
                  <th className="py-3 px-4">Última Visita</th>
                  <th className="py-3 px-4">Categoría / Último Servicio</th>
                  <th className="py-3 px-4 text-center">Citas Pagadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredClients.map((c, idx) => (
                  <tr
                    key={`${c.celular}-${idx}`}
                    className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-extrabold text-zinc-900 dark:text-zinc-100 uppercase">
                      {c.nombre}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-zinc-600 dark:text-zinc-300">
                      {c.fullPhone}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.nuncaVino ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                          Sin citas
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                          Hace {c.diasInactivo} días
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-semibold">
                      {c.ultimaCita ? c.ultimaCita.split("T")[0] : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-700 dark:text-zinc-200 font-bold truncate max-w-[220px]">
                          {c.ultimoServicio}
                        </span>
                        {c.categoriasRealizadas && c.categoriasRealizadas.length > 0 && (
                          <span className="text-[10px] text-rose-500 font-bold">
                            {c.categoriasRealizadas.join(", ")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-zinc-700 dark:text-zinc-200">
                      {c.totalCitasPagadas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}