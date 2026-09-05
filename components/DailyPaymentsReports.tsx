"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  FileText, Loader2, X, Wallet, MessageCircle, Download, Maximize2, ArrowLeft, Camera, ChevronDown, ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon
} from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MESES_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/* =========================================================
   🔹 SUB-COMPONENTE: SELECTOR DE ESPECIALISTA COMPACTO
========================================================= */
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
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
    <div className="relative w-full font-sans text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 py-2.5 px-3.5 text-xs font-bold text-zinc-800 dark:text-zinc-100 shadow-2xs hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer outline-none focus:outline-none"
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180 text-rose-500" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-[400] top-full left-0 mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-2xl animate-in fade-in duration-150">
          <div className="max-h-44 overflow-y-auto space-y-0.5 custom-scrollbar">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer border-none outline-none ${
                    isSelected
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500 font-extrabold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
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
   🔹 SUB-COMPONENTE: SELECTOR DE RANGO CON DESTACADO
========================================================= */
function RangeDatePicker({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initialDate = start ? new Date(`${start}T00:00:00`) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const [selectingEnd, setSelectingEnd] = useState(false);
  const [tempStart, setTempStart] = useState<string | null>(start);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    const monthName = MESES_ES[parseInt(m, 10) - 1];
    return `${d} ${monthName}`;
  };

  const handleDayClick = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const selectedDate = `${currentYear}-${mm}-${dd}`;

    if (!selectingEnd || !tempStart) {
      setTempStart(selectedDate);
      setSelectingEnd(true);
    } else {
      if (new Date(selectedDate) < new Date(tempStart)) {
        onChange({ start: selectedDate, end: tempStart });
      } else {
        onChange({ start: tempStart, end: selectedDate });
      }
      setSelectingEnd(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full font-sans text-left" ref={ref}>
      <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-1">Rango de Fecha</label>
      <button
        type="button"
        onClick={() => {
          setTempStart(start);
          setSelectingEnd(false);
          setOpen(!open);
        }}
        className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 py-2.5 px-3.5 text-xs font-bold text-zinc-800 dark:text-zinc-100 shadow-2xs hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer outline-none focus:outline-none"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="text-rose-500 shrink-0" />
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
            {formatDisplay(start)} - {formatDisplay(end)}
          </span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180 text-rose-500" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-[500] top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-3.5 shadow-2xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)} 
              className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
              {MESES_ES[currentMonth]} {currentYear}
            </span>
            <button 
              type="button" 
              onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)} 
              className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["D", "L", "M", "M", "J", "V", "S"].map((d, idx) => (
              <span key={idx} className="text-[9px] font-black text-zinc-400">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((p) => <div key={`pad-${p}`} />)}
            {daysArray.map((d) => {
              const mm = String(currentMonth + 1).padStart(2, "0");
              const dd = String(d).padStart(2, "0");
              const dateKey = `${currentYear}-${mm}-${dd}`;
              
              const activeStart = selectingEnd ? tempStart : start;
              const isStart = activeStart === dateKey;
              const isEnd = end === dateKey;
              
              const dateObj = new Date(dateKey);
              const startObj = activeStart ? new Date(activeStart) : null;
              const endObj = end ? new Date(end) : null;
              
              const inRange = startObj && endObj && dateObj >= startObj && dateObj <= endObj;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDayClick(d)}
                  className={`h-8 w-8 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center border-none outline-none ${
                    isStart || isEnd
                      ? "bg-rose-500 text-white font-black shadow-md shadow-rose-500/30 scale-105"
                      : inRange
                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-extrabold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-rose-500/10 hover:text-rose-500"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider text-center mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {selectingEnd ? "👇 Haz clic en la fecha final" : "👇 Haz clic en la fecha inicial"}
          </p>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 COMPONENTE PRINCIPAL
========================================================= */
export default function DailyPaymentsReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuditoriaOpen, setIsAuditoriaOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>("all");
  const [reportData, setReportData] = useState<any[]>([]);
  const [specialistsList, setSpecialistsList] = useState<any[]>([]);

  const setQuickPeriod = (period: 'hoy' | 'semana' | 'mes') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'hoy') {
      const str = now.toLocaleDateString('en-CA');
      setDateRange({ start: str, end: str });
      return;
    }

    if (period === 'semana') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    }

    if (period === 'mes') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    setDateRange({ 
      start: start.toLocaleDateString('en-CA'), 
      end: end.toLocaleDateString('en-CA') 
    });
  };

  const generateReport = useCallback(async () => {
    setLoading(true);
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, price, especialista, estado, servicio, cliente, appointment_at")
      .eq("estado", "Cita pagada")
      .filter("appointment_at", "gte", `${dateRange.start}T00:00:00+00`)
      .filter("appointment_at", "lte", `${dateRange.end}T23:59:59+00`);

    if (error) { setLoading(false); return; }

    let usersData: any[] | null = null;
    const { data: fullUsers, error: userErr } = await supabase
      .from("app_users")
      .select("name, comision_base, excepciones_comision, telefono");

    if (userErr) {
      const { data: basicUsers } = await supabase
        .from("app_users")
        .select("name, comision_base, excepciones_comision");
      usersData = basicUsers;
    } else {
      usersData = fullUsers;
    }

    if (usersData) setSpecialistsList(usersData);

    const report = usersData?.map(sp => {
      if (selectedSpecialist !== "all" && selectedSpecialist !== sp.name) return null;
      const citasSp = appointments?.filter(app => app.especialista === sp.name) || [];
      if (citasSp.length === 0) return null;

      const detalles = citasSp.map(cita => {
        const porcentaje = sp.excepciones_comision?.[cita.servicio] ?? sp.comision_base ?? 50;
        const valorCita = Number(cita.price) || 0;
        const gananciaSp = (valorCita * porcentaje) / 100;
        return { fecha: cita.appointment_at, cliente: cita.cliente, servicio: cita.servicio, subtotal: valorCita, comisionEfectiva: gananciaSp, porcentaje };
      });

      return {
        especialista: sp.name,
        telefono: sp.telefono,
        totalVentas: detalles.reduce((acc, curr) => acc + curr.subtotal, 0),
        totalAPagar: detalles.reduce((acc, curr) => acc + curr.comisionEfectiva, 0),
        detalles
      };
    }).filter(Boolean);

    setReportData(report || []);
    setLoading(false);
  }, [dateRange, selectedSpecialist]);

  useEffect(() => {
    if (isOpen) generateReport();
  }, [isOpen, generateReport]);

  const handleWhatsAppShare = () => {
    const item = reportData.find(r => r.especialista === selectedSpecialist);
    const phone = String(item?.telefono || "").replace(/\D/g, ""); 
    
    if (!phone || phone === "") {
      alert("No se encontró un número de teléfono válido para esta especialista.");
      return;
    }

    const message = encodeURIComponent(
      `*INFORME DE LIQUIDACIÓN - LEHANA STUDIO*\n\n` +
      `👤 *Especialista:* ${selectedSpecialist}\n` +
      `📅 *Periodo:* ${dateRange.start} al ${dateRange.end}\n` +
      `💰 *Total a pagar:* $${item?.totalAPagar.toLocaleString("es-CO")}\n\n` +
      `_Tu reporte PDF ha sido generado y descargado en administración._`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const exportPDF = async (shouldSendWhatsApp = false) => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            #printable-report, #printable-report * {
              color: #18181b !important;
              border-color: #e4e4e7 !important;
              background-color: transparent !important;
              box-shadow: none !important;
              text-shadow: none !important;
              color-scheme: light !important;
            }
            .bg-rose-500 { background-color: #f43f5e !important; color: #ffffff !important; }
            .bg-zinc-50 { background-color: #f8f8f8 !important; }
            .bg-white { background-color: #ffffff !important; }
            .text-rose-500 { color: #f43f5e !important; }
            .font-black, .font-bold { font-weight: 900 !important; }
            * { font-family: sans-serif !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      if (shouldSendWhatsApp) {
        handleWhatsAppShare();
      } else {
        pdf.save(`Informe_Liquidacion_${selectedSpecialist}_${dateRange.start}.pdf`);
      }
    } catch (err) {
      console.error("Error crítico PDF:", err);
      alert("Hubo un problema al procesar el documento. Intenta usar 'Guardar JPG'.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const reportElement = clonedDoc.getElementById("printable-report");
          if (reportElement) {
            const elements = reportElement.querySelectorAll("*");
            elements.forEach((node) => {
              const el = node as HTMLElement;
              const style = window.getComputedStyle(el);
              if (style.color.includes("lab") || style.color.includes("oklch")) el.style.color = "#18181b";
              if (style.backgroundColor.includes("lab") || style.backgroundColor.includes("oklch")) {
                el.style.backgroundColor = el.classList.contains("bg-rose-500") ? "#f43f5e" : "transparent";
              }
            });
            reportElement.style.fontFamily = "sans-serif";
          }
        }
      });
      
      const image = canvas.toDataURL("image/jpeg", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `Nomina_${selectedSpecialist}_${dateRange.start}_al_${dateRange.end}.jpg`;
      link.click();
    } catch (err) {
      console.error("Error capturando imagen:", err);
    }
  };

  const specialistOptions = [
    { label: "Todo el equipo de especialistas", value: "all" },
    ...specialistsList.map(s => ({ label: s.name, value: s.name }))
  ];

  if (!isOpen) return (
    <button 
      type="button"
      onClick={() => setIsOpen(true)} 
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold py-3 px-4 rounded-2xl shadow-xs text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 border-none outline-none"
    >
      <FileText size={16} /> Cierre y Liquidación
    </button>
  );

  return (
    <>
      {/* 🌸 MODAL DE SELECCIÓN DE FILTROS */}
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 font-sans antialiased text-zinc-900 animate-in fade-in duration-150">
        <div className="bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 flex flex-col w-full max-w-xl max-h-[90vh] rounded-3xl overflow-hidden text-zinc-900 dark:text-zinc-100">
          
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-rose-500/10 text-rose-500 rounded-xl text-base">👛</span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                Cierre y Liquidación
              </h2>
            </div>
            
            <button 
              type="button"
              onClick={() => setIsOpen(false)} 
              className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer rounded-full border-none outline-none"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
              
              <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800 gap-1">
                <button 
                  type="button"
                  onClick={() => setQuickPeriod('hoy')} 
                  className="flex-1 py-1.5 px-2.5 text-[9px] font-black uppercase rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer border-none outline-none"
                >
                  Hoy
                </button>
                <button 
                  type="button"
                  onClick={() => setQuickPeriod('semana')} 
                  className="flex-1 py-1.5 px-2.5 text-[9px] font-black uppercase rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer border-none outline-none"
                >
                  Esta Semana
                </button>
                <button 
                  type="button"
                  onClick={() => setQuickPeriod('mes')} 
                  className="flex-1 py-1.5 px-2.5 text-[9px] font-black uppercase rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer border-none outline-none"
                >
                  Este Mes
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RangeDatePicker 
                  start={dateRange.start}
                  end={dateRange.end}
                  onChange={(r) => setDateRange(r)}
                />

                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-1">Especialista</label>
                  <CustomSelect
                    value={selectedSpecialist}
                    onChange={(val) => setSelectedSpecialist(val)}
                    options={specialistOptions}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider">Monto a Liquidar</label>
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="animate-spin text-rose-500" size={22} />
                  <span className="text-xs font-bold text-zinc-400">Calculando nómina...</span>
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-2xl">
                  <p className="text-zinc-400 text-xs font-bold">No se registran pagos en este rango</p>
                </div>
              ) : reportData.map((item, idx) => (
                <div key={idx} className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-2xl flex justify-between items-center shadow-2xs">
                  <div>
                    <span className="text-xs font-black uppercase block text-zinc-900 dark:text-zinc-100">{item.especialista}</span>
                    <span className="text-xs text-rose-500 font-black uppercase tracking-wider block mt-0.5">
                      Pagar: ${item.totalAPagar.toLocaleString("es-CO")} COP
                    </span>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => { setSelectedSpecialist(item.especialista); setIsAuditoriaOpen(true); }} 
                    className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all cursor-pointer shadow-2xs active:scale-95 border-none outline-none"
                    title="Ver desglose de auditoría"
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3 items-center shrink-0">
            <button 
              type="button"
              onClick={() => setIsOpen(false)} 
              className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer border-none outline-none"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={() => {
                if (reportData.length > 0) setIsAuditoriaOpen(true);
                else setIsOpen(false);
              }} 
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-rose-500/20 transition-all active:scale-95 cursor-pointer border-none outline-none"
            >
              Ver Informe
            </button>
          </div>
        </div>
      </div>

      {/* 🌸 HOJA DE AUDITORÍA CON Z-INDEX AUMENTADO Y MARGEN IZQUIERDO PARA NO QUEDAR TAPADO */}
      {isAuditoriaOpen && (
        <div className="fixed inset-0 z-[500] bg-zinc-100 dark:bg-zinc-950 flex flex-col animate-in slide-in-from-right duration-200 text-zinc-900 font-sans antialiased pl-0 sm:pl-16">
          
          <header className="px-5 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 flex justify-between items-center shadow-2xs z-[510]">
            <button 
              type="button"
              onClick={() => setIsAuditoriaOpen(false)} 
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:text-rose-500 transition-colors font-extrabold text-xs uppercase tracking-wider cursor-pointer rounded-2xl border-none outline-none shadow-2xs"
            >
              <ArrowLeft size={16} /> Regresar
            </button>

            <div className="flex gap-2 items-center">
              <button 
                type="button"
                onClick={downloadImage} 
                title="Guardar JPG" 
                className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl hover:text-rose-500 active:scale-95 transition-all cursor-pointer border-none"
              >
                <Camera size={16} />
              </button>

              <button 
                type="button"
                onClick={() => exportPDF(false)} 
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer border-none"
              >
                <Download size={14} /> PDF
              </button>

              <button 
                type="button"
                onClick={() => exportPDF(true)} 
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer border-none"
              >
                <MessageCircle size={14} /> WhatsApp
              </button>

              <button 
                type="button"
                onClick={() => setIsAuditoriaOpen(false)} 
                className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer ml-1 border-none bg-transparent"
                aria-label="Cerrar auditoría"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
            <div 
              ref={reportRef} 
              id="printable-report"
              className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-xs border border-zinc-200/80 text-zinc-900"
              style={{ fontFamily: 'sans-serif' }}
            >
              <div className="border-b-2 border-zinc-900 pb-5 mb-5 flex justify-between items-end">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-zinc-900 uppercase">Liquidación de Nómina</h1>
                  <p className="text-rose-500 font-extrabold uppercase text-[8px] tracking-widest mt-0.5">Lehana Studio CRM • Cierre de Periodo</p>
                </div>
                <div className="text-right flex flex-col items-end gap-0.5">
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Periodo</p>
                  <p className="text-[10px] font-bold uppercase text-zinc-700">{dateRange.start} <span className="text-zinc-400 mx-1">al</span> {dateRange.end}</p>
                </div>
              </div>

              {reportData.filter(item => selectedSpecialist === "all" || item.especialista === selectedSpecialist).map((item, idx) => (
                <div key={idx} className="space-y-5 mb-6">
                  <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
                    <div>
                      <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">{item.especialista}</h2>
                      <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                        Ventas Brutas Totales: ${item.totalVentas.toLocaleString("es-CO")} COP
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Pagar Especialista</p>
                      <p className="text-xl font-black text-rose-500 tabular-nums">${item.totalAPagar.toLocaleString("es-CO")} COP</p>
                    </div>
                  </div>

                  <table className="w-full text-left text-[10px] mt-3">
                    <thead>
                      <tr className="border-b-2 border-zinc-200 text-zinc-400 font-black text-[8px] uppercase tracking-wider">
                        <th className="py-2 px-1.5">Fecha</th>
                        <th className="py-2 px-1.5">Servicio</th>
                        <th className="py-2 px-1.5">Cliente</th>
                        <th className="py-2 px-1.5 text-right">Precio</th>
                        <th className="py-2 px-1.5 text-right text-rose-500">Comisión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {item.detalles.map((det: any, dIdx: number) => (
                        <tr key={dIdx}>
                          <td className="py-2 px-1.5 text-zinc-500 font-medium">
                            {det.fecha ? new Date(det.fecha).toLocaleDateString('es-CO') : '--'}
                          </td>
                          <td className="py-2 px-1.5 font-extrabold text-zinc-800 uppercase">{det.servicio}</td>
                          <td className="py-2 px-1.5 text-zinc-500 font-bold uppercase">{det.cliente}</td>
                          <td className="py-2 px-1.5 text-right text-zinc-400 font-bold tracking-tight">${det.subtotal.toLocaleString("es-CO")}</td>
                          <td className="py-2 px-1.5 text-right font-black text-rose-500 tabular-nums">${det.comisionEfectiva.toLocaleString("es-CO")}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-zinc-900 bg-zinc-50/50">
                        <td className="py-3 px-1.5 font-black text-zinc-900 text-[11px] uppercase" colSpan={3}>Totales Liquidación</td>
                        <td className="py-3 px-1.5 text-right font-extrabold text-zinc-900 text-[11px] tabular-nums">${item.totalVentas.toLocaleString("es-CO")}</td>
                        <td className="py-3 px-1.5 text-right font-black text-rose-500 text-sm tabular-nums">${item.totalAPagar.toLocaleString("es-CO")}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}
            </div>
          </main>
        </div>
      )}
    </>
  );
}