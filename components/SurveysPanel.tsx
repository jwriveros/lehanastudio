"use client";

type Survey = {
  id: string;
  rating: number; // 1 a 5
};

interface SurveysPanelProps {
  surveys?: Survey[];
}

export default function SurveysPanel({ surveys }: SurveysPanelProps) {
  // ⛑️ Fallback seguro
  const safeSurveys: Survey[] = surveys ?? [];

  // ⭐ Promedio de calificación
  const averageRating =
    safeSurveys.length > 0
      ? (
          safeSurveys.reduce<number>((acc, survey) => acc + survey.rating, 0) /
          safeSurveys.length
        ).toFixed(1)
      : "—";

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-600 mb-2">
        Encuestas de satisfacción
      </h3>

      <p className="text-3xl font-semibold">{averageRating}</p>
      <p className="text-xs text-gray-400">
        Calificación promedio (últimas encuestas)
      </p>
    </div>
  );
}
