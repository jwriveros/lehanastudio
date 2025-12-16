"use client";
import React from "react";
import { Plus } from "lucide-react";
interface FloatingAddButtonProps {
  onClick: () => void;
}
const FloatingAddButton = ({ onClick }: FloatingAddButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Añadir reserva"
      className="fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 md:hidden"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
};
export default React.memo(FloatingAddButton);
