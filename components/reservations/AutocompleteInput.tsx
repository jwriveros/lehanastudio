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
  /** 👉 Texto que queda en el input al seleccionar */
  getValue: (item: T) => string;
  /** 👉 Render de cada opción (ej: nombre + celular) */
  renderItem?: (item: T) => React.ReactNode;
  getKey?: (item: T, index: number) => string | number;
  onSelect: (item: T) => void;
  inputClassName?: string;
}
function AutocompleteInput<T>({
  label,
  placeholder,
  apiEndpoint,
  getValue,
  renderItem,
  getKey,
  onSelect,
  inputClassName,
}: AutocompleteInputProps<T>) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreSearchRef = useRef(false);

  const defaultInputClasses = "w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
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
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={inputClassName || defaultInputClasses}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {isOpen && !isLoading && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700">
          {suggestions.length === 0 && inputValue.trim().length >= 2 ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              No se encontraron resultados.
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto rounded-md py-1 text-base focus:outline-none sm:text-sm">
              {suggestions.map((item, index) => (
                <li
                  key={getKey ? getKey(item, index) : index}
                  onClick={() => handleSelect(item)}
                  className="relative cursor-pointer select-none px-4 py-2 text-gray-900 hover:bg-indigo-600 hover:text-white dark:text-white"
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
