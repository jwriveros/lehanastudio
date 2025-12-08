import Image from "next/image";

import { progressEntries } from "../lib/mockData";

export function ProgressPanel() {
  return (
    <section id="progress" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Progreso del cliente</h2>
          <p className="text-sm text-zinc-500">Fotos antes/después, firma del especialista y notas clínicas</p>
        </div>
        <button className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">Subir evidencia</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {progressEntries.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Cita #{entry.appointment_id}</div>
                <p className="text-sm text-zinc-500">{entry.client_phone}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{entry.notes}</p>
            <div className="mt-3 flex gap-2">
              {entry.images.map((img, index) => (
                <Image
                  key={index}
                  src={img}
                  alt="progreso"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-xl object-cover"
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Guardar en `client_progress` con `storage` de Supabase. Incluye firma del especialista y PDF adjuntos según
              necesidad.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
