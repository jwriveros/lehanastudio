
export function SpecialistsPanel() {
  return (
    <section id="specialists" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Especialistas</h2>
          <p className="text-sm text-zinc-500">Perfil, color en calendario y servicios asignados</p>
        </div>
        <button className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">Nuevo especialista</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sampleUsers
          .filter((user) => user.role === "SPECIALIST")
          .map((user) => (
            <article key={user.id} className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full border-4" style={{ borderColor: user.color }} />
                <div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{user.name}</div>
                  <p className="text-sm text-zinc-500">Color calendario: {user.color}</p>
                </div>
              </div>

              <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                Servicios asignados y comisiones configurables en Supabase. Conecta esta tarjeta a la tabla `app_users` para
                controlar roles y colores.
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Citas agendadas</div>
                <div className="flex flex-wrap gap-2">
                  {appointments
                    .filter((appt) => appt.especialista === user.name)
                    .map((appt) => (
                      <span key={appt.id} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                        {appt.servicio} · {appt.estado}
                      </span>
                    ))}
                </div>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
