"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, DollarSign, ShoppingBag, Loader2, Filter } from "lucide-react";

export default function VentasReport() {
  const [loading, setLoading] = useState(false);
  const [serviciosList, setServiciosList] = useState<string[]>([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>("todos");
  
  const [range, setRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  
  const [stats, setStats] = useState({ total: 0, cantidad: 0, desglose: [] as any[] });

  // 1. Cargar lista de servicios disponibles para el selector
  useEffect(() => {
    const loadServicios = async () => {
      const { data } = await supabase.from("services").select("Servicio");
      if (data) {
        const nombres = data.map(s => s.Servicio);
        setServiciosList(nombres);
      }
    };
    loadServicios();
  }, []);

  // 2. Consulta de ventas con filtros
  const fetchVentas = async () => {
  setLoading(true);
  try {
    // 1. Construir la consulta base
    let query = supabase
      .from("appointments")
      .select("servicio, price, estado, appointment_at")
      // Filtramos por el rango de fecha
      .gte("appointment_at", `${range.from}T00:00:00Z`)
      .lte("appointment_at", `${range.to}T23:59:59Z`);

    // 2. Filtro de estados: Usamos .in para evitar errores de sintaxis del .or()
    // He incluido las variaciones más comunes de cómo podrías tenerlo en la DB
    query = query.in("estado", ["FINALIZADO", "Cita pagada", "Finalizado", "CITA PAGADA"]);

    // 3. Filtro por servicio
    if (servicioSeleccionado !== "todos") {
      query = query.eq("servicio", servicioSeleccionado);
    }

    const { data, error } = await query;

    // Si Supabase devuelve un error, lo lanzamos para verlo en el catch
    if (error) throw error;

    if (!data || data.length === 0) {
      console.log("No se encontraron citas con esos criterios");
      setStats({ total: 0, cantidad: 0, desglose: [] });
      return;
    }

    // 4. Calcular totales
    const total = data.reduce((acc, curr) => {
      // Convertimos a número y usamos 0 si es nulo para evitar el NaN
      const precio = parseFloat(curr.price) || 0;
      return acc + precio;
    }, 0);

    const agrupados = data.reduce((acc: any, curr) => {
      const sName = curr.servicio || "Sin definir";
      acc[sName] = (acc[sName] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total,
      cantidad: data.length,
      desglose: Object.entries(agrupados).map(([name, qty]) => ({ name, qty }))
    });

  } catch (err: any) {
    // Aquí imprimimos el error completo para saber qué pasa exactamente
    console.error("Error detallado en fetchVentas:", {
      message: err.message,
      details: err.details,
      hint: err.hint
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchVentas();
  }, [range, servicioSeleccionado]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border dark:border-zinc-800 shadow-sm space-y-6">
      
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter">Análisis de Ventas</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">Filtra por fecha y servicio</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Servicio */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-2xl border border-transparent focus-within:border-indigo-500">
            <Filter size={14} className="text-zinc-400" />
            <select 
              value={servicioSeleccionado}
              onChange={(e) => setServicioSeleccionado(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer min-w-[120px]"
            >
              <option value="todos">Todos los servicios</option>
              {serviciosList.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Selector de Fecha */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-2xl">
            <Calendar size={14} className="text-zinc-400" />
            <input 
              type="date" 
              value={range.from}
              onChange={(e) => setRange({...range, from: e.target.value})}
              className="bg-transparent text-[10px] font-black uppercase outline-none"
            />
            <span className="text-zinc-400">/</span>
            <input 
              type="date" 
              value={range.to}
              onChange={(e) => setRange({...range, to: e.target.value})}
              className="bg-transparent text-[10px] font-black uppercase outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Total Dinero */}
          <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-500/20">
            <div className="flex justify-between items-center opacity-70 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Total Facturado</span>
              <DollarSign size={20} />
            </div>
            <p className="text-4xl font-black italic tracking-tighter">
              ${stats.total.toLocaleString()}
            </p>
          </div>

          {/* Card Cantidad de Trabajos */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between items-center text-zinc-400 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Cantidad Realizada</span>
              <ShoppingBag size={20} />
            </div>
            <p className="text-4xl font-black italic tracking-tighter dark:text-white">
              {stats.cantidad}
            </p>
          </div>

          {/* Detalle si se seleccionan todos */}
          {servicioSeleccionado === "todos" && stats.desglose.length > 0 && (
            <div className="md:col-span-2 space-y-3 pt-2">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Ranking de Servicios</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.desglose.map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl">
                    <span className="text-[11px] font-bold uppercase truncate pr-2">{s.name}</span>
                    <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg text-[10px] font-black">
                      {s.qty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}