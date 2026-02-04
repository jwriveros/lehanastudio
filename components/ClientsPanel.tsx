"use client";
import React, { useState, useMemo } from "react";
import ModalCliente from "@/app/(app)/business/ModalCliente";
import { Search, Filter, ChevronRight, User } from "lucide-react";

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

type Appointment = {
  id: string | number;
  cliente: string;
  servicio: string;
  estado: string;
};

type Survey = {
  id: string | number;
  cliente: string;
  servicio: string;
  score: number;
  comentario: string;
};

interface ClientsPanelProps {
  clients?: Client[];
  appointments?: Appointment[];
  surveys?: Survey[];
}

export default function ClientsPanel({
  clients = [],
  appointments = [],
  surveys = [],
}: ClientsPanelProps) {
  // --- ESTADOS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(12); 
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // --- LÓGICA DE FILTRO ---
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const search = searchTerm.toLowerCase();
      return (
        (c.Nombre || "").toLowerCase().includes(search) ||
        (c.Celular || "").includes(search) ||
        (c.numberc || "").includes(search)
      );
    });
  }, [clients, searchTerm]);

  const visibleClients = filteredClients.slice(0, limit);

  return (
    <section id="clients" className="space-y-6">
      {/* HEADER Y BUSCADOR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">
            Clientes
          </h2>
          <p className="text-sm text-zinc-500">
            Haz clic en un cliente para ver sus fichas técnicas e historial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setLimit(12); // Resetear límite al buscar
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-900"
              placeholder="Buscar por nombre o celular..."
            />
          </div>
        </div>
      </div>

      {/* GRID DE CLIENTES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleClients.length === 0 ? (
          <div className="col-span-full py-20 text-center text-zinc-400 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl font-bold italic">
            No se encontraron clientes con "{searchTerm}"
          </div>
        ) : (
          visibleClients.map((client) => (
            <article
              key={client.numberc}
              onClick={() => setSelectedClient(client)}
              className="group cursor-pointer rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 group-hover:text-indigo-500 transition-colors">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {client.Nombre}
                    </h3>
                    <p className="text-xs font-bold text-zinc-400">
                      {client.Celular}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase text-indigo-700 dark:bg-indigo-900/30">
                  {client.Tipo || 'CLIENTE'}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-bold text-zinc-500 italic uppercase tracking-widest">
                <span>Ver Fichas / Citas</span>
                <ChevronRight size={16} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </article>
          ))
        )}
      </div>

      {/* BOTÓN CARGAR MÁS */}
      {filteredClients.length > limit && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setLimit(prev => prev + 12)}
            className="rounded-full bg-zinc-900 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-transform active:scale-95 dark:bg-white dark:text-zinc-900 shadow-xl"
          >
            Cargar más clientes ({filteredClients.length - limit})
          </button>
        </div>
      )}

      {/* MODAL DEL CLIENTE - CONFIGURADO PARA VER FICHAS */}
      {selectedClient && (
        <ModalCliente 
          isOpen={!!selectedClient} 
          onClose={() => setSelectedClient(null)} 
          mode="view" // Usamos 'view' para que el modal sepa que es solo consulta
          formData={{
            nombre: selectedClient.Nombre,
            celular: selectedClient.Celular,
            tipo: selectedClient.Tipo || "Cliente",
            estado: "Activo",
            indicador: "+57",
            direccion: selectedClient.Direccion || "",
            cumpleanos: selectedClient.Cumpleaños || "",
            // Los campos opcionales para evitar el error de TS
            municipio: "",
            identificacion: "",
            correo_electronico: "",
            genero: "",
            departamento: ""
          }}
          onCreate={async () => {}} 
          onUpdate={async () => {}} 
        />
      )}
    </section>
  );
}