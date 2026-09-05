"use client";

import React from "react";
import { X, ClipboardList, User, Phone } from "lucide-react";
// Importación manteniendo la referencia a FichaTecnicaEditor
import FichaTecnicaEditor from "./reservations/FichaTecnicaEditor"; 

interface FichaTecnicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: {
    nombre: string;
    celular: string;
  } | null;
}

/**
 * 🌸 Modal independiente para gestionar la Ficha Técnica de un cliente.
 * Diseñado bajo la línea visual de Lehana Studio (Zinc & Rose).
 */
export default function FichaTecnicaModal({
  isOpen,
  onClose,
  cliente,
}: FichaTecnicaModalProps) {
  if (!isOpen || !cliente) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans antialiased text-zinc-900 dark:text-zinc-100"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md w-full max-w-2xl rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🌸 HEADER DEL MODAL */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 shrink-0">
              <ClipboardList size={20} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 block leading-none">
                Lehana Studio CRM
              </span>
              <h2 className="text-sm font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5 leading-tight">
                Ficha Técnica e Historial
              </h2>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
                <span className="flex items-center gap-1 font-extrabold text-zinc-800 dark:text-zinc-200 uppercase">
                  <User size={13} className="text-rose-500" />
                  {cliente.nombre}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-black text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                  <Phone size={10} className="text-rose-500" />
                  {cliente.celular}
                </span>
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors text-zinc-400 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 🌸 CUERPO DEL MODAL (EDITOR DE FICHA TÉCNICA) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-zinc-50/30 dark:bg-zinc-950/30">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-1">
            <FichaTecnicaEditor celular={cliente.celular} />
          </div>
        </div>

        {/* 🌸 FOOTER DEL MODAL */}
        <div className="px-6 py-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-center">
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-black">
            Lehana Studio • Protocolos Técnicos y Registro Fotográfico
          </p>
        </div>
      </div>
    </div>
  );
}