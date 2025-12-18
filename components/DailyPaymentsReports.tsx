"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  FileText, User as UserIcon, Loader2, X, 
  Calendar, Scissors, Wallet, Info, Download, Maximize2, ArrowLeft, Camera
} from "lucide-react";
import html2canvas from "html2canvas";

export default function DailyPaymentsReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuditoriaOpen, setIsAuditoriaOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>("all");
  const [reportData, setReportData] = useState<any[]>([]);
  const [specialistsList, setSpecialistsList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) generateReport();
  }, [isOpen, selectedDate, selectedSpecialist]);

  const generateReport = async () => {
    setLoading(true);
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, price, especialista, estado, servicio, cliente, appointment_at")
      .eq("estado", "Cita pagada")
      .filter("appointment_at", "gte", `${selectedDate}T00:00:00+00`)
      .filter("appointment_at", "lte", `${selectedDate}T23:59:59+00`);

    if (error) { setLoading(false); return; }

    const { data: users } = await supabase.from("app_users").select("name, comision_base, excepciones_comision");
    if (users) setSpecialistsList(users);

    const report = users?.map(sp => {
      if (selectedSpecialist !== "all" && selectedSpecialist !== sp.name) return null;
      const citasSp = appointments?.filter(app => app.especialista === sp.name) || [];
      if (citasSp.length === 0) return null;

      const detalles = citasSp.map(cita => {
        const porcentaje = sp.excepciones_comision?.[cita.servicio] ?? sp.comision_base ?? 50;
        const valorCita = Number(cita.price) || 0;
        const gananciaSp = (valorCita * porcentaje) / 100;
        return { cliente: cita.cliente, servicio: cita.servicio, subtotal: valorCita, comisionEfectiva: gananciaSp, porcentaje };
      });

      return {
        especialista: sp.name,
        totalVentas: detalles.reduce((acc, curr) => acc + curr.subtotal, 0),
        totalAPagar: detalles.reduce((acc, curr) => acc + curr.comisionEfectiva, 0),
        detalles
      };
    }).filter(Boolean);

    setReportData(report || []);
    setLoading(false);
  };

  const downloadImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 3, // Calidad Ultra-Nítida
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const reportElement = clonedDoc.getElementById("printable-report");
          if (reportElement) {
            // SOLUCIÓN AL ERROR "LAB": Forzamos a RGB/Hexadecimal en todos los nodos
            const elements = reportElement.querySelectorAll("*");
            elements.forEach((node) => {
              const el = node as HTMLElement;
              const style = window.getComputedStyle(el);
              
              // Si el color contiene funciones modernas, lo forzamos a negro o gris
              if (style.color.includes("lab") || style.color.includes("oklch")) {
                el.style.color = "#18181b"; // Zinc-900
              }
              if (style.backgroundColor.includes("lab") || style.backgroundColor.includes("oklch")) {
                el.style.backgroundColor = el.classList.contains("bg-indigo-600") ? "#4f46e5" : "transparent";
              }
            });
            reportElement.style.fontFamily = "sans-serif";
          }
        }
      });
      
      const image = canvas.toDataURL("image/jpeg", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `Nomina_${selectedSpecialist}_${selectedDate}.jpg`;
      link.click();
    } catch (err) {
      console.error("Error capturando imagen:", err);
    }
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl shadow-md text-sm">
      <FileText size={18} /> Informe de Liquidación
    </button>
  );

  return (
    <>
      {/* VISTA RESUMEN (MODAL) */}
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
        <div className="bg-white dark:bg-zinc-950 shadow-2xl border dark:border-zinc-800 flex flex-col w-full max-w-lg h-[75vh] rounded-[2.5rem] overflow-hidden">
          <div className="px-6 py-5 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3 font-semibold text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">
              <Wallet size={20} className="text-indigo-600" />
              <span>Cierre de Caja</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-400">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex gap-3">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl text-xs font-bold" />
            <select value={selectedSpecialist} onChange={(e) => setSelectedSpecialist(e.target.value)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-xl text-xs font-bold">
              <option value="all">Todo el equipo</option>
              {specialistsList.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>
            ) : reportData.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 block">{item.especialista}</span>
                  <span className="text-xs text-indigo-600 font-bold uppercase">Pagar: ${item.totalAPagar.toLocaleString()}</span>
                </div>
                <button onClick={() => { setSelectedSpecialist(item.especialista); setIsAuditoriaOpen(true); }} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
                  <Maximize2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-6 border-t dark:border-zinc-800">
            <button onClick={() => setIsOpen(false)} className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Cerrar</button>
          </div>
        </div>
      </div>

      {/* HOJA DE AUDITORÍA (PANTALLA COMPLETA - CAPTURA) */}
      {isAuditoriaOpen && (
        <div className="fixed inset-0 z-[1000] bg-zinc-100 dark:bg-zinc-950 flex flex-col animate-in slide-in-from-right duration-500">
          <header className="px-8 py-5 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 flex justify-between items-center">
            <button onClick={() => setIsAuditoriaOpen(false)} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-bold text-sm uppercase tracking-tight">
              <ArrowLeft size={20} /> Regresar
            </button>
            <div className="flex gap-4">
               <button onClick={downloadImage} className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
                <Camera size={18} /> Guardar JPG
              </button>
              <button onClick={() => setIsAuditoriaOpen(false)} className="p-2 text-zinc-400"><X size={24} /></button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-12">
            {/* ESTE CONTENEDOR ES LA IMAGEN FINAL */}
            <div 
              ref={reportRef} 
              id="printable-report"
              className="max-w-4xl mx-auto bg-white p-16 rounded-[2.5rem] shadow-sm text-zinc-900"
              style={{ fontFamily: 'sans-serif' }}
            >
              <div className="border-b-4 border-zinc-900 pb-10 mb-10 flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tighter text-zinc-900">Estado de Liquidación</h1>
                  <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-[0.3em] mt-2">Documento de Auditoría Interna</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-sm font-bold">FECHA: <span className="font-medium text-zinc-500">{selectedDate}</span></p>
                  <p className="text-sm font-bold">ESPECIALISTA: <span className="font-bold text-indigo-600 uppercase">{selectedSpecialist}</span></p>
                </div>
              </div>

              {reportData.map((item, idx) => (
                <div key={idx} className="space-y-12">
                  <div className="flex justify-between items-center bg-zinc-50 p-10 rounded-[2rem] border border-zinc-100">
                    <div>
                      <h2 className="text-3xl font-bold text-zinc-800">{item.especialista}</h2>
                      <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest mt-1">Ventas Brutas: ${item.totalVentas.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total a Liquidar</p>
                      <p className="text-5xl font-black text-indigo-600 tabular-nums">${item.totalAPagar.toLocaleString()}</p>
                    </div>
                  </div>

                  <table className="w-full text-left text-sm mt-10">
                    <thead>
                      <tr className="border-b-2 border-zinc-100 text-zinc-400 font-bold text-[9px] uppercase tracking-[0.2em]">
                        <th className="py-5 px-4">Servicio Realizado</th>
                        <th className="py-5 px-4">Cliente</th>
                        <th className="py-5 px-4 text-right">Precio Base</th>
                        <th className="py-5 px-4 text-right text-indigo-600">Comisión Sp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {item.detalles.map((det: any, dIdx: number) => (
                        <tr key={dIdx}>
                          <td className="py-6 px-4 font-bold text-zinc-800 text-base">{det.servicio}</td>
                          <td className="py-6 px-4 text-zinc-500 font-medium">{det.cliente}</td>
                          <td className="py-6 px-4 text-right text-zinc-400 font-medium tracking-tight">${det.subtotal.toLocaleString()}</td>
                          <td className="py-6 px-4 text-right font-bold text-indigo-600 text-lg tabular-nums">${det.comisionEfectiva.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              <div className="mt-24 pt-10 border-t border-dashed border-zinc-200 text-center">
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.4em]">Este informe ha sido generado digitalmente y es vinculante para el cierre de caja</p>
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}