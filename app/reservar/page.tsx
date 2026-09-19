"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "@/lib/supabaseClient";
import LocationSearch from "@/components/LocationSearch";
import { toast } from "sonner";
import {
  Phone,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Sparkles,
  Search,
  X,
  Clock,
  User,
  MapPin,
  Check,
  ExternalLink,
  Trash2,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Mail,
  Edit3,
  MessageCircle,
} from "lucide-react";

/* =========================================================
   1. CONFIGURACIÓN DE SOPORTE DIRECTO WHATSAPP (LESLIE)
========================================================= */
const LESLIE_WHATSAPP_NUMBER = "573058633774";

/* =========================================================
   2. FOTOS DE LAS ESPECIALISTAS
========================================================= */
const SPECIALIST_PHOTOS: Record<string, string> = {
  "Nary Cabrales": "https://ijbmsdypiudovdnpwwzg.supabase.co/storage/v1/object/public/wa_media/nary.jpeg",
  "Andrea Garcia": "https://ijbmsdypiudovdnpwwzg.supabase.co/storage/v1/object/public/wa_media/andrea.jpeg",
  "Leslie Gutierrez": "https://ijbmsdypiudovdnpwwzg.supabase.co/storage/v1/object/public/wa_media/leslie.jpeg",
  "Yucelis Moscote": "https://ijbmsdypiudovdnpwwzg.supabase.co/storage/v1/object/public/wa_media/yucelis.jpeg",
};

/* =========================================================
   3. SEDES DE LEHANA STUDIO
========================================================= */
const SEDES_INFO = [
  {
    name: "Marquetalia",
    address: "Marquetalia, Palomino, La Guajira",
    mapUrl: "https://maps.app.goo.gl/Ynt2Zaak3trXt2KL8",
    isMain: true,
  },
  {
    name: "Buga",
    address: "Carrera 14 # 6-32, Buga, Valle del Cauca",
    mapUrl: "https://www.google.com/maps?q=3.899355,-76.3000322&z=17&hl=es",
    isMain: false,
  },
  {
    name: "Santa Marta",
    address: "Carrera 3 # 18-20, Centro Histórico, Santa Marta",
    mapUrl: "https://maps.app.goo.gl/UXPCcoGLmCpedVRx6",
    isMain: false,
  },
];

/* =========================================================
   4. ORDEN DE CATEGORÍAS PÚBLICAS Y EXCLUSIONES
========================================================= */
const CATEGORIAS_ORDEN = [
  "Todos",
  "Micropigmentación",
  "Cejas",
  "Pestañas",
  "Limpieza facial",
  "Depilación",
];

/* =========================================================
   5. CATÁLOGO BASE DE RESPALDO (FALLBACK SEGURO)
========================================================= */
const INITIAL_PUBLIC_SERVICES: ServiceItem[] = [
  {
    id: "micro_cejas_sombra",
    SKU: "micro_cejas_sombra",
    Servicio: "Micropigmentación de cejas efecto SOMBRA",
    Precio: 350000,
    duracion: 180,
    category: "Micropigmentación",
    especialistas: ["Leslie Gutierrez"],
    descripcion: "Técnica semipermanente que logra un efecto sombreado tipo maquillaje con acabado elegante y duradero.",
  },
  {
    id: "cejas_sombreado",
    SKU: "cejas_sombreado",
    Servicio: "Diseño, Depilación y sombreado de cejas",
    Precio: 35000,
    duracion: 45,
    category: "Cejas",
    especialistas: ["Nary Cabrales", "Yucelis Moscote", "Leslie Gutierrez"],
    descripcion: "Diseño con visagismo según tus facciones, epilación con cera suave y pigmentación semipermanente.",
  },
  {
    id: "lash_clasicas",
    SKU: "lash_clasicas",
    Servicio: "Pestañas pelo a pelo CLASICAS NATURAL",
    Precio: 90000,
    duracion: 120,
    category: "Pestañas",
    especialistas: ["Yucelis Moscote", "Leslie Gutierrez"],
    descripcion: "Una extensión individual adherida a cada pestaña natural para un efecto rímel impecable.",
  },
];

/* =========================================================
   6. PAÍSES Y SELECTOR CON COLOMBIA (+57)
========================================================= */
const RAW_COUNTRIES = [
  { code: "57", flag: "🇨🇴", name: "Colombia" },
  { code: "1", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "34", flag: "🇪🇸", name: "España" },
  { code: "52", flag: "🇲🇽", name: "México" },
  { code: "54", flag: "🇦🇷", name: "Argentina" },
  { code: "56", flag: "🇨🇱", name: "Chile" },
  { code: "51", flag: "🇵🇪", name: "Perú" },
  { code: "58", flag: "🇻🇪", name: "Venezuela" },
];

const COUNTRIES = Array.from(
  new Map(RAW_COUNTRIES.map((c) => [`${c.name}-${c.code}`, c])).values()
).sort((a, b) => a.name.localeCompare(b.name));

function formatIndicativo(val: any): string {
  if (!val) return "57";
  const digits = String(val).replace(/\D/g, "");
  return digits || "57";
}

