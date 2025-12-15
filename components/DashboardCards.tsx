"use client";

type DashboardStats = {
  dailyStatus: {
    citasHoy: number;
    ingresosHoy: number;
    pendientesConfirmar: number;
  };
};

interface DashboardCardsProps {
  dashboardStats?: DashboardStats; // ⬅️ ahora opcional
}

export default function DashboardCards({
  dashboardStats,
}: DashboardCardsProps) {
  // ⛑️ Fallback seguro
  const safeStats = dashboardStats ?? {
    dailyStatus: {
      citasHoy: 0,
      ingresosHoy: 0,
      pendientesConfirmar: 0,
    },
  };

  const kpiCards = [
    {
      label: "Citas hoy",
      value: safeStats.dailyStatus.citasHoy,
      hint: "Agenda confirmada",
    },
    {
      label: "Ingresos hoy",
      value: `$${safeStats.dailyStatus.ingresosHoy}`,
      hint: "Pagos registrados",
    },
    {
      label: "Pendientes",
      value: safeStats.dailyStatus.pendientesConfirmar,
      hint: "Por confirmar",
    },
    {
      label: "Ticket promedio",
      value: "$185",
      hint: "Últimos 30 días",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpiCards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className="text-2xl font-semibold mt-1">{card.value}</p>
          <p className="text-xs text-gray-400 mt-1">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
