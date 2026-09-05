"use client";

import { Sparkles, Scissors, Clock, DollarSign, Plus, Tag } from "lucide-react";

/* =========================================================
   🔹 TIPOS DE DATOS (INTACTOS)
========================================================= */
type Service = {
  SKU: string;
  Servicio: string;
  category: string;
  duracion: number;
  Precio: number;
};

interface ServicesPanelProps {
  services?: Service[];
  onNewServiceClick?: () => void;
}

/* =========================================================
   🔹 COMPONENTE PRINCIPAL
========================================================= */
export default function ServicesPanel({ 
  services,
  onNewServiceClick 
}: ServicesPanelProps) {
  // ⛑️ Fallback seguro
  const safeServices: Service[] = services ?? [];

  return (
    <section id="services" className="space-y-5 font-sans antialiased text-zinc-900 dark:text-zinc-100">
      
      {/* ENCABEZADO Y ACCIÓN PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/90 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div>
          <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider block leading-none mb-1">
            Lehana Studio CRM
          </span>
          <h2 className="text-base font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Scissors className="text-rose-500" size={18} />
            Catálogo de Servicios
          </h2>
          <p className="text-xs text-zinc-400 font-bold mt-0.5">
            Administra categorías, duración, tarifas y especialistas asignados.
          </p>
        </div>

        <button 
          type="button"
          onClick={onNewServiceClick}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black py-2.5 px-4 rounded-2xl shadow-md shadow-rose-500/20 text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={15} /> Nuevo Servicio
        </button>
      </div>

      {/* REJILLA DE TARJETAS DE SERVICIO */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {safeServices.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 bg-white/50 dark:bg-zinc-900/50">
            <Scissors size={24} className="mx-auto text-zinc-400 mb-2 opacity-50" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              No hay servicios registrados en el catálogo.
            </p>
          </div>
        )}

        {safeServices.map((service) => (
          <article
            key={service.SKU}
            className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 shadow-2xs hover:border-rose-300 dark:hover:border-rose-900/50 transition-all space-y-3.5 flex flex-col justify-between"
          >
            <div>
              {/* CABECERA CON NOMBRE Y SKU */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-tight">
                  {service.Servicio}
                </h3>
                <span className="rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0">
                  SKU {service.SKU}
                </span>
              </div>

              {/* CATEGORÍA */}
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-zinc-400">
                <Tag size={12} className="text-rose-500 shrink-0" />
                <span className="uppercase tracking-wider text-[10px] font-bold">
                  {service.category || "General"}
                </span>
              </div>
            </div>

            {/* DURACIÓN Y PRECIO */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-zinc-500 font-bold">
                <Clock size={13} className="text-rose-500" />
                {service.duracion} min
              </span>

              <span className="text-sm font-black text-rose-500 tabular-nums">
                ${Number(service.Precio || 0).toLocaleString("es-CO")} COP
              </span>
            </div>

            {/* NOTA DE PIE */}
            <div className="pt-1 text-[9px] text-zinc-400 font-bold uppercase tracking-wider flex justify-between items-center">
              <span>Configuración Supabase</span>
              <span className="text-zinc-500">Asignación dinámica</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}