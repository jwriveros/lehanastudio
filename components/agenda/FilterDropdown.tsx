"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface FilterDropdownProps {
  label: string;
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  align?: "left" | "right";
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  align = "right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const hasSelection = selected.length > 0 && !selected.includes("Todas");
  const selectedCount = selected.filter((s) => s !== "Todas").length;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
          hasSelection
            ? "bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400"
            : "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-rose-400/50"
        }`}
      >
        <span>{label}</span>
        {hasSelection && (
          <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black shadow-2xs">
            {selectedCount}
          </span>
        )}
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 text-zinc-400 ${isOpen ? "rotate-180 text-rose-500" : ""}`} 
        />
      </button>

      {/* 🔹 CAMBIO CLAVE: z-[200] garantiza que flote por encima de la grilla semanal */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-[200] min-w-[210px] w-auto max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
            <span>Filtrar por {label}</span>
            {hasSelection && (
              <span className="text-rose-500 font-bold">{selectedCount} activo(s)</span>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleToggleOption(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                  }`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && (
                    <Check size={14} className="text-rose-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};