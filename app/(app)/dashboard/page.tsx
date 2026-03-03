"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  ExternalLink, 
  RefreshCcw, 
  Maximize2,
  BarChart3,
  Lock
} from "lucide-react";

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // REEMPLAZA ESTO CON TU URL DE INSERCIÓN DE LOOKER STUDIO
  const lookerStudioUrl = "https://lookerstudio.google.com/embed/reporting/850e42f4-6f87-4eb0-8b5d-206ff6b64ab7/page/tDlqF";

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700 min-h-screen text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* HEADER ESTRATÉGICO */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <BarChart3 size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Business Intelligence</h1>
          </div>
          <p className="text-xs text-zinc-500 font-bold ml-12 uppercase tracking-widest">Análisis de datos en tiempo real • Lehana Studio</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-2xl transition-all text-zinc-500"
            title="Refrescar datos"
          >
            <RefreshCcw size={18} />
          </button>
          <a 
            href={lookerStudioUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            <Maximize2 size={14} /> Pantalla Completa
          </a>
        </div>
      </header>

      {/* CONTENEDOR DEL DASHBOARD DE LOOKER */}
      <section className="relative w-full rounded-[3rem] border-4 border-white dark:border-zinc-900 shadow-2xl overflow-hidden bg-white dark:bg-zinc-900 min-h-[85vh]">
        
        {/* Barra superior del reporte */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-zinc-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800 flex items-center px-8 justify-between z-10">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-zinc-400" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Conexión Segura Supabase</span>
          </div>
        </div>

        {/* El iframe de Looker Studio */}
        <div className="w-full h-full pt-12">
          <iframe
            key={refreshKey}
            src={lookerStudioUrl}
            className="w-full h-[80vh] border-0"
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          ></iframe>
        </div>

        {/* Overlay de carga (Corregido: RefreshCcw en lugar de refresh-cw) */}
        {!lookerStudioUrl.includes("http") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <RefreshCcw className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-sm font-black uppercase italic text-zinc-400">Configurando enlace de Looker Studio...</p>
          </div>
        )}
      </section>

      {/* FOOTER DE ESTADO */}
      <footer className="flex justify-between items-center px-4 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-zinc-500 uppercase">Servidor Activo</span>
          </div>
          <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-800" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sincronizado con Supabase Cloud</span>
        </div>
        <p className="text-[10px] font-bold text-zinc-400 italic">© 2026 LEHANA STUDIO ANALYTICS</p>
      </footer>
    </main>
  );
}