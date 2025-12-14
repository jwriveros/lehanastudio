"use client";

import { useState, useRef, useEffect } from "react";

export type FilterOption = {
  label: string;
  value: string;
};

interface Props {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-xs rounded-full border bg-white hover:bg-zinc-50"
      >
        {label}
        {selected.length > 0 && (
          <span className="ml-1 text-indigo-600 font-semibold">
            ({selected.length})
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg z-50">
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {options.map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-100 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
