"use client";
import ReservasChat from "@/components/chat/ReservasChat";
import { Plus, MessageSquareText } from "lucide-react";
import { useUIStore } from "@/lib/uiStore";
interface Props {
  collapsed: boolean;
}
export default function AgendaSidebar({ collapsed }: Props) {
  const openReservationDrawer = useUIStore(
    (state) => state.openReservationDrawer
  );
  // Transición de ancho y opacidad para una aparición/desaparición suave
  const sidebarClasses = `
    flex h-full flex-col border-r border-gray-200 bg-white
    dark:border-gray-800 dark:bg-gray-900
    transition-all duration-300 ease-in-out
    ${collapsed ? "w-0 opacity-0" : "w-full md:w-[320px] opacity-100"}
  `;
  if (collapsed) return null;
  return (
    <aside className={sidebarClasses}>
      {/* BOTÓN CREAR RESERVA */}
      <div className="shrink-0 border-b flex justify-center border-gray-200 p-3 dark:border-gray-800">
        <button
          onClick={() => openReservationDrawer()}
          className="flex h-8 px-4 w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] dark:hover:bg-indigo-500"
        >
          <Plus size={18} strokeWidth={2} />
          <span>Crear Reserva</span>
        </button>
      </div>
      {/* CHAT DE RESERVAS */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-200 p-3 dark:border-gray-800">
          <MessageSquareText
            size={18}
            className="text-gray-500 dark:text-gray-400"
          />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Chat de Reservas
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ReservasChat />
        </div>
      </div>
    </aside>
  );
}