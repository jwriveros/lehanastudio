"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import ModalCliente from "./ModalCliente";
import ModalEspecialista from "./ModalEspecialista";
import { Search, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, Loader2, X, User } from "lucide-react";

type TabKey = "clients" | "services" | "specialists";

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("clients");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [modalEspecialistaOpen, setModalEspecialistaOpen] = useState(false);
  
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  
  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const ITEMS_PER_PAGE = 12;

  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [specialistForm, setSpecialistForm] = useState<any>({});
  const [clientForm, setClientForm] = useState<any>({
    celular: "", nombre: "", tipo: "Cliente", estado: "Activo", indicador: "+57"
  });

  // --- CARGA DE DATOS DESDE EL SERVIDOR ---
  const loadData = useCallback(async () => {
    setLoading(true);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      if (activeTab === "clients") {
        let query = supabase.from("clients").select("*", { count: "exact" }).order("nombre", { ascending: true }).range(from, to);
        if (search.trim()) {
          // Buscamos en 'nombre' y 'numberc' (que es texto). 
          // 'celular' es bigint, así que buscamos principalmente por nombre para evitar errores de tipo.
          query = query.or(`nombre.ilike.%${search}%,numberc.ilike.%${search}%`);
        }
        const { data, count } = await query;
        setClients(data || []);
        setTotalRecords(count || 0);
      } 
      else if (activeTab === "services") {
        let query = supabase.from("services").select("*", { count: "exact" }).order("Servicio", { ascending: true }).range(from, to);
        if (search.trim()) query = query.ilike("Servicio", `%${search}%`);
        const { data, count } = await query;
        setServices(data || []);
        setTotalRecords(count || 0);
      } 
      else {
        let query = supabase.from("app_users").select("*", { count: "exact" }).in("role", ["ESPECIALISTA", "SPECIALIST"]).range(from, to);
        if (search.trim()) query = query.ilike("name", `%${search}%`);
        const { data, count } = await query;
        setSpecialists(data || []);
        setTotalRecords(count || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, search]);

  useEffect(() => {
    const timer = setTimeout(() => { loadData(); }, 400);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Resetear a página 1 si cambias de pestaña o buscas
  useEffect(() => { setCurrentPage(1); }, [activeTab, search]);

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  const openClientModal = (item: any, selectedMode: "edit" | "view") => {
    setMode(selectedMode);
    setClientForm({
      celular: item.celular || "",
      nombre: item.nombre || "",
      tipo: item.tipo || "Cliente",
      direccion: item.direccion || "",
      cumpleanos: item.cumpleanos || "",
      identificacion: item.identificacion || "",
      correo_electronico: item.correo_electronico || "",
      estado: item.estado || "Activo",
      genero: item.genero || "",
      indicador: item.indicador || "+57",
      departamento: item.departamento || "",
      municipio: item.municipio || "",
    });
    setModalClienteOpen(true);
  };

  return (
    <main className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 min-h-screen text-zinc-900 dark:text-zinc-100 font-sans">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic leading-none">Mi Negocio</h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2 tracking-widest italic">
            {totalRecords} {activeTab === 'clients' ? 'Clientes' : activeTab === 'services' ? 'Servicios' : 'Especialistas'} registrados
          </p>
        </div>
        <nav className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border dark:border-zinc-700">
          {(["clients", "services", "specialists"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                activeTab === tab ? "bg-white dark:bg-zinc-700 shadow-md text-indigo-600" : "text-zinc-400 hover:text-zinc-500"
              }`}
            >
              {tab === "clients" ? "Clientes" : tab === "services" ? "Servicios" : "Equipo"}
            </button>
          ))}
        </nav>
      </header>

      <section className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar en ${activeTab === 'clients' ? 'Clientes' : activeTab === 'services' ? 'Servicios' : 'Equipo'}...`}
            className="w-full bg-white dark:bg-zinc-900 border-2 dark:border-zinc-800 p-3 pl-12 pr-10 rounded-[1.5rem] outline-none focus:border-indigo-500 text-sm font-bold shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
               <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setMode("create");
            if (activeTab === "clients") setModalClienteOpen(true);
            else if (activeTab === "specialists") setModalEspecialistaOpen(true);
          }}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Añadir
        </button>
      </section>

      <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border dark:border-zinc-800 shadow-2xl overflow-hidden relative">
        {loading && (
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        )}

        <div className="overflow-x-auto min-h-[450px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b dark:border-zinc-800">
              <tr>
                <th className="px-8 py-5">Identificador</th>
                <th className="px-8 py-5">Información</th>
                <th className="px-8 py-5">Configuración</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-zinc-800">
              {(activeTab === 'clients' ? clients : activeTab === 'services' ? services : specialists).map((item, idx) => (
                <tr 
                  key={idx} 
                  className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all cursor-pointer"
                  onClick={() => {
                    if (activeTab === "clients") openClientModal(item, "view");
                    else if (activeTab === "specialists") { setMode("edit"); setSpecialistForm(item); setModalEspecialistaOpen(true); }
                  }}
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-indigo-500 shadow-inner">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="font-black uppercase text-sm tracking-tighter">
                            {item.nombre || item.name || item.Servicio}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400">
                            {item.celular || item.email || item.SKU}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-xs font-medium text-zinc-500 italic">
                    {activeTab === "services" ? `${item.duracion} min` : (item.direccion || item.email || "—")}
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black bg-zinc-100 dark:bg-zinc-800 uppercase tracking-widest">
                      {activeTab === "specialists" ? `${item.comision_base || 50}% COM` : (item.Precio ? `$${Number(item.Precio).toLocaleString()}` : (item.tipo || item.category))}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <Edit3 size={16} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-all inline-block ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- SISTEMA DE PAGINACIÓN NUMÉRICA --- */}
        {totalPages > 1 && (
          <div className="p-6 border-t dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase text-zinc-400 italic">
              Página <span className="text-indigo-600">{currentPage}</span> de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-xl bg-white dark:bg-zinc-800 border dark:border-zinc-700 disabled:opacity-20 transition-all"><ChevronLeft size={20} /></button>
              <div className="flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  if (pageNum <= 0) return null;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-xl font-black text-[11px] transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-zinc-800 border dark:border-zinc-700 text-zinc-500'}`}>{pageNum}</button>
                  )
                })}
              </div>
              <button disabled={currentPage === totalPages || loading} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-xl bg-white dark:bg-zinc-800 border dark:border-zinc-700 disabled:opacity-20 transition-all"><ChevronRight size={20} /></button>
            </div>
          </div>
        )}
      </section>

      <ModalCliente isOpen={modalClienteOpen} onClose={() => setModalClienteOpen(false)} mode={mode} formData={clientForm} onCreate={async (d) => { await supabase.from("clients").insert([d]); loadData(); }} onUpdate={async (d) => { await supabase.from("clients").update(d).eq("celular", d.celular); loadData(); }} />
      <ModalEspecialista isOpen={modalEspecialistaOpen} onClose={() => setModalEspecialistaOpen(false)} mode={mode} formData={specialistForm} onSave={async (data: any) => { if (mode === "edit") await supabase.from("app_users").update(data).eq("id", data.id); else await supabase.from("app_users").insert([{...data, role: 'ESPECIALISTA'}]); setModalEspecialistaOpen(false); loadData(); }} />
    </main>
  );
}