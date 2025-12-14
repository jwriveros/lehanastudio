"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  currentDate: Date;
  onChange: (date: Date) => void;
}

export default function MiniCalendar({ currentDate, onChange }: Props) {
  return (
    <div className="px-4 py-3">
      <div className="text-xs font-semibold text-zinc-500 mb-2">
        {format(currentDate, "MMMM yyyy", { locale: es })}
      </div>

      <input
        type="date"
        value={format(currentDate, "yyyy-MM-dd")}
        onChange={e => onChange(new Date(e.target.value))}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}
