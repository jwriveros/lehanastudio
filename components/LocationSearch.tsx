"use client";

import React, { useState } from "react";
import {
  MapPin,
  Search,
  Loader2,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import {
  SedeGeo,
  obtenerCoordenadasDeTexto,
  encontrarSedeMasCercana,
} from "@/lib/geoUtils";

interface LocationSearchProps {
  onSedeSeleccionada: (sede: SedeGeo) => void;
}

export default function LocationSearch({
  onSedeSeleccionada,
}: LocationSearchProps) {
  const [ubicacionTexto, setUbicacionTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<{
    sedeName: string;
    distanciaKm: number;
  } | null>(null);

  const handleBuscarUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ubicacionTexto.trim()) return;

    setCargando(true);
    setResultado(null);

    // 1. Obtener coordenadas del texto escrito por el usuario
    const coords = await obtenerCoordenadasDeTexto(ubicacionTexto);

    if (coords) {
      // 2. Calcular cuál es la sede más cercana
      const { sede, distanciaKm } = encontrarSedeMasCercana(
        coords.lat,
        coords.lng
      );

      // 3. Notificar al formulario principal y mostrar el resultado
      onSedeSeleccionada(sede);
      setResultado({
        sedeName: sede.name,
        distanciaKm,
      });
    } else {
      alert(
        "No logramos encontrar esa ubicación. Intenta escribiendo tu ciudad o municipio."
      );
    }

    setCargando(false);
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3 shadow-2xs">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-zinc-400">
        <Navigation size={14} className="text-rose-500" />
        <span>Encuentra tu Sede Más Cercana</span>
      </div>

      <form onSubmit={handleBuscarUbicacion} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Escribe tu ciudad o barrio (ej. Palomino, Cali, Dibulla)..."
            value={ubicacionTexto}
            onChange={(e) => setUbicacionTexto(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-bold rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-400"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="px-4 py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs hover:bg-rose-600 transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
        >
          {cargando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Search size={14} />
              <span className="hidden sm:inline">Buscar</span>
            </>
          )}
        </button>
      </form>

      {resultado && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>
            Sede asignada: <strong>{resultado.sedeName}</strong> (Aprox. a{" "}
            {resultado.distanciaKm} km de tu ubicación).
          </span>
        </div>
      )}
    </div>
  );
}