"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { 
  Sparkles, 
  Clock, 
  Tag, 
  ArrowLeft, 
  Search,
  MessageCircle
} from "lucide-react";

interface ServiceItem {
  id: string;
  Servicio?: string;
  service_flow?: string;
  servicioFinalidad?: string;
  descripcion?: string;
  category?: string;
  Categoria?: string;
  price?: string | number;
  Precio?: string | number;
  duracion?: string | number;
  image_url?: string;
  SKU?: string;
}

export default function CatalogoPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Número oficial de WhatsApp de atención al cliente
  const WHATSAPP_PHONE = "573183285992";

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
        // Excluir retoques de pestañas y refuerzo de color en micropigmentación
        const filteredData = data.filter((item: ServiceItem) => {
          const categoryName = (item.category || item.Categoria || "").toLowerCase();
          const serviceName = (item.service_flow || item.Servicio || "").toLowerCase();

          const isRetoquePestanas = 
            categoryName.includes("retoque") && (categoryName.includes("pestaña") || categoryName.includes("pestana"));
          
          const isRefuerzoMicropigmentacion = 
            categoryName.includes("refuerzo") || 
            (serviceName.includes("refuerzo") && categoryName.includes("micro"));

          return !isRetoquePestanas && !isRefuerzoMicropigmentacion;
        });

        setServices(filteredData);

        const uniqueCategories = [
          "Todos",
          ...Array.from(
            new Set(filteredData.map((item) => item.category || item.Categoria || "General"))
          ),
        ];
        setCategories(uniqueCategories);
      }
    } catch (err: any) {
      console.error("Error al cargar el catálogo de servicios:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de lista por texto y categoría
  const filteredServices = services.filter((service) => {
    const currentCategory = service.category || service.Categoria || "General";
    const matchesCategory =
      selectedCategory === "Todos" || currentCategory === selectedCategory;

    const displayName = service.service_flow || service.Servicio || "";
    const displayDescription = service.descripcion || "";

    const matchesSearch =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      displayDescription.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Función para abrir la app de WhatsApp en Android / iOS / Web
  const handleWhatsAppBooking = (service: ServiceItem) => {
    const finalServiceName = service.servicioFinalidad || service.service_flow || service.Servicio || "un servicio";
    const message = `Hola, quiero ${finalServiceName}`;
    const encodedMessage = encodeURIComponent(message);
    
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-16 antialiased selection:bg-rose-500 selection:text-white">
      
      {/* CABECERA ADAPTABLE A DISPOSITIVOS MÓVILES */}
      <header className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors py-1"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </Link>

          <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-xs uppercase tracking-wider">
            <Sparkles size={16} />
            <span>Lehana Studio</span>
          </div>
        </div>
      </header>

      {/* SECCIÓN DE TÍTULO, BUSCADOR Y CATEGORÍAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
            Nuestro <span className="text-rose-500">Catálogo</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium px-2">
            Explora nuestros servicios exclusivos y agenda directamente por WhatsApp.
          </p>
        </div>

        {/* CAMPO DE BÚSQUEDA ADAPTADO PARA MÓVIL */}
        <div className="max-w-md mx-auto relative px-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-xs font-medium focus:outline-none focus:border-rose-400 transition-all shadow-xs"
          />
        </div>

        {/* CARROUSEL HORIZONTAL DE CATEGORÍAS PARA DESLIZAR CON EL DEDO EN SMARTPHONES */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 px-1 justify-start sm:justify-center scrollbar-none touch-pan-x">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
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

      {/* REJILLA RESPONSIVE (1 COLUMNA EN MÓVIL, 2 EN TABLET, 3 EN ESCRITORIO) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 bg-zinc-200/60 dark:bg-zinc-900/60 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md mx-auto space-y-2 px-4">
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              No se encontraron servicios
            </p>
            <p className="text-xs text-zinc-400">
              Prueba buscando otro procedimiento o selecciona otra categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => {
              const serviceTitle = service.service_flow || service.Servicio || "Servicio Lehana";
              const serviceDesc = service.descripcion || "Procedimiento profesional realizado por nuestras especialistas.";
              const servicePrice = service.price || service.Precio || 0;
              const serviceCategory = service.category || service.Categoria || "General";

              return (
                <div
                  key={service.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* IMAGEN CON ASPECT-RATIO ADAPTATIVO */}
                  <div className="relative h-44 sm:h-48 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <img
                      src={
                        service.image_url ||
                        "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=600&auto=format&fit=crop"
                      }
                      alt={serviceTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <Tag size={12} />
                      {serviceCategory}
                    </span>
                  </div>

                  {/* CONTENIDO Y TEXTOS */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug">
                        {serviceTitle}
                      </h3>
                      
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium leading-relaxed line-clamp-3">
                        {serviceDesc}
                      </p>
                    </div>

                    {/* PRECIO Y DURACIÓN */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                        <Clock size={14} className="text-rose-500" />
                        <span>{service.duracion || 60} min</span>
                      </div>
                      <span className="text-base sm:text-lg font-black text-rose-500">
                        ${Number(servicePrice).toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>

                  {/* BOTÓN WHATSAPP GRANDE Y FÁCIL DE TOCAR EN PANTALLAS TÁCTILES */}
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                    <button
                      onClick={() => handleWhatsAppBooking(service)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs py-3.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <MessageCircle size={16} />
                      <span>Agendar este servicio</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}