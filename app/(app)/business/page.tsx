// jwriveros/lehanastudio/lehanastudio-a8a570c007a1557a6ccd13baa5a39a3fe79a534a/app/(app)/business/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Tipos para el estado del formulario (Frontend)
type TabKey = "clients" | "services" | "specialists";

type ClientForm = {
  Nombre: string;
  Celular: string;
  Tipo: string;
  numberc: string;
  Direccion: string;
  Cumpleaños: string;
  notes?: string;
};

type ServiceForm = {
  Servicio: string;
  category: string;
  Precio: number;
  duracion: number;
  SKU: string;
};

type SpecialistForm = {
  id: string;
  name: string;
  email: string;
  color: string;
};

const tabs: { key: TabKey; label: string; helper: string }[] = [
  { key: "clients", label: "Clientes", helper: "Busca por nombre, celular o código" },
  { key: "services", label: "Servicios", helper: "Gestiona duración y precios" },
  { key: "specialists", label: "Especialistas", helper: "Edita disponibilidad y color" },
];

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("clients");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [clients, setClients] = useState<ClientForm[]>([]);
  const [services, setServices] = useState<ServiceForm[]>([]); 
  const [specialists, setSpecialists] = useState<SpecialistForm[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [formTab, setFormTab] = useState<TabKey>("clients");
  const [editingId, setEditingId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [clientForm, setClientForm] = useState<ClientForm>({
    Nombre: "",
    Celular: "",
    Tipo: "",
    numberc: "",
    Direccion: "",
    Cumpleaños: "",
    notes: "",
  });
  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    Servicio: "",
    category: "",
    Precio: 0,
    duracion: 0,
    SKU: "",
  });
  const [specialistForm, setSpecialistForm] = useState<SpecialistForm>({
    id: "",
    name: "",
    email: "",
    color: "#6366f1",
  });

  // --- MAPEO ROBUSTO (A prueba de mayúsculas/minúsculas) ---
  const mapDBToClient = (c: any): ClientForm => ({
    // Intenta leer la propiedad con mayúscula (DB original) o minúscula (estándar Supabase)
    Nombre: c.Nombre || c.nombre || 'Sin Nombre',
    Celular: String(c.Celular || c.celular || ''), 
    Tipo: c.Tipo || c.tipo || 'General',
    numberc: c.numberc || c.Numberc || '', // FIX: Lee numberc o Numberc
    Direccion: c['Dirección'] || c.direccion || c.Direccion || '', 
    Cumpleaños: c['Cumpleaños'] || c.cumpleanos || c.Cumpleanos || '',
    notes: c.Notas || c.notas || '', 
  });

  const mapDBToService = (s: any): ServiceForm => ({
    Servicio: s.Servicio || s.servicio || 'Nuevo Servicio',
    category: s.category || s.Categoria || 'General',
    Precio: Number(s.Precio || s.precio || 0),
    duracion: Number(s.duracion || s.Duracion || 0),
    SKU: s.SKU || s.sku || '',
  });

  const mapDBToSpecialist = (u: any): SpecialistForm => ({
    id: u.id,
    name: u.name || u.Nombre || 'Usuario',
    email: u.email || u.Email || '',
    color: u.color || u.Color || '#000000',
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      
      // 1. Clientes: Usamos select('*') para traer todo sin importar el nombre exacto de la columna
      const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*');
      
      if (clientsError) {
        console.error("Error fetching clients:", clientsError);
      } else if (clientsData) {
        console.log("Datos crudos de clientes:", clientsData); // FIX: Mira la consola para ver qué llega
        setClients(clientsData.map(mapDBToClient));
      }
      
      // 2. Servicios
      const { data: servicesData, error: servicesError } = await supabase.from('services').select('*');
      if (servicesError) console.error("Error fetching services:", servicesError);
      else if (servicesData) setServices(servicesData.map(mapDBToService));

      // 3. Especialistas
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .or('role.eq.SPECIALIST,role.eq.ESPECIALISTA'); // Soporta ambos roles

      if (usersError) console.error("Error fetching specialists:", usersError);
      else if (usersData) setSpecialists(usersData.map(mapDBToSpecialist));

      setLoading(false);
    };

    fetchInitialData();
  }, []);

  // --- ACCIONES DEL FORMULARIO ---
  const resetForms = () => {
    setClientForm({
      Nombre: "",
      Celular: "",
      Tipo: "",
      numberc: `C${String(clients.length + 1).padStart(3, "0")}`,
      Direccion: "",
      Cumpleaños: "",
      notes: "",
    });
    setServiceForm({ Servicio: "", category: "", Precio: 0, duracion: 0, SKU: `SK-${String(services.length + 1).padStart(3, "0")}` });
    setSpecialistForm({ id: Date.now().toString(), name: "", email: "", color: "#10b981" }); 
    setEditingId("");
  };

  const openCreate = (tab: TabKey) => {
    setMode("create");
    setFormTab(tab);
    resetForms();
    setIsFormOpen(true);
  };

  const openEdit = (tab: TabKey, id: string) => {
    setMode("edit");
    setFormTab(tab);
    setEditingId(id);

    if (tab === "clients") {
      const existing = clients.find((c) => c.numberc === id);
      if (existing) setClientForm(existing);
    }
    if (tab === "services") {
      const existing = services.find((s) => s.SKU === id);
      if (existing) setServiceForm(existing);
    }
    if (tab === "specialists") {
      const existing = specialists.find((s) => s.id === id);
      if (existing) setSpecialistForm(existing);
    }

    setIsFormOpen(true);
  };

  const handleDelete = async (tab: TabKey, id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

    if (tab === "clients") {
        const { error } = await supabase.from('clients').delete().eq('numberc', id);
        if (error) return alert("Error al eliminar");
        setClients((prev) => prev.filter((c) => c.numberc !== id));
    }
    if (tab === "services") {
        const { error } = await supabase.from('services').delete().eq('SKU', id);
        if (error) return alert("Error al eliminar");
        setServices((prev) => prev.filter((s) => s.SKU !== id));
    }
    if (tab === "specialists") {
        const { error } = await supabase.from('app_users').delete().eq('id', id);
        if (error) return alert("Error al eliminar");
        setSpecialists((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSubmit = async () => {
    if (formTab === "clients") {
      if (!clientForm.Nombre) return alert("Falta nombre");
      
      // Mapeo inverso para guardar (usamos nombres exactos de tu JSON)
      const payload = {
        "Nombre": clientForm.Nombre,
        "Celular": clientForm.Celular,
        "Tipo": clientForm.Tipo,
        "numberc": clientForm.numberc,
        "Dirección": clientForm.Direccion,
        "Cumpleaños": clientForm.Cumpleaños,
        "Notas": clientForm.notes
      };

      if (mode === "edit") {
        await supabase.from('clients').update(payload).eq('numberc', editingId);
        setClients((prev) => prev.map((c) => (c.numberc === editingId ? { ...clientForm } : c)));
      } else {
        const { data } = await supabase.from('clients').insert([payload]).select();
        if (data) setClients((prev) => [...prev, mapDBToClient(data[0])]);
      }
    }

    if (formTab === "services") {
       if (!serviceForm.Servicio) return alert("Falta nombre del servicio");
       const payload = { ...serviceForm }; 
       if (mode === "edit") {
        await supabase.from('services').update(payload).eq('SKU', editingId);
        setServices((prev) => prev.map((s) => (s.SKU === editingId ? { ...serviceForm } : s)));
       } else {
        const { data } = await supabase.from('services').insert([payload]).select();
        if (data) setServices((prev) => [...prev, mapDBToService(data[0])]);
       }
    }

    if (formTab === "specialists") {
       const payload = { ...specialistForm, role: 'ESPECIALISTA' };
       if (mode === "edit") {
        await supabase.from('app_users').update(payload).eq('id', editingId);
        setSpecialists((prev) => prev.map((s) => (s.id === editingId ? { ...specialistForm } : s)));
       } else {
        const { data } = await supabase.from('app_users').insert([payload]).select();
        if (data) setSpecialists((prev) => [...prev, mapDBToSpecialist(data[0])]);
       }
    }

    setIsFormOpen(false);
  };

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase();
    if (activeTab === "clients")
      return clients.filter(c => 
        (c.Nombre?.toLowerCase().includes(term)) || (c.Celular?.includes(term))
      );
    if (activeTab === "services")
      return services.filter(s => 
        (s.Servicio?.toLowerCase().includes(term)) || (s.category?.toLowerCase().includes(term))
      );
    return specialists.filter(s => 
        (s.name?.toLowerCase().includes(term)) || (s.email?.toLowerCase().includes(term))
    );
  }, [activeTab, search, clients, services, specialists]);

  const renderRows = () => {
    if (activeTab === "clients")
      // FIX: Añadido index como fallback key para evitar el error "Encountered two children with the same key"
      return (filteredRows as ClientForm[]).map((client, idx) => (
        <tr key={client.numberc || idx} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{client.Nombre}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{client.Celular}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{client.Tipo}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{client.numberc}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{client.Direccion}</td>
          <td className="px-4 py-3 text-right text-sm">
             <button className="rounded px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50" onClick={() => openEdit("clients", client.numberc)}>Editar</button>
             <button className="ml-2 rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50" onClick={() => handleDelete("clients", client.numberc)}>X</button>
          </td>
        </tr>
      ));

    if (activeTab === "services")
      return (filteredRows as ServiceForm[]).map((service, idx) => (
        <tr key={service.SKU || idx} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
           <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{service.Servicio}</td>
           <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{service.category}</td>
           <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{service.duracion} min</td>
           <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">${service.Precio}</td>
           <td className="px-4 py-3 text-right text-sm">
             <button className="rounded px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50" onClick={() => openEdit("services", service.SKU)}>Editar</button>
             <button className="ml-2 rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50" onClick={() => handleDelete("services", service.SKU)}>X</button>
           </td>
        </tr>
      ));

    return (filteredRows as SpecialistForm[]).map((sp, idx) => (
       <tr key={sp.id || idx} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
         <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{sp.name}</td>
         <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{sp.email}</td>
         <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            <span style={{backgroundColor: sp.color}} className="mr-2 inline-block h-3 w-3 rounded-full"/>
            {sp.color}
         </td>
         <td className="px-4 py-3 text-right text-sm">
            <button className="rounded px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50" onClick={() => openEdit("specialists", sp.id)}>Editar</button>
            <button className="ml-2 rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50" onClick={() => handleDelete("specialists", sp.id)}>X</button>
         </td>
       </tr>
    ));
  };

  return (
    <section className="space-y-5 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Mi negocio</h2></div>
        <nav className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/70 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`${activeTab === tab.key ? "bg-indigo-50 text-indigo-700" : "text-zinc-600"} rounded-xl px-3 py-2 font-semibold transition`}
              onClick={() => { setActiveTab(tab.key); setSearch(""); }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900" />
            <button onClick={() => openCreate(activeTab)} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500">+ Añadir</button>
        </div>
        <div className="overflow-x-auto">
          {loading ? <p className="p-4 text-sm text-indigo-500">Cargando datos...</p> : (
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                  {activeTab === "clients" && <><th className="px-4 py-2">Nombre</th><th className="px-4 py-2">Celular</th><th className="px-4 py-2">Tipo</th><th className="px-4 py-2">Código</th><th className="px-4 py-2">Dirección</th></>}
                  {activeTab === "services" && <><th className="px-4 py-2">Servicio</th><th className="px-4 py-2">Cat</th><th className="px-4 py-2">Min</th><th className="px-4 py-2">Precio</th></>}
                  {activeTab === "specialists" && <><th className="px-4 py-2">Nombre</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Color</th></>}
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>{renderRows()}</tbody>
            </table>
          )}
          {!loading && filteredRows.length === 0 && <p className="p-4 text-sm text-zinc-500">Sin resultados para esta búsqueda.</p>}
        </div>
      </div>
      
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">{mode === 'create' ? 'Crear' : 'Editar'} {tabs.find(t=>t.key===formTab)?.label}</h3>
                
                <div className="space-y-3">
                  {formTab === 'clients' && (
                    <>
                      <input className="w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="Nombre" value={clientForm.Nombre} onChange={e => setClientForm({...clientForm, Nombre: e.target.value})} />
                      <input className="w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="Celular" value={clientForm.Celular} onChange={e => setClientForm({...clientForm, Celular: e.target.value})} />
                      <input className="w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="Código (C001)" value={clientForm.numberc} onChange={e => setClientForm({...clientForm, numberc: e.target.value})} />
                      <input className="w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="Dirección" value={clientForm.Direccion} onChange={e => setClientForm({...clientForm, Direccion: e.target.value})} />
                    </>
                  )}
                  {formTab === 'services' && (
                    <>
                      <input className="w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="Servicio" value={serviceForm.Servicio} onChange={e => setServiceForm({...serviceForm, Servicio: e.target.value})} />
                      <input className="w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" type="number" placeholder="Precio" value={serviceForm.Precio} onChange={e => setServiceForm({...serviceForm, Precio: Number(e.target.value)})} />
                      <input className="w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="SKU" value={serviceForm.SKU} onChange={e => setServiceForm({...serviceForm, SKU: e.target.value})} />
                    </>
                  )}
                   {formTab === 'specialists' && (
                    <>
                      <input className="w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="Nombre" value={specialistForm.name} onChange={e => setSpecialistForm({...specialistForm, name: e.target.value})} />
                      <input className="w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" placeholder="Email" value={specialistForm.email} onChange={e => setSpecialistForm({...specialistForm, email: e.target.value})} />
                      <input className="h-10 w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" type="color" value={specialistForm.color} onChange={e => setSpecialistForm({...specialistForm, color: e.target.value})} />
                    </>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={() => setIsFormOpen(false)} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200">Cancelar</button>
                    <button onClick={handleSubmit} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Guardar</button>
                </div>
            </div>
        </div>
      )}
    </section>
  );
}