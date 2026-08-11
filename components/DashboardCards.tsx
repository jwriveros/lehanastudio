"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// 1. Actualizamos los tipos de datos para reflejar el nuevo contador
type DashboardStats = {
  citasHoy: number;
  ingresosHoy: number;
  pendientesConfirmar: number;
  canceladasHoy: number; 
};

export default function DashboardCards() {
  const [stats, setStats] = useState<DashboardStats>({
    citasHoy: 0,
    ingresosHoy: 0,
    pendientesConfirmar: 0,
    canceladasHoy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      setLoading(true);
      try {
        const hoy = new Date();
        const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0).toISOString();
        const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

        // 2. Optimizamos la consulta: Ahora solo pedimos las citas de HOY
        const { data: appointments, error } = await supabase
          .from("appointments")
          .select("id, appointment_id, appointment_at, estado, price")
          .gte("appointment_at", inicioHoy)
          .lte("appointment_at", finHoy);

        if (error) throw error;

        let citasHoyCount = 0;
        let ingresosHoySum = 0;
        let pendientesCount = 0;
        let canceladasCount = 0; // 3. Iniciamos el contador de canceladas en cero

        appointments?.forEach((appt) => {
          const precio = Number(appt.price) || 0;

          // Como la base de datos solo nos devolvió citas de hoy, contamos todas aquí
          citasHoyCount++;

          // Evaluamos los estados de las citas
          if (appt.estado === "Cita pagada") {
            ingresosHoySum += precio;
          }
          if (appt.estado === "Nueva reserva creada") {
            pendientesCount++;
          }
          if (appt.estado === "Cita cancelada") {
            // Aumentamos el contador si la cita fue cancelada
            canceladasCount++;
          }
        });

        // Guardamos los resultados en el estado
        setStats({
          citasHoy: citasHoyCount,
          ingresosHoy: ingresosHoySum,
          pendientesConfirmar: pendientesCount,
          canceladasHoy: canceladasCount,
        });

      } catch (error) {
        console.error("Error al obtener los datos del Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // 4. Actualizamos el arreglo de tarjetas para mostrar la nueva métrica
  const kpiCards = [
    {
      label: "Citas hoy",
      value: loading ? "..." : stats.citasHoy,
      hint: "Agendadas para hoy",
    },
    {
      label: "Ingresos hoy",
      value: loading ? "..." : formatCurrency(stats.ingresosHoy),
      hint: "Pagos registrados hoy",
    },
    {
      label: "Pendientes",
      value: loading ? "..." : stats.pendientesConfirmar,
      hint: "Por confirmar hoy",
    },
    {
      label: "Citas canceladas",
      value: loading ? "..." : stats.canceladasHoy,
      hint: "Canceladas hoy",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpiCards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/50"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
          <p className="text-2xl font-semibold mt-1 text-gray-900 dark:text-white">
            {card.value}
          </p>
          <p className="text-xs text-gray-400 mt-1">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}