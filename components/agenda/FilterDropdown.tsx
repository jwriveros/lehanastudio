"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface FilterDropdownProps {
  label: string;
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedCount = selected.length;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Botón activador del menú */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
          selectedCount > 0 && !selected.includes("Todas")
            ? "bg-indigo-950/60 border-indigo-600 text-indigo-300"
            : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-indigo-500"
        }`}
      >
        <span>{label}</span>
        {selectedCount > 0 && !selected.includes("Todas") && (
          <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
            {selectedCount}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Menú flotante posicionado justo DEBAJO del botón (top-full mt-1.5) */}
      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 z-[150] min-w-[200px] w-auto max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 px-3 py-1 border-b border-gray-100 dark:border-zinc-800 mb-1">
            Filtrar por {label}
          </div>
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleToggleOption(opt.value)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};