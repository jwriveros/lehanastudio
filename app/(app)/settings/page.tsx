"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SettingsPanel } from "@/components"; //
import { useSessionStore } from "@/lib/sessionStore"; //
import { supabase } from "@/lib/supabaseClient"; //
import { Calendar, Plus, Trash2, Check, X, Clock, User, Save, Settings } from "lucide-react";

const DIAS_SEMANA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export default function SettingsPage() {
  const router = useRouter();
  const { logout, session } = useSessionStore(); //

  const getTodayStr = () => {
    const now = new Date();
    return now.getFullYear() + '-' + 
           String(now.getMonth() + 1).padStart(2, '0') + '-' + 
           String(now.getDate()).padStart(2, '0');
  };

  // --- ESTADOS ---
  const [selectedSpecId, setSelectedSpecId] = useState("");
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [baseSchedule, setBaseSchedule] = useState<any>(null);
  const [date, setDate] = useState(getTodayStr());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [type, setType] = useState<"available" | "blocked">("blocked");
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Inicialización de Sesión y Especialistas
  useEffect(() => {
    const init = async () => {
      if (session?.role === "ADMIN") {
        const { data } = await supabase.from("app_users")
          .select("id, name")
          .in("role", ["ESPECIALISTA", "SPECIALIST"]);
        if (data && data.length > 0) {
          setSpecialists(data);
          setSelectedSpecId(data[0].id);
        }
      } else if (session?.id) {
        setSelectedSpecId(session.id);
      }
    };
    init();
  }, [session]);

  // 2. Carga de Datos al cambiar Especialista
  useEffect(() => {
    const loadData = async () => {
      if (!selectedSpecId) return;

      const { data: user } = await supabase
        .from("app_users")
        .select("horario_semanal")
        .eq("id", selectedSpecId)
        .single();
      
      const parsed = typeof user?.horario_semanal === 'string' 
        ? JSON.parse(user.horario_semanal) 
        : user?.horario_semanal;
      setBaseSchedule(parsed || {});

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

  // --- LÓGICA DE EDICIÓN DE HORARIO ---
  const updateBaseDay = (dia: string, field: string, value: string) => {
    setBaseSchedule((prev: any) => {
      const currentDay = prev?.[dia] || { inicio: "09:00", fin: "18:00", estado: "cerrado" };
      
      // Si abrimos el día, forzamos que tenga horas
      if (field === "estado" && value === "abierto") {
        return {
          ...prev,
          [dia]: {
            ...currentDay,
            estado: "abierto",
            inicio: currentDay.inicio || "09:00",
            fin: currentDay.fin || "18:00"
          }
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
  
  // 1. Buscamos el nombre de la especialista seleccionada
  const specName = session?.role === "ADMIN" 
    ? specialists.find(s => s.id === selectedSpecId)?.name 
    : session?.name;

  setLoading(true);
  const { error } = await supabase
    .from("specialist_overrides")
    .insert([{ 
      specialist_id: selectedSpecId, 
      especialista: specName, // <-- Asegúrate de que el nombre de la columna sea exactamente este
      date, 
      type, 
      start_time: startTime, 
      end_time: endTime 
    }]);
  
  if (!error) {
    alert("Disponibilidad especial guardada correctamente");
    setDate(getTodayStr());
    reloadOverrides();
  } else {
    console.error("Error al guardar:", error);
    alert("Error al guardar: " + error.message);
  }
  setLoading(false);
};

  const deleteOverride = async (id: number) => {
    await supabase.from("specialist_overrides").delete().eq("id", id);
    reloadOverrides();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 pb-24">

      {/* SECCIÓN 1: SELECTOR DE ESPECIALISTA (ADMIN) */}
      {session?.role === "ADMIN" && (
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="text-indigo-600" />
            <h3 className="font-black uppercase text-xs tracking-tight">Gestionando a:</h3>
          </div>
          <select 
            value={selectedSpecId} 
            onChange={(e) => setSelectedSpecId(e.target.value)}
            className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl text-xs font-bold outline-none ring-1 ring-zinc-200 dark:ring-zinc-700"
          >
            {specialists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </section>
      )}

      {/* SECCIÓN 2: HORARIO BASE SEMANAL */}
      <section className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-4">
          <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-indigo-600" /> Horario Base Semanal
          </h3>
          <button onClick={saveBaseSchedule} disabled={loading} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all">
            <Save size={14} /> {loading ? "GUARDANDO..." : "GUARDAR HORARIO"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIAS_SEMANA.map(dia => (
            <div key={dia} className="flex flex-col gap-3 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">{dia}</span>
                <select 
                  value={baseSchedule?.[dia]?.estado || "cerrado"}
                  onChange={(e) => updateBaseDay(dia, "estado", e.target.value)}
                  className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${baseSchedule?.[dia]?.estado === 'abierto' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                >
                  <option value="abierto">Abierto</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              
              {baseSchedule?.[dia]?.estado === "abierto" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Apertura</label>
                    <input type="time" value={baseSchedule?.[dia]?.inicio || "09:00"} onChange={(e) => updateBaseDay(dia, "inicio", e.target.value)} className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Cierre</label>
                    <input type="time" value={baseSchedule?.[dia]?.fin || "18:00"} onChange={(e) => updateBaseDay(dia, "fin", e.target.value)} className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN 3: DISPONIBILIDAD ESPECIAL */}
      <section className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 border-b dark:border-zinc-800 pb-4">
          <Calendar className="text-indigo-600" /> Días Especiales (Vacaciones / Extras)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border dark:border-zinc-800">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Desde</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Hasta</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800">
                <option value="blocked">Bloquear (Ausencia)</option>
                <option value="available">Habilitar (Extra)</option>
              </select>
            </div>
            <button onClick={handleSaveOverride} className="py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
              <Plus size={16} /> AÑADIR
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overrides.map((ov) => (
              <div key={ov.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${ov.type === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {ov.type === 'available' ? <Check size={14} /> : <X size={14} />}
                  </div>
                  <div>
                    <span className="text-xs font-black block">{ov.date}</span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                      {ov.start_time?.slice(0,5)} - {ov.end_time?.slice(0,5)} • {ov.type === 'available' ? 'EXTRA' : 'AUSENCIA'}
                    </span>
                  </div>
                </div>
                <button onClick={() => deleteOverride(ov.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
      </section>

    </div>
  );
}