"use client";

import { type FormEvent, useMemo, useState } from "react";

import { appointments, clients as initialClients, sampleUsers, services as initialServices } from "@/lib/mockData";

type TabKey = "clients" | "services" | "specialists";

type ClientForm = {
  Nombre: string;
  Celular: string;
  numberc: string;
  Direccion: string;
  notes: string;
  Tipo: string;
  Cumpleaños: string;
};

type ServiceForm = {
  Servicio: string;
  category: string;
  Precio: number;
  duracion: number;
  SKU: string;
};

type SpecialistForm = {
  name: string;
  email: string;
  color: string;
  password: string;
};

const tabs: { key: TabKey; label: string; description: string }[] = [
  { key: "clients", label: "Clientes", description: "Gestiona fichas y contactos" },
  { key: "services", label: "Servicios", description: "Catálogo y precios" },
  { key: "specialists", label: "Especialistas", description: "Equipo y roles" },
];

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("clients");
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState<null | TabKey>(null);

  const [clients, setClients] = useState(initialClients);
  const [services, setServices] = useState(initialServices);
  const [specialists, setSpecialists] = useState(
    sampleUsers.filter((user) => user.role === "SPECIALIST")
  );

  const [clientForm, setClientForm] = useState<ClientForm>(() => ({
    Nombre: "",
    Celular: "",
    numberc: `C${(initialClients.length + 1).toString().padStart(3, "0")}`,
    Direccion: "",
    notes: "",
    Tipo: "Nuevo",
    Cumpleaños: "",
  }));

  const [serviceForm, setServiceForm] = useState<ServiceForm>(() => ({
    Servicio: "",
    category: "",
    Precio: 0,
    duracion: 60,
    SKU: `SK-${(initialServices.length + 1).toString().padStart(3, "0")}`,
  }));

  const [specialistForm, setSpecialistForm] = useState<SpecialistForm>({
    name: "",
    email: "",
    color: "#6366f1",
    password: "demo123",
  });

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const term = search.toLowerCase();
        return (
          client.Nombre.toLowerCase().includes(term) ||
          client.Celular.toLowerCase().includes(term)
        );
      }),
    [clients, search]
  );

  const filteredServices = useMemo(
    () =>
      services.filter((service) => {
        const term = search.toLowerCase();
        return (
          service.Servicio.toLowerCase().includes(term) ||
          service.SKU.toLowerCase().includes(term) ||
          service.category.toLowerCase().includes(term)
        );
      }),
    [services, search]
  );

  const filteredSpecialists = useMemo(
    () =>
      specialists.filter((specialist) => {
        const term = search.toLowerCase();
        return (
          specialist.name.toLowerCase().includes(term) ||
          specialist.email.toLowerCase().includes(term)
        );
      }),
    [specialists, search]
  );

  const closeModal = () => setModal(null);

  const handleClientSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClients((prev) => [
      {
        ...clientForm,
        "Cumpleaños": clientForm.Cumpleaños,
        lastIncomingAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setSuccess("Cliente guardado");
    setClientForm((prev) => ({
      ...prev,
      Nombre: "",
      Celular: "",
      Direccion: "",
      notes: "",
      numberc: `C${(clients.length + 2).toString().padStart(3, "0")}`,
      Cumpleaños: "",
    }));
    closeModal();
  };

  const handleServiceSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServices((prev) => [
      {
        ...serviceForm,
      },
      ...prev,
    ]);
    setSuccess("Servicio guardado");
    setServiceForm((prev) => ({
      ...prev,
      Servicio: "",
      category: "",
      Precio: 0,
      SKU: `SK-${(services.length + 2).toString().padStart(3, "0")}`,
    }));
    closeModal();
  };

  const handleSpecialistSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSpecialists((prev) => [
      {
        id: crypto.randomUUID(),
        name: specialistForm.name,
        email: specialistForm.email,
        avatar_url: "https://i.pravatar.cc/80",
        role: "SPECIALIST",
        color: specialistForm.color,
        password: specialistForm.password,
      },
      ...prev,
    ]);
    setSuccess("Especialista guardado");
    setSpecialistForm({ name: "", email: "", color: "#10b981", password: "demo123" });
    closeModal();
  };

  return (
    <section className="space-y-5 rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Mi negocio</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Submenú por módulo y creación rápida en modales.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200">
          CRUD listo
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-2 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearch("");
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "clients"
                ? "Buscar cliente por nombre o celular"
                : activeTab === "services"
                  ? "Buscar servicio o SKU"
                  : "Buscar especialista"
            }
            className="w-72 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            onClick={() => setModal(activeTab)}
            type="button"
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            {activeTab === "clients"
              ? "Nuevo cliente"
              : activeTab === "services"
                ? "Nuevo servicio"
                : "Nuevo especialista"}
          </button>
        </div>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-100">
          {success}
        </div>
      ) : null}

      {activeTab === "clients" ? (
        <ClientList clients={filteredClients} />
      ) : activeTab === "services" ? (
        <ServiceList services={filteredServices} />
      ) : (
        <SpecialistList specialists={filteredSpecialists} />
      )}

      {modal === "clients" && (
        <EntityModal title="Nuevo cliente" onClose={closeModal}>
          <form className="space-y-4" onSubmit={handleClientSubmit}>
            <LabeledInput
              label="Nombre"
              required
              value={clientForm.Nombre}
              onChange={(value) => setClientForm((prev) => ({ ...prev, Nombre: value }))}
            />
            <LabeledInput
              label="Celular"
              required
              value={clientForm.Celular}
              onChange={(value) => setClientForm((prev) => ({ ...prev, Celular: value }))}
            />
            <LabeledInput
              label="Dirección"
              value={clientForm.Direccion}
              onChange={(value) => setClientForm((prev) => ({ ...prev, Direccion: value }))}
            />
            <LabeledInput
              label="Cumpleaños"
              type="date"
              value={clientForm.Cumpleaños}
              onChange={(value) => setClientForm((prev) => ({ ...prev, Cumpleaños: value }))}
            />
            <LabeledInput
              label="Notas"
              textarea
              value={clientForm.notes}
              onChange={(value) => setClientForm((prev) => ({ ...prev, notes: value }))}
            />
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Tipo</span>
              <select
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                value={clientForm.Tipo}
                onChange={(e) => setClientForm((prev) => ({ ...prev, Tipo: e.target.value }))}
              >
                <option>Nuevo</option>
                <option>VIP</option>
                <option>Frecuente</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2 text-sm font-semibold">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-white shadow hover:bg-indigo-700"
              >
                Guardar cliente
              </button>
            </div>
          </form>
        </EntityModal>
      )}

      {modal === "services" && (
        <EntityModal title="Nuevo servicio" onClose={closeModal}>
          <form className="space-y-4" onSubmit={handleServiceSubmit}>
            <LabeledInput
              label="Servicio"
              required
              value={serviceForm.Servicio}
              onChange={(value) => setServiceForm((prev) => ({ ...prev, Servicio: value }))}
            />
            <LabeledInput
              label="Categoría"
              value={serviceForm.category}
              onChange={(value) => setServiceForm((prev) => ({ ...prev, category: value }))}
            />
            <LabeledInput
              label="Precio"
              type="number"
              value={serviceForm.Precio.toString()}
              onChange={(value) => setServiceForm((prev) => ({ ...prev, Precio: Number(value) }))}
            />
            <LabeledInput
              label="Duración (min)"
              type="number"
              value={serviceForm.duracion.toString()}
              onChange={(value) => setServiceForm((prev) => ({ ...prev, duracion: Number(value) }))}
            />
            <LabeledInput
              label="SKU"
              value={serviceForm.SKU}
              onChange={(value) => setServiceForm((prev) => ({ ...prev, SKU: value }))}
            />
            <div className="flex gap-3 pt-2 text-sm font-semibold">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-white shadow hover:bg-indigo-700"
              >
                Guardar servicio
              </button>
            </div>
          </form>
        </EntityModal>
      )}

      {modal === "specialists" && (
        <EntityModal title="Nuevo especialista" onClose={closeModal}>
          <form className="space-y-4" onSubmit={handleSpecialistSubmit}>
            <LabeledInput
              label="Nombre"
              required
              value={specialistForm.name}
              onChange={(value) => setSpecialistForm((prev) => ({ ...prev, name: value }))}
            />
            <LabeledInput
              label="Correo"
              value={specialistForm.email}
              onChange={(value) => setSpecialistForm((prev) => ({ ...prev, email: value }))}
            />
            <LabeledInput
              label="Contraseña"
              type="password"
              value={specialistForm.password}
              onChange={(value) => setSpecialistForm((prev) => ({ ...prev, password: value }))}
            />
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div>
                <div className="font-semibold text-zinc-800 dark:text-zinc-100">Color calendario</div>
                <p className="text-xs text-zinc-500">Define el color de sus citas.</p>
              </div>
              <input
                type="color"
                value={specialistForm.color}
                onChange={(e) => setSpecialistForm((prev) => ({ ...prev, color: e.target.value }))}
                className="h-10 w-16 rounded"
              />
            </div>
            <div className="flex gap-3 pt-2 text-sm font-semibold">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-white shadow hover:bg-indigo-700"
              >
                Guardar especialista
              </button>
            </div>
          </form>
        </EntityModal>
        )}
      </section>
  );
}

