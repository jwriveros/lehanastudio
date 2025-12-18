"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ModalCliente from "./ModalCliente";
import ModalEspecialista from "./ModalEspecialista";
import { Search, Plus, Trash2, Edit3 } from "lucide-react";

type TabKey = "clients" | "services" | "specialists";

// EXPORTAMOS EL TIPO PARA QUE EL MODAL LO LEA
export type ClientePayload = {
  celular: string;
  nombre: string;
  tipo: string;
  direccion?: string;
  cumpleanos?: string;
  identificacion?: string;
  correo_electronico?: string;
  estado: string;
  genero?: string;
  indicador: string;
  departamento?: string;
  municipio?: string;
};

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("clients");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [modalEspecialistaOpen, setModalEspecialistaOpen] = useState(false);
  
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [specialistForm, setSpecialistForm] = useState<any>({});
  const [clientForm, setClientForm] = useState<ClientePayload>({
    celular: "", nombre: "", tipo: "Cliente", estado: "Activo", indicador: "+57"
  });

  const loadData = async () => {
    setLoading(true);
    const { data: cData } = await supabase.from("clients").select("*").limit(100);
    if (cData) setClients(cData);
    const { data: sData } = await supabase.from("services").select("*");
    if (sData) setServices(sData);
    const { data: uData } = await supabase.from("app_users").select("id, name, email, color, comision_base, excepciones_comision, password");
    if (uData) setSpecialists(uData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // LÓGICA DE CLIENTES
  const handleCreateCliente = async (data: ClientePayload) => {
    const { error } = await supabase.from("clients").insert([data]);
    if (error) alert(error.message);
    else loadData();
  };

  const handleUpdateCliente = async (data: ClientePayload) => {
    const { error } = await supabase.from("clients").update(data).eq("celular", data.celular);
    if (error) alert(error.message);
    else loadData();
  };

  // LÓGICA DE ESPECIALISTAS
  const handleSaveEspecialista = async (data: any) => {
    const payload = {
      name: data.name, email: data.email, color: data.color, 
      password: data.password || "", comision_base: data.comision_base, 
      excepciones_comision: data.excepciones_comision, role: 'ESPECIALISTA'
    };
    if (mode === "edit") await supabase.from("app_users").update(payload).eq("id", data.id);
    else await supabase.from("app_users").insert([payload]);
    setModalEspecialistaOpen(false);
    loadData();
  };

  const filteredRows = useMemo(() => {
    const t = search.toLowerCase();
    if (activeTab === "clients") return clients.filter(c => (c.nombre || "").toLowerCase().includes(t));
    if (activeTab === "services") return services.filter(s => (s.Servicio || "").toLowerCase().includes(t));
    return specialists.filter(s => (s.name || "").toLowerCase().includes(t));
  }, [search, activeTab, clients, services, specialists]);

  const openEdit = (tab: TabKey, item: any) => {
  setMode("edit");
  if (tab === "clients") {
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
  } else if (tab === "specialists") {
    setSpecialistForm(item);
    setModalEspecialistaOpen(true);
  }
};

  return (
    <main className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 min-h-screen text-zinc-900 dark:text-zinc-100">
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase italic">Mi Negocio</h1>
          <p className="text-xs text-zinc-500 font-medium">Gestión administrativa y de equipo.</p>
        </div>
        <nav className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border dark:border-zinc-700">
          {(["clients", "services", "specialists"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                activeTab === tab ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-400 hover:text-zinc-500"
              }`}
            >
              {tab === "clients" ? "Clientes" : tab === "services" ? "Servicios" : "Equipo"}
            </button>
          ))}
        </nav>
      </header>

      <section className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-2 pl-10 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all"
          />
        </div>
        <button
          onClick={() => {
            setMode("create");
            if (activeTab === "clients") {
              setClientForm({ celular: "", nombre: "", tipo: "Cliente", estado: "Activo", indicador: "+57" });
              setModalClienteOpen(true);
            } else if (activeTab === "specialists") {
              setSpecialistForm({ name: "", email: "", password: "", color: "#6366f1", comision_base: 50 });
              setModalEspecialistaOpen(true);
            }
          }}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <Plus size={16} /> Añadir {activeTab === "specialists" ? "Especialista" : activeTab === "clients" ? "Cliente" : "Servicio"}
        </button>
      </section>

      <section className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800 text-[9px] font-bold uppercase tracking-wider text-zinc-500 border-b dark:border-zinc-700">
              <tr>
                <th className="px-6 py-4">Identificador</th>
                <th className="px-6 py-4">Información</th>
                <th className="px-6 py-4">Configuración</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-zinc-800 text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-xs text-zinc-400 italic">Sincronizando...</td></tr>
              ) : filteredRows.map((item, idx) => (
                <tr key={idx} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {activeTab === "specialists" && <div className="h-6 w-6 rounded-md" style={{ backgroundColor: item.color }} />}
                      <div>
                        <div className="font-bold">{item.nombre || item.name || item.Servicio}</div>
                        <div className="text-[9px] text-zinc-400">{item.SKU || item.celular || item.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs text-zinc-500 italic">
                    {activeTab === "services" ? `${item.duracion} min` : (item.direccion || item.email || "—")}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800">
                      {activeTab === "specialists" ? `${item.comision_base || 50}%` : (item.Precio ? `$${item.Precio}` : (item.tipo || item.category))}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEdit(activeTab, item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"><Edit3 size={14} /></button>
                      <button className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ModalCliente 
        isOpen={modalClienteOpen} 
        onClose={() => setModalClienteOpen(false)} 
        mode={mode} 
        formData={clientForm} 
        onCreate={handleCreateCliente} 
        onUpdate={handleUpdateCliente} 
      />

      <ModalEspecialista 
        isOpen={modalEspecialistaOpen} 
        onClose={() => setModalEspecialistaOpen(false)} 
        mode={mode} 
        formData={specialistForm} 
        onSave={handleSaveEspecialista} 
      />
    </main>
  );
}