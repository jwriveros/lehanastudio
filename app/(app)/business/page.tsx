"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import ModalCliente from "./ModalCliente";
import ModalEspecialista from "./ModalEspecialista";
import ModalServicio, { ServicioPayload } from "./ModalServicio";
import { 
  Search, 
  Plus, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  X, 
  User, 
  Sparkles, 
  Users2, 
  Scissors, 
  Briefcase, 
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  MapPin,
  Tag,
  Clock,
  Layers,
  Download
} from "lucide-react";

type TabKey = "clients" | "services" | "specialists";
type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

const SEDES_OPCIONES = ["Marquetalia", "Buga", "Santa Marta"];

/* =========================================================
   🔹 COMPONENTE REUTILIZABLE: SELECTOR MODERNO / DROPDOWN
========================================================= */
function ModernSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  icon: Icon,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  icon?: any;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs hover:border-rose-400 transition-all cursor-pointer outline-none focus:outline-none"
      >
        {Icon && <Icon size={13} className="text-rose-500" />}
        <span className="truncate max-w-[140px] sm:max-w-[180px]">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={13} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1 max-h-60 overflow-y-auto animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              value === "" ? "text-rose-500 font-bold bg-rose-50/50 dark:bg-rose-950/30" : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>{placeholder}</span>
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                value === opt.value ? "text-rose-500 font-bold bg-rose-50/50 dark:bg-rose-950/30" : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="truncate">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 PÁGINA PRINCIPAL BUSINESS
========================================================= */
export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("clients");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Filtros adicionales para Clientes
  const [filterSede, setFilterSede] = useState("");
  const [filterMunicipio, setFilterMunicipio] = useState("");

  // Filtros adicionales para Servicios
  const [filterCategory, setFilterCategory] = useState("");
  const [filterService, setFilterService] = useState("");
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [allServicesNames, setAllServicesNames] = useState<{ label: string; value: string }[]>([]);

  // Estado de Ordenamiento Cíclico
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });

  // Estados de Modales
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [modalEspecialistaOpen, setModalEspecialistaOpen] = useState(false);
  const [modalServicioOpen, setModalServicioOpen] = useState(false);
  
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const ITEMS_PER_PAGE = 12;

  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [specialistForm, setSpecialistForm] = useState<any>({});
  const [clientForm, setClientForm] = useState<any>({});
  const [serviceForm, setServiceForm] = useState<ServicioPayload | null>(null);

  // Cargar catálogo auxiliar de categorías y nombres de servicios
  useEffect(() => {
    const fetchMetadata = async () => {
      const { data } = await supabase.from("services").select("Servicio, category");
      if (data) {
        const uniqueCategories = Array.from(new Set(data.map((s) => s.category).filter(Boolean)));
        setCategoriesList(uniqueCategories);

        const serviceOpts = data.map((s) => ({ label: s.Servicio, value: s.Servicio }));
        setAllServicesNames(serviceOpts);
      }
    };
    fetchMetadata();
  }, []);

  const handleSort = (columnKey: string) => {
    setSortState((prev) => {
      if (prev.column !== columnKey) {
        return { column: columnKey, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column: columnKey, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      if (activeTab === "clients") {
        let query = supabase
          .from("clients")
          .select("*", { count: "exact" });

        if (sortState.column && sortState.direction) {
          query = query.order(sortState.column, { ascending: sortState.direction === "asc" });
        } else {
          query = query.order("id", { ascending: false });
        }

        const rawTerm = search.trim();
        if (rawTerm) {
          query = query.or(
            `celular.ilike.%${rawTerm}%,"BSUID".ilike.%${rawTerm}%,nombre.ilike.%${rawTerm}%,nombre_comercial.ilike.%${rawTerm}%`
          );
        }

        if (filterSede) query = query.eq("sede", filterSede);
        if (filterMunicipio.trim()) query = query.ilike("municipio", `%${filterMunicipio.trim()}%`);

        const { data, count, error } = await query.range(from, to);

        if (error) {
          console.error("Error consultando clientes:", error.message);
          setClients([]);
          setTotalRecords(0);
        } else {
          setClients(data || []);
          setTotalRecords(count || 0);
        }
      } else if (activeTab === "services") {
        let query = supabase.from("services").select("*", { count: "exact" });

        if (sortState.column && sortState.direction) {
          query = query.order(sortState.column, { ascending: sortState.direction === "asc" });
        } else {
          query = query.order("Servicio", { ascending: true });
        }

        if (filterCategory) query = query.eq("category", filterCategory);
        if (filterService) query = query.eq("Servicio", filterService);

        if (search.trim()) {
          query = query.or(`Servicio.ilike.%${search.trim()}%,SKU.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%`);
        }

        const { data, count } = await query.range(from, to);
        setServices(data || []);
        setTotalRecords(count || 0);
      } else {
        let query = supabase.from("app_users").select("*", { count: "exact" }).in("role", ["ESPECIALISTA", "SPECIALIST"]);

        if (sortState.column && sortState.direction) {
          query = query.order(sortState.column, { ascending: sortState.direction === "asc" });
        } else {
          query = query.order("id", { ascending: false });
        }

        if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);
        const { data, count } = await query.range(from, to);
        setSpecialists(data || []);
        setTotalRecords(count || 0);
      }
    } catch (err) {
      console.error("Error cargando tabla:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, search, filterSede, filterMunicipio, filterCategory, filterService, sortState]);

  useEffect(() => {
    const timer = setTimeout(() => { loadData(); }, 350);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => { 
    setCurrentPage(1); 
  }, [activeTab, search, filterSede, filterMunicipio, filterCategory, filterService, sortState]);

  useEffect(() => {
    setSortState({ column: null, direction: null });
  }, [activeTab]);

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  /* =========================================================
     🌸 FUNCIÓN: EXPORTAR TODOS LOS CLIENTES (SIN LÍMITE DE 1000)
  ========================================================= */
  const [exportingCSV, setExportingCSV] = useState(false);

  const exportClientsToCSV = async () => {
    try {
      setExportingCSV(true);

      let allFilteredClients: any[] = [];
      let from = 0;
      const CHUNK_SIZE = 1000;
      let hasMore = true;

      // 1. Bucle de paginación para superar el límite de 1000 de Supabase
      while (hasMore) {
        let query = supabase.from("clients").select("*");

        // Aplicar ordenamiento
        if (sortState.column && sortState.direction) {
          query = query.order(sortState.column, { ascending: sortState.direction === "asc" });
        } else {
          query = query.order("id", { ascending: false });
        }

        // Aplicar filtro de búsqueda por texto
        const rawTerm = search.trim();
        if (rawTerm) {
          query = query.or(
            `celular.ilike.%${rawTerm}%,"BSUID".ilike.%${rawTerm}%,nombre.ilike.%${rawTerm}%,nombre_comercial.ilike.%${rawTerm}%`
          );
        }

        // Aplicar filtros de Sede y Municipio
        if (filterSede) query = query.eq("sede", filterSede);
        if (filterMunicipio.trim()) query = query.ilike("municipio", `%${filterMunicipio.trim()}%`);

        // Consultar el lote actual (ej: 0-999, 1000-1999...)
        const { data: chunk, error } = await query.range(from, from + CHUNK_SIZE - 1);

        if (error) {
          alert("Error al obtener los datos para exportar: " + error.message);
          setExportingCSV(false);
          return;
        }

        if (chunk && chunk.length > 0) {
          allFilteredClients = [...allFilteredClients, ...chunk];
          from += CHUNK_SIZE;

          // Si el bloque trae menos de 1000 elementos, llegamos al final
          if (chunk.length < CHUNK_SIZE) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      if (allFilteredClients.length === 0) {
        alert("No se encontraron registros para exportar con los filtros actuales.");
        setExportingCSV(false);
        return;
      }

      // 2. Encabezados del archivo CSV
      const headers = ["Identificacion", "Nombre", "Nombre Comercial", "Celular", "BSUID", "Municipio", "Sede"];

      // 3. Transformación de los 1945+ registros a filas de texto
      const rows = allFilteredClients.map((c) => {
        const id = `"${(c.identificacion || "").toString().replace(/"/g, '""')}"`;
        const nombre = `"${(c.nombre || "").replace(/"/g, '""')}"`;
        const comercial = `"${(c.nombre_comercial || "").replace(/"/g, '""')}"`;
        const celular = `"${(c.celular || c.telefono || "").toString().replace(/"/g, '""')}"`;
        const bsuid = `"${(c.BSUID || "").replace(/"/g, '""')}"`;
        const municipio = `"${(c.municipio || "").replace(/"/g, '""')}"`;
        const sede = `"${(c.sede || "Marquetalia").replace(/"/g, '""')}"`;

        return [id, nombre, comercial, celular, bsuid, municipio, sede].join(",");
      });

      // 4. Creación del Blob con BOM UTF-8 (\uFEFF)
      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // 5. Descarga automática en el navegador
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Clientes_Completo_LehanaStudio_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error al exportar CSV:", err);
      alert("Ocurrió un error al generar el archivo.");
    } finally {
      setExportingCSV(false);
    }
  };

  const openClientModal = (item: any, selectedMode: "edit" | "view") => {
    setMode(selectedMode);
    setClientForm({
      id: item.id,
      celular: item.celular || "",
      nombre: item.nombre || "",
      tipo: item.tipo_cliente || item.tipo || "Cliente",
      direccion: item.direccion || "",
      cumpleanos: item.cumpleanos || "",
      identificacion: item.identificacion || "",
      correo_electronico: item.correo_electronico || "",
      estado: item.estado || "Activo",
      genero: item.genero || "",
      indicador: item.indicador || "+57",
      departamento: item.departamento || "",
      municipio: item.municipio || "",
      BSUID: item.BSUID || "",
      nombre_comercial: item.nombre_comercial || "",
      sede: item.sede || "",
    });
    setModalClienteOpen(true);
  };

  const openServiceModal = (item: any | null, selectedMode: "create" | "edit") => {
    setMode(selectedMode);
    setServiceForm(item);
    setModalServicioOpen(true);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortState.column !== columnKey || !sortState.direction) {
      return <ArrowUpDown size={12} className="text-zinc-400 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return sortState.direction === "asc" ? (
      <ArrowUp size={12} className="text-rose-500" />
    ) : (
      <ArrowDown size={12} className="text-rose-500" />
    );
  };

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-zinc-800 dark:text-zinc-100 font-sans antialiased">
      
      {/* ENCABEZADO PRINCIPAL */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-200/60 dark:border-zinc-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-500">
            <Sparkles size={18} />
            <span className="text-xs font-bold tracking-wider uppercase text-rose-500">Gestión de Estudio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mi Negocio
          </h1>
          <p className="text-xs font-medium text-zinc-400">
            {totalRecords} {activeTab === 'clients' ? 'Clientes registrados' : activeTab === 'services' ? 'Servicios activos' : 'Especialistas en equipo'}
          </p>
        </div>

        {/* PESTAÑAS TIPO PILL */}
        <nav className="flex bg-zinc-100/80 dark:bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
          {(["clients", "services", "specialists"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm font-bold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {tab === "clients" && <Users2 size={15} />}
                {tab === "services" && <Scissors size={15} />}
                {tab === "specialists" && <Briefcase size={15} />}
                <span>
                  {tab === "clients" ? "Clientes" : tab === "services" ? "Servicios" : "Equipo"}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* BARRA DE BÚSQUEDA Y ACCIONES */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'clients' 
                  ? "Buscar por celular, BSUID, nombre o nombre comercial..." 
                  : activeTab === 'services'
                  ? "Buscar por nombre, SKU o categoría..."
                  : "Buscar especialista..."
              }
              className="w-full bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 p-3.5 pl-12 pr-10 rounded-2xl outline-none focus:border-rose-400 text-xs sm:text-sm font-medium shadow-xs transition-colors"
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (activeTab === "clients") {
                setMode("create");
                setModalClienteOpen(true);
              } else if (activeTab === "specialists") {
                setMode("create");
                setModalEspecialistaOpen(true);
              } else if (activeTab === "services") {
                openServiceModal(null, "create");
              }
            }}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-7 py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={18} /> 
            <span>
              Añadir {activeTab === 'clients' ? 'Cliente' : activeTab === 'services' ? 'Servicio' : 'Especialista'}
            </span>
          </button>
        </div>

        {/* FILTROS EXCLUSIVOS DE CLIENTES + BOTÓN EXPORTAR CSV */}
        {activeTab === "clients" && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 mr-1">
                <Filter size={14} className="text-rose-500" />
                <span>Filtrar por:</span>
              </div>

              <ModernSelect 
                value={filterSede} 
                onChange={(val) => setFilterSede(val)} 
                options={SEDES_OPCIONES.map((s) => ({ label: s, value: s }))}
                placeholder="Todas las Sedes"
                icon={MapPin}
              />

              <input
                type="text"
                placeholder="Municipio..."
                value={filterMunicipio}
                onChange={(e) => setFilterMunicipio(e.target.value)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3.5 py-2 rounded-xl text-xs font-semibold outline-none focus:border-rose-400 w-36 sm:w-44"
              />

              {(filterSede || filterMunicipio) && (
                <button
                  onClick={() => {
                    setFilterSede("");
                    setFilterMunicipio("");
                  }}
                  className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* 🌸 BOTÓN DESCARGAR CSV DE CLIENTES FILTRADOS */}
            <button
              type="button"
              onClick={exportClientsToCSV}
              className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 border-none outline-none"
              title="Descargar clientes filtrados en Excel / CSV"
            >
              <Download size={14} className="text-rose-500" />
              <span>Exportar CSV ({clients.length})</span>
            </button>
          </div>
        )}

        {/* FILTROS EXCLUSIVOS DE SERVICIOS */}
        {activeTab === "services" && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 mr-1">
              <Filter size={14} className="text-rose-500" />
              <span>Filtrar servicios:</span>
            </div>

            <ModernSelect 
              value={filterCategory} 
              onChange={(val) => setFilterCategory(val)} 
              options={categoriesList.map((cat) => ({ label: cat, value: cat }))}
              placeholder="Todas las Categorías"
              icon={Layers}
            />

            <ModernSelect 
              value={filterService} 
              onChange={(val) => setFilterService(val)} 
              options={allServicesNames}
              placeholder="Todos los Servicios"
              icon={Scissors}
            />

            {(filterCategory || filterService) && (
              <button
                onClick={() => {
                  setFilterCategory("");
                  setFilterService("");
                }}
                className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </section>

      {/* TABLA PRINCIPAL RESPONSIVA */}
      <section className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xs z-30 flex items-center justify-center">
            <Loader2 className="animate-spin text-rose-500" size={30} />
          </div>
        )}

        <div className="overflow-x-auto min-h-[420px]">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-[11px] font-bold text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 select-none">
              {activeTab === "clients" ? (
                <tr>
                  <th onClick={() => handleSort("identificacion")} className="px-5 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Cédula</span> {renderSortIcon("identificacion")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("nombre")} className="px-5 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Cliente / Comercial</span> {renderSortIcon("nombre")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("celular")} className="px-5 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Celular</span> {renderSortIcon("celular")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("BSUID")} className="px-5 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>BSUID</span> {renderSortIcon("BSUID")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("municipio")} className="px-5 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Municipio</span> {renderSortIcon("municipio")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("sede")} className="px-5 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Sede</span> {renderSortIcon("sede")}
                    </div>
                  </th>
                  <th className="px-5 py-4 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-800 z-20 shadow-xs">Acciones</th>
                </tr>
              ) : activeTab === "services" ? (
                <tr>
                  <th onClick={() => handleSort("Servicio")} className="px-6 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Servicio / SKU</span> {renderSortIcon("Servicio")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("category")} className="px-6 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Categoría</span> {renderSortIcon("category")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("duracion")} className="px-6 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Duración</span> {renderSortIcon("duracion")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("Precio")} className="px-6 py-4 cursor-pointer group hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Precio (COP)</span> {renderSortIcon("Precio")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-800 z-20 shadow-xs">Acciones</th>
                </tr>
              ) : (
                <tr>
                  <th onClick={() => handleSort("name")} className="px-6 py-4 cursor-pointer group">
                    <div className="flex items-center gap-1.5">
                      <span>Especialista</span> {renderSortIcon("name")}
                    </div>
                  </th>
                  <th className="px-6 py-4">Correo</th>
                  <th className="px-6 py-4">Comisión Base</th>
                  <th className="px-6 py-4 text-right sticky right-0 bg-zinc-50 dark:bg-zinc-800 z-20 shadow-xs">Acciones</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
              {activeTab === "clients" ? (
                clients.length > 0 ? (
                  clients.map((item, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => openClientModal(item, "view")}
                      className="group hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    >
                      <td className="px-5 py-4 font-semibold text-zinc-500 dark:text-zinc-400">
                        {item.identificacion || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 transition-colors">
                          {item.nombre || "Sin Nombre"}
                        </div>
                        {item.nombre_comercial && (
                          <div className="text-[10px] font-semibold text-indigo-500">
                            {item.nombre_comercial}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 font-bold text-zinc-800 dark:text-zinc-200">
                        {item.celular || item.telefono || "—"}
                      </td>

                      <td className="px-5 py-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.BSUID ? item.BSUID : "—"}
                      </td>

                      <td className="px-5 py-4 font-medium text-zinc-600 dark:text-zinc-300">
                        {item.municipio || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                          {item.sede || "Marquetalia"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right sticky right-0 bg-white dark:bg-zinc-900 group-hover:bg-rose-50/40 dark:group-hover:bg-rose-950/20 transition-all z-10">
                        <div className="inline-flex items-center justify-center p-2 rounded-xl text-zinc-400 group-hover:text-rose-500 transition-all">
                          <Edit3 size={15} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium italic">
                      No se encontraron clientes coincidentes.
                    </td>
                  </tr>
                )
              ) : activeTab === "services" ? (
                services.length > 0 ? (
                  services.map((item, idx) => (
                    <tr 
                      key={item.id || idx} 
                      onClick={() => openServiceModal(item, "edit")}
                      className="group hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-2xl flex items-center justify-center font-bold shrink-0">
                            <Scissors size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 transition-colors">
                              {item.Servicio}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              SKU: {item.SKU || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 inline-flex items-center gap-1.5">
                          <Tag size={11} />
                          {item.category || "General"}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-bold text-zinc-700 dark:text-zinc-300">
                        <div className="flex items-center gap-1">
                          <Clock size={13} className="text-zinc-400" />
                          <span>{item.duracion} min</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        ${Number(item.Precio || 0).toLocaleString()} COP
                      </td>

                      <td className="px-6 py-4 text-right sticky right-0 bg-white dark:bg-zinc-900 group-hover:bg-rose-50/40 dark:group-hover:bg-rose-950/20 transition-all z-10">
                        <div className="inline-flex items-center justify-center p-2 rounded-xl text-zinc-400 group-hover:text-rose-500 transition-all">
                          <Edit3 size={15} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium italic">
                      No se encontraron servicios registrados.
                    </td>
                  </tr>
                )
              ) : (
                specialists.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className="group hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    onClick={() => {
                      setMode("edit"); 
                      setSpecialistForm(item); 
                      setModalEspecialistaOpen(true); 
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-2xl flex items-center justify-center font-bold shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600">
                            {item.name}
                          </div>
                          <div className="text-[11px] font-medium text-zinc-400">
                            {item.celular || item.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {item.email || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-3.5 py-1.5 rounded-xl text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {item.comision_base || 50}% Comisión
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right sticky right-0 bg-white dark:bg-zinc-900 group-hover:bg-rose-50/40 dark:group-hover:bg-rose-950/20 transition-all z-10">
                      <div className="inline-flex items-center justify-center p-2 rounded-xl text-zinc-400 group-hover:text-rose-500 transition-all">
                        <Edit3 size={15} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINADOR NUMÉRICO */}
        {totalPages > 1 && (
          <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs font-medium text-zinc-400">
              Página <span className="font-bold text-rose-500">{currentPage}</span> de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1 || loading} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-rose-300 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft size={18} />
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
                      className={`w-9 h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isCurrent 
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                          : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                disabled={currentPage === totalPages || loading} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-rose-300 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* MODALES INTEGRADOS */}
      <ModalCliente 
        isOpen={modalClienteOpen} 
        onClose={() => setModalClienteOpen(false)} 
        mode={mode} 
        formData={clientForm} 
        onCreate={async (d) => { 
          const { id, ...newClientData } = d;
          await supabase.from("clients").insert([newClientData]); 
          loadData(); 
        }} 
        onUpdate={async (d) => { 
          if (d.id) {
            await supabase.from("clients").update(d).eq("id", d.id);
          } else {
            await supabase.from("clients").update(d).eq("celular", d.celular);
          }
          loadData(); 
        }} 
      />

      <ModalEspecialista 
        isOpen={modalEspecialistaOpen} 
        onClose={() => setModalEspecialistaOpen(false)} 
        mode={mode === "view" ? "edit" : mode}
        formData={specialistForm} 
        onSave={async (data: any) => { 
          if (mode === "edit") await supabase.from("app_users").update(data).eq("id", data.id); 
          else await supabase.from("app_users").insert([{...data, role: 'ESPECIALISTA'}]); 
          setModalEspecialistaOpen(false); 
          loadData(); 
        }} 
      />

      <ModalServicio 
        isOpen={modalServicioOpen} 
        onClose={() => setModalServicioOpen(false)} 
        mode={mode === "view" ? "edit" : mode as "create" | "edit"} 
        formData={serviceForm} 
        onSave={async (data) => {
          if (mode === "edit" && data.id) {
            const { error } = await supabase.from("services").update(data).eq("id", data.id);
            if (error) throw error;
          } else {
            const { id, ...newService } = data;
            const { error } = await supabase.from("services").insert([newService]);
            if (error) throw error;
          }
          loadData();
        }} 
      />
    </main>
  );
}