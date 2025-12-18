"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Camera, 
  Trash2, 
  Save, 
  Loader2, 
  RotateCw, 
  Plus, 
  ChevronLeft, 
  ClipboardList, 
  History 
} from "lucide-react";

/* =========================
   TIPOS
========================= */
type FotoFicha = {
  url: string;
  descripcion: string;
  rotation?: number;
  file?: File;
};

type FichaDb = {
  id: string;
  job: string;
  observaciones: string;
  fotos: FotoFicha[];
  created_at: string;
};

type AppointmentDb = {
  id: string;
  servicio: string;
  appointment_at: string;
  especialista: string;
  estado: string;
};

interface FichaTecnicaEditorProps {
  celular: string;
}

export default function FichaTecnicaEditor({ celular }: FichaTecnicaEditorProps) {
  // Estados de navegación
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [tab, setTab] = useState<'fichas' | 'citas'>('fichas');
  
  // Estados de datos
  const [historialFichas, setHistorialFichas] = useState<FichaDb[]>([]);
  const [historialCitas, setHistorialCitas] = useState<AppointmentDb[]>([]);
  
  // Estados del formulario
  const [job, setJob] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fotos, setFotos] = useState<FotoFicha[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Cargar datos (Fichas y Citas)
  const loadData = async () => {
    if (!celular) return;
    setFetching(true);
    try {
      // 1. Cargar Fichas Técnicas
      const { data: fichas } = await supabase
        .from('fichas_tecnicas')
        .select('*')
        .eq('celular', Number(celular))
        .order('created_at', { ascending: false });
      
      // 2. Cargar Citas de la tabla appointments
      const { data: citas } = await supabase
        .from('appointments')
        .select('id, servicio, appointment_at, especialista, estado')
        .eq('celular', Number(celular))
        .order('appointment_at', { ascending: false });

      setHistorialFichas(fichas || []);
      setHistorialCitas(citas || []);
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [celular]);

  // Manejo de fotos
  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setFotos(prev => [...prev, { url: previewUrl, descripcion: "", rotation: 0, file }]);
    e.target.value = ""; // Reset para permitir la misma foto
  };

  const handleRotate = (index: number) => {
    setFotos(prev => prev.map((f, i) => 
      i === index ? { ...f, rotation: ((f.rotation || 0) + 90) % 360 } : f
    ));
  };

  const handleSave = async () => {
    if (!job.trim()) return alert("Por favor indica el trabajo realizado.");
    setLoading(true);
    try {
      const fotosFinales = [];
      for (const foto of fotos) {
        if (foto.file) {
          const fileExt = foto.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const path = `${celular}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('fichas-clientes')
            .upload(path, foto.file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('fichas-clientes')
            .getPublicUrl(path);

          fotosFinales.push({ 
            url: urlData.publicUrl, 
            descripcion: foto.descripcion, 
            rotation: foto.rotation || 0 
          });
        } else {
          fotosFinales.push(foto);
        }
      }

      const { error } = await supabase.from('fichas_tecnicas').insert({
        celular: Number(celular),
        job,
        observaciones,
        fotos: fotosFinales
      });

      if (error) throw error;
      alert("✅ Ficha técnica guardada correctamente.");
      setView('list');
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex justify-center p-10">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  /* VISTA DE LISTADO */
  if (view === 'list') {
    return (
      <div className="space-y-4">
        {/* Selector de Pestañas */}
        <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
          <button 
            onClick={() => setTab('fichas')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'fichas' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600' : 'text-gray-500'}`}
          >
            <ClipboardList size={14} /> FICHA TÉCNICA
          </button>
          <button 
            onClick={() => setTab('citas')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'citas' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600' : 'text-gray-500'}`}
          >
            <History size={14} /> HISTORIAL CITAS
          </button>
        </div>

        {/* CONTENIDO PESTAÑA FICHA TÉCNICA */}
        {tab === 'fichas' && (
          <div className="space-y-3">
            <button 
              onClick={() => { setJob(""); setObservaciones(""); setFotos([]); setView('edit'); }} 
              className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-indigo-700 transition-all"
            >
              <Plus size={20} /> CREAR NUEVA FICHA
            </button>
            
            {historialFichas.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
                <p className="text-gray-500 text-sm">No hay fichas técnicas para este cliente.</p>
              </div>
            ) : (
              historialFichas.map(f => (
                <div 
                  key={f.id} 
                  onClick={() => { setJob(f.job); setObservaciones(f.observaciones); setFotos(f.fotos); setView('edit'); }} 
                  className="p-4 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm cursor-pointer hover:border-indigo-500 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">{f.job}</h4>
                    <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-gray-500">
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">"{f.observaciones}"</p>
                  {f.fotos?.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {f.fotos.map((img, i) => (
                        <img 
                          key={i} 
                          src={img.url} 
                          style={{ transform: `rotate(${img.rotation || 0}deg)` }} 
                          className="w-12 h-12 object-cover rounded-lg border border-gray-100 dark:border-zinc-800 shrink-0" 
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* CONTENIDO PESTAÑA HISTORIAL CITAS */}
        {tab === 'citas' && (
          <div className="space-y-2">
            {historialCitas.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
                <p className="text-gray-500 text-sm">Este cliente no tiene citas registradas.</p>
              </div>
            ) : (
              historialCitas.map(c => (
                <div key={c.id} className="p-3 border border-gray-100 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900/50 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-xs font-bold dark:text-white uppercase">{c.servicio}</p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(c.appointment_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-medium">Especialista: {c.especialista}</p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase border ${c.estado === 'FINALIZADO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {c.estado || 'Agendada'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  /* VISTA DE EDICIÓN / CREACIÓN */
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <button 
        onClick={() => setView('list')} 
        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ChevronLeft size={16} /> VOLVER AL LISTADO
      </button>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Trabajo Realizado</label>
          <input 
            className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 p-3 text-sm dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="Ej: Balayage, Keratina..." 
            value={job} 
            onChange={e => setJob(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Observaciones Técnicas</label>
          <textarea 
            className="w-full h-28 rounded-xl border border-gray-200 dark:border-zinc-800 p-3 text-sm dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500" 
            placeholder="Fórmulas, tiempos, productos usados..." 
            value={observaciones} 
            onChange={e => setObservaciones(e.target.value)} 
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Fotos</label>
            <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-100">
              <Camera size={14} /> Añadir Foto
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleCapturePhoto} 
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {fotos.map((f, i) => (
              <div key={i} className="flex gap-3 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="w-20 h-20 overflow-hidden rounded-lg bg-white border shrink-0">
                  <img 
                    src={f.url} 
                    style={{ transform: `rotate(${f.rotation || 0}deg)` }} 
                    className="w-full h-full object-cover transition-transform duration-300" 
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <input 
                    className="w-full bg-transparent border-b border-gray-200 dark:border-zinc-700 py-1 text-xs focus:outline-none" 
                    placeholder="Descripción opcional..." 
                    value={f.descripcion} 
                    onChange={e => { const nf = [...fotos]; nf[i].descripcion = e.target.value; setFotos(nf); }} 
                  />
                  <div className="flex gap-4 mt-1">
                    <button onClick={() => handleRotate(i)} className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                      <RotateCw size={12} /> Rotar
                    </button>
                    <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={loading || !job} 
        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> GUARDAR FICHA TÉCNICA</>}
      </button>
    </div>
  );
}