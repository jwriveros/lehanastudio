import { surveys } from "@/lib/mockData";

export function SurveysPanel() {
  const average = (
    surveys.reduce((acc, survey) => acc + survey.score, 0) / (surveys.length || 1)
  ).toFixed(1);

  return (
    <section id="surveys" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Encuestas</h2>
          <p className="text-sm text-zinc-500">Promedio por servicio y alertas de clientes insatisfechos</p>
        </div>
        <div className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">Promedio: {average}/10</div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {surveys.map((survey) => (
          <article key={survey.id} className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{survey.servicio}</div>
              <span className={`rounded-full px-3 py-1 text-xs ${survey.score >= 9 ? "bg-emerald-100 text-emerald-800" : survey.score <= 7 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>
                {survey.score}/10
              </span>
            </div>
            <p className="text-sm text-zinc-500">Cliente: {survey.cliente}</p>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">{survey.comentario}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
