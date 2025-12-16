"use client";

import ReservasChat from "@/components/chat/ReservasChat";
import { Plus } from "lucide-react";
import { useUIStore } from "@/lib/uiStore";

interface Props {
  collapsed: boolean;
}

export default function AgendaSidebar({ collapsed }: Props) {
  const openReservationDrawer = useUIStore(
    (state) => state.openReservationDrawer
  );

  // Si está colapsado, retornamos null para que no ocupe espacio ni renderice nada
  if (collapsed) return null;

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* BOTÓN CREAR RESERVA */}
      <div className="shrink-0 p-3 border-b bg-white">
        <button 
          onClick={() => openReservationDrawer()}
          className="
            flex items-center justify-center gap-1.5
            w-fit
            rounded-lg
            bg-indigo-600 text-white
            hover:bg-indigo-700 transition-colors
            h-10
            text-sm
            px-4
            shadow-sm
            active:scale-95
          "
        >
          <Plus size={18} />
          <span className="font-medium whitespace-nowrap">
            Crear Reserva
          </span>
        </button>
      </div>

      {/* CHAT DE RESERVAS */}
      <div className="flex-1 min-h-0 overflow-hidden bg-zinc-50/30">
        <ReservasChat />
      </div>
    </div>
  );
}