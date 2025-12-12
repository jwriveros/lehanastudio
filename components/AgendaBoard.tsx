// jwriveros/lehanastudio/lehanastudio-96f5232a8f8811af1eab69428dde275c2bc1a958/components/AgendaBoard.tsx
"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

import {
  AppointmentStatus,
  appointmentStatuses,
} from "@/lib/mockData";

type AgendaBoardProps = {
  externalBookingSignal?: number | null;
  renderCalendarShell?: boolean;
  onBookingClose?: () => void;
  // New props for initial data
  initialAppointmentList: Appointment[];
  initialClientRecords: ClientRecord[];
  initialServiceRecords: ServiceRecord[];
  initialSpecialistRecords: SpecialistRecord[];
};

export type Appointment = {
  id: number;
  cliente: string;
  servicio: string;
  especialista: string;
  celular: string;
  // Aceptamos null para evitar el error de "split of null"
  appointment_at: string | null;
  estado: AppointmentStatus;
  sede: string;
  bg_color: string;
  price: number;
  is_paid: boolean;
  notas: string;
  duration?: number;
  fecha?: string;
  hora?: string;
};

// Nuevo tipo para manejar la información del cliente
type ClientRecord = {
  nombre: string;
  celular: string | number | null;
  numberc: string | null;
};

// Nuevo tipo para manejar la información del servicio (basado en la BD)
type ServiceRecord = {
    Servicio: string;
    SKU: string;
    Precio: number;
    duracion: number;
    category?: string;
};

// Nuevo tipo para manejar la información del especialista (cargado de app_users)
type SpecialistRecord = {
    id: string;
    name: string;
    role: string; // Puede ser 'ESPECIALISTA' o 'SPECIALIST'
    color: string;
};

// FIX 1: Lista completa y correcta de estados, incluyendo la etiqueta que usa el formulario.
const ALL_APPOINTMENT_STATUSES: AppointmentStatus[] = [
    "Cita pendiente" as AppointmentStatus,
    "Cita confirmada" as AppointmentStatus,
    "Cita pagada" as AppointmentStatus,
    "Cita cancelada" as AppointmentStatus,
    "No presentada" as AppointmentStatus,
    "Nueva reserva creada" as AppointmentStatus,
];

const MINUTES_START = 7 * 60; // 07:00
const MINUTES_END = 20.5 * 60; // 20:30 (Asegura que 20:00 se muestre completo)
const STEP = 30; // 30 minutes
const ROW_HEIGHT = 52;
const TOTAL_MINUTES = MINUTES_END - MINUTES_START;
const COLUMN_HEIGHT = ((MINUTES_END - MINUTES_START) / STEP) * ROW_HEIGHT;


function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function formatDateISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

// CORRECCIÓN DE ERROR "split of null": Manejo seguro de nulos
function getAppointmentDetails(isoString: string | null) {
  if (!isoString) {
    return {
      date: new Date(),
      timeString: "--:--",
      time24: "",
      minutes: 0,
      dateISO: "",
    };
  }

  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return {
      date: new Date(),
      timeString: "--:--",
      time24: "",
      minutes: 0,
      dateISO: "",
    };
  }

  const dateISO = isoString.split("T")[0];

  // 🔴 CÁLCULO EN 24H (PARA POSICIÓN Y INPUT)
  const h = date.getHours();
  const m = date.getMinutes();
  const minutes = h * 60 + m;

  const time24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  // 🟢 SOLO PARA MOSTRAR
  const timeString = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date, timeString, time24, minutes, dateISO };
}



