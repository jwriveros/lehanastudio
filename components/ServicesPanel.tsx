
export function ServicesPanel() {
  return (
    <section id="services" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Servicios</h2>
          <p className="text-sm text-zinc-500">Administra categorías, duración y precios</p>
        </div>
        <button className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">Nuevo servicio</button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {services.map((service) => (
          <article key={service.SKU} className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{service.Servicio}</div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">SKU {service.SKU}</span>
            </div>
            <p className="text-sm text-zinc-500">Categoría: {service.category}</p>
            <div className="mt-2 flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-200">
              <span>Duración: {service.duracion} min</span>
              <span className="font-semibold">${service.Precio}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Configura especialistas por servicio y colores en Supabase.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
