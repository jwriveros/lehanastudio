"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { 
  Sparkles, 
  Clock, 
  Tag, 
  CalendarCheck, 
  ArrowLeft, 
  Search 
} from "lucide-react";

interface ServiceItem {
  id: string;
  Servicio: string;
  category?: string;
  price?: string | number;
  duracion?: string | number;
  description?: string;
  image_url?: string;
  SKU?: string;
}

export default function CatalogoPage() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;

      if (data) {
        setServices(data);
        const uniqueCategories = [
          "Todos",
          ...Array.from(new Set(data.map((item) => item.category || "General"))),
        ];
        setCategories(uniqueCategories);
      }
    } catch (err: any) {
      console.error("Error al cargar el catálogo:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado dinámico por categoría y por buscador de texto
  const filteredServices = services.filter((service) => {
    const matchesCategory =
      selectedCategory === "Todos" || (service.category || "General") === selectedCategory;
    const matchesSearch =
      service.Servicio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleBookService = (sku?: string) => {
    if (sku) {
      router.push(`/agendar?service=${sku}`);
    } else {
      router.push("/agendar");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-16">
      
      {/* CABECERA Y ENCABEZADO */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Volver al inicio</span>
          </Link>

          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
            <Sparkles size={16} />
            <span>Lehana Studio</span>
          </div>
        </div>
      </header>

      {/* TITULO Y BUSCADOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
            Nuestro <span className="text-rose-500">Catálogo</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Explora la lista completa de nuestros servicios, duraciones y precios.
          </p>
        </div>

        {/* BUSCADOR */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Buscar servicio (ej. pestañas, cejas...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium focus:outline-none focus:border-rose-400 transition-all shadow-xs"
          />
        </div>

        {/* BARRAS DE CATEGORÍAS */}
        <div className="flex gap-2 overflow-x-auto pb-2 justify-start sm:justify-center no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-rose-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* GRILLA DE SERVICIOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 bg-zinc-200/60 dark:bg-zinc-900/60 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md mx-auto space-y-2">
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              No se encontraron servicios
            </p>
            <p className="text-xs text-zinc-400">
              Prueba cambiando la búsqueda o seleccionando otra categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* IMAGEN DE SERVICIO */}
                <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={
                      service.image_url ||
                      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=600&auto=format&fit=crop"
                    }
                    alt={service.Servicio}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <Tag size={12} />
                    {service.category || "General"}
                  </span>
                </div>

                {/* DETALLES */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug">
                      {service.Servicio}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium leading-relaxed line-clamp-3">
                      {service.description ||
                        "Procedimiento profesional con técnicas de vanguardia garantizadas en Lehana Studio."}
                    </p>
                  </div>

                  {/* PRECIO Y DURACIÓN */}
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                      <Clock size={14} className="text-rose-500" />
                      <span>{service.duracion || 60} min</span>
                    </div>
                    <span className="text-lg font-black text-rose-500">
                      ${Number(service.price || 0).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>

                {/* BOTÓN DE AGENDAMIENTO */}
                <div className="px-6 pb-6 pt-0">
                  <button
                    onClick={() => handleBookService(service.SKU || service.id)}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <CalendarCheck size={14} />
                    <span>Agendar este servicio</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}