"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Calendar, BarChart3, Scissors, User, 
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

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
      
      // Consultar Año Seleccionado
      const startAct = new Date(selectedYear, m, 1).toISOString();
      const endAct = new Date(selectedYear, m + 1, 0, 23, 59, 59).toISOString();
      
      // Consultar Año Anterior
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
    <div className="space-y-6">
      {/* BARRA DE FILTROS */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border dark:border-zinc-800 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl border dark:border-zinc-700">
          <Scissors size={14} className="text-indigo-500" />
          <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="bg-transparent text-[11px] font-black uppercase outline-none text-zinc-900 dark:text-white">
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl border dark:border-zinc-700">
          <User size={14} className="text-emerald-500" />
          <select value={selectedSpecialist} onChange={(e) => setSelectedSpecialist(e.target.value)} className="bg-transparent text-[11px] font-black uppercase outline-none text-zinc-900 dark:text-white">
            {specialists.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl border dark:border-zinc-700">
          <Calendar size={14} className="text-amber-500" />
          <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent w-16 text-[11px] font-black outline-none text-zinc-900 dark:text-white text-center" />
        </div>
      </div>

      {/* GRÁFICO COMPARATIVO YOY */}
      <div className="bg-zinc-950 p-8 rounded-[3rem] shadow-2xl border border-zinc-800/50">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-white text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
              <BarChart3 className="text-indigo-400" /> Comparativa Anual
            </h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Ingresos Netos: {selectedYear} vs {selectedYear - 1}</p>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2}/>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#71717a'}} dy={10} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: '#27272a', opacity: 0.4}}
                contentStyle={{ backgroundColor: '#09090b', borderRadius: '20px', border: '1px solid #27272a', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              <Bar dataKey={selectedYear} fill="#6366f1" radius={[6, 6, 6, 6]} barSize={20} name={`Año ${selectedYear}`} />
              <Bar dataKey={selectedYear - 1} fill="#3f3f46" radius={[6, 6, 6, 6]} barSize={20} name={`Año ${selectedYear - 1}`} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}