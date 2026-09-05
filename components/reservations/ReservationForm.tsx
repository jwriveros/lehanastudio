"use client";

import FichaTecnicaEditor from "./FichaTecnicaEditor";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import AutocompleteInput from "./AutocompleteInput";
import { supabase } from "@/lib/supabaseClient";
import { useUIStore } from "@/lib/uiStore";
import {
  Plus,
  Trash2,
  User,
  Phone,
  Calendar,
  Clock,
  Building,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Tag,
  Bell,
  BellOff,
  Sparkles,
  Check,
} from "lucide-react";

/* =========================================================
   🔹 TIPOS DE DATOS (INTACTOS)
========================================================= */
type ClientItem = {
  nombre: string | null;
  celular: number;
  numberc?: string | null;
  indicador?: string | null;
};

type ServiceItem = {
  SKU: string;
  Servicio: string | null;
  Precio: number | null;
  duracion: string | null;
};

type SpecialistItem = {
  id: string;
  name: string;
  color?: string | null;
  role?: string;
};

type ServiceLine = {
  id?: number; 
  servicio: string;
  precio: number;
  abono?: number;
  duracion: string;
  especialista: string;
  appointment_at: string;
};

type FormState = {
  cliente: string;
  celular: string;
  indicativo: string;
  sede: string;
  cantidad: number;
  estado: string;
  lines: ServiceLine[];
};

interface ReservationFormProps {
  appointmentData?: any | null;
  associatedServices?: any[];
  onSuccess?: () => void;
}

/* =========================================================
   🔹 SUB-COMPONENTE: CUSTOM SELECT ELEGANTE
========================================================= */
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  icon: Icon,
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; dot?: string }[];
  placeholder?: string;
  icon?: any;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div className={`relative w-full ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-2xl border bg-white dark:bg-zinc-950 py-2.5 px-3.5 text-[11px] font-extrabold text-zinc-800 dark:text-zinc-100 shadow-2xs transition-all duration-200 cursor-pointer ${
          open 
            ? "border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-400/10" 
            : "border-zinc-200/80 dark:border-zinc-800 hover:border-rose-300/60"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOpt?.dot ? (
            <span className={`h-2 w-2 rounded-full ${selectedOpt.dot} shrink-0`} />
          ) : Icon ? (
            <Icon size={14} className="text-zinc-400 shrink-0" />
          ) : null}
          <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        </div>
        <ChevronDown size={13} className={`text-zinc-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180 text-rose-500" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-[11px] font-bold text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-rose-500/10 hover:text-rose-500"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.dot && <span className={`h-2 w-2 rounded-full ${opt.dot} shrink-0`} />}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check size={13} className="text-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 LISTA DE PAÍSES (INTACTA)