type ClientListProps = {
  clients: typeof initialClients;
};

function ClientList({ clients }: ClientListProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {clients.map((client) => (
        <article
          key={client.numberc}
          className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{client.Nombre}</div>
              <p className="text-sm text-zinc-500">{client.Celular} · #{client.numberc}</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-900/30">
              {client.Tipo}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <div>Dirección: {client.Direccion || "-"}</div>
            <div>Cumpleaños: {client["Cumpleaños"] || "-"}</div>
            <div>Último msg: {new Date(client.lastIncomingAt).toLocaleString()}</div>
            <div>Notas: {client.notes || "-"}</div>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">Historial de citas</div>
            <div className="flex flex-wrap gap-2">
              {appointments
                .filter((appt) => appt.cliente === client.Nombre)
                .map((appt) => (
                  <span
                    key={appt.id}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {appt.servicio} · {appt.estado}
                  </span>
                ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

type ServiceListProps = {
  services: typeof initialServices;
};

function ServiceList({ services }: ServiceListProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {services.map((service) => (
        <article
          key={service.SKU}
          className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{service.Servicio}</div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
              SKU {service.SKU}
            </span>
          </div>
          <p className="text-sm text-zinc-500">Categoría: {service.category || "N/A"}</p>
          <div className="mt-2 flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-200">
            <span>Duración: {service.duracion} min</span>
            <span className="font-semibold">${service.Precio}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Configura especialistas por servicio y colores en Supabase.</p>
        </article>
      ))}
    </div>
  );
}

type SpecialistListProps = {
  specialists: typeof sampleUsers;
};

function SpecialistList({ specialists }: SpecialistListProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {specialists.map((user) => (
        <article
          key={user.id}
          className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full border-4" style={{ borderColor: user.color }} />
            <div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{user.name}</div>
              <p className="text-sm text-zinc-500">{user.email}</p>
              <p className="text-xs text-zinc-500">Color calendario: {user.color}</p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Citas agendadas</div>
            <div className="flex flex-wrap gap-2">
              {appointments
                .filter((appt) => appt.especialista === user.name)
                .map((appt) => (
                  <span
                    key={appt.id}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {appt.servicio} · {appt.estado}
                  </span>
                ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

type EntityModalProps = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

function EntityModal({ title, children, onClose }: EntityModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
            <p className="text-xs text-zinc-500">Completa la información y guarda.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 p-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type LabeledInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  required?: boolean;
  type?: string;
};

function LabeledInput({ label, value, onChange, textarea, required, type = "text" }: LabeledInputProps) {
  return (
    <label className="block space-y-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
      <span>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          type={type}
          className="w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
      )}
    </label>
  );
}
