"use client";

import React, { useState, useEffect, useRef } from "react";
import CustomDialog from "@/components/ui/CustomDIalog";
import { 
  Gift, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  RefreshCcw, 
  Loader2, 
  Trash2,
  Save,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Minus,
  RotateCcw,
  PauseCircle
} from "lucide-react";

const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/* =========================================================
   🌸 DATE PICKER MODERNO ESTILIZADO (POPOVER CALENDARIO)
========================================================= */
function ModernDatePicker({
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
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

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
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
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
    onChange(`${currentYear}-${mm}-${dd}`);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 mb-1 block tracking-wider">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs hover:border-rose-400 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={14} className="text-rose-500 shrink-0" />
          <span>{formatDisplay(value)}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
              {MESES_ES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
   🌸 DROPDOWN MODERNO PARA EL COMPORTAMIENTO DEL CICLO
========================================================= */
function ModernCycleSelect({
  value,
  onChange,
}: {
  value: "restart" | "once";
  onChange: (val: "restart" | "once") => void;
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

  const options = [
    {
      value: "restart" as const,
      label: "Reiniciar Conteo",
      desc: "Ciclo continuo (recompensa cada N citas)",
      icon: RotateCcw,
    },
    {
      value: "once" as const,
      label: "Pausar Conteo",
      desc: "Beneficio único por clienta",
      icon: PauseCircle,
    },
  ];

  const selected = options.find((o) => o.value === value) || options[0];
  const SelectedIcon = selected.icon;

  return (
    <div className="relative w-full" ref={ref}>
      <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 mb-1 block tracking-wider">
        Comportamiento al Cumplir
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs hover:border-rose-400 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <SelectedIcon size={14} className="text-rose-500 shrink-0" />
          <span className="truncate">{selected.label}</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in duration-150">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isCurrent = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between cursor-pointer ${
                  isCurrent
                    ? "bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={14} className={isCurrent ? "text-rose-500" : "text-zinc-400"} />
                  <div>
                    <span className="text-xs font-bold block">{opt.label}</span>
                    <span className="text-[10px] text-zinc-400 block">{opt.desc}</span>
                  </div>
                </div>
                {isCurrent && <Check size={14} className="text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🌸 COMPONENTE PRINCIPAL
========================================================= */
export default function LoyaltyReport() {
  const [loading, setLoading] = useState(false);
  const [checkingCampaign, setCheckingCampaign] = useState(true);
  const [sendingHsm, setSendingHsm] = useState<string | null>(null);

  // Parámetros de la campaña configurables
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [targetVisits, setTargetVisits] = useState(5);
  const [benefitType, setBenefitType] = useState<"percent" | "fixed" | "gift">("percent");
  const [benefitValue, setBenefitValue] = useState("20");
  const [cycleAction, setCycleAction] = useState<"restart" | "once">("restart");

  // Estado de campaña activa y datos obtenidos
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [hasActiveCampaign, setHasActiveCampaign] = useState(false);
  const [closeToReward, setCloseToReward] = useState<any[]>([]);
  const [rewardAchieved, setRewardAchieved] = useState<any[]>([]);

  // Diálogo informativo
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    variant: "success" | "danger" | "warning" | "info";
    title: string;
    message: string;
  }>({
    isOpen: false,
    variant: "info",
    title: "",
    message: "",
  });

  const showModal = (
    title: string,
    message: string,
    variant: "success" | "danger" | "warning" | "info" = "success"
  ) => {
    setDialog({ isOpen: true, variant, title, message });
  };

  // Helper seguro para evitar el SyntaxError con <!DOCTYPE html>
  const safeParseJson = async (res: Response, endpointUrl: string) => {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const htmlText = await res.text();
      console.error(`[API ERROR] ${endpointUrl} devolvió HTML:`, htmlText.slice(0, 150));
      throw new Error(`El endpoint ${endpointUrl} respondió con código ${res.status}.`);
    }
    return await res.json();
  };

  // Función que calcula clientas en el backend
  const calculateLoyaltyData = async (start: string, end: string, target: number, cycle: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          targetVisits: target,
          cycleAction: cycle,
        }),
      });

      const json = await safeParseJson(res, "/api/reports/loyalty");
      if (!res.ok || !json.ok) throw new Error(json.error || "Error consultando datos de fidelización");

      setCloseToReward(json.closeToReward || []);
      setRewardAchieved(json.rewardAchieved || []);
    } catch (err: any) {
      showModal("Aviso", err.message, "warning");
    } finally {
      setLoading(false);
    }
  };

  // 1. Cargar la campaña guardada al montar el componente
  useEffect(() => {
    const loadSavedCampaign = async () => {
      setCheckingCampaign(true);
      try {
        const res = await fetch("/api/loyalty/campaigns");
        const json = await safeParseJson(res, "/api/loyalty/campaigns");

        if (json.ok && json.campaign && json.campaign.activa) {
          setCampaignId(json.campaign.id);
          setStartDate(json.campaign.start_date);
          setEndDate(json.campaign.end_date);
          setTargetVisits(json.campaign.target_visits);
          setBenefitType(json.campaign.benefit_type);
          setBenefitValue(json.campaign.benefit_value);
          setCycleAction(json.campaign.cycle_action);
          setHasActiveCampaign(true);

          await calculateLoyaltyData(
            json.campaign.start_date,
            json.campaign.end_date,
            json.campaign.target_visits,
            json.campaign.cycle_action
          );
        } else {
          setHasActiveCampaign(false);
          setCampaignId(null);
          setCloseToReward([]);
          setRewardAchieved([]);
        }
      } catch (err) {
        console.warn("No se pudo cargar campaña guardada:", err);
        setHasActiveCampaign(false);
      } finally {
        setCheckingCampaign(false);
      }
    };

    loadSavedCampaign();
  }, []);

  // Botón para refrescar métricas
  const handleRefresh = async () => {
    if (!hasActiveCampaign) {
      showModal("Sin Campaña Activa", "Guarda primero la promoción para comenzar el cálculo de clientas.", "info");
      return;
    }
    await calculateLoyaltyData(startDate, endDate, targetVisits, cycleAction);
  };

  // Guardar campaña en la base de datos
  const handleSaveCampaign = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/loyalty/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          target_visits: targetVisits,
          benefit_type: benefitType,
          benefit_value: benefitValue,
          cycle_action: cycleAction,
        }),
      });

      const json = await safeParseJson(res, "/api/loyalty/campaigns");
      if (json.ok && json.campaign) {
        setCampaignId(json.campaign.id);
        setHasActiveCampaign(true);
        showModal("Campaña Guardada", "La promoción ahora está activa y los datos han sido calculados.", "success");
        await calculateLoyaltyData(startDate, endDate, targetVisits, cycleAction);
      }
    } catch (err: any) {
      showModal("Error al Guardar", err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar campaña activa
  const handleDeleteCampaign = async () => {
    if (!campaignId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/campaigns?id=${campaignId}`, {
        method: "DELETE",
      });

      const json = await safeParseJson(res, "/api/loyalty/campaigns");
      if (json.ok) {
        setCampaignId(null);
        setHasActiveCampaign(false);
        setCloseToReward([]);
        setRewardAchieved([]);
        showModal("Promoción Eliminada", "La campaña fue desactivada. Los indicadores han sido reiniciados.", "success");
      }
    } catch (err: any) {
      showModal("Error al Eliminar", err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  // Disparar mensaje por WhatsApp vía n8n
  const handleSendReminder = async (client: any) => {
    setSendingHsm(client.celular);
    try {
      const res = await fetch("/api/bookings/send-flow-hsm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          celular: client.celular,
          flowType: "loyalty_reminder",
          customerPhone: client.fullPhone,
          customerName: client.cliente,
          targetVisits,
          benefitText:
            benefitType === "percent"
              ? `${benefitValue}% de descuento`
              : benefitType === "fixed"
              ? `$${Number(benefitValue).toLocaleString()} COP de descuento`
              : `Obsequio: ${benefitValue}`,
        }),
      });

      const json = await safeParseJson(res, "/api/bookings/send-flow-hsm");
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo enviar el WhatsApp");

      showModal(
        "¡Recordatorio Enviado!",
        `Se envió el aviso a ${client.cliente} (${client.fullPhone}).`,
        "success"
      );
    } catch (err: any) {
      showModal("Error al Enviar", err.message, "danger");
    } finally {
      setSendingHsm(null);
    }
  };

  return (
    <div className="space-y-8 font-sans antialiased text-zinc-900 dark:text-zinc-100">
      
      {/* PANEL CONFIGURADOR DE LA PROMOCIÓN */}
      <section className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
              <Gift size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight">
                  Configuración del Programa de Citas Frecuentes
                </h2>
                {hasActiveCampaign ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Activa
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                    Inactiva
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-zinc-400">
                Ajusta las metas, fechas de vigencia y beneficios para fidelizar clientas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {campaignId && (
              <button
                type="button"
                onClick={handleDeleteCampaign}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>Eliminar Promoción</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveCampaign}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-rose-500/20 hover:from-rose-600 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{hasActiveCampaign ? "Actualizar Promoción" : "Guardar Promoción"}</span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || !hasActiveCampaign}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 transition-all cursor-pointer disabled:opacity-40"
              title="Refrescar métricas"
            >
              <RefreshCcw size={15} className={loading ? "animate-spin text-rose-500" : ""} />
            </button>
          </div>
        </div>

        {/* Criterios de la Promoción: SELECTORES MODERNIZADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          {/* 🌸 DATE PICKER INICIO */}
          <ModernDatePicker
            label="Vigencia Inicio"
            value={startDate}
            onChange={(val) => setStartDate(val)}
          />

          {/* 🌸 DATE PICKER FIN */}
          <ModernDatePicker
            label="Vigencia Fin"
            value={endDate}
            onChange={(val) => setEndDate(val)}
          />

          {/* 🌸 CONTROL VISUAL DE META DE CITAS */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
              Citas Requeridas (Meta)
            </label>
            <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setTargetVisits((prev) => Math.max(2, prev - 1))}
                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Minus size={14} />
              </button>
              
              <div className="flex items-center gap-1 font-black text-xs text-zinc-800 dark:text-zinc-100">
                <span className="text-sm font-extrabold text-rose-500">{targetVisits}</span>
                <span className="text-[11px] text-zinc-400">citas</span>
              </div>

              <button
                type="button"
                onClick={() => setTargetVisits((prev) => Math.min(20, prev + 1))}
                className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* 🌸 SELECTOR MODERNO DE COMPORTAMIENTO DE CICLO */}
          <ModernCycleSelect
            value={cycleAction}
            onChange={(val) => setCycleAction(val)}
          />
        </div>

        {/* Tipo de Recompensa */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
              Tipo de Beneficio
            </label>
            <div className="flex gap-1.5 p-1 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setBenefitType("percent")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  benefitType === "percent" ? "bg-rose-500 text-white shadow-2xs" : "text-zinc-500"
                }`}
              >
                % Porcentaje
              </button>
              <button
                type="button"
                onClick={() => setBenefitType("fixed")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  benefitType === "fixed" ? "bg-rose-500 text-white shadow-2xs" : "text-zinc-500"
                }`}
              >
                $ Fijo COP
              </button>
              <button
                type="button"
                onClick={() => setBenefitType("gift")}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  benefitType === "gift" ? "bg-rose-500 text-white shadow-2xs" : "text-zinc-500"
                }`}
              >
                Regalo
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1 block tracking-wider">
              Detalle del Premio
            </label>
            <input
              type="text"
              value={benefitValue}
              onChange={(e) => setBenefitValue(e.target.value)}
              placeholder={benefitType === "gift" ? "Ej. Hidratación de labios o Kit de cepillos" : "20"}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl text-xs font-bold outline-none focus:border-rose-400 text-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </section>

      {/* ESTADO VACÍO: SI NO SE HA ACTIVADO LA CAMPAÑA */}
      {!hasActiveCampaign && !checkingCampaign && (
        <section className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-3">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <Gift size={28} />
          </div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            No hay ninguna promoción activa
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Configura los parámetros en el formulario superior y presiona <strong>Guardar Promoción</strong> para activar el conteo de visitas y ver los clientes elegibles.
          </p>
        </section>
      )}

      {/* SI HAY CAMPAÑA ACTIVA: INDICADORES Y TABLAS */}
      {hasActiveCampaign && (
        <>
          {/* TARJETAS DE INDICADORES */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xs flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                  Próximos a Recompensa ({targetVisits - 1} Citas)
                </span>
                <span className="text-3xl font-extrabold text-amber-500 mt-1 block">
                  {closeToReward.length}
                </span>
                <span className="text-[11px] font-semibold text-zinc-400">Listos para recordar por WhatsApp</span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
                <Clock size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xs flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                  Premios Desbloqueados ({targetVisits} Citas)
                </span>
                <span className="text-3xl font-extrabold text-emerald-500 mt-1 block">
                  {rewardAchieved.length}
                </span>
                <span className="text-[11px] font-semibold text-zinc-400">Beneficio activo en su próxima cita</span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xs flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                  Beneficio Actual
                </span>
                <span className="text-xl font-extrabold text-rose-500 mt-1 block truncate max-w-[220px]">
                  {benefitType === "percent"
                    ? `${benefitValue}% OFF`
                    : benefitType === "fixed"
                    ? `$${Number(benefitValue).toLocaleString()} COP`
                    : benefitValue}
                </span>
                <span className="text-[11px] font-semibold text-zinc-400">En la visita #{targetVisits}</span>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
                <Gift size={24} />
              </div>
            </div>
          </section>

          {/* TABLA 1: CLIENTAS A 1 CITA DE SU PREMIO */}
          <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden space-y-4 p-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                Clientas a 1 Cita del Premio ({targetVisits - 1} Citas registradas)
              </h3>
              <p className="text-xs font-semibold text-zinc-400">
                Envíales un mensaje de WhatsApp para recordarles que su próxima visita tiene regalo o descuento
              </p>
            </div>

            <div className="overflow-x-auto">
              {closeToReward.length === 0 ? (
                <p className="text-center py-12 text-zinc-400 text-xs font-medium italic">
                  No hay clientas con {targetVisits - 1} citas en este periodo.
                </p>
              ) : (
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                      <th className="py-3 px-4">Clienta</th>
                      <th className="py-3 px-4">Teléfono</th>
                      <th className="py-3 px-4 text-center">Progreso</th>
                      <th className="py-3 px-4">Última Visita</th>
                      <th className="py-3 px-4 text-right">Acción WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {closeToReward.map((c, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-colors">
                        <td className="py-3 px-4 font-extrabold text-zinc-900 dark:text-zinc-100 uppercase">
                          {c.cliente}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-500">
                          {c.fullPhone}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full font-black text-[11px] border border-amber-200 dark:border-amber-900/40">
                            {c.currentCycleVisits} / {c.targetVisits} Citas
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 font-medium">
                          {c.ultimaCita ? c.ultimaCita.split("T")[0] : "—"} ({c.ultimoServicio})
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleSendReminder(c)}
                            disabled={sendingHsm === c.celular}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-[11px] shadow-2xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                          >
                            {sendingHsm === c.celular ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Send size={13} />
                            )}
                            <span>Enviar WhatsApp HSM</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* TABLA 2: CLIENTAS QUE YA GANARON EL PREMIO */}
          <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden space-y-4 p-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Clientas con Premio Activo ({targetVisits} o más Citas)
              </h3>
              <p className="text-xs font-semibold text-zinc-400">
                A estas clientas se les debe aplicar el beneficio en su próxima o actual cita
              </p>
            </div>

            <div className="overflow-x-auto">
              {rewardAchieved.length === 0 ? (
                <p className="text-center py-12 text-zinc-400 text-xs font-medium italic">
                  Aún no hay clientas que hayan alcanzado la meta de {targetVisits} citas.
                </p>
              ) : (
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                      <th className="py-3 px-4">Clienta</th>
                      <th className="py-3 px-4">Teléfono</th>
                      <th className="py-3 px-4 text-center">Citas Totales</th>
                      <th className="py-3 px-4 text-center">Ciclos Completados</th>
                      <th className="py-3 px-4 text-right">Beneficio Aplicable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {rewardAchieved.map((c, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-colors">
                        <td className="py-3 px-4 font-extrabold text-zinc-900 dark:text-zinc-100 uppercase">
                          {c.cliente}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-500">
                          {c.fullPhone}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {c.totalCitasHistoricas} citas
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {c.cyclesCompleted > 0 ? `${c.cyclesCompleted} veces ganado` : "1er ciclo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                            {benefitType === "percent"
                              ? `${benefitValue}% OFF en Cita #${c.totalCitasHistoricas}`
                              : benefitType === "fixed"
                              ? `-$${Number(benefitValue).toLocaleString()} COP`
                              : `Obsequio: ${benefitValue}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}

      {/* MODAL DE CONFIRMACIÓN / ALERTA */}
      <CustomDialog
        isOpen={dialog.isOpen}
        type="alert"
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}