"use client";

import React from "react";
import { AlertCircle, CheckCircle2, HelpCircle, X } from "lucide-react";

interface CustomDialogProps {
  isOpen: boolean;
  type?: "alert" | "confirm";
  variant?: "danger" | "warning" | "info" | "success";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export default function CustomDialog({
  isOpen,
  type = "alert",
  variant = "danger",
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  onClose,
}: CustomDialogProps) {
  if (!isOpen) return null;

  // Selección de ícono y colores según variante
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertCircle className="w-6 h-6 text-rose-500" />,
          bgIcon: "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/30",
          btnConfirm: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20",
        };
      case "warning":
        return {
          icon: <HelpCircle className="w-6 h-6 text-amber-500" />,
          bgIcon: "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/30",
          btnConfirm: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
          bgIcon: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/30",
          btnConfirm: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6 text-rose-500" />,
          bgIcon: "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/30",
          btnConfirm: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl border ${styles.bgIcon}`}>
            {styles.icon}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <h3 className="text-base font-extrabold mb-1">{title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-2.5 justify-end">
          {type === "confirm" && (
            <button
              onClick={() => {
                onCancel?.();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl transition-all cursor-pointer active:scale-95"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer active:scale-95 ${styles.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}