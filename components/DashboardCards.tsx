import { dashboardStats } from "@/lib/mockData";

const kpiCards = [
  { label: "Citas hoy", value: dashboardStats.dailyStatus.citasHoy, hint: "Agenda confirmada" },
  { label: "Ingresos hoy", value: `$${dashboardStats.dailyStatus.ingresosHoy}`, hint: "Pagos registrados" },
  { label: "Pendientes", value: dashboardStats.dailyStatus.pendientesConfirmar, hint: "Por confirmar" },
  { label: "Ticket promedio", value: "$185", hint: "Últimos 30 días" },
];

export function DashboardCards() {
  return (
    <div id="dashboard" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpiCards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="text-sm text-zinc-500">{card.label}</div>
          <div className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{card.value}</div>
          <div className="text-xs text-zinc-500">{card.hint}</div>
        </div>
      ))}

      <div className="col-span-full grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Ventas por mes"
          description="Ideal para conectar a Recharts con Supabase RPC"
          dataLabel="total"
          data={dashboardStats.monthlySales.map((item) => ({ label: item.month, value: item.total }))}
        />
        <ChartCard
          title="Servicios más vendidos"
          description="Hook listo para TanStack Query"
          dataLabel="servicio"
          data={dashboardStats.servicesRank.map((item) => ({ label: item.servicio, value: item.count }))}
        />
      </div>
    </div>
  );
}

type ChartProps = {
  title: string;
  description: string;
  data: { label: string; value: number }[];
  dataLabel: string;
};

function ChartCard({ title, description, data, dataLabel }: ChartProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-900/30">Recharts</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        {data.map((point) => (
          <div key={point.label} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-center dark:border-zinc-800 dark:bg-zinc-800">
            <div className="text-xs text-zinc-500">{point.label}</div>
            <div className="text-lg font-semibold">{point.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Conecta este bloque al endpoint RPC o view de Supabase que devuelva {"`{label, value}`"} y pásalo a Recharts. El label
        recomendado es {`"${dataLabel}"`}.
      </div>
    </div>
  );
}
