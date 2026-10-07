"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Camera, Trash2, Save, Loader2, RotateCw, Plus, ChevronLeft, 
  ClipboardList, History, Clock, FileText, Eye, X, HeartPulse, Sparkles, User
} from "lucide-react";

/* =========================================================
   🔹 TIPOS DE DATOS
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

type FacialRecordDb = {
  id: string;
  patient_id_doc: number | string;
  occupation?: string;
  emergency_contact?: string;
  sun_exposure?: string;
  habits_check?: any;
  diet_info?: string;
  sleep_info?: string;
  consult_reason?: string;
  health_conditions?: any;
  allergies_meds_details?: string;
  current_routine?: string;
  consent_acceptances?: any;
  additional_notes?: string;
  patient_signature_name: string;
  created_at: string;
  client_phone?: string;
};

type MicroRecordDb = {
  id: string;
  patient_id_doc: number | string;
  client_phone: string;
  address?: string;
  emergency_contact?: string;
  procedure_reason?: string;
  procedure_reason_other?: string;
  selected_services?: string; // 👈 Agregado para compatibilidad
  medical_history?: string;
  medical_notes?: string;
  consent_acceptances?: string;
  patient_signature_name: string;
  created_at: string;
  smokes?: string;
  pregnant?: string;
};

interface FichaTecnicaEditorProps {
  celular: string;
}

function parseJsonField(val: any): string {
  if (!val) return "Sin especificar";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.join(", ");
    if (typeof parsed === "object") return JSON.stringify(parsed);
    return String(parsed);
  } catch {
    return String(val);
  }
}

/* =========================================================
   🔹 DICCIONARIOS DE TRADUCCIÓN DE FLOW Y PDF CLÍNICO
========================================================= */

// Mapeo de Motivos de Consulta / Procedimientos
const PROCEDURES_MAP: Record<string, string> = {
  cejas_sombreadas: "Cejas sombreadas",
  cejas_pelo_a_pelo: "Cejas pelo a pelo",
  labios: "Labios",
  camuflaje_cicatriz: "Camuflaje de cicatriz",
  delineado_parpado: "Delineado párpado superior",
  delineado_parpado_superior: "Delineado párpado superior",
  otro: "Otro",
};

// Mapeo de Antecedentes Médicos
const MEDICAL_MAP: Record<string, string> = {
  alergia: "Alergia",
  enfermedad_dermatologica: "Enfermedad dermatológica",
  tintura_cabello: "Se tintura el cabello",
  cancer: "Cáncer",
  enfermedad_hematologica: "Enfermedad hematológica",
  sida: "Sida",
  cicatriz_queloide: "Cicatriz queloide",
  epilepsia: "Epilepsia",
  usa_acutane: "Usa Acutane",
  cirugias_recientes: "Cirugías recientes",
  esta_embarazada: "Está embarazada",
  usa_lentes_contacto: "Usa lentes de contacto",
  diabetes: "Diabetes",
  hemofilia: "Hemofilia",
  tiene_tatuajes: "Tiene tatuajes",
  enfermedad_autoinmune: "Enfermedad autoinmune",
  hepatitis: "Hepatitis",
  toma_anticoagulante: "Toma anticoagulante",
  enfermedad_cardiaca: "Enfermedad cardíaca",
  herpes: "Herpes",
  tratamiento_medico: "Tratamiento médico",
};