function minutesToTimeString(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const dayFormatter = new Intl.DateTimeFormat("es", { weekday: "short" });

// FIX 1.2: Función para obtener la fecha actual anclada a medianoche local (para evitar desfase por TimeZone)
function getLocalMidnight(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

import { useUIStore } from "@/lib/uiStore";

export function AgendaBoard({
  externalBookingSignal,
  renderCalendarShell = true,
  onBookingClose,
  initialAppointmentList,
  initialClientRecords,
  initialServiceRecords,
  initialSpecialistRecords,
}: AgendaBoardProps) {
  const { openBookingModal } = useUIStore();
  const [appointmentList, setAppointmentList] = useState<Appointment[]>(initialAppointmentList);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  
  // FIX 1.3: Usar getLocalMidnight(new Date()) para inicializar baseDate
  const [baseDate, setBaseDate] = useState<Date>(getLocalMidnight(new Date())); 
  
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [specialistFilter, setSpecialistFilter] = useState<string>("ALL");
  
  // FIX 3: ESTADO MULTI-SELECT: Inicializado con todos los estados
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus[]>(ALL_APPOINTMENT_STATUSES); 
  const [showStatusMenu, setShowStatusMenu] = useState(false); 

  // FIX: Declaración de estados faltantes
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const [mobileSelectedSpecialist, setMobileSelectedSpecialist] = useState<string | null>(null);
  const [isEditingDate, setIsEditingDate] = useState<boolean>(false);


  const [bookingForm, setBookingForm] = useState({
    open: false,
    customer: "",
    phone: "",
    guests: 1,
    service: "", 
    specialist: "", 
    price: 0, 
    date: formatDateISO(baseDate),
    time: "09:00",
    location: "Marquetalia",
    notes: "",
    status: "Nueva reserva creada" as AppointmentStatus, // FIX 1: Usar el estado correcto
  });

  const [clientRecords, setClientRecords] = useState<ClientRecord[]>(initialClientRecords);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(initialServiceRecords);
  const [specialistRecords, setSpecialistRecords] = useState<SpecialistRecord[]>(initialSpecialistRecords);

  const [serviceSuggestions, setServiceSuggestions] = useState<ServiceRecord[]>([]);
  const [clientSuggestions, setClientSuggestions] = useState<ClientRecord[]>([]);

  useEffect(() => {
    const fetchServiceSuggestions = async () => {
      if (bookingForm.service.length > 1) { // Only fetch if user has typed something
        try {
          const response = await fetch(`/api/autocomplete/services?q=${bookingForm.service}`);
          if (response.ok) {
            const data = await response.json();
            setServiceSuggestions(data);
          } else {
            console.error("Failed to fetch service suggestions:", response.statusText);
            setServiceSuggestions([]);
          }
        } catch (error) {
          console.error("Error fetching service suggestions:", error);
          setServiceSuggestions([]);
        }
      } else {
        setServiceSuggestions([]); // Clear suggestions if query is too short
      }
    };
    fetchServiceSuggestions();
  }, [bookingForm.service]);


  useEffect(() => {
  const fetchClientSuggestions = async () => {
    const nameQuery = bookingForm.customer.trim();
    const phoneQuery = bookingForm.phone.replace(/\D/g, '').trim();

    // Nada para buscar
    if (nameQuery.length < 2 && phoneQuery.length < 2) {
      setClientSuggestions([]);
      return;
    }

    const q = phoneQuery.length > 1 ? phoneQuery : nameQuery;

    try {
      const response = await fetch(`/api/autocomplete/clients?q=${encodeURIComponent(q)}`);

      if (response.ok) {
        const data = await response.json();
        setClientSuggestions(data);
      } else {
        console.error("Failed to fetch client suggestions:", response.statusText);
        setClientSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching client suggestions:", error);
      setClientSuggestions([]);
    }
  };

  fetchClientSuggestions();
}, [bookingForm.customer, bookingForm.phone]);
  useEffect(() => {
    const fetchSpecialists = async () => {
      try {
        const response = await fetch('/api/autocomplete/specialists');
        if (response.ok) {
          const data = await response.json();
          setSpecialistRecords(data);
        } else {
          const errorData = await response.json().catch(() => ({ error: "Error de red o JSON inválido." }));
          console.error("Failed to fetch specialists:", errorData.error || response.statusText);
          setSpecialistRecords([]);
        }
      } catch (error) {
        console.error("Error fetching specialists:", error);
        setSpecialistRecords([]);
      }
    };
    fetchSpecialists();
  }, []); // Fetch specialists only once on component mount


  const serviceRecordMap = useMemo(() => {
    // Combine initial service records with dynamic suggestions for the map
    // Dynamic suggestions take precedence if available
    const allServices = [...(initialServiceRecords || []), ...(serviceSuggestions || [])];
    const uniqueServices = Array.from(new Map(allServices.map(s => [s.Servicio, s])).values());
    if (!uniqueServices) return new Map(); // Defensive check
    return new Map(uniqueServices.map(s => [s.Servicio, s]));
  }, [initialServiceRecords, serviceSuggestions]);

  // 1. Crear un mapa para la búsqueda rápida de color por especialista.
  const specialistColorMap = useMemo(() => {
    if (!specialistRecords) return new Map(); // Defensive check
    return new Map(specialistRecords.map(s => [s.name, s.color]));
  }, [specialistRecords]);

  // 2. Definir una función utilitaria local para normalizar citas y establecer el color correcto.
  const getNormalizedAppointment = useCallback((appt: Appointment): Appointment => {
    const matchedService = serviceRecordMap.get(appt.servicio);
    const duration = appt.duration ?? matchedService?.duracion ?? 60;
    const { dateISO, time24 } = getAppointmentDetails(appt.appointment_at);

    const specialistColor = specialistColorMap.get(appt.especialista) ?? appt.bg_color ?? '#94a3b8';
    // Paid appointments are gray, otherwise use specialist color
    const finalColor =
      appt.estado === "Cita pagada"
    ? "#94a3b8"        // gris para pagadas
    : specialistColor; // color del especialista para todo lo demás


    return { 
        ...appt, 
        duration, 
        fecha: dateISO, 
        hora: time24,
        bg_color: finalColor,
    };
  }, [serviceRecordMap, specialistColorMap]);


  const specialistOptions = useMemo(
    () => {
      if (!specialistRecords) return []; // Defensive check
      return specialistRecords.map(u => u.name).sort();
    }, 
    [specialistRecords]
  );




  const closeEditModal = () => {
  setSelectedAppointment(null);
  setEditAppointment(null);
  setIsEditingDate(false);
};


  const formatDateForDisplay = (isoDate: string | undefined) => {
      if (!isoDate) return '';
      // Adding T12:00:00 to avoid timezone issues that could shift the date.
      const date = new Date(`${isoDate}T12:00:00`);
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formatted = date.toLocaleDateString('es-ES', options);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  // **********************************************
  // Lógica de Toggling de Estados
  // **********************************************
  const toggleStatusFilter = (status: AppointmentStatus) => {
    setStatusFilter(prev => {
        const isSelected = prev.includes(status);
        if (isSelected) {
            const next = prev.filter(s => s !== status);
            return next.length > 0 ? next : prev; 
        } else {
            return [...prev, status];
        }
    });
  };

  const handleSelectAllStatuses = () => {
    // Usar la lista completa local
    setStatusFilter(ALL_APPOINTMENT_STATUSES);
    setShowStatusMenu(false);
  };
  
  // ** Agrupación de servicios por categoría **
  const serviceOptionsGrouped = useMemo(() => {
      const servicesToGroup = bookingForm.service.length > 1 ? serviceSuggestions : serviceRecords;
      if (!servicesToGroup) return {}; // Defensive check
      return servicesToGroup.reduce((acc, service) => {
          const category = service.category || 'Sin Categoría';
          if (!acc[category]) {
              acc[category] = [];
          }
          acc[category].push(service);
          return acc;
      }, {} as Record<string, ServiceRecord[]>);
  }, [serviceRecords, serviceSuggestions, bookingForm.service]);
  
  const suggestionOptions = useMemo(() => {
    if (!clientSuggestions) return []; // Use clientSuggestions here
    const nameQuery = bookingForm.customer.toLowerCase().trim();
    const phoneQuery = bookingForm.phone.replace(/\D/g, '').trim(); 
    
    // Min length check is now handled by the useEffect for fetching clientSuggestions
    // if (!minLengthRequired) return [];

    const suggestions: { display: string, name: string, phone: string }[] = [];
    const addedPhones = new Set<string>();

    clientSuggestions.forEach(c => { // Iterate over clientSuggestions
        const primaryPhone = c.celular as string; 
        const displayName = c.nombre;

        if (!primaryPhone || addedPhones.has(primaryPhone)) return;

        // MATCHING LOGIC (Usando substring search para nombre y número)
        const nameMatch = nameQuery.length > 0 && displayName.toLowerCase().includes(nameQuery);
        const phoneMatch = phoneQuery.length > 0 && primaryPhone.includes(phoneQuery); 

        if (nameMatch || phoneMatch) {
            suggestions.push({
                display: `${displayName} | ${primaryPhone}`,
                name: displayName,
                phone: primaryPhone,
            });
            addedPhones.add(primaryPhone);
        }
    });

    return suggestions;
  }, [clientSuggestions, bookingForm.customer, bookingForm.phone]);

  const handleSuggestionSelect = (inputValue: string) => {
    const selectedSuggestion = suggestionOptions.find(o => o.display === inputValue);
    if (selectedSuggestion) {
        setBookingForm(prev => ({
            ...prev,
            customer: selectedSuggestion.name, 
            phone: selectedSuggestion.phone,   
        }));
        return true;
    }
    return false;
  };
  
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (handleSuggestionSelect(inputValue)) return;

    setBookingForm(prev => ({ ...prev, customer: inputValue }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (handleSuggestionSelect(inputValue)) return;

    const normalizedInputPhone = inputValue.replace(/\D/g, '').trim();
    setBookingForm(prev => ({ ...prev, phone: inputValue }));

    const matchingClient = (clientRecords || []).find(c => c.celular === normalizedInputPhone);

    if (matchingClient && matchingClient.nombre && matchingClient.nombre !== bookingForm.customer) {
        setBookingForm(prev => ({
            ...prev,
            customer: matchingClient.nombre,
        }));
    }
  };

  // Handler para actualizar precio y duración al seleccionar un servicio
  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedService = e.target.value;
      const matchingService = serviceRecordMap.get(selectedService); // Use serviceRecordMap
      setBookingForm(prev => ({
          ...prev,
          service: selectedService,
          price: matchingService?.Precio ?? 0,
      }));
  };

  // **********************************************
  // Lógica de Agenda (código existente y optimizado)
  // **********************************************

  // Función estable para cargar citas (optimizado con filtrado por rango)
  const fetchAppointments = async () => {
    // Si no se renderiza la shell del calendario (ej. es modal de booking), no cargar la lista grande.
    if (!renderCalendarShell) {
        setAppointmentList([]); // Limpiar la lista para evitar renderizado inútil
        return;
    }
    
    setLoading(true);

    // 1. Determinar las fechas de inicio y fin del rango visible (Día, Semana o Mes)
    let dateStart = getLocalMidnight(new Date(baseDate)); 
    let dateEnd = new Date(dateStart);

    if (viewMode === "day") {
        // Rango de 1 día (el día actual)
        dateEnd.setDate(dateStart.getDate() + 1); 
    } else if (viewMode === "week") {
        // Rango de 7 días (la semana visible)
        dateStart = startOfWeek(dateStart);
        dateEnd = new Date(dateStart);
        dateEnd.setDate(dateStart.getDate() + 7);
    } else if (viewMode === "month") {
        // Rango de 6 semanas para cubrir la vista mensual completa (42 días)
        // La baseDate en vista de mes es el día en que se inició. Necesitamos el primer día visible.
        dateStart = startOfWeek(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
        dateEnd = new Date(dateStart);
        dateEnd.setDate(dateStart.getDate() + 42); 
    }

    // Formatear fechas a ISO para la consulta de Supabase
    // Usamos .toISOString() ya que la base de datos almacena en UTC (típico de Supabase).
    const startISO = dateStart.toISOString();
    const endISO = dateEnd.toISOString();
    
    // FIX PRINCIPAL: FILTRADO POR RANGO DE FECHAS VISIBLE (gte y lt)
    const { data, error } = await supabase
      .from('appointments')
      .select('*') 
      .gte('appointment_at', startISO) // Mayor o igual a la fecha de inicio visible
      .lt('appointment_at', endISO)   // Menor a la fecha de fin visible (exclusiva)
      .order('appointment_at', { ascending: true })
      .returns<Appointment[]>();

    if (error) {
      console.error("Error fetching appointments:", error);
    } else {
      const validData = data ? data.filter(a => a.appointment_at) : [];
      // Usar la nueva función para normalizar y actualizar el color
      setAppointmentList(validData.map(getNormalizedAppointment));
    }
    setLoading(false);
};

// Reemplazo del useEffect original (Ahora reactivo a la navegación y modo de vista)
useEffect(() => {
    fetchAppointments();
// Añadimos las dependencias para que se refresque cuando el usuario cambie la fecha o vista
}, [baseDate, viewMode, renderCalendarShell, getNormalizedAppointment]); 

// El otro useEffect que usa externalBookingSignal se mantiene:
useEffect(() => {
    if (externalBookingSignal == null) return;
    openBooking(formatDateISO(baseDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [externalBookingSignal]); 
// Fin de la zona de modificación de carga de citas

  useEffect(() => {
    if (!selectedAppointment) {
      setEditAppointment(null);
      return;
    };
    
    const matchedService = (serviceRecords || []).find(s => s.Servicio === selectedAppointment.servicio);

    setEditAppointment({
        ...selectedAppointment,
        price: matchedService?.Precio ?? selectedAppointment.price,
        duration: matchedService?.duracion ?? selectedAppointment.duration,
    });

  }, [selectedAppointment, serviceRecords]);

  const serviceOptions = useMemo(() => {
    if (!appointmentList) return []; // Defensive check
    return Array.from(new Set(appointmentList.map((a) => a.servicio)));
  }, [appointmentList]);

  // Lógica de Filtrado de Citas usando el array de estados seleccionados
  const filteredAppointments = useMemo(
    () => {
      if (!appointmentList) return []; // Defensive check
      return appointmentList.filter((appt) => {
        const matchesService = serviceFilter === "ALL" || appt.servicio === serviceFilter;
        const matchesSpecialist = specialistFilter === "ALL" || appt.especialista === specialistFilter;
        
        // Comprobar si el estado de la cita está incluido en el array de filtros
        const okStatus = statusFilter.includes(appt.estado); 
        
        return matchesService && matchesSpecialist && okStatus;
      });
    },
    [appointmentList, serviceFilter, specialistFilter, statusFilter]
  );

  const days = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfWeek(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
      return Array.from({ length: 42 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return {
          date: d,
          iso: formatDateISO(d),
          label: dayFormatter.format(d).replace(".", ""),
          dayNumber: d.getDate(),
        };
      });
    }
    const base = viewMode === "day" ? baseDate : startOfWeek(baseDate);
    const length = viewMode === "day" ? 1 : 7;
    return Array.from({ length }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        date: d,
        iso: formatDateISO(d),
        label: dayFormatter.format(d).replace(".", ""),
        dayNumber: d.getDate(),
      };
    });
  }, [baseDate, viewMode]);

  // Determinar qué especialistas mostrar en la vista "day"
  const dayViewSpecialists = useMemo(() => {
    if (viewMode !== 'day' || days.length === 0) return [];
    if (!filteredAppointments) return []; // Defensive check
    
    const singleDay = days[0];
    
    let specialists = Array.from(
        new Set(
            filteredAppointments
                .filter(appt => getAppointmentDetails(appt.appointment_at).dateISO === singleDay.iso)
                .map(appt => appt.especialista)
        )
    ).sort();

    if (specialistFilter !== 'ALL') {
        // Si hay un filtro, solo mostrar ese especialista si existe, o forzarlo a mostrar.
        if (specialists.length === 0 || (specialists.length === 1 && specialists[0] !== specialistFilter)) {
            specialists = [specialistFilter];
        } else {
            specialists = specialists.filter(s => s === specialistFilter);
        }
    } else if (specialists.length === 0) {
        specialists = specialistOptions; // Si no hay filtro y no hay citas, mostrar todos los especialistas.
    }
    
    return specialists;
  }, [viewMode, days, filteredAppointments, specialistOptions, specialistFilter]);

  useEffect(() => {
    if (viewMode === 'day' && dayViewSpecialists.length > 0) {
        if (!mobileSelectedSpecialist || !dayViewSpecialists.includes(mobileSelectedSpecialist)) {
            setMobileSelectedSpecialist(dayViewSpecialists[0]);
        }
    }
  }, [viewMode, dayViewSpecialists, mobileSelectedSpecialist]);
  
  // Nuevo: Columnas para la vista de Semana (Día + Especialista)
  const weeklySpecialistGroups = useMemo(() => {
      if (viewMode !== 'week' || days.length === 0) return [];
      if (!filteredAppointments) return []; // Defensive check
      
      return days.map(day => {
          let specialistsForDay = Array.from(
              new Set(
                  filteredAppointments
                      .filter(appt => getAppointmentDetails(appt.appointment_at).dateISO === day.iso)
                      .map(appt => appt.especialista)
              )
          ).sort();

          if (specialistFilter !== 'ALL') {
              specialistsForDay = specialistsForDay.filter(s => s === specialistFilter);
          }

          if (specialistsForDay.length === 0 && specialistFilter === 'ALL') {
              // Si está vacío y no hay filtro, mostramos todos los especialistas para que haya columnas.
              return { day, specialists: specialistOptions, isEmpty: true };
          }
          
          if (specialistsForDay.length === 0 && specialistFilter !== 'ALL') {
              // Mostrar al especialista filtrado aunque no tenga citas.
              specialistsForDay = [specialistFilter];
          }

          return { day, specialists: specialistsForDay };
      });
  }, [viewMode, days, filteredAppointments, specialistFilter, specialistOptions]);


  const slots = useMemo(() => {
    const items: { label: string; minutes: number; dashed: boolean }[] = [];
    for (let m = MINUTES_START; m <= MINUTES_END; m += STEP) {
      const hours = Math.floor(m / 60);
      const minutes = m % 60;
      // Ajuste para el formato AM/PM en las etiquetas de la hora
      const ampm = hours >= 12 && hours < 24 ? "PM" : "AM";
      const displayHour = hours % 12 === 0 ? (hours === 24 ? 12 : 12) : hours % 12;
      const label = `${displayHour}:${minutes.toString().padStart(2, "0")} ${ampm}`;
      
      items.push({ label: label, minutes: m, dashed: minutes === 30 });
    }
    return items;
  }, []);

  const handleNavigate = (direction: -1 | 1) => {
    const next = new Date(baseDate);
    if (viewMode === "day") next.setDate(baseDate.getDate() + direction);
    else if (viewMode === "week") next.setDate(baseDate.getDate() + 7 * direction);
    else next.setMonth(baseDate.getMonth() + direction);
    // FIX 1.4: Asegurar que baseDate siempre sea local midnight después de navegar
    setBaseDate(getLocalMidnight(next));
  };

  const openBooking = (dateIso: string, time?: string, specialist?: string) => {
    setBookingForm((prev) => ({ 
      ...prev, 
      open: true, 
      date: dateIso, 
      time: time ?? prev.time, 
      specialist: specialist ?? prev.specialist 
    }));
  };

  const closeBooking = () => {
  setBookingForm((prev) => ({ ...prev, open: false }));
};


  const updateAppointment = async (id: Appointment["id"], updater: (appt: Appointment) => Partial<Appointment>) => {
    const existing = appointmentList.find(a => a.id === id);
    if (!existing) return;
    const updates = updater(existing);
    
    // Al actualizar, volvemos a normalizar para refrescar el color de la especialista
    const updatedAppt = getNormalizedAppointment({ ...existing, ...updates } as Appointment);
    
    const { duration, fecha, hora, ...dbUpdates } = updatedAppt as any; 
    const { error } = await supabase.from('appointments').update(dbUpdates).eq('id', id);
    if (error) {
      console.error("Error al actualizar la cita:", error);
      alert("Error al actualizar la cita.");
      return;
    }
    setAppointmentList((prev) =>
      prev.map((appt) => (appt.id === id ? updatedAppt : appt))
    );
  };
  
  const handleMarkPaid = async () => {
    if (!selectedAppointment) return;

    const appointmentId = selectedAppointment.id;

    const response = await fetch('/api/bookings/mark-as-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
    });

    if (response.ok) {
        // Update local state to reflect the change immediately
        const newStatus = "Cita pagada" as AppointmentStatus;
        const newIsPaid = true;

        const updatedAppointment = getNormalizedAppointment({ ...selectedAppointment, is_paid: newIsPaid, estado: newStatus });

        setAppointmentList((prev) =>
            prev.map((appt) =>
                appt.id === appointmentId
                    ? updatedAppointment
                    : appt
            )
        );
        setSelectedAppointment(updatedAppointment);
    } else {
        const errorData = await response.json().catch(() => ({ error: "Error de red o JSON inválido." }));
        console.error("Error al marcar como pagada (API):", errorData);
        alert(`Error al marcar la cita como pagada. Error: ${errorData.error || 'Desconocido'}.`);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    const isConfirmed = window.confirm(
        `¿Está seguro de cancelar la cita para ${selectedAppointment.cliente} (${selectedAppointment.servicio})? Esta acción marcará la cita como CANCELADA.`
    );
    
    if (isConfirmed) {
        const appointmentId = selectedAppointment.id;
        const newStatus = "Cita cancelada" as AppointmentStatus;

        // 1. Llamar al endpoint de API para cancelar con privilegios
        const response = await fetch("/api/bookings/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointmentId }),
        });

        if (!response.ok) {
            // Captura de error mejorada
            const errorData = await response.json().catch(() => ({ error: "Error de red o JSON inválido." }));
            console.error("Error al cancelar cita (API):", errorData);
            alert(`Error al actualizar la cita. Error: ${errorData.error || 'Desconocido'}.`);
            return; 
        }

        const result = await response.json();

        if (result.success !== true) {
            alert(`Error al actualizar la cita. El servidor no confirmó el éxito.`);
            return;
        }

        // 2. Si la API es exitosa, actualizar el estado local y cerrar el modal
        setAppointmentList((prev) =>
            prev.map((appt) =>
                appt.id === appointmentId
                    ? getNormalizedAppointment({ ...appt, estado: newStatus } as Appointment)
                    : appt
            )
        );
        setSelectedAppointment(null); // Esto cierra el modal de detalle/edición
        setEditAppointment(null);
        await fetchAppointments(); 

    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    const isConfirmed = window.confirm(
        `¿Está seguro de que desea ELIMINAR PERMANENTEMENTE la cita para ${selectedAppointment.cliente} (${selectedAppointment.servicio})? Esta acción no se puede deshacer.`
    );
    
    if (isConfirmed) {
        const appointmentId = selectedAppointment.id;

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', appointmentId);

        if (error) {
            console.error("Error deleting appointment:", error);
            alert(`Error al eliminar la cita: ${error.message}`);
            return;
        }

        setAppointmentList((prev) =>
            prev.filter((appt) => appt.id !== appointmentId)
        );
        closeEditModal();
        await fetchAppointments(); 
    }
  };

  const saveEditedAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editAppointment) return;
    const editAppt = editAppointment as Appointment; 
    // Comprobar que fecha y hora existan antes de concatenar
    const f = editAppt.fecha || formatDateISO(new Date());
    const h = editAppt.hora || "09:00";

    const [year, month, day] = f.split('-').map(Number);
    const [hours, minutes] = h.split(':').map(Number);
    
    // Crear una fecha en UTC a partir de los componentes locales, para que .toISOString() no aplique el offset local del servidor.
    const appointmentDateISO =
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` +
    `T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;


    const updatedAppt: Appointment = { ...editAppt, price: Number(editAppt.price), duration: Number(editAppt.duration), appointment_at: appointmentDateISO };
    
    // OBTENER EL COLOR ACTUALIZADO DE LA ESPECIALISTA ANTES DE GUARDAR EN EL ESTADO
    const normalizedUpdatedAppt = getNormalizedAppointment(updatedAppt); 

    const { id, duration, fecha, hora, ...dbUpdates } = normalizedUpdatedAppt as any; 
    const { error } = await supabase.from('appointments').update(dbUpdates).eq('id', normalizedUpdatedAppt.id);
    if (error) {
        console.error("Error al guardar cambios:", JSON.stringify(error, null, 2));
        alert(`Error al guardar cambios: ${error.message}`);
        return;
    }
    setAppointmentList((prev) => prev.map((appt) => (appt.id === normalizedUpdatedAppt.id ? normalizedUpdatedAppt : appt)));
    setSelectedAppointment(null);
    setEditAppointment(null);
    await fetchAppointments(); 

  };

 const submitBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Obtener la duración del servicio seleccionado para enviar a la BD
    const selectedService = (serviceRecords || []).find(s => s.Servicio === bookingForm.service);
    const serviceDuration = selectedService?.duracion ?? 60; // Default to 60 min if not found

    const [year, month, day] = bookingForm.date.split("-").map(Number);
    const [hours, minutes] = bookingForm.time.split(":").map(Number);

    // Fecha LOCAL, sin UTC
    const appointmentDateISO =
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` +
      `T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;


    // NEW: Obtener el color del mapa de especialistas
    const specialistColor = specialistColorMap.get(bookingForm.specialist) ?? '#94a3b8';

    const newAppointment = {
      cliente: bookingForm.customer,
      celular: bookingForm.phone,
      // Se pasa 'service', 'specialist', 'price', 'date', 'time', 'location' para facilitar el mensaje en el API
      service: bookingForm.service,
      specialist: bookingForm.specialist,
      price: bookingForm.price,
      date: bookingForm.date, 
      time: bookingForm.time,
      location: bookingForm.location,
      appointment_at: appointmentDateISO,
      sede: bookingForm.location,
      notas: bookingForm.notes,
      estado: 'Nueva reserva creada' as AppointmentStatus, 
      bg_color: specialistColor, 
      is_paid: false,
      duration: serviceDuration, 
    };
    
    const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
    });
    
    if (response.ok) {
        const result = await response.json();
        
        let successMessage = "¡Reserva agendada y cliente verificado con éxito!";
        
        if (result.warning) {
          alert(`Advertencia: ${result.warning}`);
        }

        // --- LÓGICA DE CONFIRMACIÓN DE WHATSAPP ---
        if (result.whatsapp_status === "SENT_TO_N8N_OK") {
            successMessage += " Se ha enviado un mensaje de confirmación por WhatsApp.";
        } else if (result.whatsapp_status && result.whatsapp_status.includes("ERROR")) {
             successMessage += " ⚠️ Advertencia: No se pudo enviar el mensaje de confirmación por WhatsApp. Revisa el log del servidor.";
        } else {
             successMessage += " Pendiente de envío de confirmación por WhatsApp.";
        }
        // --- FIN LÓGICA WHATSAPP ---
        
        alert(successMessage);
        await fetchAppointments();
        closeBooking();
    } else {
        alert("Error al enviar la solicitud.");
    }
  };

  // El único objeto de día en la vista "day"
  const currentDay = days.length > 0 && viewMode === 'day' ? days[0] : null;

  return (
    <>
      <datalist id="services-list">
        {Object.entries(serviceOptionsGrouped).map(([category, services]) => (
          <optgroup key={category} label={category}>
            {services.map((s) => (
              <option
                key={s.SKU}
                value={s.Servicio}
                label={`$${s.Precio.toLocaleString()} — ${s.Servicio}`}
              />
            ))}
          </optgroup>
        ))}
      </datalist>

      {renderCalendarShell ? (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-white dark:bg-zinc-950 z-50">
          {/* Header del Calendario */}
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-gradient-to-r from-white via-indigo-50 to-white px-4 py-3 text-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/60 dark:to-zinc-900">
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" onClick={() => handleNavigate(-1)}>←</button>
              <button className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" onClick={() => setBaseDate(getLocalMidnight(new Date()))}>Hoy</button>
              <button className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" onClick={() => handleNavigate(1)}>→</button>
              <input 
                type="date" 
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" 
                value={formatDateISO(baseDate)} 
                onChange={(e) => setBaseDate(getLocalMidnight(new Date(e.target.value)))} 
              />
            </div>
             <button
                onClick={openBookingModal}
                className="sm:ml-auto mt-2 sm:mt-0 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-indigo-700 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                <span>Nueva Reserva</span>
              </button>
            <div className="flex items-center gap-2">
              {([{ key: "day", label: "Día" }, { key: "week", label: "Semana" }, { key: "month", label: "Mes" }] as const).map((option) => (
                <button key={option.key} onClick={() => setViewMode(option.key)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${viewMode === option.key ? "bg-indigo-600 text-white shadow" : "border border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"}`}>{option.label}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                <option value="ALL">Todos los servicios</option>
                {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={specialistFilter} onChange={(e) => setSpecialistFilter(e.target.value)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                <option value="ALL">Todos los especialistas</option>
                {specialistOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* MULTI-SELECT DE ESTADOS */}
              <div className="relative">
                  <button
                      onClick={() => setShowStatusMenu(v => !v)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-inner outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 flex items-center gap-2"
                  >
                      Estado: {statusFilter.length === ALL_APPOINTMENT_STATUSES.length ? 'Todos' : `${statusFilter.length} Seleccionados`}
                      <span className="text-[8px] transform">{showStatusMenu ? '▲' : '▼'}</span>
                  </button>

                  {showStatusMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg z-50 dark:border-zinc-700 dark:bg-zinc-900">
                          <div className="space-y-2">
                              <button
                                  onClick={handleSelectAllStatuses}
                                  className={`w-full text-left p-2 rounded-lg text-xs font-semibold transition ${
                                      statusFilter.length === ALL_APPOINTMENT_STATUSES.length
                                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                  }`}
                              >
                                  Seleccionar Todos
                              </button>
                              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 grid grid-cols-2 gap-2">
                                  {ALL_APPOINTMENT_STATUSES.map((status) => {
                                      const isSelected = statusFilter.includes(status);
                                      return (
                                          <button
                                              key={status}
                                              onClick={() => toggleStatusFilter(status)}
                                              className={`p-2 rounded-lg text-xs font-semibold text-center transition border ${
                                                  isSelected
                                                  ? "bg-indigo-600 text-white border-indigo-600"
                                                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                              }`}
                                          >
                                              {status}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
            </div>
          </div>

          {/* Cuerpo del Calendario */}
          {viewMode === "month" ? (
            <div className="flex-1 overflow-auto overscroll-x-none">
              <div className="grid min-h-[520px] grid-cols-7 gap-3 p-4 sm:p-6">
                {loading ? (
                    <p className="col-span-7 text-center py-12 text-lg text-indigo-500">Cargando Agenda...</p>
                ) : (
                    days.map((day) => {
                      const dayAppointments = filteredAppointments.filter((appt) => getAppointmentDetails(appt.appointment_at).dateISO === day.iso);
                      return (
                        <div key={day.iso} onClick={(e) => { if (!(e.target as HTMLElement).closest("[data-appointment]")) openBooking(day.iso, "09:00"); }} className={`flex min-h-[160px] cursor-pointer flex-col rounded-2xl border p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:hover:border-indigo-700/50 ${day.date.getMonth() === baseDate.getMonth() ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 text-zinc-400 dark:bg-zinc-900/50"}`} >
                          <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                            <span className="uppercase text-[10px]">{day.label}</span>
                            <span className="text-sm">{day.dayNumber}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {dayAppointments.map((appt) => {
                              const { timeString } = getAppointmentDetails(appt.appointment_at);
                              return (
                                <div
                                  key={appt.id}
                                  data-appointment
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAppointment(appt);
                                  }}
                                  className="h-3 w-3 rounded-full cursor-pointer"
                                  style={{ backgroundColor: appt.bg_color }}
                                  title={`${timeString} - ${appt.servicio} (${appt.cliente})`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          ) : (
            /* ------------------------- VISTA DIA / SEMANA (GRID) -------------------------- */
            <div className="relative flex-1 overflow-auto overscroll-x-none bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
              {viewMode === 'week' ? (
                 /* ------------------------- VISTA SEMANA (ADAPTADA A LA IMAGEN) -------------------------- */
                <div className="min-w-full"> {/* Elimina el scroll horizontal forzado */}
                    {/* Encabezado de la Semana (SOLO DÍAS) */}
                    <div className="sticky top-0 z-20 flex border-b border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                        <div className="w-16 flex-shrink-0 border-r border-zinc-300 bg-white/95 text-[11px] font-semibold uppercase text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/95">Hora</div>
                        
                        {/* Columna Principal por Día */}
                        {weeklySpecialistGroups.map((group) => (
                            <div 
                                key={group.day.iso} 
                                className={`flex flex-1 flex-col min-w-0 border-r border-zinc-300 last:border-r-0 ${group.day.iso === formatDateISO(new Date()) ? "bg-indigo-50/40 dark:bg-indigo-950/30" : "bg-white dark:bg-zinc-900"}`}
                            >
                                {/* Día y Fecha */}
                                <div className={`p-2 text-center border-b border-zinc-300 dark:border-zinc-800`}>
                                    <div className={`text-lg font-bold leading-none ${group.day.iso === formatDateISO(new Date()) ? "text-indigo-700 dark:text-indigo-200" : "text-zinc-800 dark:text-zinc-100"}`}>
                                        {group.day.label.toUpperCase()}
                                    </div>
                                    <p className="text-[12px] text-zinc-500">{group.day.dayNumber}</p>
                                </div>
                                
                                {/* Sub-Encabezado de Especialistas */}
                                <div className="flex bg-zinc-50 dark:bg-zinc-800/50">
                                    {group.specialists.map(specialist => (
                                        <div key={specialist} className="flex-1 min-w-0 p-1 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 truncate border-r last:border-r-0 border-zinc-200 dark:border-zinc-700">
                                            {specialist}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Cuerpo de la agenda (Slots y Citas) */}
                    <div className="relative flex" aria-label="Agenda por especialista">
                        {/* Columna Horas */}
                        <div className="sticky left-0 z-20 w-16 flex-shrink-0 border-r border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                            <div className="relative" style={{ height: COLUMN_HEIGHT }}>
                                {slots.map((slot, idx) => (
                                    <div key={slot.minutes} className={`absolute inset-x-0 flex items-start justify-center border-b ${slot.dashed ? "border-dashed" : "border-solid"} border-zinc-200 px-1 text-[11px] font-medium leading-none text-zinc-500 dark:border-zinc-800 dark:text-zinc-400`} style={{ top: idx * ROW_HEIGHT, height: ROW_HEIGHT }}>
                                        <span className="mt-1 block">{slot.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Columnas de Días/Especialistas */}
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center" style={{ height: COLUMN_HEIGHT }}><p className="text-xl text-indigo-500">Cargando Citas...</p></div>
                        ) : (
                            weeklySpecialistGroups.map((group) => {
                                const dayIso = group.day.iso;
                                const totalSpecialists = group.specialists.length;
                                const colWidthPercent = 100 / totalSpecialists;

                                return (
                                    <div 
                                        key={dayIso}
                                        className={`relative flex flex-1 border-r border-zinc-300 last:border-r-0 ${group.day.iso === formatDateISO(new Date()) ? "bg-indigo-50/40 dark:bg-indigo-950/30" : "bg-white dark:bg-zinc-900"}`}
                                        style={{ height: COLUMN_HEIGHT }}
                                    >
                                        <div 
                                            className="pointer-events-none absolute inset-0" 
                                            style={{ backgroundImage: `repeating-linear-gradient(to bottom, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent ${ROW_HEIGHT}px)` }} 
                                        />

                                        {group.specialists.map((specialist) => {
                                            const specialistAppointments = filteredAppointments
                                                .filter((appt) => 
                                                    getAppointmentDetails(appt.appointment_at).dateISO === dayIso && 
                                                    appt.especialista === specialist
                                                );
                                                // No es necesario mapear con getNormalizedAppointment aquí si ya se hizo al cargar

                                            const handleColumnClick = (event: MouseEvent<HTMLDivElement>) => {
                                                const rect = event.currentTarget.getBoundingClientRect();
                                                const offsetY = event.clientY - rect.top;
                                                const minutesFromStart = Math.min(Math.max(offsetY / COLUMN_HEIGHT, 0), 1) * TOTAL_MINUTES;
                                                const roundedSlot = Math.floor(minutesFromStart / STEP) * STEP + MINUTES_START;
                                                openBooking(dayIso, minutesToTimeString(roundedSlot), specialist);
                                            };
                                            
                                            // Renderizar una columna vacía para el especialista
                                            if (specialist === 'VACÍO') {
                                                return <div key={`${dayIso}-${specialist}`} className="flex-1 border-r border-zinc-200 dark:border-zinc-800"></div>;
                                            }

                                            return (
                                                <div
                                                    key={`${dayIso}-${specialist}`}
                                                    onClick={handleColumnClick} 
                                                    className="relative h-full border-r border-zinc-200 dark:border-zinc-800"
                                                    style={{ width: `${colWidthPercent}%` }}
                                                >
                                                    {specialistAppointments.map((appt) => {
                                                        const { minutes, timeString, dateISO } = getAppointmentDetails(appt.appointment_at);
                                                        const top = Math.max(0, ((minutes - MINUTES_START) / STEP) * ROW_HEIGHT);
                                                        const height = Math.min(COLUMN_HEIGHT - top, Math.max((appt.duration! / STEP) * ROW_HEIGHT, ROW_HEIGHT * 0.75));
                                                        
                                                        const apptColor = appt.bg_color;

                                                        return (
                                                            <button 
                                                                key={appt.id} 
                                                                type="button" 
                                                                data-appointment 
                                                                // Usamos getNormalizedAppointment al hacer clic para asegurar el color correcto en el modal.
                                                                onClick={(e) => { e.stopPropagation(); setSelectedAppointment(appt); }} 
                                                                // CLASE CORREGIDA: Eliminamos el degradado para ver el color plano
                                                                className="group absolute left-0.5 right-0.5 flex flex-col gap-0.5 truncate rounded-xl border border-white/50 p-1 text-left text-white shadow-md ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg" 
                                                                style={{ backgroundColor: apptColor, top, height }} 
                                                                title={`${appt.servicio} · ${appt.cliente} (${appt.especialista})`}
                                                            >
                                                                <div className="flex items-center justify-between gap-1 text-[8px] font-semibold leading-none uppercase">
                                                                    <span>{timeString}</span>
                                                                    <span className="rounded-full bg-black/20 px-1 py-0.5 text-[7px] text-white">{appt.estado}</span>
                                                                </div>
                                                                <div className="truncate text-[9px] font-semibold leading-tight">{appt.servicio}</div>
                                                                <div className="truncate text-[8px] leading-tight opacity-90">{appt.cliente}</div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
              ) : (
                <>
                    {/* ------------------------- VISTA DIA (MOBILE) -------------------------- */}
                    <div className="md:hidden">
                        {/* Day Header */}
                        {currentDay && (
                            <div className="sticky top-0 z-20 flex flex-col border-b border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                                <div className="flex items-center justify-center p-3">
                                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                                        {currentDay.label}. {currentDay.dayNumber}{" "}
                                        <span className="text-sm font-normal text-zinc-500">
                                            {currentDay.date.toLocaleString("es", { month: "long" })}
                                        </span>
                                    </h3>
                                </div>
                            </div>
                        )}

                        {/* Specialist Tabs */}
                        <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                            {dayViewSpecialists.map(specialist => (
                                <button
                                    key={specialist}
                                    onClick={() => setMobileSelectedSpecialist(specialist)}
                                    className={`flex-shrink-0 p-3 text-sm font-semibold ${mobileSelectedSpecialist === specialist ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-zinc-500'}`}
                                >
                                    {specialist}
                                </button>
                            ))}
                        </div>

                        {/* Timeline for the selected specialist */}
                        <div className="overflow-y-auto p-2">
                            {loading && <p className="text-center py-12 text-lg text-indigo-500">Cargando Citas...</p>}
                            
                            {!loading && mobileSelectedSpecialist && (() => {
                                const specialistAppointments = filteredAppointments
                                    .filter((appt) => 
                                        getAppointmentDetails(appt.appointment_at).dateISO === currentDay?.iso && 
                                        appt.especialista === mobileSelectedSpecialist
                                    );

                                const handleColumnClick = (event: MouseEvent<HTMLDivElement>) => {
                                    const rect = event.currentTarget.getBoundingClientRect();
                                    const offsetY = event.clientY - rect.top;
                                    const minutesFromStart = Math.min(Math.max(offsetY / COLUMN_HEIGHT, 0), 1) * TOTAL_MINUTES;
                                    const roundedSlot = Math.floor(minutesFromStart / STEP) * STEP + MINUTES_START;
                                    openBooking(currentDay!.iso, minutesToTimeString(roundedSlot), mobileSelectedSpecialist);
                                };

                                return (
                                    <div className="flex">
                                        {/* Hours Column */}
                                        <div className="w-16 flex-shrink-0 text-center text-zinc-700">
                                            <div className="relative" style={{ height: COLUMN_HEIGHT }}>
                                                {slots.map((slot, idx) => (
                                                    <div key={slot.minutes} className={`absolute inset-x-0 flex items-start justify-center border-b ${slot.dashed ? "border-dashed" : "border-solid"} border-zinc-200 px-1 text-[11px] font-medium leading-none text-zinc-500 dark:border-zinc-800 dark:text-zinc-400`} style={{ top: idx * ROW_HEIGHT, height: ROW_HEIGHT }}>
                                                        <span className="mt-1 block">{slot.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Appointments Column */}
                                        <div 
                                            onClick={handleColumnClick} 
                                            className="relative flex-1 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800"
                                            style={{ height: COLUMN_HEIGHT }}
                                        >
                                            <div 
                                                className="pointer-events-none absolute inset-0" 
                                                style={{ backgroundImage: `repeating-linear-gradient(to bottom, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent ${ROW_HEIGHT}px)` }} 
                                            />

                                            {specialistAppointments.map((appt) => {
                                                const { minutes } = getAppointmentDetails(appt.appointment_at);
                                                const top = Math.max(0, ((minutes - MINUTES_START) / STEP) * ROW_HEIGHT);
                                                const height = Math.min(COLUMN_HEIGHT - top, Math.max((appt.duration! / STEP) * ROW_HEIGHT, ROW_HEIGHT * 0.75));
                                                return (
                                                    <button 
                                                        key={appt.id} 
                                                        type="button" 
                                                        data-appointment 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedAppointment(appt); }} 
                                                        className="group absolute left-1 right-1 flex flex-col gap-0.5 truncate rounded-xl border border-white/50 p-2 text-left text-white shadow-md ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg" 
                                                        style={{ backgroundColor: appt.bg_color, top, height }} 
                                                        title={`${appt.servicio} · ${appt.cliente}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold leading-none uppercase">
                                                            <span>{getAppointmentDetails(appt.appointment_at).timeString}</span>
                                                            <span className="rounded-full bg-black/20 px-2 py-0.5 text-[9px] text-white">{appt.estado}</span>
                                                        </div>
                                                        <div className="truncate text-[11px] font-semibold leading-tight">{appt.servicio}</div>
                                                        <div className="truncate text-[10px] leading-tight opacity-90">{appt.cliente}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {!loading && dayViewSpecialists.length === 0 && (
                                <p className="text-center text-zinc-500 py-12">No hay especialistas con citas para este día.</p>
                            )}
                        </div>
                    </div>

                    {/* ------------------------- VISTA DIA (DESKTOP - SPECIALIST COLUMNS) -------------------------- */}
                    <div className="hidden md:block">
                        {/* Encabezado Principal del Día */}
                        {currentDay && (
                            <div className="sticky top-0 z-20 flex flex-col border-b border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                                <div className="flex items-center justify-center p-3">
                                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                                        {currentDay!.label}. {currentDay!.dayNumber}{" "}
                                        <span className="text-sm font-normal text-zinc-500">
                                            {currentDay!.date.toLocaleString("es", { month: "long" })}
                                        </span>
                                    </h3>
                                </div>
                                
                                {/* Sub-Encabezado de Especialistas */}
                                <div className="flex border-t border-zinc-300 dark:border-zinc-800">
                                    <div className="w-16 flex-shrink-0 border-r border-zinc-300 bg-white/95 text-[11px] font-semibold uppercase text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/95">Hora</div>
                                    {dayViewSpecialists.map((specialist) => (
                                        <div 
                                            key={specialist} 
                                            className="flex-1 border-r border-zinc-300 p-2 text-xs font-semibold text-indigo-700 dark:border-zinc-800 dark:text-indigo-300"
                                        >
                                            {specialist}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Cuerpo de la Agenda (Slots y Citas) */}
                        <div className="relative flex" aria-label="Agenda por especialista">
                            
                            {/* Columna Horas */}
                            <div className="sticky left-0 z-20 w-16 flex-shrink-0 border-r border-zinc-300 bg-white/95 text-center text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                                <div className="relative" style={{ height: COLUMN_HEIGHT }}>
                                    {slots.map((slot, idx) => (
                                        <div key={slot.minutes} className={`absolute inset-x-0 flex items-start justify-center border-b ${slot.dashed ? "border-dashed" : "border-solid"} border-zinc-200 px-1 text-[11px] font-medium leading-none text-zinc-500 dark:border-zinc-800 dark:text-zinc-400`} style={{ top: idx * ROW_HEIGHT, height: ROW_HEIGHT }}>
                                            <span className="mt-1 block">{slot.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Columnas de Especialistas */}
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center" style={{ height: COLUMN_HEIGHT }}><p className="text-xl text-indigo-500">Cargando Citas...</p></div>
                            ) : (
                                dayViewSpecialists.map((specialist) => {
                                    const specialistAppointments = filteredAppointments
                                        .filter((appt) => 
                                            getAppointmentDetails(appt.appointment_at).dateISO === currentDay?.iso && 
                                            appt.especialista === specialist
                                        );

                                    const handleColumnClick = (event: MouseEvent<HTMLDivElement>) => {
                                        const rect = event.currentTarget.getBoundingClientRect();
                                        const offsetY = event.clientY - rect.top;
                                        const minutesFromStart = Math.min(Math.max(offsetY / COLUMN_HEIGHT, 0), 1) * TOTAL_MINUTES;
                                        const roundedSlot = Math.floor(minutesFromStart / STEP) * STEP + MINUTES_START;
                                        openBooking(currentDay!.iso, minutesToTimeString(roundedSlot), specialist);
                                    };

                                    return (
                                        <div 
                                            key={specialist} 
                                            onClick={handleColumnClick} 
                                            className="relative flex flex-1 border-r border-zinc-300 last:border-r-0 bg-white dark:bg-zinc-900" 
                                            style={{ height: COLUMN_HEIGHT }}
                                        >
                                            <div 
                                                className="pointer-events-none absolute inset-0" 
                                                style={{ backgroundImage: `repeating-linear-gradient(to bottom, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent ${ROW_HEIGHT}px)` }} 
                                            />

                                            {specialistAppointments.map((appt) => {
                                                const { minutes, timeString, dateISO } = getAppointmentDetails(appt.appointment_at);
                                                const top = Math.max(0, ((minutes - MINUTES_START) / STEP) * ROW_HEIGHT);
                                                const height = Math.min(COLUMN_HEIGHT - top, Math.max((appt.duration! / STEP) * ROW_HEIGHT, ROW_HEIGHT * 0.75));
                                                
                                                const apptColor = appt.bg_color;
                                                
                                                return (
                                                    <button 
                                                        key={appt.id} 
                                                        type="button" 
                                                        data-appointment 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedAppointment(appt); }} 
                                                        className="group absolute left-1 right-1 flex flex-col gap-0.5 truncate rounded-xl border border-white/50 bg-gradient-to-br from-black/10 via-black/5 to-white/10 p-2 text-left text-white shadow-md ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg" 
                                                        style={{ backgroundColor: apptColor, top, height }} 
                                                        title={`${appt.servicio} · ${appt.cliente}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold leading-none uppercase">
                                                            <span>{timeString}</span>
                                                            <span className="rounded-full bg-black/20 px-2 py-0.5 text-[9px] text-white">{appt.estado}</span>
                                                        </div>
                                                        <div className="truncate text-[11px] font-semibold leading-tight">{appt.servicio}</div>
                                                        <div className="truncate text-[10px] leading-tight opacity-90">{appt.cliente}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* ------------------------- MODAL EDITAR CITA -------------------------- */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeEditModal}
            aria-hidden
          />
          
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-2 bg-zinc-900 px-5 py-4 text-white dark:bg-zinc-800">
              <h3 className="text-lg font-bold" style={{ color: selectedAppointment.bg_color }}>
                {selectedAppointment.servicio}
              </h3>
              <button
                className="rounded-full bg-white/20 px-3 py-1 text-xs"
                onClick={closeEditModal}
              >
                Cerrar
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form
                className="grid grid-cols-2 gap-4"
                onSubmit={saveEditedAppointment}
              >
                <label className="col-span-2 text-xs font-semibold text-zinc-500">
                  Cliente
                </label>
                <input
                  className="col-span-2 border p-2 rounded"
                  value={editAppointment?.cliente || ''}
                  onChange={(e) =>
                    setEditAppointment((prev) => ({
                      ...prev!,
                      cliente: e.target.value,
                    }))
                  }
                />
                <label className="col-span-2 text-xs font-semibold text-zinc-500">
                  Especialista
                </label>
                <select
                  className="col-span-2 w-full border p-2 rounded bg-white"
                  value={editAppointment?.especialista || ''}
                  onChange={(e) =>
                    setEditAppointment((prev) => ({
                      ...prev!,
                      especialista: e.target.value,
                    }))
                  }
                >
                  <option value="">Seleccionar Especialista</option>
                                        {(specialistRecords || []).map((u) => (
                                            <option key={u.id} value={u.name}>{u.name}</option>
                                        ))}                </select>

                <label className="col-span-2 text-xs font-semibold text-zinc-500">
                  Servicio
                </label>
                <input
                  className="col-span-2 w-full border p-2 rounded bg-white"
                  list="services-list"
                  placeholder="Escribe o selecciona un servicio..."
                  value={editAppointment?.servicio || ''}
                  onChange={(e) => {
                    const newServiceName = e.target.value;
                    const matchedService = (serviceRecords || []).find(s => s.Servicio.trim().toLowerCase() === newServiceName.trim().toLowerCase());
                    setEditAppointment((prev) => ({
                        ...prev!,
                        servicio: newServiceName,
                        price: matchedService?.Precio ?? prev!.price,
                        duration: matchedService?.duracion ?? prev!.duration,
                    }));
                  }}
                />

                <div className="col-span-1">
                  <label className="text-xs font-semibold text-zinc-500">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    className="w-full mt-1 border p-2 rounded"
                    value={editAppointment?.duration || 0}
                    onChange={(e) =>
                      setEditAppointment((prev) => ({
                        ...prev!,
                        duration: Number(e.target.value),
                      }))
                    }
                  />
                  {editAppointment?.duration && editAppointment.duration >= 60 && (
                    <p className="text-xs text-zinc-500 mt-1">
                      ({(editAppointment.duration / 60).toLocaleString('es-ES', { maximumFractionDigits: 2 })} horas)
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-semibold text-zinc-500">
                    Precio
                  </label>
                  <input
                    type="number"
                    className="w-full mt-1 border p-2 rounded"
                    value={editAppointment?.price || 0}
                    onChange={(e) =>
                      setEditAppointment((prev) => ({
                        ...prev!,
                        price: Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-semibold text-zinc-500">
                    Fecha
                  </label>
                  {isEditingDate ? (
                    <input
                      type="date"
                      className="w-full mt-1 border p-2 rounded"
                      value={editAppointment?.fecha || ''}
                      onChange={(e) => {
                        setEditAppointment((prev) => ({
                          ...prev!,
                          fecha: e.target.value,
                        }));
                        setIsEditingDate(false);
                      }}
                      onBlur={() => setIsEditingDate(false)}
                      autoFocus
                    />
                  ) : (
                    <p 
                      className="w-full mt-1 p-2 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 cursor-pointer"
                      onClick={() => setIsEditingDate(true)}
                    >
                      {formatDateForDisplay(editAppointment?.fecha)}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-semibold text-zinc-500">
                    Hora
                  </label>
                  <input
                    type="time"
                    className="w-full mt-1 border p-2 rounded"
                    value={editAppointment?.hora || ''}
                    onChange={(e) =>
                      setEditAppointment((prev) => ({
                        ...prev!,
                        hora: e.target.value,
                      }))
                    }
                  />
                </div>
                
                <div className="col-span-2 flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    title="Eliminar permanentemente"
                    onClick={handleDeleteAppointment}
                    className="p-2 border rounded text-red-600 hover:bg-red-50 flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAppointment}
                    className="p-2 border rounded text-rose-600 hover:bg-rose-50"
                  >
                    Cancelar Cita
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    disabled={selectedAppointment.is_paid}
                    className="p-2 border rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {selectedAppointment.is_paid ? "Pagada" : "Marcar como Pagada"}
                  </button>
                </div>

                <div className="col-span-2 flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="p-2 border rounded"
                  >
                    Cerrar
                  </button>

                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 text-white rounded"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------- MODAL NUEVA CITA -------------------------- */}
      {bookingForm.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up relative">
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">Nueva Reserva</h2>
              <button
                onClick={closeBooking}
                className="p-1 hover:bg-indigo-700 rounded-full transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round" className="lucide lucide-x">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>

            <form onSubmit={submitBooking} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              
              {/* Input Nombre con Sugerencias */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente Principal</label>
                  <input 
                      required 
                      list="client-suggestions"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                      placeholder="Nombre del cliente (o 3 últimos dígitos de celular)" 
                      value={bookingForm.customer} 
                      onChange={handleCustomerChange} 
                  />
                  {/* Datalist enlazada al input de nombre */}
                  <datalist id="client-suggestions">
                      {suggestionOptions.map(o => (
                          <option key={o.phone + o.name} value={o.display} />
                      ))}
                  </datalist>
              </div>

              {/* Input Celular con Autocompletado */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular (Para WhatsApp)</label>
                  <input 
                      required
                      list="client-suggestions"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                      placeholder="+57 300 123 4567" 
                      value={bookingForm.phone} 
                      onChange={handlePhoneChange} 
                  />
              </div>
              
              {/* Servicio (Actualizado para usar serviceRecords y agrupación por categoría) */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                  <input
                      required
                      list="services-list"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 bg-white"
                      placeholder={
                        Object.keys(serviceOptionsGrouped).length > 0
                          ? "Escribe o selecciona un servicio..."
                          : "No hay servicios disponibles"
                      }
                      value={bookingForm.service}
                      onChange={handleServiceChange} 
                  />

              </div>

              {/* Especialista (ACTUALIZADO para usar specialistRecords) */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialista</label>
                  <select
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={bookingForm.specialist}
                      onChange={(e) => setBookingForm({ ...bookingForm, specialist: e.target.value })}
                  >
                      {(specialistRecords || []).length > 0 ? (
                        <>
                          <option value="">Seleccionar Especialista</option>
                          {(specialistRecords || []).map((u) => (
                              <option key={u.id} value={u.name}>{u.name}</option>
                          ))}
                        </>
                      ) : (
                        <option value="" disabled>No hay especialistas disponibles</option>
                      )}
                  </select>
              </div>

              {/* Precio */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
                  <input
                      required
                      type="number"
                      min="0"
                      step="10" // Reduced step for flexibility
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                      value={bookingForm.price}
                      onChange={(e) => setBookingForm({ ...bookingForm, price: Number(e.target.value) })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                      Precio sugerido: 
                      {(serviceRecords || []).find(s => s.Servicio === bookingForm.service)?.Precio 
                       ? `$${(serviceRecords || []).find(s => s.Servicio === bookingForm.service)!.Precio.toLocaleString()} `
                       : '$0'}
                  </p>
              </div>

              {/* Fecha + Hora */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                      <input
                          required
                          type="date"
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
                          value={bookingForm.date}
                          onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                      <input
                          required
                          type="time"
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
                          value={bookingForm.time}
                          onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                      />
                  </div>
              </div>

              {/* Sede */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
                  <select
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={bookingForm.location}
                      onChange={(e) => setBookingForm({ ...bookingForm, location: e.target.value })}
                  >
                      <option value="Marquetalia">Marquetalia</option>
                  </select>
              </div>

              {/* Notas */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
                      placeholder="Detalles adicionales..."
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  />
              </div>

              {/* BOTONES */}
              <div className="pt-4 flex gap-3">
                  <button
                      type="button"
                      onClick={closeBooking}
                      className="flex-1 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                      Cancelar
                  </button>
                  <button
                      type="submit"
                      className="flex-1 py-3 text-white bg-indigo-600 rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition"
                  >
                      Agendar
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}