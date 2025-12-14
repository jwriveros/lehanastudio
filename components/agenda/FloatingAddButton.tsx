// components/agenda/FloatingAddButton.tsx
"use client";

import React from "react";

interface FloatingAddButtonProps {
  onClick: () => void;
}

const FloatingAddButton = ({ onClick }: FloatingAddButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Añadir reserva"
      className="fixed bottom-16 right-6 z-50 rounded-full bg-indigo-600 p-4 text-white shadow-lg transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 5v14m7-7H5"
        />
      </svg>
    </button>
  );
};

export default React.memo(FloatingAddButton);
