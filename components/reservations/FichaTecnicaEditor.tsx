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
  History,
  Clock,
  Sparkles
} from "lucide-react";

/* =========================================================
   🔹 TIPOS DE DATOS (INTACTOS)
========================================================= */
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
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [tab, setTab] = useState<'fichas' | 'citas'>('fichas');
  const [historialFichas, setHistorialFichas] = useState<FichaDb[]>([]);
  const [historialCitas, setHistorialCitas] = useState<AppointmentDb[]>([]);
  const [job, setJob] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fotos, setFotos] = useState<FotoFicha[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [editingFichaId, setEditingFichaId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadData();
  }, [celular]);

  const formatTime12h = (dateStr: string) => {
    if (!dateStr) return "--:--";
    try {
      const timePart = dateStr.includes(' ') ? dateStr.split(' ')[1] : dateStr.split('T')[1];
      if (!timePart) return "--:--";
      const [hours, minutes] = timePart.split(':');
      let h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${minutes} ${ampm}`;
    } catch (e) {
      return "--:--";
    }
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return "";
    const datePart = dateStr.split(/[ T]/)[0];
    const [year, month, day] = datePart.split('-');
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${day} ${months[parseInt(month) - 1]}`;
  };

  const loadData = async () => {
    if (!celular) return;
    setFetching(true);
    try {
      const { data: fichas } = await supabase
        .from('fichas_tecnicas')
        .select('*')
        .eq('celular', Number(celular))
        .order('created_at', { ascending: false });
      
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

  const handleDeleteFicha = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("¿Estás seguro de que deseas eliminar esta ficha técnica?")) return;
    
    try {
      const { error } = await supabase.from('fichas_tecnicas').delete().eq('id', id);
      if (error) throw error;
      setHistorialFichas(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setFotos(prev => [...prev, { url: previewUrl, descripcion: "", rotation: 0, file }]);
    e.target.value = "";
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
          const fileName = `${celular}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('fichas-clientes')
            .upload(fileName, foto.file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('fichas-clientes')
            .getPublicUrl(fileName);

          fotosFinales.push({ 
            url: urlData.publicUrl, 
            descripcion: foto.descripcion, 
            rotation: foto.rotation || 0 
          });
        } else {
          fotosFinales.push(foto);
        }
      }

      if (editingFichaId) {
        const { error } = await supabase
          .from('fichas_tecnicas')
          .update({ job, observaciones, fotos: fotosFinales })
          .eq('id', editingFichaId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fichas_tecnicas').insert({
          celular: Number(celular),
          job,
          observaciones,
          fotos: fotosFinales
        });
        if (error) throw error;
      }

      setEditingFichaId(null);
      setView('list');
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <Loader2 className="animate-spin text-rose-500" size={30} />
      <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
        Cargando perfil...
      </span>
    </div>
  );

  if (view === 'list') {
    return (
      <div className="space-y-4 font-sans text-zinc-900 dark:text-zinc-100 antialiased">
        
        {/* NAVEGACIÓN ENTRE PESTAÑAS (FICHAS / CITAS) */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
          <button 
            type="button"
            onClick={() => setTab('fichas')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              tab === 'fichas' 
                ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-2xs' 
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <ClipboardList size={14} /> Fichas Técnicas
          </button>
          <button 
            type="button"
            onClick={() => setTab('citas')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              tab === 'citas' 
                ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-2xs' 
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <History size={14} /> Historial Citas
          </button>
        </div>

        {/* TAB 1: LISTADO DE FICHAS TÉCNICAS */}
        {tab === 'fichas' && (
          <div className="space-y-3">
            <button 
              type="button"
              onClick={() => { setEditingFichaId(null); setJob(""); setObservaciones(""); setFotos([]); setView('edit'); }} 
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} /> Crear Nueva Ficha
            </button>
            
            {historialFichas.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6">
                <p className="text-zinc-400 text-xs font-semibold">No hay fichas técnicas registradas aún.</p>
              </div>
            ) : (
              historialFichas.map(f => (
                <div 
                  key={f.id} 
                  onClick={() => { setEditingFichaId(f.id); setJob(f.job); setObservaciones(f.observaciones); setFotos(f.fotos); setView('edit'); }} 
                  className="p-4 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/90 shadow-2xs cursor-pointer hover:border-rose-300 dark:hover:border-rose-900/50 transition-all duration-200 group relative"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="font-extrabold text-xs uppercase text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 transition-colors pr-6">
                      {f.job}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
                        {isClient && formatDateShort(f.created_at)}
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteFicha(e, f.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar Ficha"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    "{f.observaciones}"
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: HISTORIAL DE CITAS PASADAS */}
        {tab === 'citas' && (
          <div className="space-y-2.5">
            {historialCitas.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6">
                <p className="text-zinc-400 text-xs font-semibold">No hay citas registradas en el historial.</p>
              </div>
            ) : (
              historialCitas.map(c => (
                <div key={c.id} className="p-3.5 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/90 flex justify-between items-center shadow-2xs">
                  <div className="flex-1 pr-3">
                    <p className="text-xs font-extrabold dark:text-white uppercase truncate">{c.servicio}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-zinc-500 font-black uppercase bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                        {isClient && formatDateShort(c.appointment_at)}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-rose-500 font-extrabold">
                        <Clock size={12} />
                        {isClient && formatTime12h(c.appointment_at)}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 font-semibold">
                      Especialista: <span className="text-zinc-700 dark:text-zinc-300 font-extrabold">{c.especialista}</span>
                    </p>
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase border shrink-0 ${
                    c.estado === 'FINALIZADO' || c.estado === 'Cita pagada' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' 
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                  }`}>
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

  {/* MODO EDICIÓN / CREACIÓN DE FICHA */}
  return (
    <div className="space-y-5 animate-in slide-in-from-right duration-200 font-sans text-zinc-900 dark:text-zinc-100 antialiased">
      <button 
        type="button"
        onClick={() => { setEditingFichaId(null); setView('list'); }} 
        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
      >
        <ChevronLeft size={16} /> Volver al Listado
      </button>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Trabajo Realizado</label>
          <input 
            className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-3 text-xs font-bold bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-400/20 shadow-2xs" 
            placeholder="Ej: Balayage, Keratina..." 
            value={job} 
            onChange={e => setJob(e.target.value)} 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Observaciones Técnicas</label>
          <textarea 
            className="w-full h-28 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-3 text-xs font-bold bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-400/20 shadow-2xs custom-scrollbar" 
            placeholder="Fórmulas, tiempos, tonos, productos aplicados..." 
            value={observaciones} 
            onChange={e => setObservaciones(e.target.value)} 
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Registro Fotográfico</label>
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-500/20 transition-all">
              <Camera size={13} /> Añadir Foto
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapturePhoto} />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {fotos.map((f, i) => (
              <div key={i} className="flex gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
                <div className="w-16 h-16 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 shrink-0">
                  <img src={f.url} style={{ transform: `rotate(${f.rotation || 0}deg)` }} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <input className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 py-1 text-xs font-medium outline-none text-zinc-800 dark:text-zinc-200 focus:border-rose-400" placeholder="Descripción opcional..." value={f.descripcion} onChange={e => { const nf = [...fotos]; nf[i].descripcion = e.target.value; setFotos(nf); }} />
                  <div className="flex gap-3 mt-1">
                    <button type="button" onClick={() => handleRotate(i)} className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1 cursor-pointer"><RotateCw size={12} /> Rotar</button>
                    <button type="button" onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="text-[10px] font-black text-zinc-400 hover:text-rose-500 uppercase flex items-center gap-1 cursor-pointer"><Trash2 size={12} /> Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button 
        type="button"
        onClick={handleSave} 
        disabled={loading || !job} 
        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={16} /> {editingFichaId ? 'Actualizar Ficha' : 'Guardar Ficha Técnica'}</>}
      </button>
    </div>
  );
}