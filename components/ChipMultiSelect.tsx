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
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const active = selected.includes(opt.value);

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`
              px-2 py-0.5 rounded-full text-xs leading-tight border transition
              ${
                active
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
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
