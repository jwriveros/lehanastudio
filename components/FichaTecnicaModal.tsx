"use client";

import React from "react";
import { X, ClipboardList, User } from "lucide-react";
// Importación corregida apuntando al nuevo archivo independiente
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
 * Modal independiente para gestionar la Ficha Técnica de un cliente.
 */
export default function FichaTecnicaModal({
  isOpen,
  onClose,
  cliente,
}: FichaTecnicaModalProps) {
  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER DEL MODAL */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
              <ClipboardList size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Ficha Técnica
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                <User size={14} />
                <span className="font-medium">{cliente.nombre}</span>
                <span>•</span>
                <span>{cliente.celular}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white dark:bg-zinc-900">
            {/* Componente con la lógica de Supabase */}
            <FichaTecnicaEditor celular={cliente.celular} />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/30">
          <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-semibold">
            Lehana Studio - Gestión de Protocolos Técnicos
          </p>
        </div>
      </div>
    </div>
  );
}