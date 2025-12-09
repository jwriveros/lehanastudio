"use client";

import { useMemo, useState } from "react";

import {
  appointments,
  clients as mockClients,
  sampleUsers,
  services as mockServices,
} from "@/lib/mockData";

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

  const [clients, setClients] = useState<ClientForm[]>(() =>
    mockClients.map((client) => ({
      Nombre: client.Nombre,
      Celular: client.Celular,
      Tipo: client.Tipo,
      numberc: client.numberc,
      Direccion: client.Direccion,
      Cumpleaños: client["Cumpleaños"],
      notes: client.notes,
    }))
  );

  const [services, setServices] = useState<ServiceForm[]>(() =>
    mockServices.map((service) => ({
      Servicio: service.Servicio,
      category: service.category,
      Precio: service.Precio,
      duracion: service.duracion,
      SKU: service.SKU,
    }))
  );

  const [specialists, setSpecialists] = useState<SpecialistForm[]>(() =>
    sampleUsers
      .filter((user) => user.role === "SPECIALIST")
      .map((user) => ({ id: user.id, name: user.name, email: user.email, color: user.color }))
  );

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
    setSpecialistForm({ id: crypto.randomUUID(), name: "", email: "", color: "#10b981" });
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

  const handleDelete = (tab: TabKey, id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

    if (tab === "clients") setClients((prev) => prev.filter((c) => c.numberc !== id));
    if (tab === "services") setServices((prev) => prev.filter((s) => s.SKU !== id));
    if (tab === "specialists") setSpecialists((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = () => {
    if (formTab === "clients") {
      if (!clientForm.Nombre || !clientForm.Celular) return alert("Completa nombre y celular");
      setClients((prev) => {
        if (mode === "edit") return prev.map((c) => (c.numberc === editingId ? { ...clientForm } : c));
        return [...prev, { ...clientForm }];
      });
    }

    if (formTab === "services") {
      if (!serviceForm.Servicio) return alert("Agrega el nombre del servicio");
      setServices((prev) => {
        if (mode === "edit") return prev.map((s) => (s.SKU === editingId ? { ...serviceForm } : s));
        return [...prev, { ...serviceForm }];
      });
    }

    if (formTab === "specialists") {
      if (!specialistForm.name || !specialistForm.email) return alert("Completa nombre y correo del especialista");
      setSpecialists((prev) => {
        if (mode === "edit") return prev.map((s) => (s.id === editingId ? { ...specialistForm } : s));
        return [...prev, { ...specialistForm }];
      });
    }

    setIsFormOpen(false);
  };

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase();
    if (activeTab === "clients")
      return clients.filter(
        (client) =>
          client.Nombre.toLowerCase().includes(term) ||
          client.Celular.toLowerCase().includes(term) ||
          client.numberc.toLowerCase().includes(term)
      );
    if (activeTab === "services")
      return services.filter(
        (service) =>
          service.Servicio.toLowerCase().includes(term) ||
          service.category.toLowerCase().includes(term) ||
          service.SKU.toLowerCase().includes(term)
      );
    return specialists.filter(
      (specialist) => specialist.name.toLowerCase().includes(term) || specialist.email.toLowerCase().includes(term)
    );
  }, [activeTab, clients, search, services, specialists]);

  const renderRows = () => {
    if (activeTab === "clients")
      return filteredRows.map((client) => (
        <tr key={client.numberc} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
          <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{client.Nombre}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{client.Celular}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{client.Tipo}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{client.numberc}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{client.Direccion}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{client.Cumpleaños}</td>
          <td className="px-4 py-3 text-right text-sm">
            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                onClick={() => setSelectedClientId(client.numberc)}
              >
                Ver ficha
              </button>
              <button className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-indigo-950/30" onClick={() => openEdit("clients", client.numberc)}>
                Editar
              </button>
              <button className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30" onClick={() => handleDelete("clients", client.numberc)}>
                Eliminar
              </button>
            </div>
          </td>
        </tr>
      ));

    if (activeTab === "services")
      return filteredRows.map((service: ServiceForm) => (
        <tr key={service.SKU} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
          <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{service.Servicio}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{service.category}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{service.duracion} min</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">${service.Precio}</td>
          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{service.SKU}</td>
          <td className="px-4 py-3 text-right text-sm">
            <div className="flex justify-end gap-2">
              <button className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-indigo-950/30" onClick={() => openEdit("services", service.SKU)}>
                Editar
              </button>
              <button className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30" onClick={() => handleDelete("services", service.SKU)}>
                Eliminar
              </button>
            </div>
          </td>
        </tr>
      ));

    return (filteredRows as SpecialistForm[]).map((specialist) => (
      <tr key={specialist.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
        <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{specialist.name}</td>
        <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{specialist.email}</td>
        <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: specialist.color }} />
            {specialist.color}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-sm">
          <div className="flex justify-end gap-2">
            <button className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-indigo-950/30" onClick={() => openEdit("specialists", specialist.id)}>
              Editar
            </button>
            <button className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30" onClick={() => handleDelete("specialists", specialist.id)}>
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <section className="space-y-5 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Mi negocio</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Clientes, especialistas y servicios en un solo panel.</p>
        </div>
        <nav className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/70 p-1 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`${
                activeTab === tab.key
                  ? "bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300"
              } rounded-xl px-3 py-2 font-semibold transition`}
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

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{tabs.find((tab) => tab.key === activeTab)?.label}</p>
            <p className="text-sm text-zinc-500">{tabs.find((tab) => tab.key === activeTab)?.helper}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              onClick={() => openCreate(activeTab)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              + Añadir
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
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
                    <th className="px-4 py-2">Cumpleaños</th>
                  </>
                )}
                {activeTab === "services" && (
                  <>
                    <th className="px-4 py-2">Servicio</th>
                    <th className="px-4 py-2">Categoría</th>
                    <th className="px-4 py-2">Duración</th>
                    <th className="px-4 py-2">Precio</th>
                    <th className="px-4 py-2">SKU</th>
                  </>
                )}
                {activeTab === "specialists" && (
                  <>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Correo</th>
                    <th className="px-4 py-2">Color</th>
                  </>
                )}
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
          {filteredRows.length === 0 && <p className="px-4 py-6 text-sm text-zinc-500">Sin resultados para esta búsqueda.</p>}
        </div>
      </div>

      {isFormOpen ? (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/30">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-100">{mode === "create" ? "Añadir" : "Editar"} {tabs.find((tab) => tab.key === formTab)?.label}</p>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-200/80">Completa los campos y guarda el cambio.</p>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="rounded-full px-3 py-1 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100 dark:text-indigo-100 dark:hover:bg-indigo-900"
            >
              Cerrar
            </button>
          </div>

          {formTab === "clients" && (
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Nombre
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={clientForm.Nombre}
                  onChange={(e) => setClientForm({ ...clientForm, Nombre: e.target.value })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Celular
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={clientForm.Celular}
                  onChange={(e) => setClientForm({ ...clientForm, Celular: e.target.value })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Tipo
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={clientForm.Tipo}
                  onChange={(e) => setClientForm({ ...clientForm, Tipo: e.target.value })}
                  placeholder="VIP / Nuevo"
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Código
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={clientForm.numberc}
                  onChange={(e) => setClientForm({ ...clientForm, numberc: e.target.value })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Dirección
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={clientForm.Direccion}
                  onChange={(e) => setClientForm({ ...clientForm, Direccion: e.target.value })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Cumpleaños
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={clientForm.Cumpleaños}
                  onChange={(e) => setClientForm({ ...clientForm, Cumpleaños: e.target.value })}
                />
              </label>
              <label className="md:col-span-3 text-sm text-zinc-700 dark:text-zinc-200">
                Notas
                <textarea
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  rows={2}
                />
              </label>
            </div>
          )}

          {formTab === "services" && (
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Servicio
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={serviceForm.Servicio}
                  onChange={(e) => setServiceForm({ ...serviceForm, Servicio: e.target.value })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Categoría
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Precio
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={serviceForm.Precio}
                  onChange={(e) => setServiceForm({ ...serviceForm, Precio: Number(e.target.value) })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Duración (min)
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={serviceForm.duracion}
                  onChange={(e) => setServiceForm({ ...serviceForm, duracion: Number(e.target.value) })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                SKU
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={serviceForm.SKU}
                  onChange={(e) => setServiceForm({ ...serviceForm, SKU: e.target.value })}
                />
              </label>
            </div>
          )}

          {formTab === "specialists" && (
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Nombre
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={specialistForm.name}
                  onChange={(e) => setSpecialistForm({ ...specialistForm, name: e.target.value })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Correo
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={specialistForm.email}
                  onChange={(e) => setSpecialistForm({ ...specialistForm, email: e.target.value })}
                />
              </label>
              <label className="text-sm text-zinc-700 dark:text-zinc-200">
                Color
                <input
                  type="color"
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
                  value={specialistForm.color}
                  onChange={(e) => setSpecialistForm({ ...specialistForm, color: e.target.value })}
                />
              </label>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : null}

      {selectedClientId ? (
        <ClientDetailModal
          client={clients.find((c) => c.numberc === selectedClientId)}
          onClose={() => setSelectedClientId("")}
        />
      ) : null}
    </section>
  );
}

type ClientDetailModalProps = {
  client?: ClientForm;
  onClose: () => void;
};

function ClientDetailModal({ client, onClose }: ClientDetailModalProps) {
  if (!client) return null;

  const clientAppointments = appointments.filter((appt) => appt.cliente === client.Nombre);
  const pastServices = clientAppointments.map((appt) => ({
    servicio: appt.servicio,
    especialista: appt.especialista,
    fecha: appt.fecha,
    hora: appt.hora,
    estado: appt.estado,
    is_paid: appt.is_paid,
    price: appt.price,
  }));

  const serviceSummary = Array.from(
    pastServices.reduce((map, item) => {
      map.set(item.servicio, (map.get(item.servicio) || 0) + 1);
      return map;
    }, new Map<string, number>())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-500">Ficha del cliente</p>
            <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{client.Nombre}</h3>
            <p className="text-sm text-zinc-500">{client.Tipo} · Código {client.numberc}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Cerrar
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Ficha técnica</p>
            <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              <li><span className="font-semibold">Celular:</span> {client.Celular}</li>
              <li><span className="font-semibold">Dirección:</span> {client.Direccion}</li>
              <li><span className="font-semibold">Cumpleaños:</span> {client.Cumpleaños}</li>
              <li><span className="font-semibold">Notas:</span> {client.notes || "Sin notas"}</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Servicios tomados</p>
            {serviceSummary.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Aún sin historial.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                {serviceSummary.map(([service, count]) => (
                  <li key={service} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/60">
                    <span>{service}</span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">{count}x</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Pagos</p>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
                <span>Pagadas</span>
                <span className="font-semibold">{pastServices.filter((s) => s.is_paid).length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
                <span>Pendientes</span>
                <span className="font-semibold">{pastServices.filter((s) => !s.is_paid).length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Historial de reservas</p>
              <p className="text-sm text-zinc-500">Últimas atenciones y estado de pago</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-100">
              {pastServices.length} reservas
            </span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Hora</th>
                  <th className="px-3 py-2 text-left">Servicio</th>
                  <th className="px-3 py-2 text-left">Especialista</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Pago</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {pastServices.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-center text-sm text-zinc-500" colSpan={7}>
                      Sin reservas registradas para este cliente.
                    </td>
                  </tr>
                ) : (
                  pastServices.map((appt, index) => (
                    <tr key={`${appt.fecha}-${index}`} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                      <td className="px-3 py-2 text-zinc-800 dark:text-zinc-100">{appt.fecha}</td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{appt.hora}</td>
                      <td className="px-3 py-2 text-zinc-800 dark:text-zinc-100">{appt.servicio}</td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{appt.especialista}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-100">
                          {appt.estado}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            appt.is_paid
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-100"
                          }`}
                        >
                          {appt.is_paid ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-800 dark:text-zinc-100">${appt.price}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
