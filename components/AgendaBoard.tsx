import { appointments, appointmentStatuses } from "@/lib/mockData";

const statusStyles: Record<
  (typeof appointmentStatuses)[number],
  { badge: string; surface: string; border: string }
> = {
  CONFIRMED: {
    badge: "bg-emerald-100 text-emerald-800",
    surface: "bg-emerald-50/60 dark:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  PENDING: {
    badge: "bg-amber-100 text-amber-800",
    surface: "bg-amber-50/60 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  CANCELLED: {
    badge: "bg-rose-100 text-rose-700",
    surface: "bg-rose-50/60 dark:bg-rose-900/30",
    border: "border-rose-200 dark:border-rose-800/60",
  },
  "NO SHOW": {
    badge: "bg-red-100 text-red-700",
    surface: "bg-red-50/60 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800/60",
  },
  COMPLETED: {
    badge: "bg-indigo-100 text-indigo-700",
    surface: "bg-indigo-50/60 dark:bg-indigo-900/30",
    border: "border-indigo-200 dark:border-indigo-800/60",
  },
};

export function AgendaBoard() {
  return (
    <section id="agenda" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-500">Agenda</p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Gestiona reservas, cambia especialista y confirma por chat</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <button className="rounded-full border border-zinc-200 px-3 py-2 text-zinc-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-200">
            Filtros
          </button>
          <button className="rounded-full border border-zinc-200 px-3 py-2 text-zinc-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-200">
            Vista diaria
          </button>
          <button className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-200">
            Vista semanal
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-50">Agenda semanal</div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">Arrastrar y reprogramar</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">Cambiar especialista</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">Confirmar por chat</span>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3 md:grid-cols-2">
          {appointments.map((appointment) => {
            const style = statusStyles[appointment.estado];
            return (
              <article
                key={appointment.id}
                className={`flex h-full flex-col gap-2 rounded-2xl border p-4 shadow-sm ${style.surface} ${style.border}`}
                style={{ borderLeft: `4px solid ${appointment.bg_color}` }}
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">{appointment.servicio}</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>{appointment.estado}</span>
                </div>

                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  {appointment.fecha} · {appointment.hora}
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-200">
                  {appointment.cliente} · {appointment.celular}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-zinc-700 dark:text-zinc-200">
                  <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900/70 dark:ring-zinc-700">
                    Dr. {appointment.especialista}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900/70 dark:ring-zinc-700">
                    Sede: {appointment.sede}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900/70 dark:ring-zinc-700">
                    ${appointment.price}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 shadow-sm ring-1 ${
                      appointment.is_paid
                        ? "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100"
                        : "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-100"
                    }`}
                  >
                    {appointment.is_paid ? "Pagado" : "Pendiente"}
                  </span>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-300">{appointment.notas}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
        Estados válidos: {appointmentStatuses.join(", ")}. Conecta Supabase Realtime para drag & drop y n8n para confirmar o mover
        citas desde el chat.
      </div>
    </section>
  );
}
