"use client";

import Image from "next/image";
import { Camera, Sparkles, Calendar, Phone, FileText } from "lucide-react";

/* =========================================================
   🔹 TIPOS DE DATOS (INTACTOS)
========================================================= */
type ProgressEntry = {
  id: string;
  appointment_id: string | number;
  client_phone: string;
  created_at: string;
  notes: string;
  images: string[];
};

interface ProgressPanelProps {
  progressEntries?: ProgressEntry[];
  onUploadClick?: () => void;
}

/* =========================================================
   🔹 COMPONENTE PRINCIPAL
========================================================= */
export default function ProgressPanel({
  progressEntries,
  onUploadClick,
}: ProgressPanelProps) {
  // ⛑️ Fallback seguro
  const safeEntries: ProgressEntry[] = progressEntries ?? [];

  return (
    <section id="progress" className="space-y-5 font-sans antialiased text-zinc-900 dark:text-zinc-100">
      
      {/* ENCABEZADO Y ACCIÓN PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/90 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div>
          <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider block leading-none mb-1">
            Lehana Studio CRM
          </span>
          <h2 className="text-base font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="text-rose-500" size={18} />
            Progreso y Evidencias
          </h2>
          <p className="text-xs text-zinc-400 font-bold mt-0.5">
            Registro fotográfico antes/después, notas clínicas y seguimiento.
          </p>
        </div>

        <button 
          type="button"
          onClick={onUploadClick}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black py-2.5 px-4 rounded-2xl shadow-md shadow-rose-500/20 text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Camera size={15} /> Subir Evidencia
        </button>
      </div>

      {/* REJILLA DE TARJETAS DE PROGRESO */}
      <div className="grid gap-4 md:grid-cols-2">
        {safeEntries.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 bg-white/50 dark:bg-zinc-900/50">
            <Camera size={24} className="mx-auto text-zinc-400 mb-2 opacity-50" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Aún no hay evidencias o fotografías registradas para este perfil.
            </p>
          </div>
        )}

        {safeEntries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 shadow-2xs hover:border-rose-300 dark:hover:border-rose-900/50 transition-all space-y-3"
          >
            {/* CABECERA DE CADA CITA */}
            <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <div>
                <span className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 block">
                  Cita #{entry.appointment_id}
                </span>
                <span className="inline-flex items-center gap-1 mt-1 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded-full text-[10px] font-black text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-800">
                  <Phone size={10} className="text-rose-500" />
                  {entry.client_phone}
                </span>
              </div>

              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-1 rounded-full shrink-0">
                {new Date(entry.created_at).toLocaleDateString('es-CO')}
              </span>
            </div>

            {/* NOTAS CLÍNICAS */}
            <div className="flex gap-2 items-start text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium bg-zinc-50/50 dark:bg-zinc-950/50 p-3 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/60">
              <FileText size={14} className="text-rose-500 shrink-0 mt-0.5" />
              <p>{entry.notes || "Sin observaciones adicionales."}</p>
            </div>

            {/* GALERÍA FOTOGRÁFICA */}
            {entry.images && entry.images.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-1">
                {entry.images.map((img, index) => (
                  <div 
                    key={index}
                    className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 shadow-2xs group"
                  >
                    <Image
                      src={img}
                      alt={`Evidencia ${index + 1}`}
                      width={96}
                      height={96}
                      className="h-22 w-22 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* PIE DE TARJETA SOBRIO */}
            <div className="pt-2 border-t border-dashed border-zinc-100 dark:border-zinc-800/60 text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex justify-between items-center">
              <span>Almacenamiento Supabase</span>
              <span className="text-rose-500">Firmado por especialista</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}