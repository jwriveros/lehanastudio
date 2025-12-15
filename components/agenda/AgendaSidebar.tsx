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
  return (
    <div className="flex h-full flex-col bg-white">
      {/* BOTÓN CREAR RESERVA */}
      <div className="shrink-0 p-3 border-b">
        <button onClick={() => openReservationDrawer()}
          className={`
            flex items-center justify-center gap-1.5
            w-1/2 mx-auto
            rounded-lg
            bg-indigo-600 text-white
            hover:bg-indigo-700 transition
            h-9
            text-sm
            ${collapsed ? "px-0" : "px-3"}
          `}
        >
          <Plus size={16} />
          {!collapsed && (
            <span className="font-medium">
              Crear
            </span>
          )}
        </button>

      </div>

      {/* CHAT DE RESERVAS */}
      <div className="flex-1 min-h-0">
        <ReservasChat />
      </div>
    </div>
  );
}
