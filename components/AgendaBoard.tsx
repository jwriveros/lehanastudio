import { appointments, appointmentStatuses } from "../lib/mockData";

export function AgendaBoard() {
  return (
    <section id="agenda" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Agenda semanal</h2>
          <p className="text-sm text-zinc-500">Arrastrar, reprogramar y cambiar especialista</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-indigo-700">Añadir reserva</button>
          <button className="rounded-xl border border-zinc-200 px-3 py-2 text-zinc-600">Vista diaria</button>
          <button className="rounded-xl border border-zinc-200 px-3 py-2 text-zinc-600">Vista semanal</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {appointments.map((appointment) => (
          <article
            key={appointment.id}
            className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            style={{ borderLeft: `4px solid ${appointment.bg_color}` }}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">{appointment.servicio}</div>
              <StatusPill status={appointment.estado} />
            </div>
            <div className="mt-2 text-sm text-zinc-500">{appointment.fecha} · {appointment.hora}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">{appointment.cliente} · {appointment.celular}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                {appointment.especialista}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                Sede: {appointment.sede}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                ${appointment.price}
              </span>
              <span className={`rounded-full px-3 py-1 ${appointment.is_paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {appointment.is_paid ? "Pagado" : "Pendiente"}
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-500">{appointment.notas}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
        El calendario está listo para conectarse a Supabase Realtime para drag & drop y a n8n para confirmaciones automáticas.
        Los estados válidos son: {appointmentStatuses.join(", ")}
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    CONFIRMED: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-amber-100 text-amber-800",
    CANCELLED: "bg-rose-100 text-rose-700",
    "NO SHOW": "bg-red-100 text-red-700",
    COMPLETED: "bg-indigo-100 text-indigo-700",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status] ?? "bg-zinc-100 text-zinc-600"}`}>{status}</span>;
}
