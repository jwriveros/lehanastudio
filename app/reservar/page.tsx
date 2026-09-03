"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "@/lib/supabaseClient";
import {
  Phone,
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Sparkles,
  Search,
  History,
  ArrowLeft,
  X,
  AlertCircle,
  Clock,
  UserCheck,
  User,
  MapPin,
  Check,
  ShieldCheck,
  ExternalLink,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

const SEDES_INFO = [
  {
    name: "Marquetalia",
    address: "Marquetalia, Palomino, La Guajira",
    mapUrl: "https://maps.app.goo.gl/hubKPjEnApSYAxrv6",
  },
  {
    name: "Buga",
    address: "Carrera 14 # 6-32, Buga, Valle del Cauca",
    mapUrl: "https://www.google.com/maps?q=3.899355,-76.3000322&z=17&hl=es",
  },
  {
    name: "Santa Marta",
    address: "Carrera 3 # 18-20, Centro Histórico, Santa Marta",
    mapUrl: "https://maps.app.goo.gl/azMUpzjVAGRGapez6",
  },
];

interface ServiceItem {
  id: string;
  Servicio: string;
  Precio: number;
  duracion: number;
  category: string;
  especialistas: string | string[];
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
  attendeeName: string;
  isCompanion: boolean;
  service: ServiceItem;
  date: string;
  time: string;
  specialist: string;
  sede: string;
}

// Convierte hora de 24h a 12h (AM/PM)
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

export default function BookingPage() {
  const [step, setStep] = useState<"identify" | "register" | "profile" | "booking" | "summary">("identify");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [searching, setSearching] = useState(false);

  // Datos del Cliente Principal
  const [clientId, setClientId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGenero] = useState("Femenino");
  const [city, setMunicipio] = useState("");
  const [address, setDireccion] = useState("");
  const [selectedSede, setSelectedSede] = useState(SEDES_INFO[0]);

  // Historial y Catálogo
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);

  // Carrito de Servicios Agregados
  const [cartItems, setCartItems] = useState<BookingCartItem[]>([]);

  // Beneficiario del servicio actual
  const [currentAttendeeName, setCurrentAttendeeName] = useState("");
  const [isAddingCompanion, setIsAddingCompanion] = useState(false);
  const [companionNameInput, setCompanionNameInput] = useState("");

  // Búsqueda de Servicio Actual
  const [serviceQuery, setServiceSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Especialistas calificadas
  const [serviceQualifiedSpecialists, setServiceQualifiedSpecialists] = useState<string[]>([]);
  const [preferredSpecialistFilter, setPreferredSpecialistFilter] = useState<string>("");

  // Disponibilidad de la API
  const [availabilityData, setAvailabilityData] = useState<DateAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Selección de Cita Actual
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSpecialist, setSelectedSpecialist] = useState("");
  const [currentSlotSpecialists, setCurrentSlotSpecialists] = useState<string[]>([]);
  const [availableSlotsForDate, setAvailableSlotsForDate] = useState<SlotDetail[]>([]);
  const [dateError, setDateError] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchAvailability(selectedService.id, selectedSede.name, preferredSpecialistFilter);
    }
  }, [selectedService, selectedSede, preferredSpecialistFilter]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, Servicio, Precio, duracion, category, especialistas")
      .order("category", { ascending: true })
      .order("Servicio", { ascending: true });

    if (!error && data) {
      setAllServices(data);
    }
  };

  const fetchAvailability = async (serviceId: string, sedeName: string, specialistName?: string) => {
    setLoadingAvailability(true);
    setDateError("");
    setSelectedDate("");
    setSelectedTime("");
    setSelectedSpecialist("");
    setAvailableSlotsForDate([]);
    setCurrentSlotSpecialists([]);

    try {
      let url = `/api/availability?service_id=${serviceId}&sede=${encodeURIComponent(sedeName)}`;
      if (specialistName) {
        url += `&specialist=${encodeURIComponent(specialistName)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.available_dates) {
        setAvailabilityData(data.available_dates);
      } else {
        setAvailabilityData([]);
        setDateError("No se encontró disponibilidad para las opciones seleccionadas.");
      }
    } catch (err) {
      console.error("Error cargando disponibilidad:", err);
      setAvailabilityData([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const isTileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const tomorrow = getTomorrowDate();
      if (date < tomorrow) return true;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const isAvailable = availabilityData.some((item) => item.date === formattedDate);
      return !isAvailable;
    }
    return false;
  };

  const handleCalendarSelect = (value: any) => {
    if (!(value instanceof Date)) return;

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    setSelectedDate(dateStr);
    setSelectedTime("");
    setSelectedSpecialist("");
    setCurrentSlotSpecialists([]);
    setDateError("");

    const matchDay = availabilityData.find((d) => d.date === dateStr);
    if (matchDay) {
      setAvailableSlotsForDate(matchDay.slots);
    } else {
      setAvailableSlotsForDate([]);
    }
  };

  const handleTimeSelect = (timeValue: string) => {
    setSelectedTime(timeValue);
    setSelectedSpecialist("");

    const slotDetail = availableSlotsForDate.find((s) => s.time === timeValue);
    if (slotDetail) {
      const specList = slotDetail.available_specialists || [slotDetail.assigned_specialist];
      setCurrentSlotSpecialists(specList);
      setSelectedSpecialist(specList[0]);
    } else {
      setCurrentSlotSpecialists([]);
    }
  };

  const selectSuggestedService = (service: ServiceItem) => {
    setSelectedService(service);
    setServiceSearchTerm(service.Servicio);
    setShowSuggestions(false);

    let specs: string[] = [];
    if (typeof service.especialistas === "string") {
      try {
        specs = JSON.parse(service.especialistas);
      } catch (e) {
        specs = [service.especialistas];
      }
    } else if (Array.isArray(service.especialistas)) {
      specs = service.especialistas;
    }

    setServiceQualifiedSpecialists(specs);
    setPreferredSpecialistFilter("");
  };

  const clearSelectedService = () => {
    setSelectedService(null);
    setServiceSearchTerm("");
    setShowSuggestions(true);
    setServiceQualifiedSpecialists([]);
    setPreferredSpecialistFilter("");
    setAvailabilityData([]);
    setSelectedDate("");
    setSelectedTime("");
    setSelectedSpecialist("");
    setCurrentSlotSpecialists([]);
    setDateError("");
  };

  const mainClientFullName = `${firstName} ${lastName}`.trim() || "Para mí";

  const getActiveAttendeeName = () => {
    if (isAddingCompanion) {
      return companionNameInput.trim() ? companionNameInput.trim() : "Acompañante";
    }
    return currentAttendeeName || mainClientFullName;
  };

  const handleAddServiceToCart = () => {
    if (!selectedService || !selectedDate || !selectedTime || !selectedSpecialist) return;

    const attendee = getActiveAttendeeName();

    const newItem: BookingCartItem = {
      id: Math.random().toString(36).substring(2, 9),
      attendeeName: attendee,
      isCompanion: isAddingCompanion || attendee !== mainClientFullName,
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      specialist: selectedSpecialist,
      sede: selectedSede.name,
    };

    setCartItems([...cartItems, newItem]);

    setSelectedService(null);
    setServiceSearchTerm("");
    setServiceQualifiedSpecialists([]);
    setPreferredSpecialistFilter("");
    setSelectedDate("");
    setSelectedTime("");
    setSelectedSpecialist("");
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const resetAll = () => {
    setStep("identify");
    setPhoneSearch("");
    setClientId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setMunicipio("");
    setDireccion("");
    setGenero("Femenino");
    setPastAppointments([]);
    setCartItems([]);
    setCurrentAttendeeName("");
    setIsAddingCompanion(false);
    setCompanionNameInput("");
    setSelectedService(null);
    setServiceSearchTerm("");
    setShowSuggestions(false);
    setServiceQualifiedSpecialists([]);
    setPreferredSpecialistFilter("");
    setSelectedDate("");
    setSelectedTime("");
    setSelectedSpecialist("");
    setAvailabilityData([]);
    setDateError("");
    setBookingSuccess(false);
  };

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneSearch.replace(/\D/g, "");
    if (!cleanPhone) return;

    setSearching(true);

    try {
      const { data: clientRes } = await supabase
        .from("clients")
        .select("*")
        .or(`celular.eq.${cleanPhone},telefono.eq.${cleanPhone}`)
        .limit(1);

      if (clientRes && clientRes.length > 0) {
        const c = clientRes[0];
        setClientId(c.id);
        const nameParts = (c.nombre || "").split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
        setEmail(c.correo_electronico || "");
        setMunicipio(c.municipio || "");
        setDireccion(c.direccion || "");
        setGenero(c.genero || "Femenino");

        const { data: appts } = await supabase
          .from("appointments")
          .select("*")
          .eq("celular", cleanPhone)
          .order("appointment_at", { ascending: false });

        setPastAppointments(appts || []);
        setStep("profile");
      } else {
        setFirstName("");
        setLastName("");
        setEmail("");
        setMunicipio("");
        setDireccion("");
        setStep("register");
      }
    } catch (err) {
      console.error("Error buscando cliente:", err);
      setStep("register");
    } finally {
      setSearching(false);
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);

    const fullName = `${firstName} ${lastName}`.trim();
    const cleanPhone = phoneSearch.replace(/\D/g, "");

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            nombre: fullName,
            celular: cleanPhone,
            correo_electronico: email,
            municipio: city,
            direccion: address,
            genero: gender,
            sede: selectedSede.name,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setClientId(data[0].id);
      }

      setPastAppointments([]);
      setStep("profile");
    } catch (err) {
      console.error("Error creando cliente:", err);
      alert("Ocurrió un error al guardar tu registro.");
    } finally {
      setSearching(false);
    }
  };

  /* =========================================================
     🔥 CONFIRMACIÓN DE RESERVA A TRAVÉS DE /api/booking/create
     Guarda en Supabase y dispara la notificación de WhatsApp vía n8n
  ========================================================= */
  const handleConfirmBooking = async () => {
    let finalItems = [...cartItems];
    if (selectedService && selectedDate && selectedTime && selectedSpecialist) {
      finalItems.push({
        id: Math.random().toString(36).substring(2, 9),
        attendeeName: getActiveAttendeeName(),
        isCompanion: isAddingCompanion,
        service: selectedService,
        date: selectedDate,
        time: selectedTime,
        specialist: selectedSpecialist,
        sede: selectedSede.name,
      });
    }

    if (finalItems.length === 0) return;
    setBookingLoading(true);

    try {
      const cleanPhone = phoneSearch.replace(/\D/g, "");
      const clientFullName = `${firstName} ${lastName}`.trim();

      // Mapear los elementos al formato que requiere api/booking/create/route.ts
      const itemsPayload = finalItems.map((item) => ({
        servicio: item.service.Servicio,
        especialista: item.specialist,
        appointment_at: `${item.date}T${item.time}:00`,
        duration: item.service.duracion,
        price: item.service.Precio,
      }));

      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente: clientFullName,
          celular: cleanPhone,
          indicativo: "57",
          sede: selectedSede.name,
          cantidad: finalItems.length,
          items: itemsPayload,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.ok) {
        throw new Error(resData.error || "Error al procesar la reserva");
      }

      setBookingSuccess(true);
      setStep("booking");
    } catch (err: any) {
      console.error("Error al agendar citas:", err);
      alert(`No se pudo confirmar la cita: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredServices = allServices.filter(
    (s) =>
      s.Servicio.toLowerCase().includes(serviceQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(serviceQuery.toLowerCase())
  );

  const calculateTotalPrice = () => {
    let total = cartItems.reduce((acc, item) => acc + item.service.Precio, 0);
    if (selectedService) {
      total += selectedService.Precio;
    }
    return total;
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-800 font-sans flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-[0.2em] text-zinc-900 uppercase">
              LEHANA STUDIO
            </span>
            <span className="text-[9px] font-bold tracking-[0.25em] text-rose-600 uppercase -mt-1">
              BEAUTY & ACADEMY
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition-all"
          >
            <ArrowLeft size={14} />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 py-6 sm:py-10">
        <div className="rounded-3xl border border-pink-100 bg-white p-4 sm:p-10 shadow-xl space-y-6 sm:space-y-8">
          
          {step === "identify" && (
            <div className="space-y-6 max-w-md mx-auto py-6">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-700">
                  <Sparkles size={14} /> Portal de Agendamiento
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Ingresa tu Celular</h1>
                <p className="text-xs sm:text-sm text-zinc-500">
                  Escribe tu número de WhatsApp para ver tu perfil, revisar tus citas o agendar un nuevo servicio.
                </p>
              </div>

              <form onSubmit={handleIdentify} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Número de WhatsApp</label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="Ej. 3000000000"
                      required
                      value={phoneSearch}
                      onChange={(e) => setPhoneSearch(e.target.value)}
                      className="w-full p-4 pl-11 text-sm rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 outline-none focus:border-rose-500 font-semibold"
                    />
                    <Phone size={18} className="absolute left-4 top-4 text-zinc-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={searching}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-emerald-600 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {searching ? "Buscando..." : "Buscar Cuenta / Continuar"}
                </button>
              </form>
            </div>
          )}

          {step === "register" && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900">Registro de Cliente</h2>
                  <p className="text-xs sm:text-sm text-zinc-500">No encontramos el número {phoneSearch}. Completa tus datos.</p>
                </div>
                <button
                  onClick={() => setStep("identify")}
                  className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 bg-zinc-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl"
                >
                  <ArrowLeft size={14} /> Cancelar
                </button>
              </div>

              <form onSubmit={handleRegisterClient} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Nombres</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Apellidos</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Género</label>
                    <select
                      value={gender}
                      onChange={(e) => setGenero(e.target.value)}
                      className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none font-semibold"
                    >
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Municipio / Ciudad</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setMunicipio(e.target.value)}
                      className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Dirección</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep("identify")}
                    className="w-1/3 rounded-2xl bg-zinc-100 text-zinc-700 font-bold py-3.5 hover:bg-zinc-200 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={searching}
                    className="w-2/3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-emerald-600 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {searching ? "Guardando..." : "Guardar & Continuar"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "profile" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900">{firstName} {lastName}</h2>
                  <p className="text-xs sm:text-sm text-zinc-500">{phoneSearch} • {city || "Sin municipio"}</p>
                </div>

                <button
                  onClick={resetAll}
                  className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors w-max"
                >
                  <ArrowLeft size={14} /> Salir
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                    <History size={16} className="text-rose-500" /> Historial de Citas
                  </h3>
                  <button
                    onClick={() => setStep("booking")}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl shadow-md cursor-pointer"
                  >
                    <Plus size={16} /> Agendar Cita
                  </button>
                </div>

                {pastAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {pastAppointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50 flex items-center justify-between text-xs sm:text-sm"
                      >
                        <div>
                          <p className="font-bold text-zinc-900">{appt.servicio}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {appt.sede} • {new Date(appt.appointment_at).toLocaleDateString("es-CO")}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700">
                          {appt.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-zinc-400 text-center py-10">Aún no tienes citas registradas.</p>
                )}
              </div>
            </div>
          )}

          {/* VISTA DE CONFIGURACIÓN DE LA RESERVA */}
          {step === "booking" && !bookingSuccess && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900">Nueva Cita</h2>
                  <p className="text-xs sm:text-sm text-zinc-500">Agrega servicios para ti o tus familiares</p>
                </div>
                <button
                  onClick={() => setStep("profile")}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-800"
                >
                  ← Volver
                </button>
              </div>

              {/* RESUMEN DEL CARRITO DE CITAS */}
              {cartItems.length > 0 && (
                <div className="space-y-3 p-4 bg-rose-50/40 border border-rose-100 rounded-3xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Users size={16} className="text-rose-600" /> Citas añadidas en esta reserva ({cartItems.length})
                    </h3>
                    <span className="text-xs font-black text-rose-600">Total: ${calculateTotalPrice().toLocaleString()} COP</span>
                  </div>

                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-white rounded-2xl border border-zinc-200 flex items-center justify-between text-xs gap-2"
                      >
                        <div>
                          <p className="font-extrabold text-zinc-900">
                            {item.attendeeName} • <span className="text-rose-600">{item.service.Servicio}</span>
                          </p>
                          <p className="text-zinc-500 mt-0.5">
                            {item.date} a las {formatTime12h(item.time)} hs con {item.specialist} (Sede {item.sede})
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-zinc-800">${item.service.Precio.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SELECCIÓN DE BENEFICIARIO */}
              <div className="space-y-3 p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-3xl">
                <label className="text-xs sm:text-sm font-bold text-zinc-800 block">
                  ¿Para quién es este servicio?
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCompanion(false);
                      setCurrentAttendeeName(mainClientFullName);
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      !isAddingCompanion
                        ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <User size={14} /> Para mí ({firstName})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCompanion(true);
                      if (!companionNameInput) setCompanionNameInput("");
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isAddingCompanion
                        ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                        : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
                    }`}
                  >
                    <UserPlus size={14} /> + Añadir Acompañante
                  </button>
                </div>

                {isAddingCompanion && (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Escribe el nombre o parentesco (ej. María, Mamá, Hija)..."
                      value={companionNameInput}
                      onChange={(e) => setCompanionNameInput(e.target.value)}
                      className="w-full p-3.5 text-xs sm:text-sm font-bold rounded-2xl border border-rose-300 bg-white text-rose-900 outline-none focus:border-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* SEDE CON MAPA */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-bold text-zinc-700 block">
                  Sede del Estudio
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SEDES_INFO.map((s) => {
                    const isSelected = selectedSede.name === s.name;
                    return (
                      <div
                        key={s.name}
                        onClick={() => setSelectedSede(s)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? "border-rose-500 bg-rose-50/50 shadow-md shadow-rose-500/10"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className={`text-xs font-black ${isSelected ? "text-rose-700" : "text-zinc-800"}`}>
                              {s.name}
                            </span>
                            {isSelected ? (
                              <CheckCircle2 size={16} className="text-rose-600" />
                            ) : (
                              <MapPin size={14} className="text-zinc-400" />
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-500 font-medium block">
                            {s.address}
                          </span>
                        </div>

                        <a
                          href={s.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline"
                        >
                          <span>Ver en Google Maps</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PASO 1: SERVICIO */}
              <div className="space-y-1 relative" ref={suggestionsRef}>
                <label className="text-xs sm:text-sm font-bold text-zinc-700 block">
                  1. Selecciona Servicio {isAddingCompanion && companionNameInput ? `para ${companionNameInput}` : "para Ti"}
                </label>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Escribe para buscar (ej. Cejas, Pestañas, Limpieza)..."
                    value={serviceQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setServiceSearchTerm(e.target.value);
                      setSelectedService(null);
                      setShowSuggestions(true);
                      setServiceQualifiedSpecialists([]);
                      setPreferredSpecialistFilter("");
                      setAvailabilityData([]);
                      setSelectedDate("");
                      setSelectedTime("");
                      setSelectedSpecialist("");
                      setCurrentSlotSpecialists([]);
                      setDateError("");
                    }}
                    className={`w-full p-3.5 pl-10 pr-10 text-xs sm:text-sm font-semibold rounded-2xl border outline-none transition-colors ${
                      selectedService
                        ? "border-emerald-500 bg-emerald-50/40 text-emerald-900 font-bold"
                        : "border-zinc-200 bg-zinc-50 focus:border-rose-500"
                    }`}
                  />
                  <Search size={16} className="absolute left-3.5 top-4 text-zinc-400 pointer-events-none" />

                  {selectedService && (
                    <button
                      type="button"
                      onClick={clearSelectedService}
                      className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-700 p-1 rounded-full hover:bg-zinc-200"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {showSuggestions && !selectedService && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-zinc-200 rounded-2xl shadow-2xl divide-y divide-zinc-100 text-xs sm:text-sm">
                    {filteredServices.length > 0 ? (
                      filteredServices.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => selectSuggestedService(s)}
                          className="w-full text-left p-3.5 hover:bg-rose-50/70 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-zinc-800 group-hover:text-rose-700">{s.Servicio}</p>
                            <p className="text-xs text-zinc-400">{s.category} • {s.duracion} min</p>
                          </div>
                          <span className="font-extrabold text-rose-600 text-xs bg-rose-50 px-2.5 py-1 rounded-lg">
                            ${s.Precio.toLocaleString()} COP
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-zinc-400">No se encontraron servicios.</div>
                    )}
                  </div>
                )}
              </div>

              {/* PASO 2: ESPECIALISTA PREFERIDA */}
              {selectedService && (
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-zinc-700 block">
                    2. Especialista de Preferencia
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferredSpecialistFilter("")}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        preferredSpecialistFilter === ""
                          ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      <Sparkles size={14} /> Cualquiera disponible (Recomendado)
                    </button>

                    {serviceQualifiedSpecialists.map((spec) => {
                      const isSelected = preferredSpecialistFilter === spec;
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => setPreferredSpecialistFilter(spec)}
                          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          }`}
                        >
                          <User size={14} /> {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 3: CALENDARIO */}
              {selectedService && (
                <div className="space-y-3 pt-2">
                  <label className="text-xs sm:text-sm font-bold text-zinc-700 block">
                    3. Selecciona la Fecha en el Calendario
                  </label>

                  <div className="p-2 sm:p-4 bg-zinc-50 border border-zinc-200 rounded-3xl flex justify-center overflow-x-auto">
                    <Calendar
                      onChange={handleCalendarSelect}
                      tileDisabled={isTileDisabled}
                      minDate={getTomorrowDate()}
                      className="custom-lh-calendar font-sans text-xs sm:text-sm w-full max-w-full"
                    />
                  </div>

                  {selectedDate && (
                    <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      Fecha seleccionada: {selectedDate}
                    </p>
                  )}
                </div>
              )}

              {/* PASO 4: HORA DISPONIBLE */}
              {selectedDate && (
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-bold text-zinc-700 block">
                    4. Hora Disponible
                  </label>

                  {availableSlotsForDate.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">No hay horarios libres para esta fecha.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
                      {availableSlotsForDate.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => handleTimeSelect(slot.time)}
                            className={`p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between ${
                              isSelected
                                ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20"
                                : "bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-rose-50 hover:border-rose-300"
                            }`}
                          >
                            <span>{formatTime12h(slot.time)}</span>
                            {isSelected && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SELECCIÓN FINAL SI HAY MÁS DE 1 LIBRE */}
              {selectedTime && preferredSpecialistFilter === "" && currentSlotSpecialists.length > 1 && (
                <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-3">
                  <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <UserCheck size={16} className="text-rose-600" />
                    Hay {currentSlotSpecialists.length} especialistas disponibles a las {formatTime12h(selectedTime)}. Selecciona una:
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {currentSlotSpecialists.map((specName) => (
                      <button
                        type="button"
                        key={specName}
                        onClick={() => setSelectedSpecialist(specName)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedSpecialist === specName
                            ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                            : "bg-white text-zinc-700 border border-zinc-200 hover:bg-rose-100"
                        }`}
                      >
                        {specName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BOTÓN DE ADICIÓN AL CARRITO */}
              {selectedService && selectedDate && selectedTime && selectedSpecialist && (
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleAddServiceToCart}
                    className="w-full p-4 rounded-2xl border-2 border-rose-500 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-500/10"
                  >
                    <Plus size={18} />
                    <span>
                      Añadir este servicio a la reserva ({getActiveAttendeeName()})
                    </span>
                  </button>
                </div>
              )}

              {/* INDICADOR DE CARGA */}
              {loadingAvailability && (
                <p className="text-xs text-rose-600 font-bold animate-pulse flex items-center gap-1.5">
                  <Clock size={14} /> Consultando disponibilidad...
                </p>
              )}

              {/* ALERTA DE ERROR */}
              {dateError && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                  <span>{dateError}</span>
                </div>
              )}

              {/* ACCIONES DE VERIFICACIÓN */}
              <div className="pt-4 flex justify-between items-center text-xs sm:text-sm">
                <button
                  onClick={() => setStep("profile")}
                  className="text-zinc-500 hover:text-zinc-800 font-bold"
                >
                  ← Volver al Perfil
                </button>
                <button
                  type="button"
                  onClick={() => setStep("summary")}
                  disabled={cartItems.length === 0 && (!selectedService || !selectedDate || !selectedTime || !selectedSpecialist)}
                  className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3.5 sm:px-8 font-bold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-emerald-600 transition-all active:scale-95 disabled:opacity-40 cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck size={18} />
                  <span>Verificar Disponibilidad {cartItems.length > 0 && `(${cartItems.length + (selectedService ? 1 : 0)})`}</span>
                </button>
              </div>
            </div>
          )}

          {/* VISTA RESUMEN */}
          {step === "summary" && !bookingSuccess && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900">Resumen de tu Reserva</h2>
                  <p className="text-xs sm:text-sm text-zinc-500">Por favor revisa todos los detalles antes de confirmar</p>
                </div>
                <button
                  onClick={() => setStep("booking")}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Editar o añadir más
                </button>
              </div>

              {/* LISTA DE CITAS A CONFIRMAR */}
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={item.id} className="bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 border border-rose-100 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start border-b border-rose-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100/60 px-2.5 py-0.5 rounded-full">
                          Cita #{index + 1} • Para: {item.attendeeName}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-zinc-900 mt-1">
                          {item.service.Servicio}
                        </h3>
                      </div>
                      <span className="text-base font-black text-rose-600">
                        ${item.service.Precio.toLocaleString()} COP
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-zinc-100">
                        <p className="text-zinc-400 font-bold text-[10px] uppercase">Fecha & Hora</p>
                        <p className="font-extrabold text-zinc-800">{item.date}</p>
                        <p className="font-bold text-rose-600">{formatTime12h(item.time)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-zinc-100">
                        <p className="text-zinc-400 font-bold text-[10px] uppercase">Atendida por</p>
                        <p className="font-extrabold text-zinc-800">{item.specialist}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-zinc-100">
                        <p className="text-zinc-400 font-bold text-[10px] uppercase">Sede</p>
                        <p className="font-extrabold text-zinc-800">Sede {item.sede}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Si hay un elemento configurado actualmente sin añadir explícitamente */}
                {selectedService && selectedDate && selectedTime && selectedSpecialist && (
                  <div className="bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 border border-rose-100 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start border-b border-rose-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100/60 px-2.5 py-0.5 rounded-full">
                          Cita #{cartItems.length + 1} • Para: {getActiveAttendeeName()}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-zinc-900 mt-1">
                          {selectedService.Servicio}
                        </h3>
                      </div>
                      <span className="text-base font-black text-rose-600">
                        ${selectedService.Precio.toLocaleString()} COP
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-zinc-100">
                        <p className="text-zinc-400 font-bold text-[10px] uppercase">Fecha & Hora</p>
                        <p className="font-extrabold text-zinc-800">{selectedDate}</p>
                        <p className="font-bold text-rose-600">{formatTime12h(selectedTime)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-zinc-100">
                        <p className="text-zinc-400 font-bold text-[10px] uppercase">Atendida por</p>
                        <p className="font-extrabold text-zinc-800">{selectedSpecialist}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-zinc-100">
                        <p className="text-zinc-400 font-bold text-[10px] uppercase">Sede</p>
                        <p className="font-extrabold text-zinc-800">Sede {selectedSede.name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RESUMEN TOTAL */}
              <div className="p-4 bg-zinc-900 text-white rounded-2xl flex justify-between items-center text-sm font-bold">
                <span>Total a Pagar ({cartItems.length + (selectedService ? 1 : 0)} Cita/s):</span>
                <span className="text-lg text-rose-400 font-black">${calculateTotalPrice().toLocaleString()} COP</span>
              </div>

              {/* ACCIONES FINALES */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("booking")}
                  className="w-full sm:w-auto text-zinc-500 hover:text-zinc-800 font-bold text-xs sm:text-sm py-2"
                >
                  ← Añadir otra cita o cambiar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-4 font-bold text-white shadow-xl shadow-emerald-600/20 hover:from-emerald-700 hover:to-emerald-600 transition-all active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <CheckCircle2 size={20} />
                  <span>{bookingLoading ? "Guardando Citas & Enviando WhatsApp..." : "Confirmar Cita"}</span>
                </button>
              </div>
            </div>
          )}

          {bookingSuccess && (
            <div className="py-12 text-center space-y-4">
              <div className="w-20 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-zinc-900">¡Citas Confirmadas con Éxito!</h2>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
                Hemos registrado todas las reservas asociadas al celular <span className="font-bold text-zinc-800">{phoneSearch}</span> y enviado la confirmación por WhatsApp.
              </p>
              <button
                onClick={resetAll}
                className="mt-6 rounded-2xl bg-zinc-900 px-8 py-3.5 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer"
              >
                Volver al Inicio
              </button>
            </div>
          )}

        </div>
      </main>

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