========================================================= */
const COUNTRIES = [
  { code: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "+1", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "+34", flag: "🇪🇸", name: "España" },
  { code: "+52", flag: "🇲🇽", name: "México" },
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "+51", flag: "🇵🇪", name: "Perú" },
  { code: "+58", flag: "🇻🇪", name: "Venezuela" },
  { code: "+593", flag: "🇪🇨", name: "Ecuador" },
  { code: "+502", flag: "🇬🇹", name: "Guatemala" },
  { code: "+53", flag: "🇨🇺", name: "Cuba" },
  { code: "+591", flag: "🇧🇴", name: "Bolivia" },
  { code: "+506", flag: "🇨🇷", name: "Costa Rica" },
  { code: "+1", flag: "🇩🇴", name: "Rep. Dominicana" },
  { code: "+503", flag: "🇸🇻", name: "El Salvador" },
  { code: "+504", flag: "🇭🇳", name: "Honduras" },
  { code: "+505", flag: "🇳🇮", name: "Nicaragua" },
  { code: "+507", flag: "🇵🇦", name: "Panamá" },
  { code: "+595", flag: "🇵🇾", name: "Paraguay" },
  { code: "+598", flag: "🇺🇾", name: "Uruguay" },
  { code: "+1", flag: "🇵🇷", name: "Puerto Rico" },
  { code: "+55", flag: "🇧🇷", name: "Brasil" },
  { code: "+33", flag: "🇫🇷", name: "Francia" },
  { code: "+39", flag: "🇮🇹", name: "Italia" },
  { code: "+49", flag: "🇩🇪", name: "Alemania" },
  { code: "+44", flag: "🇬🇧", name: "Reino Unido" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+41", flag: "🇨🇭", name: "Suiza" },
  { code: "+32", flag: "🇧🇪", name: "Bélgica" },
  { code: "+31", flag: "🇳🇱", name: "Países Bajos" },
  { code: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "+46", flag: "🇸🇪", name: "Suecia" },
  { code: "+47", flag: "🇳🇴", name: "Noruega" },
  { code: "+45", flag: "🇩🇰", name: "Dinamarca" },
  { code: "+358", flag: "🇫🇮", name: "Finlandia" },
  { code: "+30", flag: "🇬🇷", name: "Grecia" },
  { code: "+353", flag: "🇮🇪", name: "Irlanda" },
  { code: "+7", flag: "🇷🇺", name: "Rusia" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japón" },
  { code: "+82", flag: "🇰🇷", name: "Corea del Sur" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+64", flag: "🇳🇿", name: "Nueva Zelanda" },
  { code: "+27", flag: "🇿🇦", name: "Sudáfrica" },
  { code: "+20", flag: "🇪🇬", name: "Egipto" },
  { code: "+971", flag: "🇦🇪", name: "Emiratos Árabes" },
  { code: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "+90", flag: "🇹🇷", name: "Turquía" },
  { code: "+63", flag: "🇵🇭", name: "Filipinas" },
  { code: "+66", flag: "🇹🇭", name: "Tailandia" },
  { code: "+65", flag: "🇸🇬", name: "Singapur" },
  { code: "+60", flag: "🇲🇾", name: "Malasia" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+84", flag: "🇻🇳", name: "Vietnam" }
].sort((a, b) => a.name.localeCompare(b.name));

const EMPTY_LINE: ServiceLine = {
  servicio: "",
  precio: 0,
  abono: 0,
  duracion: "60",
  especialista: "",
  appointment_at: "",
};

const EMPTY_FORM: FormState = {
  cliente: "",
  celular: "",
  indicativo: "+57",
  sede: "Marquetalia",
  cantidad: 1,
  estado: "Nueva reserva creada",
  lines: [{ ...EMPTY_LINE }],
};

const ESTADO_OPTIONS = [
  { label: "Nueva reserva creada", value: "Nueva reserva creada", dot: "bg-amber-400" },
  { label: "Cita confirmada", value: "Cita confirmada", dot: "bg-rose-500" },
  { label: "Cita pagada", value: "Cita pagada", dot: "bg-emerald-500" },
  { label: "Cita cancelada", value: "Cita cancelada", dot: "bg-zinc-400" },
];

const SEDE_OPTIONS = [
  { label: "Santa Marta", value: "Santa Marta" },
  { label: "Buga", value: "Buga" },
  { label: "Marquetalia", value: "Marquetalia" },
];

/* =========================================================
   🔹 HELPERS DE HORA (INTACTOS)
========================================================= */
function toDatetimeLocal(dateValue: any) {
  if (!dateValue) return "";

  if (dateValue instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dateValue.getFullYear()}-${pad(dateValue.getMonth() + 1)}-${pad(dateValue.getDate())}T${pad(dateValue.getHours())}:${pad(dateValue.getMinutes())}`;
  }

  const dateString = String(dateValue);
  const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  
  if (match) {
    const [_, y, m, d, hh, mm] = match;
    return `${y}-${m}-${d}T${hh}:${mm}`;
  }

  return dateString.substring(0, 16).replace(" ", "T");
}

function localDateTimeToUTC(localDateTime: string) {
  if (!localDateTime) return "";
  return `${localDateTime}:00Z`;
}

/* =========================================================
   🔹 COMPONENTE PRINCIPAL
========================================================= */
export default function ReservationForm({
  appointmentData,
  associatedServices,
  onSuccess,
}: ReservationFormProps) {
  const closeReservationDrawer = useUIStore((s) => s.closeReservationDrawer);
  const formRef = useRef<HTMLFormElement>(null);
  
  const isEditing = !!appointmentData?.id && appointmentData.id !== "new";
  
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveClient, setSaveClient] = useState(false);
  const [notifyOnEdit, setNotifyOnEdit] = useState(false);
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservas' | 'fichas'>('fichas');
  const [deletedLineIds, setDeletedLineIds] = useState<number[]>([]);

  /* CARGAR ESPECIALISTAS */
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoadingSpecialists(true);  
      try {
        const { data, error } = await supabase
          .from("app_users")
          .select("id,name,role,color")
          .in("role", ["ESPECIALISTA", "SPECIALIST"])
          .order("name", { ascending: true });
        if (!mounted) return;
        if (error) throw error;
        setSpecialists((data ?? []) as SpecialistItem[]);
      } catch (e) {
        console.error("Error cargando especialistas:", e);
      } finally {
        if (mounted) setLoadingSpecialists(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  /* PRECARGAR DATOS */
  useEffect(() => {
    if (!appointmentData) {
      setForm(EMPTY_FORM);
      return;
    }

    const raw = appointmentData.raw ?? {};

    if (appointmentData.id === "new") {
      setForm({
        ...EMPTY_FORM,
        lines: [{
          ...EMPTY_LINE,
          especialista: raw.especialista ?? "",
          appointment_at: toDatetimeLocal(raw.appointment_at_local ?? appointmentData.start)
        }]
      });
      setNotifyOnEdit(false);
      return;
    }

    const loadData = async () => {
      let linesData: ServiceLine[] = [];

      if (associatedServices && associatedServices.length > 0) {
        linesData = associatedServices.map((l) => ({
          id: l.id,
          servicio: l.servicio ?? l.title ?? "",
          precio: Number(l.price ?? l.precio ?? 0),
          abono: Number(l.abono ?? 0),
          duracion: String(l.duration ?? l.duracion ?? "60"),
          especialista: l.especialista ?? "",
          appointment_at: toDatetimeLocal(l.appointment_at ?? l.appointment_at_local ?? appointmentData.start),
        }));
      } else {
        const groupId = raw.appointment_id;

        if (groupId) {
          const { data, error } = await supabase
            .from("appointments")
            .select("*")
            .eq("appointment_id", groupId)
            .order("appointment_at", { ascending: true });

          if (!error && data && data.length > 0) {
            linesData = data.map((l) => ({
              id: l.id,
              servicio: l.servicio,
              precio: Number(l.price || 0),
              abono: Number(l.abono || 0),
              duracion: String(l.duration || "60"),
              especialista: l.especialista,
              appointment_at: toDatetimeLocal(l.appointment_at),
            }));
          }
        }

        if (linesData.length === 0) {
          linesData = [{
            id: Number(appointmentData.id),
            servicio: raw.servicio ?? appointmentData.title ?? "",
            precio: Number(raw.price ?? 0),
            duracion: String(raw.duration ?? "60"),
            especialista: raw.especialista ?? "",
            appointment_at: toDatetimeLocal(
              raw.appointment_at ?? raw.appointment_at_local ?? appointmentData.start
            ),
          }];
        }
      }

      setForm({
        cliente: raw.cliente ?? appointmentData.cliente ?? "",
        celular: String(raw.celular ?? appointmentData.celular ?? ""),
        indicativo: raw.indicativo ?? "+57",
        sede: raw.sede ?? "Marquetalia",
        cantidad: 1,
        estado: raw.estado ?? "Nueva reserva creada",
        lines: linesData,
      });

      setNotifyOnEdit(false);
    };

    loadData();
    setSaveClient(false);
    setDeletedLineIds([]);
  }, [appointmentData, associatedServices]);

  /* HELPERS FORMULARIO */
  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateLine = useCallback((index: number, patch: Partial<ServiceLine>) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l, i) => i === index ? { ...l, ...patch } : l),
    }));
  }, []);

  const addLine = () => {
    setForm((prev) => {
      const lastLine = prev.lines[prev.lines.length - 1];
      let nextTime = "";
      if (lastLine && lastLine.appointment_at && lastLine.duracion) {
        const currentDate = new Date(lastLine.appointment_at);
        const durationMinutes = parseInt(lastLine.duracion, 10) || 0;
        const nextDate = new Date(currentDate.getTime() + durationMinutes * 60000);
        nextTime = toDatetimeLocal(nextDate);
      }
      return {
        ...prev,
        lines: [...prev.lines, { ...EMPTY_LINE, appointment_at: nextTime }],
      };
    });
  };

  const removeLine = (index: number) => {
    setForm((prev) => {
      const lineToRemove = prev.lines[index];
      if (lineToRemove.id) {
        setDeletedLineIds((prevIds) => [...prevIds, lineToRemove.id!]);
      }
      return prev.lines.length <= 1 
        ? prev 
        : { ...prev, lines: prev.lines.filter((_, i) => i !== index) };
    });
  };

  const totalEstimado = useMemo(() => {
    const sum = form.lines.reduce((acc, l) => acc + Number(l.precio || 0), 0);
    return sum * (Number(form.cantidad) || 1);
  }, [form.lines, form.cantidad]);

  /* ENVÍO DE DATOS */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente.trim() || !form.celular.trim()) { alert("Faltan datos obligatorios"); return; }
    setSaving(true);
    try {
      const lines = form.lines.filter((l) => l.servicio.trim());
      const cleanPhone = String(form.celular).replace(/\D/g, "");
      const cleanIndicativo = String(form.indicativo).replace(/\D/g, "");
      const fullPhone = `+${cleanIndicativo}${cleanPhone}`;

      if (saveClient) {
        await supabase.from("clients").upsert(
          { nombre: form.cliente.trim(), celular: cleanPhone, indicador: form.indicativo },
          { onConflict: "celular" }
        );
      }

      if (isEditing) {
        if (deletedLineIds.length > 0) {
          await supabase.from("appointments").delete().in("id", deletedLineIds);
        }

        const updatePromises = lines.map((l) => {
          const updates = {
            cliente: form.cliente.trim(),
            celular: cleanPhone,             
            indicativo: form.indicativo,
            sede: form.sede,
            servicio: l.servicio,
            especialista: l.especialista,
            duration: l.duracion,
            price: Number(l.precio),
            abono: Number(l.abono),
            appointment_at: localDateTimeToUTC(l.appointment_at),
            estado: form.estado,
          };

          if (l.id) {
            return supabase.from("appointments").update(updates).eq("id", l.id);
          } else {
            return supabase.from("appointments").insert({
                ...updates,
                appointment_id: (appointmentData.raw as any).appointment_id
            });
          }
        });

        await Promise.all(updatePromises);

        if (notifyOnEdit) {
          try {
            const l = lines[0];
            await fetch("/api/bookings/notify-update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "EDITED",
                appointmentId: appointmentData.id,
                cliente: form.cliente.trim(),
                celular: cleanPhone,
                indicativo: form.indicativo,
                sede: form.sede,
                servicio: l.servicio,
                especialista: l.especialista,
                duration: l.duracion,
                price: l.precio,
                total: totalEstimado, 
                appointment_at: localDateTimeToUTC(l.appointment_at),
                estado: form.estado
              }),
            });
          } catch (webhookErr) {
            console.error("Error enviando notificación:", webhookErr);
          }
        }

        onSuccess?.();
        closeReservationDrawer();
        return;
      }

      const payload = {
        action: "CREATE",
        cliente: form.cliente.trim(),
        celular: cleanPhone,
        indicativo: form.indicativo,
        fullPhone: fullPhone,
        sede: form.sede,
        cantidad: String(form.cantidad),
        items: lines.map((l) => ({
          servicio: l.servicio,
          especialista: l.especialista,
          duration: l.duracion,
          price: l.precio,
          appointment_at: localDateTimeToUTC(l.appointment_at),
        })),
      };

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Error creando la reserva");
      
      onSuccess?.();
      closeReservationDrawer();
    } catch (e: any) {
      alert(e.message || "Error guardando la reserva");
    } finally {
      setSaving(false);
    }
  };

  const isLastLineComplete = useMemo(() => {
    const lastLine = form.lines[form.lines.length - 1];
    return lastLine && lastLine.servicio.trim() !== "" && lastLine.especialista.trim() !== "";
  }, [form.lines]);

  const specialistOptions = useMemo(() => {
    return specialists.map((s) => ({ label: s.name, value: s.name }));
  }, [specialists]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      
      {/* PANEL IZQUIERDO: DETALLES DEL CLIENTE */}
      {showDetails && form.celular && (
        <div className="w-full md:w-[450px] border-r border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto animate-in slide-in-from-left duration-300 custom-scrollbar">
          <div className="sticky top-0 z-20 bg-white/90 p-4 backdrop-blur-md dark:bg-zinc-900/90 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-2.5">
              Perfil del Cliente
            </h2>
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
              <button 
                type="button"
                onClick={() => setActiveTab('fichas')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer ${activeTab === 'fichas' ? 'bg-white shadow-xs text-rose-500 dark:bg-zinc-800 dark:text-rose-400' : 'text-zinc-400'}`}
              >
                <ClipboardList size={14} /> Ficha Técnica
              </button>
            </div>
          </div>

          <div className="p-4">
            {activeTab === 'fichas' ? (
              <FichaTecnicaEditor celular={form.celular} />
            ) : (
              <div className="text-center py-10 text-zinc-400 text-xs font-bold uppercase">Historial de Citas</div>
            )}
          </div>
        </div>
      )}

      {/* PANEL DERECHO: FORMULARIO */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {form.celular && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-rose-500 text-white p-2 rounded-r-2xl shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all cursor-pointer"
            title={showDetails ? "Ocultar detalles" : "Ver detalles del cliente"}
          >
            {showDetails ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            
            {/* 🌸 SECCIÓN 1: CLIENTE */}
            <section className="space-y-3.5 rounded-3xl bg-white p-4 sm:p-5 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900/90">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <User size={15} className="text-rose-500" />
                  Cliente
                </h3>
                {form.celular && !showDetails && (
                  <button 
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="text-[10px] font-black text-rose-500 hover:underline flex items-center gap-1 uppercase tracking-wider"
                  >
                    <ClipboardList size={12} /> Ver Ficha
                  </button>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Buscar Servicio o Cliente</label>
                <div className="group relative">
                  <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500 z-10" />
                  <AutocompleteInput<ClientItem>
                    placeholder="Buscar por nombre o celular..."
                    apiEndpoint="/api/autocomplete/clients"
                    initialValue={form.cliente}
                    getValue={(i) => i.nombre ?? ""}
                    getKey={(i) => String(i.celular)}
                    renderItem={(i) => (
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{i.nombre}</span>
                        <span className="text-[10px] text-zinc-400 font-semibold">{i.celular}</span>
                      </div>
                    )}
                    onChange={(val) => updateField("cliente", val)}
                    onSelect={(i) =>
                      setForm((p) => ({
                        ...p,
                        cliente: i.nombre ?? "",
                        celular: String(i.celular ?? ""),
                        indicativo: i.indicador || p.indicativo,
                      }))
                    }
                    inputClassName="w-full rounded-2xl border border-zinc-200/80 bg-white py-2 pl-10 pr-3 text-[11px] font-bold text-zinc-900 shadow-2xs focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="celular" className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Teléfono Móvil</label>
                <div className="flex gap-2">
                  <div className="relative w-24">
                    <input
                      type="text"
                      list="indicativos-list"
                      value={form.indicativo}
                      onChange={(e) => updateField("indicativo", e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200/80 bg-white py-2 px-2.5 text-[11px] font-black text-center shadow-2xs focus:border-rose-300 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      placeholder="+00"
                    />
                    <datalist id="indicativos-list">
                      {COUNTRIES.map((c) => (
                        <option key={`${c.name}-${c.code}`} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </datalist>
                  </div>

                  <div className="group relative flex-1">
                    <Phone size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500" />
                    <input
                      id="celular"
                      type="tel"
                      value={form.celular}
                      onChange={(e) => updateField("celular", e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200/80 bg-white py-2 pl-9 pr-3 text-[11px] font-bold shadow-2xs focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      placeholder="Ej: 3001234567"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center pt-0.5">
                <input
                  id="save-client"
                  type="checkbox"
                  checked={saveClient}
                  onChange={(e) => setSaveClient(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-rose-500 focus:ring-rose-400 dark:bg-zinc-950 dark:border-zinc-800 cursor-pointer"
                />
                <label htmlFor="save-client" className="ml-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer">
                  Guardar cliente en directorio
                </label>
              </div>
            </section>

            {/* 🌸 SECCIÓN 2: SERVICIOS */}
            <section className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles size={15} className="text-rose-500" />
                  Servicios Solicitados
                </h3>
                <button
                  type="button"
                  onClick={addLine}
                  disabled={!isLastLineComplete}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-500 hover:bg-rose-500/20 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Plus size={14} /> <span>Añadir</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {form.lines.map((line, index) => (
                  <div key={index} className="relative rounded-3xl bg-white p-4 sm:p-5 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900/90 space-y-3.5">
                    {form.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="absolute -right-2 -top-2 rounded-full border border-zinc-200 bg-white p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:border-zinc-800 dark:bg-zinc-900 transition-all cursor-pointer shadow-2xs"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    {/* BUSCAR SERVICIO */}
                    <AutocompleteInput<ServiceItem>
                      label={form.lines.length > 1 ? `Servicio ${index + 1}` : "Buscar servicio..."}
                      placeholder="Escribe para buscar un servicio..."
                      apiEndpoint="/api/autocomplete/services"
                      initialValue={line.servicio}
                      getValue={(i) => i.Servicio ?? ""}
                      getKey={(i) => i.SKU}
                      renderItem={(i) => (
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{i.Servicio}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold">${Number(i.Precio ?? 0).toLocaleString("es-CO")} • {i.duracion} min</span>
                        </div>
                      )}
                      onSelect={(i) => updateLine(index, {
                        servicio: i.Servicio ?? "",
                        precio: Number(i.Precio ?? 0),
                        duracion: String(i.duracion ?? "60"),
                      })}
                      inputClassName="w-full rounded-2xl border border-zinc-200/80 bg-white py-2 px-3 text-[11px] font-bold text-zinc-900 shadow-2xs focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />

                    {/* SELECTOR DE ESPECIALISTA Y FECHA/HORA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Especialista</label>
                        <CustomSelect
                          value={line.especialista}
                          onChange={(val) => updateLine(index, { especialista: val })}
                          options={specialistOptions}
                          placeholder={loadingSpecialists ? "Cargando..." : "Seleccionar especialista..."}
                          icon={Users}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Fecha y Hora</label>
                        <div className="group relative">
                          <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                          <input
                            type="datetime-local"
                            value={line.appointment_at}
                            onChange={(e) => updateLine(index, { appointment_at: e.target.value })}
                            className="w-full rounded-2xl border border-zinc-200/80 bg-white dark:bg-zinc-950 py-2 pl-9 pr-2.5 text-[11px] font-bold text-zinc-800 dark:text-zinc-100 shadow-2xs hover:border-rose-300 dark:hover:border-rose-900/50 focus:border-rose-400 focus:outline-none transition-all cursor-pointer"
                          />
                        </div>
                      </div>

                    </div>

                    {/* DURACIÓN, PRECIO Y ABONO */}
                    <div className="grid grid-cols-3 gap-2.5 pt-0.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Duración (m)</label>
                        <div className="group relative">
                          <Clock size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="number"
                            min={5}
                            value={Number(line.duracion || 60)}
                            onChange={(e) => updateLine(index, { duracion: String(e.target.value) })}
                            className="w-full rounded-2xl border border-zinc-200 bg-white py-1.5 pl-7 pr-2 text-[11px] font-extrabold text-zinc-800 dark:text-zinc-100 shadow-2xs focus:border-rose-300 dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Precio</label>
                        <div className="group relative">
                          <DollarSign size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="number"
                            value={Number(line.precio || 0)}
                            onChange={(e) => updateLine(index, { precio: Number(e.target.value) })}
                            className="w-full rounded-2xl border border-zinc-200 bg-white py-1.5 pl-7 pr-2 text-[11px] font-extrabold text-zinc-800 dark:text-zinc-100 shadow-2xs focus:border-rose-300 dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-emerald-500">Abono</label>
                        <div className="group relative">
                          <DollarSign size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                          <input
                            type="number"
                            value={Number(line.abono || 0)}
                            onChange={(e) => updateLine(index, { abono: Number(e.target.value) })}
                            className="w-full rounded-2xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 py-1.5 pl-7 pr-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 shadow-2xs focus:border-emerald-500"
                            placeholder="0"
                          />
                        </div>
                      </div> 
                    </div>

                  </div>
                ))}
              </div>
            </section>

            {/* 🌸 SECCIÓN 3: CONFIGURACIÓN CON SELECTORES PERSONALIZADOS */}
            <section className="space-y-3.5 rounded-3xl bg-white p-4 sm:p-5 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900/90">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Tag size={15} className="text-rose-500" />
                Configuración
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Estado de la Cita</label>
                  <CustomSelect
                    value={form.estado}
                    onChange={(val) => updateField("estado", val)}
                    options={ESTADO_OPTIONS}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Sede</label>
                  <CustomSelect
                    value={form.sede}
                    onChange={(val) => updateField("sede", val)}
                    options={SEDE_OPTIONS}
                    icon={Building}
                  />
                </div>

              </div>
            </section>
          </div>

          {/* PIE DEL FORMULARIO Y BOTÓN DE GUARDADO */}
          <div className="sticky bottom-0 z-10 mt-auto border-t border-zinc-200/80 bg-white/95 p-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95 space-y-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => setNotifyOnEdit(!notifyOnEdit)}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  notifyOnEdit 
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400" 
                    : "bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  {notifyOnEdit ? <Bell size={15} /> : <BellOff size={15} />}
                  <span className="text-[10px] font-black uppercase tracking-wider">{notifyOnEdit ? "Notificación Activa" : "Notificación Desactivada"}</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${notifyOnEdit ? 'bg-rose-500' : 'bg-zinc-300 dark:bg-zinc-800'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${notifyOnEdit ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </button>
            )}

            <div className="flex items-center justify-between rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3">
              <span className="text-xs font-black uppercase tracking-wider text-rose-500">Total Reserva</span>
              <span className="text-lg font-black text-rose-500">${Number(totalEstimado).toLocaleString("es-CO")} COP</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}