/* Helper 1: Formateador elegante de Procedimientos / Motivos */
function formatProcedureLabel(val: any): string {
  if (!val) return "Sin especificar";
  
  let items: string[] = [];
  try {
    if (Array.isArray(val)) {
      items = val;
    } else {
      const parsed = JSON.parse(val);
      items = Array.isArray(parsed) ? parsed : [String(parsed)];
    }
  } catch {
    items = [String(val)];
  }

  const formatted = items.map((item) => {
    const cleanKey = String(item).toLowerCase().trim().replace(/["'\[\]]/g, "");
    if (PROCEDURES_MAP[cleanKey]) return PROCEDURES_MAP[cleanKey];
    // Convierte guiones bajos en espacios y capitaliza cada palabra
    return cleanKey
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  });

  return formatted.join(", ");
}

/* Helper 2: Formateador de Antecedentes Médicos */
function formatMedicalHistory(val: any): string[] {
  if (!val) return [];
  let items: string[] = [];
  try {
    if (Array.isArray(val)) {
      items = val;
    } else {
      const parsed = JSON.parse(val);
      items = Array.isArray(parsed) ? parsed : [String(parsed)];
    }
  } catch {
    items = [String(val)];
  }

  return items.map((item) => {
    const cleanKey = String(item).toLowerCase().trim().replace(/["'\[\]]/g, "");
    return MEDICAL_MAP[cleanKey] || cleanKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  });
}

/* Helper 3: Evaluación de Consentimiento y Autorización de Fotos */
function parsePhotoConsent(val: any): { photosAllowed: boolean; termsAccepted: boolean } {
  if (!val) return { photosAllowed: false, termsAccepted: true };
  const strVal = String(typeof val === "object" ? JSON.stringify(val) : val).toLowerCase();
  
  const photosAllowed = strVal.includes("accept_photos") || strVal.includes("fotos_si") || strVal.includes("autorizo_fotos");
  const termsAccepted = strVal.includes("accept_terms") || strVal.includes("terminos_si") || true;

  return { photosAllowed, termsAccepted };
}

export default function FichaTecnicaEditor({ celular }: FichaTecnicaEditorProps) {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [tab, setTab] = useState<'fichas' | 'facial_flow' | 'micro_flow' | 'citas'>('fichas');
  
  // Estados de datos
  const [historialFichas, setHistorialFichas] = useState<FichaDb[]>([]);
  const [historialCitas, setHistorialCitas] = useState<AppointmentDb[]>([]);
  const [fichasFaciales, setFichasFaciales] = useState<FacialRecordDb[]>([]);
  const [fichasMicro, setFichasMicro] = useState<MicroRecordDb[]>([]);

  // Modales de detalle para Fichas de WhatsApp Flow
  const [selectedFacial, setSelectedFacial] = useState<FacialRecordDb | null>(null);
  const [selectedMicro, setSelectedMicro] = useState<MicroRecordDb | null>(null);

  // Estados de Formulario de Ficha Técnica Manual
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
  /* 🌸 FUNCIÓN DE BÚSQUEDA SIMPLIFICADA POR NÚMERO LOCAL */
  const loadData = async () => {
    if (!celular) return;
    setFetching(true);

    // 1. Limpiamos el prop celular para dejar únicamente los dígitos locales (ejemplo: "3181757220")
    const cleanPhoneDigits = String(celular).replace(/\D/g, "");

    try {
      // 📌 1. Fichas Manuales de Especialistas (Busca por celular numérico local)
      const { data: fichas } = await supabase
        .from('fichas_tecnicas')
        .select('*')
        .eq('celular', Number(cleanPhoneDigits))
        .order('created_at', { ascending: false });
      
      // 📌 2. Historial de Citas (Busca por celular numérico local)
      const { data: citas } = await supabase
        .from('appointments')
        .select('id, servicio, appointment_at, especialista, estado')
        .eq('celular', Number(cleanPhoneDigits))
        .order('appointment_at', { ascending: false });

      // 📌 3. Fichas Faciales de WhatsApp Flow (Busca por client_phone numérico en texto)
      const { data: faciales } = await supabase
        .from('facial_medical_records')
        .select('*')
        .eq('client_phone', cleanPhoneDigits)
        .order('created_at', { ascending: false });

      // 📌 4. Fichas de Micropigmentación de WhatsApp Flow (Busca por phone_number numérico en texto)
      const { data: micros } = await supabase
        .from('micropigmentation_records')
        .select('*')
        .eq('client_phone', cleanPhoneDigits)
        .order('created_at', { ascending: false });

      // Guardamos la información obtenida en los estados locales
      setHistorialFichas(fichas || []);
      setHistorialCitas(citas || []);
      setFichasFaciales(faciales || []);
      setFichasMicro(micros || []);

    } catch (err) {
      console.error("Error cargando historial de fichas del cliente:", err);
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
        Cargando historial de cliente...
      </span>
    </div>
  );

  if (view === 'list') {
    return (
      <div className="space-y-4 font-sans text-zinc-900 dark:text-zinc-100 antialiased">
        
        {/* NAVEGACIÓN ENTRE PESTAÑAS (FICHAS ESPECIALISTA / FACIAL / MICROPIGMENTACIÓN / CITAS) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
          <button 
            type="button"
            onClick={() => setTab('fichas')}
            className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              tab === 'fichas' 
                ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-2xs' 
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <ClipboardList size={13} /> Especialistas
          </button>

          <button 
            type="button"
            onClick={() => setTab('facial_flow')}
            className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              tab === 'facial_flow' 
                ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-2xs' 
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles size={13} /> Ficha Facial ({fichasFaciales.length})
          </button>

          <button 
            type="button"
            onClick={() => setTab('micro_flow')}
            className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              tab === 'micro_flow' 
                ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-2xs' 
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <HeartPulse size={13} /> Micropig. ({fichasMicro.length})
          </button>

          <button 
            type="button"
            onClick={() => setTab('citas')}
            className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              tab === 'citas' 
                ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-2xs' 
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            <History size={13} /> Citas
          </button>
        </div>

        {/* TAB 1: LISTADO DE FICHAS TÉCNICAS MANUALES DE ESPECIALISTAS */}
        {tab === 'fichas' && (
          <div className="space-y-3">
            <button 
              type="button"
              onClick={() => { setEditingFichaId(null); setJob(""); setObservaciones(""); setFotos([]); setView('edit'); }} 
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} /> Crear Nueva Ficha Manual
            </button>
            
            {historialFichas.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6">
                <p className="text-zinc-400 text-xs font-semibold">No hay fichas manuales de especialista registradas.</p>
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

        {/* TAB 2: FICHAS FACIALES (WHATSAPP FLOW) */}
        {tab === 'facial_flow' && (
          <div className="space-y-3">
            {fichasFaciales.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6">
                <p className="text-zinc-400 text-xs font-semibold">El cliente no ha diligenciado ninguna Ficha Facial.</p>
              </div>
            ) : (
              fichasFaciales.map((f) => (
                <div 
                  key={f.id} 
                  className="p-4 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-500" />
                      <h4 className="font-extrabold text-xs uppercase text-zinc-900 dark:text-zinc-100">
                        Ficha Médica Facial
                      </h4>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                      {isClient && formatDateShort(f.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Paciente: <strong className="text-zinc-800 dark:text-zinc-200">{f.patient_signature_name}</strong> (Doc: {f.patient_id_doc})
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedFacial(f)}
                    className="w-full mt-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-rose-500 text-white py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye size={14} /> Ver Ficha Completa
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: FICHAS MICROPIGMENTACIÓN (WHATSAPP FLOW) */}
        {tab === 'micro_flow' && (
          <div className="space-y-3">
            {fichasMicro.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6">
                <p className="text-zinc-400 text-xs font-semibold">No se encontraron registros de Micropigmentación de Flow.</p>
              </div>
            ) : (
              fichasMicro.map((m) => (
                <div 
                  key={m.id} 
                  className="p-4 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HeartPulse size={16} className="text-rose-500" />
                      <h4 className="font-extrabold text-xs uppercase text-zinc-900 dark:text-zinc-100">
                        Ficha Micropigmentación
                      </h4>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                      {isClient && formatDateShort(m.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Servicio / Motivo:{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {formatProcedureLabel(m.procedure_reason || m.selected_services)}
                    </strong>
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedMicro(m)}
                    className="w-full mt-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-rose-500 text-white py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye size={14} /> Ver Ficha Completa
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: HISTORIAL DE CITAS PASADAS */}
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

        {/* 🌸 MODAL FLOTANTE 1: DETALLE DE FICHA FACIAL */}
        {selectedFacial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="font-extrabold text-sm uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles size={18} className="text-rose-500" />
                  Ficha Médica Facial (Flow)
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedFacial(null)}
                  className="p-1 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p><strong>Paciente:</strong> {selectedFacial.patient_signature_name}</p>
                  <p><strong>Documento / ID:</strong> {selectedFacial.patient_id_doc}</p>
                  <p><strong>Ocupación:</strong> {selectedFacial.occupation || "N/A"}</p>
                  <p><strong>Contacto de Emergencia:</strong> {selectedFacial.emergency_contact || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">Motivo de Consulta:</p>
                  <p className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-zinc-600 dark:text-zinc-400">
                    {selectedFacial.consult_reason || "Sin especificar"}
                  </p>
                </div>

                {selectedFacial.health_conditions && (
                  <div className="space-y-1">
                    <p className="font-bold text-zinc-700 dark:text-zinc-300">Condiciones de Salud:</p>
                    <pre className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-[11px] font-mono text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedFacial.health_conditions, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">Alergias / Medicamentos:</p>
                  <p className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-zinc-600 dark:text-zinc-400">
                    {selectedFacial.allergies_meds_details || "Ninguna especificada"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">Rutina Actual:</p>
                  <p className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-zinc-600 dark:text-zinc-400">
                    {selectedFacial.current_routine || "Sin rutina actual"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFacial(null)}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        )}

        {/* 🌸 MODAL FLOTANTE: FICHA CLÍNICA MICROPIGMENTACIÓN (DISEÑO IDÉNTICO AL PDF) */}
        {selectedMicro && (() => {
          const medicalList = formatMedicalHistory(selectedMicro.medical_history);
          const { photosAllowed, termsAccepted } = parsePhotoConsent(selectedMicro.consent_acceptances);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
              <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto custom-scrollbar">
                
                {/* Encabezado con Estilo de Academia */}
                <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 block">
                      Leslie Gutierrez Studio Academy
                    </span>
                    <h3 className="font-black text-sm uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mt-0.5">
                      <HeartPulse size={17} className="text-rose-500" />
                      Ficha Clínica Micropigmentación
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMicro(null)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* BLOQUE 1: DATOS PERSONALES */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <User size={12} className="text-rose-500" /> Datos del Paciente
                  </h4>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                    <p><strong>Nombre:</strong> {selectedMicro.patient_signature_name || "N/A"}</p>
                    <p><strong>Cédula (CC):</strong> {selectedMicro.patient_id_doc || "N/A"}</p>
                    <p><strong>Celular:</strong> {selectedMicro.client_phone || "N/A"}</p>
                    <p><strong>Dirección:</strong> {selectedMicro.address || "No registrada"}</p>
                    <p><strong>Contacto de Emergencia:</strong> {selectedMicro.emergency_contact || "No especificado"}</p>
                  </div>
                </div>

                {/* BLOQUE 2: MOTIVO DE CONSULTA */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-500 flex items-center gap-1">
                    <Sparkles size={12} /> Motivo de Consulta / Procedimiento
                  </h4>
                  <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl font-extrabold text-xs text-rose-600 dark:text-rose-400">
                    {formatProcedureLabel(selectedMicro.procedure_reason || selectedMicro.selected_services)}
                    {selectedMicro.procedure_reason_other && (
                      <span className="block text-[11px] font-normal mt-1 text-zinc-600 dark:text-zinc-400">
                        Nota: {selectedMicro.procedure_reason_other}
                      </span>
                    )}
                  </div>
                </div>

                {/* BLOQUE 3: ANTECENTES MÉDICOS */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Antecedentes Médicos Registrados
                  </h4>
                  {medicalList.length === 0 ? (
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 italic">
                      Sin antecedentes médicos reportados.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      {medicalList.map((med, idx) => (
                        <span key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                          • {med}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* HÁBITOS ADICIONALES */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase">Fuma:</span>
                    <span className="font-black uppercase text-zinc-800 dark:text-zinc-200">{selectedMicro.smokes || "No"}</span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[9px] text-zinc-400 font-bold block uppercase">Embarazada / Lactante:</span>
                    <span className="font-black uppercase text-zinc-800 dark:text-zinc-200">{selectedMicro.pregnant || "No"}</span>
                  </div>
                </div>

                {/* BLOQUE 4: CONSENTIMIENTO INFORMADO Y FOTOGRAFÍAS */}
                <div className="space-y-1.5 pt-1">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Consentimiento Informado & Fotografías
                  </h4>
                  <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-xs">
                    
                    {/* Autorización de Fotos */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">¿Acepta toma de fotografías?</span>
                      {photosAllowed ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                          ✓ SÍ ACEPTÓ
                        </span>
                      ) : (
                        <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                          ✕ NO ACEPTÓ FOTOS
                        </span>
                      )}
                    </div>

                    {/* Firma Digital */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex justify-between items-center text-[11px]">
                      <span className="text-zinc-400 font-bold">Firma Digital del Paciente:</span>
                      <span className="font-black text-zinc-900 dark:text-zinc-100 italic">
                        {selectedMicro.patient_signature_name}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Botón de Cierre */}
                <button
                  type="button"
                  onClick={() => setSelectedMicro(null)}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md shadow-rose-500/20 active:scale-95"
                >
                  Cerrar Ficha
                </button>

              </div>
            </div>
          );
        })()}

      </div>
    );
  }

  {/* MODO EDICIÓN / CREACIÓN DE FICHA MANUAL */}
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