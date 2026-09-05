"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/sessionStore"; 
import { supabase } from "@/lib/supabaseClient"; 
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  User, 
  Save, 
  MapPin, 
  Sparkles, 
  CheckSquare, 
  Square,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings
} from "lucide-react";

const DIAS_SEMANA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const SEDES_DISPONIBLES = ["Marquetalia", "Buga", "Santa Marta"];
const MESES_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const TIME_OPTIONS = (() => {
  const times = [];
  for (let h = 7; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = h < 10 ? `0${h}` : `${h}`;
      const mm = m === 0 ? "00" : `${m}`;
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
})();

function format12h(time24: string) {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h < 10 ? "0" + h : h}:${m} ${ampm}`;
}

/* =========================================================
   🔹 DATE PICKER PERSONALIZADO CON SOPORTE MODOS CLARO/OSCURO
========================================================= */
function CustomDatePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(`${value}T00:00:00`) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentMonthYear] = useState(initialDate.getFullYear());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return "Seleccionar fecha";
    const [y, m, d] = dateStr.split("-");
    const monthName = MESES_ES[parseInt(m, 10) - 1]?.slice(0, 3);
    return `${d} ${monthName}, ${y}`;
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentMonthYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentMonthYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const handleSelectDay = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const formatted = `${currentYear}-${mm}-${dd}`;
    onChange(formatted);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block tracking-wider">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs hover:border-rose-400 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={14} className="text-rose-500" />
          <span>{value ? formatDisplay(value) : "Opcional"}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {MESES_ES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"].map((d) => (
              <span key={d} className="text-[10px] font-bold text-zinc-400">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((p) => (
              <div key={`pad-${p}`} />
            ))}
            {daysArray.map((d) => {
              const mm = String(currentMonth + 1).padStart(2, "0");
              const dd = String(d).padStart(2, "0");
              const dateKey = `${currentYear}-${mm}-${dd}`;
              const isSelected = value === dateKey;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`p-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {d}
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
   🔹 DROPDOWN CON SOPORTE MODOS CLARO/OSCURO
========================================================= */
function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  icon: Icon,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: any;
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

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs hover:border-rose-400 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-rose-500 shrink-0" />}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                value === opt.value
                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={14} className="text-rose-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 SELECTOR DE HORA CON SOPORTE MODOS CLARO/OSCURO
========================================================= */
function CustomTimePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
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

  return (
    <div className="relative w-full" ref={ref}>
      <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 ml-1 mb-1 block tracking-wider">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs hover:border-rose-400 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-rose-500" />
          <span>{format12h(value) || "Seleccionar"}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 max-h-52 overflow-y-auto grid grid-cols-2 gap-1 animate-in fade-in duration-150">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={`p-2 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                value === t
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {format12h(t)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 PÁGINA PRINCIPAL CONFIGURACIÓN AVANZADA
========================================================= */
export default function SettingsPage() {
  const router = useRouter();
  const { session } = useSessionStore();

  const getTodayStr = () => {
    const now = new Date();
    return (
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0")
    );
  };

  const [selectedSpecId, setSelectedSpecId] = useState("");
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [baseSchedule, setBaseSchedule] = useState<any>(null);

  const [date, setDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [type, setType] = useState<"blocked" | "available" | "assigned_sede">("blocked");
  const [selectedSede, setSelectedSede] = useState("Marquetalia");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (session?.role === "ADMIN") {
        const { data } = await supabase
          .from("app_users")
          .select("id, name")
          .in("role", ["ESPECIALISTA", "SPECIALIST"]);
        if (data && data.length > 0) {
          setSpecialists(data);
          setSelectedSpecId(data[0].id);
        }
      } else if (session?.id) {
        setSelectedSpecId(session.id);
      }

      const { data: servData } = await supabase
        .from("services")
        .select("id, SKU, Servicio, category, especialistas");
      if (servData) setServicesList(servData);
    };
    init();
  }, [session]);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedSpecId) return;
      const { data: user } = await supabase
        .from("app_users")
        .select("horario_semanal")
        .eq("id", selectedSpecId)
        .single();

      const parsed =
        typeof user?.horario_semanal === "string"
          ? JSON.parse(user.horario_semanal)
          : user?.horario_semanal;

      setBaseSchedule(parsed || {});
      setSelectedServices([]);
      reloadOverrides();
    };
    loadData();
  }, [selectedSpecId]);

  const reloadOverrides = async () => {
    const { data } = await supabase
      .from("specialist_overrides")
      .select("*")
      .eq("specialist_id", selectedSpecId)
      .gte("date", getTodayStr())
      .order("date", { ascending: true });

    setOverrides(data || []);
  };

  const currentSpecName =
    session?.role === "ADMIN"
      ? specialists.find((s) => s.id === selectedSpecId)?.name
      : session?.name;

  const availableServicesForSpec = servicesList.filter((srv) => {
    if (!currentSpecName) return false;
    let specList: string[] = [];

    if (typeof srv.especialistas === "string") {
      try {
        specList = JSON.parse(srv.especialistas);
      } catch (e) {
        specList = [srv.especialistas];
      }
    } else if (Array.isArray(srv.especialistas)) {
      specList = srv.especialistas;
    }

    return specList.includes(currentSpecName);
  });

  const servicesByCategory = availableServicesForSpec.reduce((acc: Record<string, any[]>, srv) => {
    const cat = srv.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(srv);
    return acc;
  }, {});

  const handleToggleService = (skuOrId: string) => {
    if (selectedServices.includes(skuOrId)) {
      setSelectedServices(selectedServices.filter((s) => s !== skuOrId));
    } else {
      setSelectedServices([...selectedServices, skuOrId]);
    }
  };

  const handleToggleCategory = (categoryName: string) => {
    const categoryServices = servicesByCategory[categoryName] || [];
    const categorySkus = categoryServices.map((s) => s.SKU || s.id);
    const allSelected = categorySkus.every((sku) => selectedServices.includes(sku));

    if (allSelected) {
      setSelectedServices(selectedServices.filter((s) => !categorySkus.includes(s)));
    } else {
      const newSelections = new Set([...selectedServices, ...categorySkus]);
      setSelectedServices(Array.from(newSelections));
    }
  };

  const updateBaseDay = (dia: string, field: string, value: string) => {
    setBaseSchedule((prev: any) => {
      const currentDay = prev?.[dia] || { inicio: "09:00", fin: "18:00", estado: "cerrado" };
      if (field === "estado" && value === "abierto") {
        return {
          ...prev,
          [dia]: {
            ...currentDay,
            estado: "abierto",
            inicio: currentDay.inicio || "09:00",
            fin: currentDay.fin || "18:00",
          },
        };
      }
      return { ...prev, [dia]: { ...currentDay, [field]: value } };
    });
  };

  const saveBaseSchedule = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("app_users")
      .update({ horario_semanal: JSON.stringify(baseSchedule) })
      .eq("id", selectedSpecId);

    if (!error) alert("¡Horario base actualizado!");
    else alert("Error: " + error.message);
    setLoading(false);
  };

  const handleSaveOverride = async () => {
    if (!selectedSpecId || !date) return;

    setLoading(true);

    const datesToInsert = [date];
    if (endDate && endDate > date) {
      let current = new Date(date + "T00:00:00");
      let end = new Date(endDate + "T00:00:00");
      while (current < end) {
        current.setDate(current.getDate() + 1);
        datesToInsert.push(current.toISOString().split("T")[0]);
      }
    }

    const rows = datesToInsert.map((d) => ({
      specialist_id: selectedSpecId,
      especialista: currentSpecName,
      date: d,
      type,
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      sede: type === "assigned_sede" ? selectedSede : null,
      allowed_services:
        type === "assigned_sede" && selectedServices.length > 0
          ? selectedServices
          : null,
    }));

    const { error } = await supabase.from("specialist_overrides").insert(rows);

    if (!error) {
      alert(
        datesToInsert.length > 1
          ? `Se han guardado ${datesToInsert.length} días de novedad correctamente`
          : "Novedad registrada exitosamente"
      );
      setDate(getTodayStr());
      setEndDate("");
      setSelectedServices([]);
      reloadOverrides();
    } else {
      alert("Error guardando novedad: " + error.message);
    }
    setLoading(false);
  };

  const deleteOverride = async (id: number) => {
    await supabase.from("specialist_overrides").delete().eq("id", id);
    reloadOverrides();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pb-24 font-sans text-zinc-900 dark:text-zinc-100 antialiased animate-in fade-in duration-500">
      
      {/* ENCABEZADO PRINCIPAL GRANDE Y RECALCADO */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6 space-y-1.5">
        <div className="flex items-center gap-2 text-rose-500">
          <Sparkles size={20} />
          <span className="text-xs font-bold tracking-wider uppercase text-rose-500">Módulo de Administración</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Configuración Avanzada
        </h1>
        <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Gestión integral de horarios recurrentes, ausencias, bloques especiales y asignación de sedes
        </p>
      </header>

      {/* SELECTOR ESPECIALISTA */}
      {session?.role === "ADMIN" && (
        <section className="bg-white dark:bg-zinc-900/90 p-5 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-extrabold uppercase text-xs tracking-wider text-zinc-900 dark:text-zinc-100">Especialista Activa</h3>
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Selecciona la agenda que vas a configurar</p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <CustomSelect
              icon={User}
              options={specialists.map((s) => ({ label: s.name, value: s.id }))}
              value={selectedSpecId}
              onChange={(val) => setSelectedSpecId(val)}
              placeholder="Especialista..."
            />
          </div>
        </section>
      )}

      {/* HORARIO BASE SEMANAL */}
      <section className="bg-white dark:bg-zinc-900/90 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                Horario Base Semanal
              </h3>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Días recurrentes de atención habitual</p>
            </div>
          </div>

          <button
            onClick={saveBaseSchedule}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save size={16} /> <span>{loading ? "Guardando..." : "Guardar Horario"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="flex flex-col gap-3 p-5 bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200 tracking-wider">
                  {dia}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    updateBaseDay(
                      dia,
                      "estado",
                      baseSchedule?.[dia]?.estado === "abierto" ? "cerrado" : "abierto"
                    )
                  }
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    baseSchedule?.[dia]?.estado === "abierto"
                      ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {baseSchedule?.[dia]?.estado === "abierto" ? "ABIERTO" : "CERRADO"}
                </button>
              </div>

              {baseSchedule?.[dia]?.estado === "abierto" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <CustomTimePicker
                    label="Apertura"
                    value={baseSchedule?.[dia]?.inicio || "09:00"}
                    onChange={(val) => updateBaseDay(dia, "inicio", val)}
                  />
                  <CustomTimePicker
                    label="Cierre"
                    value={baseSchedule?.[dia]?.fin || "18:00"}
                    onChange={(val) => updateBaseDay(dia, "fin", val)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* NOVEDADES Y DÍAS ESPECIALES */}
      <section className="bg-white dark:bg-zinc-900/90 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-5">
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
              Días Especiales y Asignación de Sedes
            </h3>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Configura bloqueos, ausencias o viajes a sedes</p>
          </div>
        </div>

        {/* CONTENEDOR FORMULARIO NOVEDADES */}
        <div className="space-y-6 bg-zinc-50 dark:bg-zinc-950/60 p-5 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            
            <CustomDatePicker label="Fecha Inicio" value={date} onChange={(val) => setDate(val)} />

            <CustomDatePicker label="Fecha Fin (Opcional)" value={endDate} onChange={(val) => setEndDate(val)} />

            <CustomTimePicker label="Hora Inicio" value={startTime} onChange={(val) => setStartTime(val)} />

            <CustomTimePicker label="Hora Fin" value={endTime} onChange={(val) => setEndTime(val)} />

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 ml-1 block tracking-wider">Tipo Novedad</label>
              <CustomSelect
                options={[
                  { label: "Ausencia / Bloqueo", value: "blocked" },
                  { label: "Turno Extra", value: "available" },
                  { label: "Asignación de Sede", value: "assigned_sede" },
                ]}
                value={type}
                onChange={(val: any) => setType(val)}
              />
            </div>
          </div>

          {/* OPCIONES DE SEDE Y SERVICIOS */}
          {type === "assigned_sede" && (
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-5">
              
              {/* Selección de Sede */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase text-rose-500 flex items-center gap-1.5">
                  <MapPin size={14} /> Selecciona la Sede donde estará presente:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SEDES_DISPONIBLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSede(s)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                        selectedSede === s
                          ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20 scale-[1.02]"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <MapPin size={13} /> {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selección por Categorías */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase text-rose-500 flex items-center gap-1.5">
                  <Sparkles size={14} /> Servicios que realizará {currentSpecName ? `(${currentSpecName})` : ""}
                </label>

                {Object.keys(servicesByCategory).length > 0 ? (
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {Object.entries(servicesByCategory).map(([category, services]) => {
                      const categorySkus = services.map((s) => s.SKU || s.id);
                      const isCategoryAllSelected = categorySkus.every((sku) =>
                        selectedServices.includes(sku)
                      );

                      return (
                        <div
                          key={category}
                          className="p-4 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                            <span className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                              <Layers size={13} className="text-rose-500" /> {category} ({services.length})
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleCategory(category)}
                              className="text-[10px] font-extrabold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {isCategoryAllSelected ? (
                                <>
                                  <CheckSquare size={13} /> Desmarcar Categoría
                                </>
                              ) : (
                                <>
                                  <Square size={13} /> Seleccionar Toda la Categoría
                                </>
                              )}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {services.map((srv) => {
                              const sku = srv.SKU || srv.id;
                              const isSelected = selectedServices.includes(sku);
                              return (
                                <button
                                  key={srv.id}
                                  type="button"
                                  onClick={() => handleToggleService(sku)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                                    isSelected
                                      ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20 scale-[1.02]"
                                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                  }`}
                                >
                                  {isSelected ? <Check size={12} /> : <Plus size={12} />}
                                  <span>{srv.Servicio}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/40">
                    No se encontraron servicios asignados a {currentSpecName}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* BOTÓN REGISTRAR */}
          <button
            onClick={handleSaveOverride}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <Plus size={18} /> <span>{loading ? "Guardando..." : "Registrar Novedad en la Agenda"}</span>
          </button>
        </div>

        {/* LISTA DE NOVEDADES GUARDADAS */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">
            Novedades Vigentes ({overrides.length})
          </h4>

          {overrides.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 italic p-4 text-center border border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
              No hay bloqueos ni novedades programadas.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {overrides.map((ov) => (
                <div
                  key={ov.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        ov.type === "available"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : ov.type === "assigned_sede"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {ov.type === "available" ? (
                        <Check size={16} />
                      ) : ov.type === "assigned_sede" ? (
                        <MapPin size={16} />
                      ) : (
                        <X size={16} />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-black block text-zinc-900 dark:text-zinc-100">{ov.date}</span>
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight block">
                        {format12h(ov.start_time?.slice(0, 5))} - {format12h(ov.end_time?.slice(0, 5))} •{" "}
                        {ov.type === "available"
                          ? "TURNO EXTRA"
                          : ov.type === "assigned_sede"
                          ? `SEDE: ${ov.sede || "NO DEFINIDA"}`
                          : "AUSENCIA / BLOQUEO"}
                      </span>
                      {ov.allowed_services && Array.isArray(ov.allowed_services) && (
                        <span className="text-[9px] font-semibold text-rose-500 dark:text-rose-400 block mt-0.5">
                          Servicios Habilitados: {ov.allowed_services.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteOverride(ov.id)}
                    className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}