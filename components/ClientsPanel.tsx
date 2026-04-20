"use client";
import React, { useState, useEffect, useCallback } from "react";
import ModalCliente from "@/app/(app)/business/ModalCliente";
import { Search, ChevronRight, User, Loader2, X, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

/* ======================
    TYPES
====================== */
type Client = {
  numberc: string;
  Nombre: string;
  Celular: string;
  Tipo: string;
  Direccion: string;
  Cumpleaños: string;
  lastIncomingAt: string;
  notes: string;
};

export default function ClientsPanel() {
  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const ITEMS_PER_PAGE = 12;

  // --- LÓGICA DE CARGA (SUPABASE SERVER-SIDE) ---
  const fetchClients = useCallback(async (page: number, search: string) => {
    setLoading(true);
    
    // Calculamos el rango para la base de datos
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      let query = supabase
        .from("clients")
        .select("*", { count: "exact" })
        .order("Nombre", { ascending: true })
        .range(from, to);

      // Si el usuario escribe algo, filtramos en el servidor
      if (search.trim() !== "") {
        query = query.or(`Nombre.ilike.%${search}%,Celular.ilike.%${search}%,numberc.ilike.%${search}%`);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setClients(data as Client[] || []);
      setTotalCount(count || 0);

    } catch (error) {
      console.error("Error en búsqueda de clientes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto: Cuando cambia la búsqueda, volvemos a la página 1 y consultamos
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchClients(1, searchTerm);
    }, 500); // Debounce de 500ms
    return () => clearTimeout(timer);
  }, [searchTerm, fetchClients]);

  // Efecto: Cuando cambia la página, consultamos
  useEffect(() => {
    fetchClients(currentPage, searchTerm);
  }, [currentPage, fetchClients, searchTerm]);

  // Cálculos de navegación
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <section id="clients" className="space-y-6">
      {/* HEADER Y BUSCADOR MEJORADO */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">
            Directorio de Clientes
          </h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {loading ? "Sincronizando..." : `Mostrando ${clients.length} de ${totalCount} registros`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-10 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm"
              placeholder="Buscar por nombre o celular en toda la DB..."
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GRID DE RESULTADOS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-[2.5rem]">
             <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
        )}

        {clients.length === 0 && !loading ? (
          <div className="col-span-full py-20 text-center text-zinc-400 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] font-black uppercase italic text-xs">
            No se encontraron clientes para "{searchTerm}"
          </div>
        ) : (
          clients.map((client) => (
            <article
              key={client.numberc}
              onClick={() => setSelectedClient(client)}
              className="group cursor-pointer rounded-[2rem] border border-zinc-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-500 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-indigo-500 transition-all shadow-inner">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tighter text-zinc-900 dark:text-white leading-tight">
                      {client.Nombre}
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                      {client.Celular || "N/A"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-[9px] font-black uppercase text-indigo-700">
                  {client.Tipo || 'CLIENTE'}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between text-[10px] font-black text-zinc-400 italic uppercase tracking-[0.2em]">
                <span>Ver Ficha Técnica</span>
                <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ChevronRight size={14} />
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* --- SISTEMA DE PAGINACIÓN --- */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-[2rem] gap-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">
          Página <span className="text-indigo-600">{currentPage}</span> de <span className="text-zinc-600 dark:text-zinc-200">{totalPages || 1}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-3 rounded-xl bg-white dark:bg-zinc-800 border dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} className="text-zinc-600 dark:text-zinc-300" />
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              // Lógica para mostrar páginas dinámicas
              let pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              if (pageNum <= 0) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-xl font-black text-[11px] transition-all ${
                    currentPage === pageNum 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'bg-white dark:bg-zinc-800 border dark:border-zinc-700 text-zinc-500'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-3 rounded-xl bg-white dark:bg-zinc-800 border dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-50 transition-all shadow-sm"
          >
            <ChevronRight size={20} className="text-zinc-600 dark:text-zinc-300" />
          </button>
        </div>

        <div className="text-[9px] font-black text-zinc-400 uppercase italic">
          Total: {totalCount.toLocaleString()} clientes
        </div>
      </div>

      {/* MODAL DEL CLIENTE */}
      {selectedClient && (
        <ModalCliente 
          isOpen={!!selectedClient} 
          onClose={() => setSelectedClient(null)} 
          mode="view"
          formData={{
            nombre: selectedClient.Nombre,
            celular: selectedClient.Celular,
            tipo: selectedClient.Tipo || "Cliente",
            estado: "Activo",
            indicador: "+57",
            direccion: selectedClient.Direccion || "",
            cumpleanos: selectedClient.Cumpleaños || "",
            municipio: "", identificacion: "", correo_electronico: "", genero: "", departamento: ""
          }}
          onCreate={async () => {}} 
          onUpdate={async () => {}} 
        />
      )}
    </section>
  );
}