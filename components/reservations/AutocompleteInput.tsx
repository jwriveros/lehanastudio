"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

interface AutocompleteInputProps<T> {
  label: string;
  placeholder: string;
  apiEndpoint: string;

  /** 👉 Texto que queda en el input al seleccionar */
  getValue: (item: T) => string;

  /** 👉 Render de cada opción (ej: nombre + celular) */
  renderItem?: (item: T) => React.ReactNode;

  getKey?: (item: T, index: number) => string | number;
  onSelect: (item: T) => void;
}

function AutocompleteInput<T>({
  label,
  placeholder,
  apiEndpoint,
  getValue,
  renderItem,
  getKey,
  onSelect,
}: AutocompleteInputProps<T>) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* =========================
     Cerrar al hacer click fuera
  ========================= */
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* =========================
     Fetch con debounce (SIN null)
  ========================= */
  useEffect(() => {
    const q = inputValue.trim();

    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // limpiar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      // abortar request anterior
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      try {
        const res = await fetch(
          `${apiEndpoint}?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error("Error en autocomplete");
        }

        const data: T[] = await res.json();
        setSuggestions(data);
        setIsOpen(true);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Autocomplete error:", err);
          setSuggestions([]);
          setIsOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    // ✅ cleanup VÁLIDO (nunca null)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, apiEndpoint]);

  /* =========================
     Selección
  ========================= */
  const handleSelect = useCallback(
    (item: T) => {
      // 👉 SOLO el valor definido (ej: nombre)
      setInputValue(getValue(item));
      setSuggestions([]);
      setIsOpen(false);
      onSelect(item);
    },
    [getValue, onSelect]
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
        onFocus={() => setIsOpen(true)}
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm
                   focus:border-indigo-500 focus:ring-indigo-500"
        autoComplete="off"
      />

      {isLoading && (
        <div className="absolute right-3 top-9 text-xs text-zinc-400">
          Buscando…
        </div>
      )}

      {isOpen && !isLoading && (
        <>
          {/* SIN resultados */}
          {suggestions.length === 0 && inputValue.trim().length >= 2 && (
            <div className="absolute z-20 mt-1 w-full rounded-md bg-white
                            px-3 py-2 text-sm text-zinc-500
                            shadow ring-1 ring-black/5">
              No existe el cliente
            </div>
          )}

          {/* CON resultados */}
          {suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto
                           rounded-md bg-white py-1 text-sm
                           shadow ring-1 ring-black/5">
              {suggestions.map((item, index) => (
                <li
                  key={getKey ? getKey(item, index) : index}
                  onClick={() => handleSelect(item)}
                  className="cursor-pointer px-3 py-2
                             hover:bg-indigo-600 hover:text-white"
                >
                  {renderItem ? renderItem(item) : getValue(item)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default React.memo(AutocompleteInput) as typeof AutocompleteInput;
