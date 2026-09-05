"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Calendar, BarChart3, Scissors, User
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

/* =========================================================
   🔹 SUB-COMPONENTE: TOOLTIP PERSONALIZADO (ALTO CONTRASTE)
   =========================================================
   Este componente se encarga de mostrar el cuadro flotante
   con fondo blanco nítido y texto oscuro para garantizar
   una legibilidad perfecta al pasar el cursor.
========================================================= */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl shadow-xl font-sans text-xs">
        {/* Nombre del mes */}
        <p className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1">
          {label}
        </p>

        {/* Lista de valores comparativos (Año Actual vs Año Anterior) */}
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-bold text-zinc-600 dark:text-zinc-300 text-[11px]">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block" 
                  style={{ backgroundColor: entry.fill }} 
                />
                {entry.name}:
              </span>
              <span className="font-black text-zinc-900 dark:text-zinc-100 tabular-nums text-xs">
                ${Number(entry.value || 0).toLocaleString("es-CO")} COP
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function AdvancedComparativeReports() {
  const [data, setData] = useState<any[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [specialists, setSpecialists] = useState<string[]>([]);
  
  const [selectedService, setSelectedService] = useState("Todos los Servicios");
  const [selectedSpecialist, setSelectedSpecialist] = useState("Todo el Equipo");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchComparativeData();
  }, [selectedService, selectedSpecialist, selectedYear]);

  const fetchFilters = async () => {
    const { data: apps } = await supabase.from("appointments").select("servicio, especialista");
    if (apps) {
      setServices(["Todos los Servicios", ...Array.from(new Set(apps.map(i => i.servicio).filter(Boolean)))]);
      setSpecialists(["Todo el Equipo", ...Array.from(new Set(apps.map(i => i.especialista).filter(Boolean)))]);
    }
  };

  const getRevenue = (citas: any[]) => {
    return citas.reduce((acc, c) => {
      const valor = Number(c.price) || 0;
      const factor = c.especialista === "Leslie Gutierrez" ? 1 : 0.5;
      return acc + (valor * factor);
    }, 0);
  };

  const fetchComparativeData = async () => {
    const monthlyData = [];
    
    for (let m = 0; m < 12; m++) {
      const monthName = new Date(selectedYear, m).toLocaleString('es-ES', { month: 'short' }).toUpperCase();
      
      const startAct = new Date(selectedYear, m, 1).toISOString();
      const endAct = new Date(selectedYear, m + 1, 0, 23, 59, 59).toISOString();
      
      const startPrev = new Date(selectedYear - 1, m, 1).toISOString();
      const endPrev = new Date(selectedYear - 1, m + 1, 0, 23, 59, 59).toISOString();

      const fetchData = async (start: string, end: string) => {
        let query = supabase.from("appointments").select("price, especialista, servicio")
          .gte("appointment_at", start).lte("appointment_at", end)
          .in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA"]);

        if (selectedService !== "Todos los Servicios") query = query.eq("servicio", selectedService);
        if (selectedSpecialist !== "Todo el Equipo") query = query.eq("especialista", selectedSpecialist);

        const { data } = await query;
        return getRevenue(data || []);
      };

      const [actual, anterior] = await Promise.all([
        fetchData(startAct, endAct),
        fetchData(startPrev, endPrev)
      ]);

      monthlyData.push({
        name: monthName,
        [selectedYear]: actual,
        [selectedYear - 1]: anterior
      });
    }
    setData(monthlyData);
  };

  return (
    <div className="space-y-6 font-sans antialiased text-zinc-900 dark:text-zinc-100">
      
      {/* BARRA DE FILTROS SUPERIOR */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <Scissors size={14} className="text-rose-500" />
          <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="bg-transparent text-xs font-extrabold uppercase outline-none text-zinc-800 dark:text-zinc-100 cursor-pointer">
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <User size={14} className="text-rose-500" />
          <select value={selectedSpecialist} onChange={(e) => setSelectedSpecialist(e.target.value)} className="bg-transparent text-xs font-extrabold uppercase outline-none text-zinc-800 dark:text-zinc-100 cursor-pointer">
            {specialists.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <Calendar size={14} className="text-rose-500" />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Año:</span>
          <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent w-16 text-xs font-black outline-none text-zinc-800 dark:text-zinc-100 text-center" />
        </div>
      </div>

      {/* TARJETA DEL GRÁFICO COMPARATIVO YOY */}
      <div className="bg-white dark:bg-zinc-900/90 p-6 sm:p-8 rounded-3xl shadow-2xs border border-zinc-200/80 dark:border-zinc-800">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider block leading-none mb-1">
              Lehana Studio CRM
            </span>
            <h3 className="text-base font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BarChart3 className="text-rose-500" size={18} /> Comparativa Anual
            </h3>
            <p className="text-zinc-400 text-[10px] font-extrabold uppercase tracking-wider mt-1">
              Ingresos Netos: <span className="text-rose-500">{selectedYear}</span> vs <span className="text-zinc-400">{selectedYear - 1}</span>
            </p>
          </div>
        </div>

        <div className="h-[400px] w-full" style={{ minHeight: "400px" }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={400}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.6}/>
              
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 800, fill: '#71717a'}} 
                dy={10} 
              />
              
              <YAxis hide />
              
              {/* 🌸 INYECCIÓN DEL TOOLTIP PERSONALIZADO */}
              <Tooltip 
                cursor={{ fill: '#f43f5e', opacity: 0.05 }}
                content={<CustomTooltip />}
              />
              
              <Legend 
                iconType="circle" 
                wrapperStyle={{ paddingTop: '25px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }} 
              />
              
              {/* BARRAS DE COLOR DE MARCA (GRIS PARA AÑO ANTERIOR Y ROSA PARA AÑO ACTUAL) */}
              <Bar 
                dataKey={selectedYear - 1} 
                fill="#a1a1aa" 
                radius={[6, 6, 0, 0]} 
                barSize={16} 
                name={`Año ${selectedYear - 1}`} 
              />

              <Bar 
                dataKey={selectedYear} 
                fill="#f43f5e" 
                radius={[6, 6, 0, 0]} 
                barSize={16} 
                name={`Año ${selectedYear}`} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}