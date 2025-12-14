
"use client";

import ReservasChat from "@/components/chat/ReservasChat";

interface Props {
  currentDate: Date;
  onDateChange: (d: Date) => void;
  children?: React.ReactNode; // 👈 CLAVE
}


export default function AgendaSidebar({
  currentDate,
  onDateChange,
}: Props) {
  return (
    <div className="flex h-full w-[320px] flex-col border-r bg-white">

      {/* MINI CALENDARIO */}
      <div className="shrink-0 p-4 border-b">
        <div className="text-xs text-zinc-500 mb-2">diciembre 2025</div>

        <input
          type="date"
          value={currentDate.toISOString().slice(0, 10)}
          onChange={e => onDateChange(new Date(e.target.value))}
          className="w-full rounded-md border px-2 py-1 text-sm"
        />
      </div>

      {/* CHAT DE RESERVAS */}
      <div className="flex-1 min-h-0">
        <ReservasChat />
      </div>
    </div>
  );
}

