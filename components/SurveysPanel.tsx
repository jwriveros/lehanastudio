"use client";

import { MessageSquare, Smile, Frown } from "lucide-react";

type Survey = {
  id: string | number;
  calificacion: string; // "Muy satisfecho" o "Insatisfecho"
};

interface SurveysPanelProps {
  surveys?: Survey[];
}

export default function SurveysPanel({ surveys }: SurveysPanelProps) {
  const safeSurveys: Survey[] = surveys ?? [];

  // Calculamos cuántos están felices basándonos en el texto de tu BD
  const satisfiedCount = safeSurveys.filter(s => 
    s.calificacion?.toLowerCase().includes("muy satisfecho")
  ).length;

  const total = safeSurveys.length;
  const percentage = total > 0 ? Math.round((satisfiedCount / total) * 100) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
          <MessageSquare size={14} className="text-indigo-500" /> Detalle de Encuestas
        </h3>
        {percentage !== null && (
          <span className={`text-xs font-black px-2 py-1 rounded-lg ${percentage >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {percentage}% Felicidad
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-center py-6 text-zinc-400 text-xs italic font-medium">No se han recibido encuestas en este periodo.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Smile size={16} />
              <span className="text-[10px] font-black uppercase">Satisfechos</span>
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{satisfiedCount}</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <Frown size={16} />
              <span className="text-[10px] font-black uppercase">Insatisfechos</span>
            </div>
            <p className="text-2xl font-black text-red-700 dark:text-red-400">{total - satisfiedCount}</p>
          </div>
        </div>
      )}
      
      <p className="text-[9px] text-zinc-400 font-bold uppercase text-center italic">
        Total de encuestas procesadas: {total}
      </p>
    </div>
  );
}