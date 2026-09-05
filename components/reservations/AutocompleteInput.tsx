"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Loader2 } from "lucide-react";

interface AutocompleteInputProps<T> {
  label?: string;
  placeholder: string;
  apiEndpoint: string;
  /** Valor inicial para el modo edición */
  initialValue?: string;
  /** Texto que queda en el input al seleccionar */
  getValue: (item: T) => string;
  /** Render de cada opción (ej: nombre + celular) */
  renderItem?: (item: T) => React.ReactNode;
  getKey?: (item: T, index: number) => string | number;
  onSelect: (item: T) => void;
  onChange?: (value: string) => void;
  inputClassName?: string;
}

function AutocompleteInput<T>({
  label,
  placeholder,
  apiEndpoint,
  initialValue = "",
  getValue,
  renderItem,
  getKey,
  onSelect,
  onChange,
  inputClassName,
}: AutocompleteInputProps<T>) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreSearchRef = useRef(false);

  // Sincronizar el valor interno cuando cambia el valor inicial desde afuera
  useEffect(() => {
    if (initialValue !== undefined && initialValue !== inputValue) {
      ignoreSearchRef.current = true;
      setInputValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  /* 🌸 ESTILOS DELICADOS POR DEFECTO DEL INPUT (LEHANA STUDIO) */
  const defaultInputClasses = 
    "w-full rounded-2xl border border-zinc-200/80 bg-white py-2 pl-3.5 pr-10 text-[11px] font-bold text-zinc-900 shadow-2xs focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 transition-all duration-200";

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
      Fetch con debounce
  ========================= */
  useEffect(() => {
    if (ignoreSearchRef.current) {
      ignoreSearchRef.current = false;
      return;
    }
    const q = inputValue.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
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
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, apiEndpoint]);

  /* =========================
      Selección de un elemento
  ========================= */
  const handleSelect = useCallback(
    (item: T) => {
      const newValue = getValue(item);
      if (newValue !== inputValue) {
        ignoreSearchRef.current = true;
        setInputValue(newValue);
      }
      setSuggestions([]);
      setIsOpen(false);
      onSelect(item);
    },
    [getValue, onSelect, inputValue]
  );

  return (
    <div ref={containerRef} className="relative w-full font-sans antialiased">
      {label && (
        <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-zinc-400">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            if (onChange) onChange(val);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          className={inputClassName || defaultInputClasses}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
          </div>
        )}
      </div>

      {/* 🌸 DESPLEGABLE DE RESULTADOS REFINADO Y SIN BORDES NEGROS */}
      {isOpen && !isLoading && (
        <div className="absolute top-full mt-1.5 z-[160] w-full rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          {suggestions.length === 0 && inputValue.trim().length >= 2 ? (
            <div className="px-3 py-2.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 text-center">
              No se encontraron resultados.
            </div>
          ) : (
            <ul className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar text-xs">
              {suggestions.map((item, index) => (
                <li
                  key={getKey ? getKey(item, index) : index}
                  onClick={() => handleSelect(item)}
                  className="relative cursor-pointer select-none rounded-2xl px-3 py-2 text-zinc-800 dark:text-zinc-100 font-bold hover:bg-rose-50/80 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors duration-150"
                >
                  {renderItem ? renderItem(item) : getValue(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(AutocompleteInput) as typeof AutocompleteInput;