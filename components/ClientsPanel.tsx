"use client";

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

/* ======================
   COMPONENT
====================== */
export default function ClientsPanel({
  clients,
  appointments,
  surveys,
}: ClientsPanelProps) {
  // ⛑️ Fallbacks seguros
  const safeClients: Client[] = clients ?? [];
  const safeAppointments: Appointment[] = appointments ?? [];
  const safeSurveys: Survey[] = surveys ?? [];

  return (
    <section id="clients" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Clientes
          </h2>
          <p className="text-sm text-zinc-500">
            Búsqueda por nombre, celular, numberc o servicio más usado
          </p>
        </div>

        <div className="flex gap-2 text-sm">
          <input
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Buscar por nombre o celular"
          />
          <button className="rounded-xl border border-zinc-200 px-3 py-2 text-zinc-600">
            Filtrar
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {safeClients.length === 0 && (
          <div className="text-sm text-zinc-400">
            No hay clientes registrados.
          </div>
        )}

        {safeClients.map((client) => (
          <article
            key={client.numberc}
            className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {client.Nombre}
                </div>
                <p className="text-sm text-zinc-500">
                  {client.Celular} · #{client.numberc}
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-900/30">
                {client.Tipo}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <div>Dirección: {client.Direccion}</div>
              <div>Cumpleaños: {client.Cumpleaños}</div>
              <div>
                Último msg:{" "}
                {new Date(client.lastIncomingAt).toLocaleString()}
              </div>
              <div>Notas: {client.notes}</div>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                Historial de citas
              </div>
              <div className="flex flex-wrap gap-2">
                {safeAppointments
                  .filter((a) => a.cliente === client.Nombre)
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

            <div className="mt-3 space-y-2 text-sm">
              <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                Encuestas
              </div>

              {safeSurveys
                .filter((survey) => survey.cliente === client.Nombre)
                .map((survey) => (
                  <div
                    key={survey.id}
                    className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {survey.servicio}: {survey.score}/10 ·{" "}
                    {survey.comentario}
                  </div>
                ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
