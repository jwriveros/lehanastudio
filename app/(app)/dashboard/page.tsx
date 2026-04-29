"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { RefreshCcw, BarChart3, Lock } from "lucide-react";

// Mantenemos esto para que Vercel no falle con TypeScript
const MetabaseDashboard = "metabase-dashboard" as any;

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false); // Nuevo estado

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
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="flex flex-col h-screen w-full bg-white dark:bg-zinc-950 animate-in fade-in duration-700 overflow-hidden">
      
      {/* Script con manejo de estado */}
      <Script 
        src={`${metabaseInstanceUrl}/app/embed.js`}
        strategy="afterInteractive"
        onLoad={() => {
          (window as any).metabaseConfig = {
            theme: { preset: "light" },
            isGuest: true,
            instanceUrl: metabaseInstanceUrl
          };
          setIsScriptLoaded(true); // Marcamos que el script y config están listos
        }}
      />

      {/* HEADER COMPACTO */}
      <header className="flex items-center justify-between px-6 py-3 border-b dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-600 rounded-xl">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">Analytics</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Lehana Studio</p>
          </div>
        </div>
        <button onClick={handleRefresh} className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
          <RefreshCcw size={16} className={!token ? "animate-spin" : ""} />
        </button>
      </header>

      {/* CONTENEDOR DEL DASHBOARD */}
      <section className="flex-1 w-full h-full relative bg-white">
        {/* CONDICIÓN CRÍTICA: Esperar al token Y al script */}
        {token && isScriptLoaded ? (
          <div key={refreshKey} className="w-full h-full">
            <MetabaseDashboard
              token={token}
              instance-url={metabaseInstanceUrl} // Pasamos la URL directamente aquí también
              with-title="false"
              with-downloads="true"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <RefreshCcw className="animate-spin text-indigo-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Estableciendo conexión con Metabase...
            </p>
          </div>
        )}
      </section>

      <footer className="px-6 py-2 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Sincronizado</span>
        </div>
        <p className="italic text-zinc-400">© 2026 LEHANA ANALYTICS</p>
      </footer>
    </main>
  );
}