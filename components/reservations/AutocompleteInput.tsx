// components/reservations/AutocompleteInput.tsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

interface AutocompleteItem {
  id: string;
  name: string;
}

interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  apiEndpoint: string;
  onSelect: (item: AutocompleteItem) => void;
}

const AutocompleteInput = ({
  label,
  placeholder,
  apiEndpoint,
  onSelect,
}: AutocompleteInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch con debounce + abort
  useEffect(() => {
    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      try {
        const res = await fetch(
          `${apiEndpoint}?q=${encodeURIComponent(inputValue)}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Error en autocomplete");

        const data: AutocompleteItem[] = await res.json();
        setSuggestions(data);
        setIsOpen(true);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Autocomplete error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, apiEndpoint]);

  const handleSelect = useCallback(
    (item: AutocompleteItem) => {
      setInputValue(item.name);
      setSuggestions([]);
      setIsOpen(false);
      onSelect(item);
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-zinc-700">
        {label}
      </label>

      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        autoComplete="off"
      />

      {isLoading && (
        <div className="absolute right-3 top-9 text-xs text-zinc-400">
          Buscando…
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5">
          {suggestions.map((item) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className="cursor-pointer px-3 py-2 hover:bg-indigo-600 hover:text-white"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default React.memo(AutocompleteInput);
