"use client";
import React from "react";

interface ChipMultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (newValues: string[]) => void;
}

export default function ChipMultiSelect({
  label,
  options,
  selected,
  onChange
}: ChipMultiSelectProps) {

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-600">{label}</span>

        {/* BOTONES SELECT-ALL / CLEAR */}
        <div className="flex gap-2">
          <button
            className="text-[11px] px-2 py-1 rounded-lg bg-zinc-200 hover:bg-zinc-300"
            onClick={selectAll}
            type="button"
          >
            Todos
          </button>

          <button
            className="text-[11px] px-2 py-1 rounded-lg bg-zinc-200 hover:bg-zinc-300"
            onClick={clearAll}
            type="button"
          >
            Ninguno
          </button>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {options.map((op) => {
          const active = selected.includes(op);
          return (
            <button
              key={op}
              type="button"
              onClick={() => toggleValue(op)}
              className={`
                px-3 py-1 rounded-full text-xs font-semibold transition
                border ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                }
              `}
            >
              {op}
            </button>
          );
        })}
      </div>
    </div>
  );
}
