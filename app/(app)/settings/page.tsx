"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/sessionStore"; 
import { supabase } from "@/lib/supabaseClient"; 
import { Calendar, Plus, Trash2, Check, X, Clock, User, Save, MapPin, Sparkles } from "lucide-react";

const DIAS_SEMANA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const SEDES_DISPONIBLES = ["Marquetalia", "Buga", "Santa Marta"];

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

  // --- ESTADOS ---
  const [selectedSpecId, setSelectedSpecId] = useState("");
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [baseSchedule, setBaseSchedule] = useState<any>(null);
  
  // Formulario de Novedades / Días Especiales
  const [date, setDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [type, setType] = useState<"blocked" | "available" | "assigned_sede">("blocked");
  const [selectedSede, setSelectedSede] = useState("Marquetalia");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicialización de datos
  useEffect(() => {
    const init = async () => {
      // Cargar Especialistas
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

      // Cargar catálogo de Servicios con su campo de especialistas habilitadas
      const { data: servData } = await supabase
        .from("services")
        .select("id, SKU, Servicio, especialistas");
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
      // Reiniciar selección de servicios al cambiar de especialista
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

  // Obtener el nombre de la especialista seleccionada actualmente
  const currentSpecName =
    session?.role === "ADMIN"
      ? specialists.find((s) => s.id === selectedSpecId)?.name
      : session?.name;

  // Filtrar la lista de servicios para incluir ÚNICAMENTE los que realiza la especialista actual
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

  const handleToggleService = (skuOrId: string) => {
    if (selectedServices.includes(skuOrId)) {
      setSelectedServices(selectedServices.filter((s) => s !== skuOrId));
    } else {
      setSelectedServices([...selectedServices, skuOrId]);
    }
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
    <div className="space-y-6 max-w-5xl mx-auto p-4 pb-24 font-sans">
      {/* SELECTOR ESPECIALISTA */}
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
            {specialists.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </section>
      )}

      {/* HORARIO BASE SEMANAL */}
      <section className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-4">
          <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-indigo-600" /> Horario Base Semanal
          </h3>
          <button
            onClick={saveBaseSchedule}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Save size={14} /> {loading ? "GUARDANDO..." : "GUARDAR HORARIO"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="flex flex-col gap-3 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                  {dia}
                </span>
                <select
                  value={baseSchedule?.[dia]?.estado || "cerrado"}
                  onChange={(e) => updateBaseDay(dia, "estado", e.target.value)}
                  className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                    baseSchedule?.[dia]?.estado === "abierto"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <option value="abierto">Abierto</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              {baseSchedule?.[dia]?.estado === "abierto" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">
                      Apertura
                    </label>
                    <input
                      type="time"
                      value={baseSchedule?.[dia]?.inicio || "09:00"}
                      onChange={(e) => updateBaseDay(dia, "inicio", e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">
                      Cierre
                    </label>
                    <input
                      type="time"
                      value={baseSchedule?.[dia]?.fin || "18:00"}
                      onChange={(e) => updateBaseDay(dia, "fin", e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* DISPONIBILIDAD ESPECIAL / NOVEDADES / ASIGNACIÓN DE SEDES */}
      <section className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 border-b dark:border-zinc-800 pb-4">
          <Calendar className="text-indigo-600" /> Días Especiales / Novedades / Sedes
        </h3>

        <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border dark:border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Inicio</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Fin (Opcional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Desde</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Hasta</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-400 ml-1 uppercase">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold border dark:border-zinc-800 outline-none"
              >
                <option value="blocked">Ausencia / Bloqueo</option>
                <option value="available">Extra</option>
                <option value="assigned_sede">Asignación de Sede</option>
              </select>
            </div>
            <button
              onClick={handleSaveOverride}
              disabled={loading}
              className="py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Plus size={16} /> {loading ? "..." : "AÑADIR"}
            </button>
          </div>

          {/* SI ELIGE "ASIGNACIÓN DE SEDE", SE MUESTRAN CONTROLES EXTENDIDOS */}
          {type === "assigned_sede" && (
            <div className="pt-3 border-t dark:border-zinc-700 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-indigo-600 block mb-1.5 flex items-center gap-1">
                  <MapPin size={12} /> Sede donde estará presente:
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEDES_DISPONIBLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSede(s)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSede === s
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : "bg-white dark:bg-zinc-900 border dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-indigo-600 block mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} /> Servicios que realizará {currentSpecName ? `(${currentSpecName})` : ""} (Opcional - Dejar vacío para permitir todos sus servicios):
                </label>
                
                {availableServicesForSpec.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {availableServicesForSpec.map((srv) => {
                      const sku = srv.SKU || srv.id;
                      const isSelected = selectedServices.includes(sku);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => handleToggleService(sku)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                              : "bg-white dark:bg-zinc-900 border dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {srv.Servicio}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-xl">
                    No se encontraron servicios asignados a {currentSpecName}.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* LISTADO DE NOVEDADES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overrides.map((ov) => (
            <div
              key={ov.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    ov.type === "available"
                      ? "bg-emerald-50 text-emerald-600"
                      : ov.type === "assigned_sede"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {ov.type === "available" ? (
                    <Check size={14} />
                  ) : ov.type === "assigned_sede" ? (
                    <MapPin size={14} />
                  ) : (
                    <X size={14} />
                  )}
                </div>
                <div>
                  <span className="text-xs font-black block">{ov.date}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter block">
                    {ov.start_time?.slice(0, 5)} - {ov.end_time?.slice(0, 5)} •{" "}
                    {ov.type === "available"
                      ? "EXTRA"
                      : ov.type === "assigned_sede"
                      ? `SEDE: ${ov.sede || "NO DEFINIDA"}`
                      : "AUSENCIA"}
                  </span>
                  {ov.allowed_services && Array.isArray(ov.allowed_services) && (
                    <span className="text-[8px] font-semibold text-indigo-500 block">
                      Servicios Habilitados: {ov.allowed_services.length}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteOverride(ov.id)}
                className="p-2 text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}