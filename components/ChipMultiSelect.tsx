"use client";

import React from "react";

export type Option = {
  label: string;
  value: string;
};

interface ChipMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export default function ChipMultiSelect({
  options,
  selected,
  onChange,
}: ChipMultiSelectProps) {
  /* =========================================================
     🔹 LÓGICA DE CONMUTACIÓN (AGREGAR O RETIRAR DE LA LISTA)
  ========================================================= */
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 font-sans antialiased">
      {options.map((opt) => {
        const active = selected.includes(opt.value);

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`
              px-3 py-1 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all duration-200 cursor-pointer active:scale-95
              ${
                active
                  ? "bg-rose-500 text-white border-rose-500 shadow-xs shadow-rose-500/20"
                  : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-900/50 hover:text-rose-500"
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}