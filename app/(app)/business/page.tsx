"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ModalCliente from "./ModalCliente";

// Tipos
type TabKey = "clients" | "services" | "specialists";

type ClientForm = {
  celular: string;     // <- ESTE ES EL ID REAL
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
  numberc?: string;
  notas?: string;
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

export type ClientePayload = {
  tipo: string;
  nombre: string;
  identificacion?: string;
  correo_electronico?: string;
  estado: string;
  genero?: string;
  indicador: string;
  celular: string;
  direccion?: string;
  cumpleanos?: string;
  departamento?: string;
  municipio?: string;
  numberc?: string;
  notas?: string;
};

const tabs = [
  { key: "clients", label: "Clientes", helper: "Busca por nombre, celular o código" },
  { key: "services", label: "Servicios", helper: "Gestiona duración y precios" },
  { key: "specialists", label: "Especialistas", helper: "Edita disponibilidad y color" },
] as const;

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("clients");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalClienteOpen, setModalClienteOpen] = useState(false);

  const [clients, setClients] = useState<ClientForm[]>([]);
  const [services, setServices] = useState<ServiceForm[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistForm[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [formTab, setFormTab] = useState<TabKey>("clients");
  const [editingId, setEditingId] = useState<string>("");

  const [clientForm, setClientForm] = useState<ClientForm>({
  celular: "",
  nombre: "",
  tipo: "General",
  direccion: "",
  cumpleanos: "",
  identificacion: "",
  correo_electronico: "",
  estado: "activo",
  genero: "",
  indicador: "+57",
  departamento: "",
  municipio: "",
  notas: "",
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

  // Mapeo DB → Cliente
  const mapDBToClient = (c: any): ClientForm => ({
  celular: c.celular,
  nombre: c.nombre,
  tipo: c.tipo,
  direccion: c.direccion || "",
  cumpleanos: c.cumpleanos || "",
  identificacion: c.identificacion || "",
  correo_electronico: c.correo_electronico || "",
  estado: c.estado || "activo",
  genero: c.genero || "",
  indicador: c.indicador || "+57",
  departamento: c.departamento || "",
  municipio: c.municipio || "",
});


  const mapDBToService = (s: any): ServiceForm => ({
    Servicio: s.Servicio,
    category: s.category,
    Precio: Number(s.Precio),
    duracion: Number(s.duracion),
    SKU: s.SKU,
  });

  const mapDBToSpecialist = (u: any): SpecialistForm => ({
    id: u.id,
    name: u.name,
    email: u.email,
    color: u.color,
  });

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data: clientsData } = await supabase.from("clients").select("*");
      if (clientsData) setClients(clientsData.map(mapDBToClient));

      const { data: servicesData } = await supabase.from("services").select("*");
      if (servicesData) setServices(servicesData.map(mapDBToService));

      const { data: specialistsData } = await supabase.from("app_users").select("*");
      if (specialistsData) setSpecialists(specialistsData.map(mapDBToSpecialist));

      setLoading(false);
    };

    loadData();
  }, []);

  // Crear cliente
  const handleCreateCliente = async (data: ClientePayload) => {
    const { data: inserted, error } = await supabase
      .from("clients")
      .insert([data])
      .select();

    if (error) {
      alert(error.message);
      return;
    }

    if (inserted && inserted[0]) {
      setClients((prev) => [...prev, mapDBToClient(inserted[0])]);
    }
  };

  // Editar cliente
  const openEdit = (tab: TabKey, id: string) => {
  setMode("edit");
  setFormTab(tab);

  if (tab === "clients") {
  const found = clients.find(c => c.celular === id);
  if (found) {
    setEditingId(id);
    setClientForm(found);
    setModalClienteOpen(true);
  }
  return;
}
  

  // servicios
  if (tab === "services") {
    const found = services.find(s => s.SKU === id);
    if (found) {
      setServiceForm(found);
      setIsFormOpen(true);
    }
    return;
  }

  // especialistas
  if (tab === "specialists") {
    const found = specialists.find(s => s.id === id);
    if (found) {
      setSpecialistForm(found);
      setIsFormOpen(true);
    }
  }
};


  // Eliminar registro
  const handleDelete = async (tab: TabKey, id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;

    if (tab === "clients") {
      await supabase.from("clients").delete().eq("celular", id);
      setClients(prev => prev.filter(c => c.celular !== id));
    }

    if (tab === "services") {
      await supabase.from("services").delete().eq("SKU", id);
      setServices((prev) => prev.filter((s) => s.SKU !== id));
    }

    if (tab === "specialists") {
      await supabase.from("app_users").delete().eq("id", id);
      setSpecialists((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Filtrado
  const filteredRows = useMemo(() => {
    const t = search.toLowerCase();

    if (activeTab === "clients")
      return clients.filter(
        (c) =>
          c.nombre.toLowerCase().includes(t) ||
          c.celular.includes(t)
      );

    if (activeTab === "services")
      return services.filter(
        (s) =>
          s.Servicio.toLowerCase().includes(t) ||
          s.category.toLowerCase().includes(t)
      );

    return specialists.filter(
      (s) => s.name.toLowerCase().includes(t) || s.email.toLowerCase().includes(t)
    );
  }, [search, activeTab, clients, services, specialists]);
  // Render de filas según tab activo
  const renderRows = () => {
    if (activeTab === "clients") {
      return (filteredRows as ClientForm[]).map((client, idx) => (
        <tr
          key={client.celular || `client-${idx}`}
          className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
        >
          <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {client.nombre}
          </td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            {client.celular}
          </td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            {client.tipo}
          </td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            {client.celular}
          </td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            {client.direccion}
          </td>
          <td className="px-4 py-3 text-right text-sm">
            <button
              className="rounded px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              onClick={() => openEdit("clients", client.celular)}

            >
              Editar
            </button>
            <button
              className="ml-2 rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              onClick={() => handleDelete("clients", client.celular)}
            >
              Eliminar
            </button>
          </td>
        </tr>
      ));
    }

    if (activeTab === "services") {
      return (filteredRows as ServiceForm[]).map((service, idx) => (
        <tr
          key={service.SKU || `service-${idx}`}
          className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
        >
          <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {service.Servicio}
          </td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            {service.category}
          </td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            {service.duracion} min
          </td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
            ${service.Precio}
          </td>
          <td className="px-4 py-3 text-right text-sm">
            <button
              className="rounded px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              onClick={() => openEdit("services", service.SKU)}
            >
              Editar
            </button>
            <button
              className="ml-2 rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              onClick={() => handleDelete("services", service.SKU)}
            >
              Eliminar
            </button>
          </td>
        </tr>
      ));
    }

    // specialists
    return (filteredRows as SpecialistForm[]).map((sp, idx) => (
      <tr
        key={sp.id || `specialist-${idx}`}
        className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
      >
        <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {sp.name}
        </td>
        <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
          {sp.email}
        </td>
        <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
          <span
            className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
            style={{ backgroundColor: sp.color }}
          />
          {sp.color}
        </td>
        <td className="px-4 py-3 text-right text-sm">
          <button
            className="rounded px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
            onClick={() => openEdit("specialists", sp.id)}
          >
            Editar
          </button>
          <button
            className="ml-2 rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            onClick={() => handleDelete("specialists", sp.id)}
          >
            Eliminar
          </button>
        </td>
      </tr>
    ));
  };
  const handleUpdateCliente = async (data: ClientePayload) => {
  const { error } = await supabase
    .from("clients")
    .update(data)
    .eq("celular", editingId);

  if (error) {
    alert(error.message);
    return;
  }

  // actualizar en memoria
  setClients(prev =>
    prev.map(c => (c.celular === editingId ? mapDBToClient(data) : c))
  );

  setModalClienteOpen(false);
};


  return (
    <>
      {/* CONTENEDOR PRINCIPAL */}
      <section className="space-y-5 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
        {/* HEADER */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Mi negocio
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Gestiona clientes, servicios y especialistas desde un solo lugar.
            </p>
          </div>

          {/* TABS */}
          <nav className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/70 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`rounded-xl px-3 py-2 font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-zinc-600"
                }`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearch("");
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {/* BUSCADOR + BOTÓN AÑADIR */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, celular, servicio..."
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              {tabs.find((t) => t.key === activeTab)?.helper}
            </p>
          </div>

          <button
            onClick={() => {
              if (activeTab === "clients") {
                setMode("create");
                setModalClienteOpen(true);
              } else {
                setMode("create");
                setFormTab(activeTab);
                setIsFormOpen(true);
              }
            }}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 sm:mt-0"
          >
            + Añadir
          </button>
        </div>

        {/* TABLA */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
          {loading ? (
            <p className="p-4 text-sm text-indigo-500">Cargando datos...</p>
          ) : (
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                  {activeTab === "clients" && (
                    <>
                      <th className="px-4 py-2">Nombre</th>
                      <th className="px-4 py-2">Celular</th>
                      <th className="px-4 py-2">Tipo</th>
                      <th className="px-4 py-2">Código</th>
                      <th className="px-4 py-2">Dirección</th>
                    </>
                  )}

                  {activeTab === "services" && (
                    <>
                      <th className="px-4 py-2">Servicio</th>
                      <th className="px-4 py-2">Categoría</th>
                      <th className="px-4 py-2">Min</th>
                      <th className="px-4 py-2">Precio</th>
                    </>
                  )}

                  {activeTab === "specialists" && (
                    <>
                      <th className="px-4 py-2">Nombre</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Color</th>
                    </>
                  )}

                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>{renderRows()}</tbody>
            </table>
          )}

          {!loading && filteredRows.length === 0 && (
            <p className="p-4 text-sm text-zinc-500">
              Sin resultados para esta búsqueda.
            </p>
          )}
        </div>
      </section>

      {/* MODAL CLIENTE */}
      <ModalCliente
        isOpen={modalClienteOpen}
        onClose={() => setModalClienteOpen(false)}
        mode={mode}
        formData={clientForm}
        onCreate={handleCreateCliente}
        onUpdate={handleUpdateCliente}
      />
    </>
  );
}
