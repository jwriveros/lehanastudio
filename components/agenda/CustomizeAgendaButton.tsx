"use client";

import React, { useState, useRef, useEffect } from "react";
import { Palette, RotateCcw, Check } from "lucide-react";
import { useAgendaColor, CUSTOMIZABLE_STATUSES } from "@/lib/useAgendaColor";

const QUICK_PALETTE = [
  "#F59E0B", // Ámbar
  "#EC4899", // Rosa
  "#10B981", // Esmeralda
  "#3B82F6", // Azul
  "#8B5CF6", // Violeta
  "#14B8A6", // Turquesa
];

export default function CustomizeAgendaButton() {
  const [open, setOpen] = useState(false);

  // Desestructuramos exactamente las propiedades actualizadas del hook useAgendaColor
  const {
    statusColors,
    updateStatusColor,
    resetAllToDefault,
    hasAnyCustom,
  } = useAgendaColor();

  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú flotante al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* BOTÓN PRINCIPAL EN LA BARRA SUPERIOR DE LA AGENDA */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-extrabold transition-all cursor-pointer shadow-2xs ${
          hasAnyCustom
            ? "border-rose-300 bg-rose-50/80 text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
            : "border-zinc-200/80 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        }`}
        title="Personalizar colores por estado de cita"
      >
        <Palette size={15} className="text-rose-500" />
        <span className="hidden sm:inline">Personalizar</span>
        {hasAnyCustom && (
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
        )}
      </button>

      {/* POPOVER DE CONFIGURACIÓN POR ESTADO */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-3xl border border-zinc-200/80 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 space-y-3.5">
          {/* Encabezado */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Colores por Estado
              </h4>
              <p className="text-[10px] text-zinc-400 font-semibold">
                En &ldquo;Default&rdquo; conserva el color de cada especialista
              </p>
            </div>

            {hasAnyCustom && (
              <button
                type="button"
                onClick={resetAllToDefault}
                className="flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-extrabold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Restaurar todos a color de especialista"
              >
                <RotateCcw size={11} />
                Todo Default
              </button>
            )}
          </div>

          {/* Lista de Estados Configurables */}
          <div className="space-y-3">
            {CUSTOMIZABLE_STATUSES.map((st) => {
              const currentVal = statusColors[st.key] || "default";
              const isDefault = currentVal === "default";

              return (
                <div
                  key={st.key}
                  className="p-2.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80 space-y-2"
                >
                  {/* Nombre del estado y botón Default */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                      <span className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200">
                        {st.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateStatusColor(st.key, "default")}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                        isDefault
                          ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                          : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      {isDefault ? "✓ Default (Especialista)" : "Usar Default"}
                    </button>
                  </div>

                  {/* Paleta rápida + Selector libre para este estado */}
                  <div className="flex items-center justify-between gap-1.5 pt-0.5">
                    {QUICK_PALETTE.map((hex) => {
                      const isSelected = currentVal.toLowerCase() === hex.toLowerCase();
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => updateStatusColor(st.key, hex)}
                          className={`h-6 w-6 rounded-lg flex items-center justify-center transition-transform cursor-pointer shadow-2xs ${
                            isSelected
                              ? "scale-110 ring-2 ring-zinc-900 dark:ring-white"
                              : "hover:scale-105 opacity-85 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: hex }}
                          title={`Aplicar ${hex} a ${st.label}`}
                        >
                          {isSelected && <Check size={12} className="text-white drop-shadow-xs" />}
                        </button>
                      );
                    })}

                    {/* Selector de color libre */}
                    <label
                      title="Elegir otro color"
                      className="h-6 w-6 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:border-rose-400 relative overflow-hidden bg-white dark:bg-zinc-900"
                    >
                      <input
                        type="color"
                        value={isDefault ? "#F43F5E" : currentVal}
                        onChange={(e) => updateStatusColor(st.key, e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <span className="text-[10px] font-black text-zinc-500">+</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}