function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 🎯 Agregamos 'touchstart' además de 'mousedown' para móviles
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const cleanValue = formatIndicativo(value);
  const selectedCountry = COUNTRIES.find((c) => c.code === cleanValue) || {
    flag: "🇨🇴",
    code: "57",
    name: "Colombia",
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  return (
    <div className="relative w-28 shrink-0 select-none" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-3 px-2.5 text-xs font-black hover:border-rose-300 transition-all cursor-pointer touch-manipulation"
      >
        <span className="flex items-center gap-1">
          <span>{selectedCountry.flag}</span>
          <span>+{selectedCountry.code}</span>
        </span>
        <ChevronDown
          size={12}
          className={`text-zinc-400 transition-transform ${
            open ? "rotate-180 text-rose-500" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-2 shadow-2xl animate-in fade-in duration-150">
          <div className="relative mb-1">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Buscar país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-[10px] font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-rose-400"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
            {filteredCountries.map((c, idx) => (
              <button
                key={`${c.code}-${c.name}-${idx}`}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-left transition-all cursor-pointer touch-manipulation ${
                  c.code === cleanValue
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-rose-500/10 hover:text-rose-500"
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{c.flag}</span>
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="font-mono text-zinc-400 font-bold shrink-0">
                  +{c.code}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ServiceItem {
  id: string;
  SKU?: string;
  Servicio: string;
  Precio: number;
  duracion: number;
  category: string;
  especialistas?: string[] | string;
  descripcion?: string;
}

interface SlotDetail {
  time: string;
  assigned_specialist: string;
  available_specialists: string[];
}

interface DateAvailability {
  date: string;
  day_name: string;
  slots: SlotDetail[];
}

interface BookingCartItem {
  id: string;
  isCompanion: boolean;
  companionName?: string;
  service: ServiceItem;
  date: string;
  time: string;
  specialist: string;
  sede: string;
}

function formatTime12h(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let hours = parseInt(hStr, 10);
  const minutes = mStr || "00";
  const modifier = hours >= 12 ? "PM" : "AM";

  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${formattedHours}:${minutes} ${modifier}`;
}

/* =========================================================
   7. COMPONENTE PRINCIPAL DE RESERVAS
========================================================= */
function BookingContent() {
  const [bookingSubStep, setBookingSubStep] = useState<number>(1);

  // Datos del Cliente
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [indicativo, setIndicativo] = useState("57");

  // Estado de Búsqueda de Cliente
  const [checkingClient, setCheckingClient] = useState(false);
  const [clientFound, setClientFound] = useState<boolean | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  // Sedes y Disponibilidad de Agendas Regionales
  const [selectedSede, setSelectedSede] = useState(SEDES_INFO[0]);
  const [sedesAvailabilityMap, setSedesAvailabilityMap] = useState<Record<string, boolean>>({
    Marquetalia: true,
    Buga: false,
    "Santa Marta": false,
  });
  const [checkingSedesAvailability, setCheckingSedesAvailability] = useState(true);

  // Catálogo
  const [allServices, setAllServices] = useState<ServiceItem[]>(INITIAL_PUBLIC_SERVICES);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [loadingServices, setLoadingServices] = useState(false);

  // Carrito Multi-servicio
  const [cartItems, setCartItems] = useState<BookingCartItem[]>([]);

  // Beneficiario del servicio activo
  const [isAddingCompanion, setIsAddingCompanion] = useState(false);
  const [companionNameInput, setCompanionNameInput] = useState("");

  // Configuración del servicio en edición
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>("");

  // Disponibilidad de Horarios
  const [availabilityData, setAvailabilityData] = useState<DateAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlotsForDate, setAvailableSlotsForDate] = useState<SlotDetail[]>([]);

  // Confirmación
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  useEffect(() => {
    fetchServicesFromSupabase();
    fetchSedesAvailability();
  }, []);

  // 🎯 Reinicia la posición del scroll al cambiar de paso para evitar que la pantalla parezca bloqueada
useEffect(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
}, [bookingSubStep]);

  /* 🔹 VALIDAR FECHAS PROGRAMADAS EN SUPABASE PARA BUGA Y SANTA MARTA */
  const fetchSedesAvailability = async () => {
    setCheckingSedesAvailability(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("specialist_overrides")
        .select("sede")
        .eq("type", "assigned_sede")
        .gte("date", todayStr);

      const activeSedes: Record<string, boolean> = {
        Marquetalia: true,
        Buga: false,
        "Santa Marta": false,
      };

      if (!error && data) {
        data.forEach((row: any) => {
          if (row.sede) {
            const normalized = row.sede.trim();
            if (normalized.toLowerCase() === "buga") activeSedes["Buga"] = true;
            if (normalized.toLowerCase() === "santa marta") activeSedes["Santa Marta"] = true;
          }
        });
      }

      setSedesAvailabilityMap(activeSedes);
    } catch (err) {
      console.error("Error verificando disponibilidad de sedes:", err);
    } finally {
      setCheckingSedesAvailability(false);
    }
  };

  // CARGA DE SERVICIOS
  const fetchServicesFromSupabase = async () => {
    setLoadingServices(true);
    try {
      const { data, error } = await supabase.from("services").select("*");

      if (!error && data && data.length > 0) {
        const loaded = data
          .map((s: any) => {
            const name = s.Servicio || s.servicio || "Servicio Lehana";
            const cat = s.category || s.categoria || "General";
            let specs: string[] = [];

            if (Array.isArray(s.especialistas)) {
              specs = s.especialistas;
            } else if (typeof s.especialistas === "string") {
              try {
                specs = JSON.parse(s.especialistas);
              } catch {
                specs = [s.especialistas];
              }
            }

            return {
              id: s.id || s.SKU || Math.random().toString(),
              SKU: s.SKU || s.id,
              Servicio: name,
              Precio: Number(s.Precio || s.precio || s.price || 35000),
              duracion: Number(s.duracion || s.duration || 45),
              category: cat,
              especialistas: specs,
              descripcion: s.descripcion || "Procedimiento profesional realizado en Lehana Studio.",
            };
          })
          .filter((s: ServiceItem) => {
            const catLower = (s.category || "").toLowerCase();
            const nameLower = (s.Servicio || "").toLowerCase();
            return (
              !catLower.includes("retoque") &&
              !catLower.includes("refuerzo") &&
              !nameLower.includes("retoque") &&
              !nameLower.includes("refuerzo")
            );
          });

        if (loaded.length > 0) {
          setAllServices(loaded);
        }
      }
    } catch (e) {
      console.error("Usando catálogo estático por defecto:", e);
    } finally {
      setLoadingServices(false);
    }
  };

  /* 🔹 BÚSQUEDA DE CLIENTE POR 'full_phone' */
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    setClientPhone(rawVal);

    if (rawVal.length === 10) {
      setCheckingClient(true);
      try {
        const cleanIndicativo = formatIndicativo(indicativo);
        const fullPhoneQuery = `${cleanIndicativo}${rawVal}`;

        const { data, error } = await supabase
          .from("clientes")
          .select("*")
          .eq("full_phone", fullPhoneQuery)
          .limit(1);

        if (!error && data && data.length > 0) {
          const clientRecord = data[0];
          const nameFound = clientRecord.nombre || clientRecord.cliente || clientRecord.name || "";
          const emailFound = clientRecord.correo || clientRecord.email || "";

          setClientName(nameFound);
          if (emailFound) setClientEmail(emailFound);
          setClientFound(true);
          setIsEditingName(false);
          toast.success(`¡Te hemos reconocido, ${nameFound}!`);
        } else {
          setClientFound(false);
          setClientName("");
          setIsEditingName(true);
        }
      } catch (err) {
        console.error("Error buscando cliente en la tabla clientes:", err);
        setClientFound(false);
      } finally {
        setCheckingClient(false);
      }
    } else {
      setClientFound(null);
    }
  };

  /* 🔹 FILTRADO DINÁMICO DE ESPECIALISTAS CALIFICADAS */
  const qualifiedSpecialistsForSelectedService = useMemo(() => {
    const targetService = selectedService || (cartItems.length > 0 ? cartItems[0].service : null);
    if (!targetService || !targetService.especialistas) {
      return ["Leslie Gutierrez", "Nary Cabrales", "Yucelis Moscote", "Andrea Garcia"];
    }

    let specs: string[] = [];
    if (Array.isArray(targetService.especialistas)) {
      specs = targetService.especialistas;
    } else if (typeof targetService.especialistas === "string") {
      try {
        specs = JSON.parse(targetService.especialistas);
      } catch {
        specs = [targetService.especialistas];
      }
    }

    return specs.length > 0
      ? specs
      : ["Leslie Gutierrez", "Nary Cabrales", "Yucelis Moscote", "Andrea Garcia"];
  }, [selectedService, cartItems]);

  /* 🔹 CONSULTA DE DISPONIBILIDAD ESTABLE (SIN PARPADEO) */
  useEffect(() => {
    const controller = new AbortController();

    async function loadAvailability() {
      // Solo consultar si estamos en el paso 3 y hay un servicio seleccionado
      if (!selectedService || bookingSubStep !== 3) return;

      setLoadingAvailability(true);

      try {
        const serviceIdParam = selectedService.id || selectedService.SKU || "";
        const skuParam = selectedService.SKU || selectedService.id || "";
        const serviceNameParam = selectedService.Servicio || "";

        let url = `/api/availability?service_id=${encodeURIComponent(
          serviceIdParam
        )}&sku=${encodeURIComponent(skuParam)}&servicio=${encodeURIComponent(
          serviceNameParam
        )}&sede=${encodeURIComponent(selectedSede.name)}`;

        if (selectedSpecialist && selectedSpecialist !== "Cualquier profesional") {
          url += `&specialist=${encodeURIComponent(selectedSpecialist)}&search_mode=strict`;
        } else {
          url += `&search_mode=strict`;
        }

        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        if (res.ok && Array.isArray(data.available_dates)) {
          setAvailabilityData(data.available_dates);

          // Si ya hay una fecha seleccionada, actualizamos sus horas de forma limpia
          if (selectedDate) {
            const matchDay = data.available_dates.find((d: any) => d.date === selectedDate);
            setAvailableSlotsForDate(matchDay ? matchDay.slots || [] : []);
          }
        } else {
          setAvailabilityData([]);
          setAvailableSlotsForDate([]);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error obteniendo disponibilidad:", err);
          setAvailabilityData([]);
          setAvailableSlotsForDate([]);
        }
      } finally {
        setLoadingAvailability(false);
      }
    }

    loadAvailability();

    return () => {
      controller.abort();
    };
    // 🎯 IMPORTANTE: Quitamos 'selectedSpecialist' si el usuario está en modo 'Cualquier profesional'
    // para evitar re-consultas innecesarias al marcar la hora.
  }, [selectedService, selectedSede, bookingSubStep]);

  // CATEGORÍAS ORDENADAS
  const categories = useMemo(() => {
    const presentCats = new Set<string>();
    allServices.forEach((s) => {
      if (s.category) presentCats.add(s.category);
    });

    const ordered = CATEGORIAS_ORDEN.filter(
      (c) => c === "Todos" || presentCats.has(c)
    );

    presentCats.forEach((c) => {
      if (!ordered.includes(c)) ordered.push(c);
    });

    return ordered;
  }, [allServices]);

  const filteredServices = useMemo(() => {
    return allServices.filter((s) => {
      if (selectedCategory === "Todos") return true;
      return (
        s.category &&
        s.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
      );
    });
  }, [allServices, selectedCategory]);

  /* 🔹 OBTENER ETIQUETA VISUAL DEL BENEFICIARIO */
  const getDisplayAttendeeName = (item: BookingCartItem) => {
    if (item.isCompanion) {
      return item.companionName?.trim()
        ? item.companionName.trim()
        : "Acompañante";
    }
    return clientName.trim() ? clientName.trim() : "Para mí";
  };

  /* 🎯 GENERAR ENLACE DIRECTO DE WHATSAPP PARA LESLIE */
  const getWhatsAppHelpLink = () => {
    const serviceName = selectedService?.Servicio || cartItems[0]?.service.Servicio || "un servicio";
    let message = "";

    if (selectedDate) {
      message = `Hola Leslie, quiero agendar ${serviceName} para el día ${selectedDate} pero no encontré ninguna hora que me sirva en la página web, me ayudas por favor.`;
    } else {
      message = `Hola Leslie, quiero agendar ${serviceName} pero no encontré ninguna hora que me sirva en la página web, me ayudas por favor.`;
    }

    return `https://wa.me/${LESLIE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  /* 🎯 SELECCIÓN DE SEDE CON NOTIFICACIÓN ESTILIZADA */
  const handleSelectSede = (sedeObj: (typeof SEDES_INFO)[0]) => {
    const hasAvailableDates = sedesAvailabilityMap[sedeObj.name] ?? false;

    if (!hasAvailableDates) {
      toast.error(`Sin agenda disponible en ${sedeObj.name}`, {
        description: `Actualmente no hay fechas programadas para esta sede. Por favor selecciona Marquetalia o escríbenos por WhatsApp.`,
        duration: 5000,
      });
      return;
    }

    setSelectedSede(sedeObj);
  };

  /* 🔹 SELECCIÓN DE SERVICIO AISLADO */
  const toggleSelectService = (service: ServiceItem) => {
    const isComp = isAddingCompanion;
    const compName = companionNameInput.trim();

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) =>
          (item.service.SKU === service.SKU || item.service.id === service.id) &&
          item.isCompanion === isComp &&
          (!isComp || item.companionName === compName)
      );

      if (existingIndex >= 0) {
        return prevItems.filter((_, idx) => idx !== existingIndex);
      } else {
        const uniqueInstanceId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newItem: BookingCartItem = {
          id: uniqueInstanceId,
          isCompanion: isComp,
          companionName: isComp ? compName : undefined,
          service: service,
          date: "",
          time: "",
          specialist: "Cualquier profesional",
          sede: selectedSede.name,
        };
        return [...prevItems, newItem];
      }
    });

    setSelectedService(service);
  };

  const handleCalendarSelect = (value: any) => {
    if (!(value instanceof Date)) return;

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    setSelectedDate(dateStr);
    setSelectedTime("");

    const matchDay = availabilityData.find((d) => d.date === dateStr);
    if (matchDay) {
      setAvailableSlotsForDate(matchDay.slots || []);
    } else {
      setAvailableSlotsForDate([]);
    }
  };

  /* 🔹 SELECCIÓN DE HORA INSTANTÁNEA Y FLUIDA */
  const handleTimeSelect = (timeValue: string) => {
    // 1. Marca la hora seleccionada inmediatamente
    setSelectedTime(timeValue);

    // 2. Busca los detalles del turno seleccionado
    const slotDetail = availableSlotsForDate.find((s) => s.time === timeValue);
    
    if (slotDetail) {
      // Si la clienta no había elegido especialista previa, asignamos la disponible para este turno
      if (!selectedSpecialist || selectedSpecialist === "Cualquier profesional") {
        const specList = slotDetail.available_specialists || [slotDetail.assigned_specialist];
        if (specList.length > 0 && specList[0]) {
          setSelectedSpecialist(specList[0]);
        }
      }
    }
  };

  /* 🔹 CONFIRMAR HORARIO PARA TODO EL BLOQUE */
  const handleAddCurrentServiceToCart = () => {
    if (!selectedDate || !selectedTime) return;

    setCartItems((prevItems) => {
      return prevItems.map((item) => {
        return {
          ...item,
          date: selectedDate,
          time: selectedTime,
          specialist: selectedSpecialist || "Cualquier profesional",
          sede: selectedSede.name,
        };
      });
    });

    setBookingSubStep(4);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const calculateTotalPrice = () => {
    return cartItems.reduce((acc, item) => acc + item.service.Precio, 0);
  };

  const calculateTotalDuration = () => {
    return cartItems.reduce((acc, item) => acc + item.service.duracion, 0);
  };

  /* 🔹 CONFIRMAR RESERVA */
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.warning("Por favor selecciona al menos un servicio.");
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      toast.warning("Por favor completa tu nombre y celular de contacto.");
      return;
    }

    setBookingLoading(true);

    try {
      const cleanPhone = clientPhone.replace(/\D/g, "");
      const cleanIndicativo = formatIndicativo(indicativo);
      const fullPhone = `${cleanIndicativo}${cleanPhone}`;

      const itemsPayload = cartItems.map((item) => {
        let nombreCita = clientName.trim();
        if (item.isCompanion) {
          nombreCita = item.companionName?.trim()
            ? item.companionName.trim()
            : `Acompañante de ${clientName.trim()}`;
        }

        return {
          servicio: item.service.Servicio,
          especialista: item.specialist || "Cualquier profesional",
          appointment_at: item.date && item.time ? `${item.date}T${item.time}:00` : new Date().toISOString(),
          duration: String(item.service.duracion),
          price: item.service.Precio,
          descuento: 0,
          price_final: item.service.Precio,
          cliente: nombreCita,
        };
      });

      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: clientName.trim(),
          celular: cleanPhone,
          indicativo: cleanIndicativo,
          fullPhone: fullPhone,
          correo: clientEmail.trim() || null,
          sede: selectedSede.name,
          cantidad: 1,
          items: itemsPayload,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.ok) {
        throw new Error(resData.error || "Error al registrar las citas.");
      }

      setBookingSuccess(true);
      toast.success("¡Reserva confirmada con éxito!");
    } catch (err: any) {
      console.error("Error al agendar:", err);
      toast.error(`No se pudo procesar la reserva: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const resetAll = () => {
    setBookingSubStep(1);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setIndicativo("57");
    setCartItems([]);
    setSelectedService(null);
    setSelectedDate("");
    setSelectedTime("");
    setBookingSuccess(false);
    setClientFound(null);
  };

  /* 🔹 NAVEGACIÓN RETROACTIVA SEGURA */
  const handleBackNavigation = () => {
    if (bookingSubStep > 1) {
      const prevStep = bookingSubStep - 1;
      
      if ((prevStep === 2 || prevStep === 3) && !selectedService && cartItems.length > 0) {
        setSelectedService(cartItems[0].service);
      }
      
      setBookingSubStep(prevStep);
    } else {
      window.location.href = "/";
    }
  };

  const serviceToConfigure = useMemo(() => {
    return cartItems.find((i) => !i.date || !i.time)?.service || selectedService;
  }, [cartItems, selectedService]);

  const handleNextStep = () => {
    if (bookingSubStep === 1) {
      if (cartItems.length === 0) {
        toast.warning("Por favor selecciona al menos un servicio para continuar.");
        return;
      }
      if (serviceToConfigure) {
        setSelectedService(serviceToConfigure);
      } else {
        setSelectedService(cartItems[0].service);
      }
      setBookingSubStep(2);
    } else if (bookingSubStep === 2) {
      setBookingSubStep(3);
    } else if (bookingSubStep === 3) {
      if (!selectedDate || !selectedTime) {
        toast.warning("Por favor selecciona la fecha y la hora de tu cita.");
        return;
      }
      handleAddCurrentServiceToCart();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col pb-24 lg:pb-8">
      
      {/* ENCABEZADO PÚBLICO */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8">
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition-all cursor-pointer"
            title="Volver atrás"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Atrás</span>
          </button>

          <Link href="/" className="flex flex-col text-center">
            <span className="text-base sm:text-xl font-black tracking-[0.2em] text-zinc-900 dark:text-zinc-50 uppercase">
              LEHANA STUDIO
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.25em] text-rose-500 uppercase -mt-0.5">
              BEAUTY & ACADEMY
            </span>
          </Link>

          <button
            onClick={() => (window.location.href = "/")}
            className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-500"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        
        {!bookingSuccess ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA IZQUIERDA: FLUJO DE PASOS */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* BREADCRUMBS MULTIPASO */}
              <div className="flex items-center gap-2 text-xs font-bold pb-2 border-b border-zinc-200/80 dark:border-zinc-800 overflow-x-auto custom-scrollbar">
                <span className={bookingSubStep >= 1 ? "text-rose-500 font-extrabold" : "text-zinc-400"}>
                  1. Servicios
                </span>
                <ChevronRight size={12} className="text-zinc-400" />
                <span className={bookingSubStep >= 2 ? "text-rose-500 font-extrabold" : "text-zinc-400"}>
                  2. Profesional & Sede
                </span>
                <ChevronRight size={12} className="text-zinc-400" />
                <span className={bookingSubStep >= 3 ? "text-rose-500 font-extrabold" : "text-zinc-400"}>
                  3. Fecha y Hora
                </span>
                <ChevronRight size={12} className="text-zinc-400" />
                <span className={bookingSubStep >= 4 ? "text-rose-500 font-extrabold" : "text-zinc-400"}>
                  4. Tus Datos
                </span>
              </div>

              {/* PASO 1: SELECCIONAR SERVICIOS */}
              {bookingSubStep === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                      Seleccionar servicios
                    </h1>

                    {/* BENEFICIARIO */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIsAddingCompanion(false)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                          !isAddingCompanion ? "bg-white dark:bg-zinc-800 text-rose-500 shadow-xs" : "text-zinc-400"
                        }`}
                      >
                        Para mí
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCompanion(true)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                          isAddingCompanion ? "bg-rose-500 text-white shadow-xs" : "text-zinc-400"
                        }`}
                      >
                        + Acompañante
                      </button>
                    </div>
                  </div>

                  {isAddingCompanion && (
                    <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-1">
                      <label className="text-[10px] font-black uppercase text-rose-500">Nombre del Acompañante</label>
                      <input
                        type="text"
                        placeholder="Ej. María (Hija, Mamá, Amiga)..."
                        value={companionNameInput}
                        onChange={(e) => setCompanionNameInput(e.target.value)}
                        className="w-full p-2.5 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none"
                      />
                    </div>
                  )}

                  {/* Píldoras de Categoría */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-2xl text-[11px] font-extrabold transition-all cursor-pointer shrink-0 ${
                          selectedCategory === cat
                            ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-rose-300"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Lista de Servicios */}
                  {loadingServices ? (
                    <div className="py-12 flex items-center justify-center gap-2 text-zinc-400 text-xs font-bold">
                      <Loader2 size={20} className="animate-spin text-rose-500" />
                      <span>Cargando catálogo de servicios...</span>
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 text-xs font-medium">
                      No se encontraron servicios para esta categoría.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredServices.map((service) => {
                        const isComp = isAddingCompanion;
                        const compName = companionNameInput.trim();

                        const isInCart = cartItems.some(
                          (i) =>
                            (i.service.SKU === service.SKU || i.service.id === service.id) &&
                            i.isCompanion === isComp &&
                            (!isComp || i.companionName === compName)
                        );

                        return (
                          <div
                            key={service.SKU || service.id}
                            className={`flex items-start justify-between gap-4 p-4 sm:p-5 rounded-3xl border transition-all ${
                              isInCart
                                ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs"
                                : "border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-rose-300"
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-50">
                                {service.Servicio}
                              </h3>
                              <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                                <Clock size={12} /> {service.duracion} min
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {service.descripcion}
                              </p>
                              <div className="pt-1 font-black text-xs text-rose-500">
                                ${service.Precio.toLocaleString("es-CO")} COP
                              </div>
                            </div>

                            <button
                              onClick={() => toggleSelectService(service)}
                              className={`w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full sm:rounded-2xl font-black text-xs transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1 ${
                                isInCart
                                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                  : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-rose-400"
                              }`}
                            >
                              {isInCart ? (
                                <>
                                  <Check size={16} />
                                  <span className="hidden sm:inline">Añadido</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={16} />
                                  <span className="hidden sm:inline">Seleccionar</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PASO 2: PROFESIONAL Y SEDE CON FOTOS DE LAS ESPECIALISTAS */}
              {bookingSubStep === 2 && (selectedService || cartItems.length > 0) && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                        Seleccionar Profesional & Sede
                      </h1>
                      <p className="text-xs text-rose-500 font-bold mt-0.5">
                        Para: {selectedService?.Servicio || cartItems[0]?.service.Servicio}
                      </p>
                    </div>
                    <button
                      onClick={() => setBookingSubStep(1)}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      ← Cambiar servicio
                    </button>
                  </div>

                  {/* Selección de Sede */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400">
                      Sedes Disponibles
                    </label>
                    <LocationSearch
                      onSedeSeleccionada={(sedeMasCercana) => {
                        const nombreBuscado = (sedeMasCercana?.name || "").toLowerCase();
                        const sedeEncontrada = SEDES_INFO.find(
                          (s) => s.name.toLowerCase() === nombreBuscado
                        );

                        if (sedeEncontrada) {
                          setSelectedSede(sedeEncontrada);
                        } else {
                          setSelectedSede({
                            name: sedeMasCercana?.name || "Marquetalia",
                            address: sedeMasCercana?.address || "",
                            mapUrl: sedeMasCercana?.mapUrl || "",
                            isMain: (sedeMasCercana?.name || "") === "Marquetalia",
                          });
                        }
                      }}
                    />
                    {checkingSedesAvailability ? (
                      <div className="py-4 text-xs font-bold text-rose-500 flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verificando fechas de atención por sede...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {SEDES_INFO.map((s) => {
                          const isSelected = selectedSede.name === s.name;
                          const hasAvailableDates = sedesAvailabilityMap[s.name] ?? false;

                          return (
                            <div
                              key={s.name}
                              onClick={() => handleSelectSede(s)}
                              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                                !hasAvailableDates
                                  ? "opacity-60 bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
                                  : isSelected
                                  ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 shadow-2xs cursor-pointer"
                                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 cursor-pointer"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-extrabold text-xs block">{s.name}</span>
                                  {isSelected && hasAvailableDates && (
                                    <CheckCircle2 size={14} className="text-rose-500 shrink-0" />
                                  )}
                                  {!hasAvailableDates && (
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                                      Sin agenda
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-400 block mt-0.5 leading-tight">
                                  {s.address}
                                </span>
                              </div>

                              <a
                                href={s.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-500 hover:text-rose-700 hover:underline pt-2 border-t border-zinc-100 dark:border-zinc-800"
                              >
                                <MapPin size={11} />
                                <span>Ver en Google Maps</span>
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selección de Profesional con Fotos Grandes y Destacadas */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Profesional Capacitado
                    </label>
                    
                    {/* Opción 'Cualquier profesional' */}
                    <div
                      onClick={() => setSelectedSpecialist("")}
                      className={`flex items-center justify-between p-5 sm:p-6 rounded-3xl border bg-white dark:bg-zinc-900 cursor-pointer transition-all ${
                        selectedSpecialist === ""
                          ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-rose-200"
                      }`}
                    >
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/40">
                          <Shuffle size={28} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-50">
                            Cualquier profesional
                          </h4>
                          <p className="text-xs text-zinc-400 font-medium mt-0.5">
                            Asigna automáticamente según la máxima disponibilidad de horarios
                          </p>
                        </div>
                      </div>
                      {selectedSpecialist === "" && <CheckCircle2 size={22} className="text-rose-500 shrink-0" />}
                    </div>

                    {/* Grid de Especialistas con Fotos Ampliadas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {qualifiedSpecialistsForSelectedService.map((spec) => {
                        const isSelected = selectedSpecialist === spec;
                        const photoUrl = SPECIALIST_PHOTOS[spec];

                        return (
                          <div
                            key={spec}
                            onClick={() => setSelectedSpecialist(spec)}
                            className={`flex items-center justify-between p-4 sm:p-5 rounded-3xl border bg-white dark:bg-zinc-900 cursor-pointer transition-all ${
                              isSelected
                                ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-rose-200"
                            }`}
                          >
                            <div className="flex items-center gap-4 sm:gap-5">
                              {/* Foto Destacada (80px en móvil / 96px en escritorio) */}
                              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800 shadow-xs">
                                {photoUrl ? (
                                  <img
                                    src={photoUrl}
                                    alt={spec}
                                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                    <User size={32} />
                                  </div>
                                )}
                              </div>

                              {/* Información Nombre y Rol */}
                              <div className="space-y-1">
                                <h4 className="font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-50 leading-tight">
                                  {spec}
                                </h4>
                                <p className="text-xs text-rose-500 font-extrabold">
                                  Especialista en Belleza
                                </p>
                                <span className="inline-block text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                  Lehana Studio
                                </span>
                              </div>
                            </div>

                            {isSelected && <CheckCircle2 size={22} className="text-rose-500 shrink-0 ml-2" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-4 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black text-xs uppercase tracking-wider shadow-md hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continuar a Fecha y Hora</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* PASO 3: FECHA Y HORA DE CITA */}
              {bookingSubStep === 3 && (selectedService || cartItems.length > 0) && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                        Selecciona fecha y hora
                      </h1>
                      <p className="text-xs text-rose-500 font-bold mt-0.5">
                        Para: {selectedService?.Servicio || cartItems[0]?.service.Servicio} ({selectedSpecialist || "Cualquier profesional"})
                      </p>
                    </div>
                    <button
                      onClick={() => setBookingSubStep(2)}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      ← Cambiar profesional
                    </button>
                  </div>

                  <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex justify-center">
                    <Calendar
                      onChange={handleCalendarSelect}
                      minDate={getTomorrowDate()}
                      className="custom-lh-calendar font-sans text-xs w-full"
                    />
                  </div>

                  {selectedDate && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400">
                        Horarios Disponibles para el {selectedDate}
                      </label>

                      {loadingAvailability ? (
                        <p className="text-xs text-rose-500 font-bold animate-pulse flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" /> Consultando disponibilidad...
                        </p>
                      ) : availableSlotsForDate.length === 0 ? (
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl text-xs font-semibold text-rose-700 dark:text-rose-400">
                          No hay turnos libres para la fecha seleccionada. Por favor intenta seleccionando otro día o probando con otra especialista.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {availableSlotsForDate.map((slot) => {
                            const isSelected = selectedTime === slot.time;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                onClick={() => handleTimeSelect(slot.time)}
                                className={`p-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                                  isSelected
                                    ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20"
                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-rose-300"
                                }`}
                              >
                                {formatTime12h(slot.time)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TARJETA DE SOPORTE DIRECTO POR WHATSAPP */}
                  <div className="p-4 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <MessageCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                        ¿No encontraste un horario conveniente?
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        Escríbenos directamente a WhatsApp y te ayudamos a acomodar tu cita personalizada.
                      </p>
                    </div>

                    <a
                      href={getWhatsAppHelpLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <MessageCircle size={15} />
                      <span>Escribir a Leslie por WhatsApp</span>
                    </a>
                  </div>

                  {selectedDate && selectedTime && (
                    <button
                      type="button"
                      onClick={handleAddCurrentServiceToCart}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-pink-600 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      <span>Confirmar horario y continuar a Tus Datos</span>
                    </button>
                  )}
                </div>
              )}

              {/* PASO 4: INGRESAR DATOS Y BÚSQUEDA EN TABLA 'clientes' */}
              {bookingSubStep === 4 && (
                <form onSubmit={handleConfirmBooking} className="space-y-6 animate-in fade-in">
                  
                  {/* RESUMEN DETALLADO DEL AGENDAMIENTO */}
                  <div className="p-6 rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-950/20 dark:to-zinc-900 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/30 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-rose-500" />
                        <h2 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-50">
                          Resumen de tu Agendamiento
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBookingSubStep(1)}
                        className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-300">
                        <MapPin size={15} className="text-rose-500 shrink-0" />
                        <span>Sede: <strong>{selectedSede.name}</strong></span>
                      </div>

                      <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-300">
                        <CalendarIcon size={15} className="text-rose-500 shrink-0" />
                        <span>Fecha: <strong>{selectedDate} ({formatTime12h(selectedTime)})</strong></span>
                      </div>

                      <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-300">
                        <User size={15} className="text-rose-500 shrink-0" />
                        <span>Atiende: <strong>{selectedSpecialist || "Cualquier profesional"}</strong></span>
                      </div>

                      <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-300">
                        <Clock size={15} className="text-rose-500 shrink-0" />
                        <span>Duración total: <strong>{calculateTotalDuration()} min</strong></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-100 dark:border-rose-900/20 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-zinc-400">Servicios Incluidos:</span>
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          <span>• {item.service.Servicio} <span className="text-rose-500">({getDisplayAttendeeName(item)})</span></span>
                          <span className="text-rose-500">${item.service.Precio.toLocaleString("es-CO")} COP</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FORMULARIO DE CONTACTO */}
                  <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-xs">
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                      Tus Datos de Contacto
                    </h3>

                    {/* Teléfono Móvil */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400">
                        Teléfono Móvil (WhatsApp) *
                      </label>
                      <div className="flex gap-2">
                        <CountrySelect
                          value={indicativo}
                          onChange={(val) => setIndicativo(val)}
                        />

                        <div className="relative flex-1">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="tel"
                            required
                            placeholder="Ej: 3001234567"
                            value={clientPhone}
                            onChange={handlePhoneChange}
                            className="w-full pl-10 pr-4 py-3 text-xs font-bold rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-400"
                          />
                          {checkingClient && (
                            <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-rose-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RECONOCIMIENTO EN LA TABLA 'clientes' */}
                    {clientFound === true && (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            ¡Te hemos reconocido! Nombre: <strong>{clientName}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingName(!isEditingName)}
                            className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Edit3 size={12} />
                            <span>{isEditingName ? "Guardar" : "Cambiar nombre"}</span>
                          </button>
                        </div>

                        {isEditingName && (
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full p-2.5 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-zinc-950 outline-none"
                            placeholder="Ingresa tu nombre..."
                          />
                        )}
                      </div>
                    )}

                    {/* CLIENTE NUEVO */}
                    {(clientFound === false || clientFound === null) && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-400">
                            Nombre Completo *
                          </label>
                          <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="text"
                              required
                              placeholder="Ej: Ana María Pérez"
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 text-xs font-bold rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-zinc-400">
                            Correo Electrónico (Opcional)
                          </label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="email"
                              placeholder="Ej: ana@correo.com"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 text-xs font-bold rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-400"
                            />
                          </div>
                        </div>
                      </>
                    )}

                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-emerald-600 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Confirmando Reserva...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Confirmar Reserva (${calculateTotalPrice().toLocaleString("es-CO")} COP)</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>

            {/* COLUMNA DERECHA: SIDEBAR DE RESUMEN DE CARRITO (ESCRITORIO) */}
            <aside className="hidden lg:block space-y-4">
              <div className="sticky top-24 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl space-y-5">
                
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white font-black flex items-center justify-center shrink-0">
                    LS
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50">Lehana Studio</h3>
                    <p className="text-[10px] text-zinc-400">{selectedSede.name}, Colombia</p>
                  </div>
                </div>

                {/* Lista del Carrito */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400">
                    Carrito ({cartItems.length})
                  </h4>

                  {cartItems.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-3 text-center">No has añadido citas aún.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {cartItems.map((item) => (
                        <div key={item.id} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between text-xs">
                          <div className="max-w-[160px] space-y-0.5">
                            <span className="font-bold block truncate text-zinc-900 dark:text-zinc-100">{item.service.Servicio}</span>
                            <span className="text-[10px] text-zinc-400 block"><strong className="text-rose-500">{getDisplayAttendeeName(item)}</strong> • {item.service.duracion} min</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-rose-500">${item.service.Precio.toLocaleString("es-CO")}</span>
                            <button onClick={() => handleRemoveFromCart(item.id)} className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-zinc-400">Total Acumulado</span>
                  <span className="text-lg font-black text-rose-500">${calculateTotalPrice().toLocaleString("es-CO")} COP</span>
                </div>

                {/* BOTÓN CONTINUAR EN ESCRITORIO */}
                {cartItems.length > 0 && bookingSubStep < 4 && (
                  <button
                    onClick={handleNextStep}
                    className="w-full py-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continuar</span>
                    <ChevronRight size={14} />
                  </button>
                )}

              </div>
            </aside>

          </div>
        ) : null}

        {/* MENSAJE DE ÉXITO */}
        {bookingSuccess && (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
            <h2 className="text-2xl font-black">¡Reserva Registrada con Éxito!</h2>
            <p className="text-xs text-zinc-500">
              Registramos tus reservas asociadas al celular <span className="font-bold text-zinc-800 dark:text-zinc-200">+{indicativo} {clientPhone}</span> y enviamos los detalles a tu WhatsApp.
            </p>
            <button
              onClick={resetAll}
              className="px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold text-xs cursor-pointer hover:opacity-90 transition-all"
            >
              Realizar otra reserva
            </button>
          </div>
        )}

      </main>

      {/* BARRA FLOTANTE INFERIOR MÓVIL ESTILO FRESHA */}
      {!bookingSuccess && cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-base font-black text-rose-500">
                ${calculateTotalPrice().toLocaleString("es-CO")} COP
              </div>
              <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5">
                <span>🛒 {cartItems.length} {cartItems.length === 1 ? "servicio" : "servicios"}</span>
                <span>•</span>
                <span>{calculateTotalDuration()} min</span>
              </div>
            </div>

            {bookingSubStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer touch-manipulation active:scale-95 transition-transform"
              >
                <span>Continuar</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer touch-manipulation active:scale-95 transition-transform disabled:opacity-50"
              >
                <span>Finalizar</span>
                <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ESTILOS DEL CALENDARIO */}
      <style jsx global>{`
        .custom-lh-calendar {
          border: none !important;
          background: transparent !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        .custom-lh-calendar .react-calendar__navigation {
          display: flex;
          margin-bottom: 1rem;
        }

        .custom-lh-calendar .react-calendar__navigation button {
          font-weight: 800;
          color: #18181b;
          border-radius: 0.75rem;
          padding: 0.5rem;
          background: transparent;
        }

        .custom-lh-calendar .react-calendar__navigation button:enabled:hover {
          background-color: #ffe4e6;
        }

        .custom-lh-calendar .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-weight: 800;
          font-size: 0.7rem;
          color: #a1a1aa;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .custom-lh-calendar .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }

        .custom-lh-calendar .react-calendar__tile {
          padding: 0.75rem 0.5rem;
          font-weight: 700;
          border-radius: 0.75rem !important;
          color: #e11d48;
          background: #fff1f2;
          margin: 2px 0;
          transition: all 0.2s;
        }

        .custom-lh-calendar .react-calendar__tile:enabled:hover {
          background-color: #f43f5e !important;
          color: white !important;
        }

        .custom-lh-calendar .react-calendar__tile--now {
          background: #fecdd3 !important;
          color: #9f1239 !important;
        }

        .custom-lh-calendar .react-calendar__tile--active {
          background: #e11d48 !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
        }

        .custom-lh-calendar .react-calendar__tile:disabled {
          background-color: #f4f4f5 !important;
          color: #d4d4d8 !important;
          cursor: not-allowed !important;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-zinc-50">
          <p className="text-xs font-bold text-rose-600 animate-pulse">
            Cargando portal de reservas...
          </p>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}