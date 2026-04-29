"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { 
  RefreshCcw, 
  Maximize2,
  BarChart3,
  Lock
} from "lucide-react";




export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const metabaseInstanceUrl = "https://reports.lehanastudio.com";

  useEffect(() => {
    async function getToken() {
      try {
        const res = await fetch("/api/metabase/token");
        const data = await res.json();
        if (data.token) setToken(data.token);
      } catch (err) {
        console.error("Error al obtener el token:", err);
      }
    }
    getToken();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    // Eliminamos max-w, p-4 y mx-auto para que use todo el ancho
    // h-screen asegura que use toda la altura del navegador
    <main className="flex flex-col h-screen w-full bg-white dark:bg-zinc-950 animate-in fade-in duration-700 overflow-hidden">
      
      <Script 
        src={`${metabaseInstanceUrl}/app/embed.js`}
        strategy="afterInteractive"
        onLoad={() => {
          (window as any).metabaseConfig = {
            theme: { preset: "light" },
            isGuest: true,
            instanceUrl: metabaseInstanceUrl
          };
        }}
      />

      {/* HEADER COMPACTO: Ocupa poco espacio vertical */}
      <header className="flex items-center justify-between px-6 py-3 border-b dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">DASHBOARD</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Lehana Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-zinc-500"
            title="Refrescar datos"
          >
            <RefreshCcw size={16} />
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 border dark:border-zinc-700 rounded-full">
            <Lock size={10} className="text-emerald-500" />
            <span className="text-[9px] font-black text-zinc-400 uppercase">Encrypted Connection</span>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL: Sin bordes redondeados, sin sombras, ocupa el resto del alto */}
      <section className="flex-1 w-full h-full relative bg-white">
        {token ? (
          <div key={refreshKey} className="w-full h-full">
            <metabase-dashboard
              token={token}
              with-title="false"
              with-downloads="true"
              // Estilo inline para forzar que el componente de Metabase use el 100%
              style={{ width: '100%', height: '100%', border: 'none' }}
            ></metabase-dashboard>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <RefreshCcw className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Cargando Inteligencia de Negocios...
            </p>
          </div>
        )}
      </section>

      {/* FOOTER MINIMALISTA */}
      <footer className="px-6 py-2 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">Sincronizado con Supabase Realtime</span>
        </div>
        <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-tighter">Lehana v2.0.4 • Metabase Engine</p>
      </footer>
    </main>
  );
}