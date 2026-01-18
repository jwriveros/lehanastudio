"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import ExpensesManager from "@/components/ExpensesManager";
import DailyPaymentsReport from "@/components/DailyPaymentsReports";
import SurveysPanel from "@/components/SurveysPanel";
import { 
  LayoutDashboard, Zap, PieChart, Calendar, 
  TrendingUp, Target, Activity, Users, AlertCircle, X, UserCheck, Phone, Trophy, UserPlus, Download, UserMinus
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isRecurrentesModalOpen, setIsRecurrentesModalOpen] = useState(false);
  const [isProspectsModalOpen, setIsProspectsModalOpen] = useState(false);
  const [monthlyGoal] = useState(25000000); 
  
  const getTodayStr = () => new Date().toLocaleDateString('en-CA');
  const getSevenDaysAgoStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toLocaleDateString('en-CA');
  };

  const [dateRange, setDateRange] = useState({ start: getSevenDaysAgoStr(), end: getTodayStr() });
  const [activePeriod, setActivePeriod] = useState<'7' | '30' | '90' | 'custom'>('7');
  const [data, setData] = useState<any>({ 
    appointments: [], 
    expenses: [], 
    surveys: [], 
    allAppointmentsGlobal: [], 
    allClientsTable: [] 
  });

  const exportToExcel = (items: any[], fileName: string) => {
    if (!items.length) return;
    const headers = Object.keys(items[0]).join(",");
    const rows = items.map(item => 
      Object.values(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${fileName}_${new Date().toLocaleDateString()}.csv`);
    link.click();
  };

  const setQuickPeriod = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({ start: start.toLocaleDateString('en-CA'), end: end.toLocaleDateString('en-CA') });
    setActivePeriod(String(days) as any);
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const startISO = `${dateRange.start}T00:00:00Z`;
    const endISO = `${dateRange.end}T23:59:59Z`;

    const [appts, exps, survs, riskAppts, clients] = await Promise.all([
      supabase.from("appointments").select("*").gte("appointment_at", startISO).lte("appointment_at", endISO),
      supabase.from("expenses").select("*").gte("fecha", dateRange.start).lte("fecha", dateRange.end),
      supabase.from("encuestas").select("*").gte("created_at", startISO).lte("created_at", endISO),
      // Búsqueda global sin límites para riesgo y prospectos
      supabase.from("appointments").select("cliente, celular, appointment_at").order("appointment_at", { ascending: false }),
      // Tabla oficial de clientes
      supabase.from("clients").select("nombre, celular, numberc")
    ]);

    setData({
      appointments: appts.data || [],
      expenses: exps.data || [],
      surveys: survs.data || [],
      allAppointmentsGlobal: riskAppts.data || [],
      allClientsTable: clients.data || []
    });
    setLoading(false);
  }, [dateRange]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const stats = useMemo(() => {
    const paid = data.appointments.filter((a: any) => a.estado === "Cita pagada");
    const income = paid.reduce((acc: number, curr: any) => acc + Number(curr.price || 0), 0);
    const cost = data.expenses.reduce((acc: number, curr: any) => acc + Number(curr.valor || 0), 0);

    // 1. LÓGICA DE PROSPECTOS (Cruce Clients vs Appointments)
    const appointedPhones = new Set(data.allAppointmentsGlobal.map((a: any) => String(a.celular || "").trim()));
    const neverAppointed = data.allClientsTable.filter((c: any) => {
      const phone = String(c.celular || "").trim();
      return !appointedPhones.has(phone) && phone !== "";
    }).map((c: any) => ({ Cliente: c.nombre, Telefono: c.numberc || String(c.celular) }));

    // 2. LÓGICA DE RIESGO (+20 DÍAS)
    const clientRiskMap: any = {};
    data.allAppointmentsGlobal.forEach((a: any) => {
      if (!clientRiskMap[a.cliente] || new Date(a.appointment_at) > new Date(clientRiskMap[a.cliente].last)) {
        clientRiskMap[a.cliente] = { Cliente: a.cliente, last: a.appointment_at, Telefono: String(a.celular || "") };
      }
    });
    const allAtRisk = Object.values(clientRiskMap).filter((c: any) => {
      const diffDays = (new Date().getTime() - new Date(c.last).getTime()) / (1000 * 3600 * 24);
      return diffDays > 20;
    }).map((c: any) => ({ Cliente: c.Cliente, Telefono: c.Telefono, Ultima_Visita: new Date(c.last).toLocaleDateString(), last: c.last }))
      .sort((a: any, b: any) => new Date(a.last).getTime() - new Date(b.last).getTime());

    // 3. RECURRENTES E INGRESOS
    const recurrenceMap: any = {};
    paid.forEach((a: any) => {
      if (!recurrenceMap[a.cliente]) recurrenceMap[a.cliente] = { Cliente: a.cliente, Visitas: 0, Telefono: String(a.celular || "") };
      recurrenceMap[a.cliente].Visitas += 1;
    });
    const recurrentes = Object.values(recurrenceMap).filter((c: any) => c.Visitas > 1).sort((a: any, b: any) => b.Visitas - a.Visitas);

    const specialistMap: any = {};
    paid.forEach((a: any) => {
      const name = a.especialista || "Sin asignar";
      if (!specialistMap[name]) specialistMap[name] = { Especialista: name, Total: 0, Citas: 0 };
      specialistMap[name].Total += Number(a.price || 0);
      specialistMap[name].Citas += 1;
    });

    const satisfied = data.surveys.filter((s: any) => s.calificacion?.toLowerCase().includes("muy")).length;
    const satRate = data.surveys.length > 0 ? Math.round((satisfied / data.surveys.length) * 100) : 0;

    return {
      netProfit: income - cost,
      totalIncome: income,
      totalExpenses: cost,
      satRate,
      allAtRisk,
      recurrentes,
      neverAppointed,
      specialists: Object.values(specialistMap).sort((a: any, b: any) => b.Total - a.Total),
      goalProgress: Math.min(Math.round((income / monthlyGoal) * 100), 100)
    };
  }, [data, monthlyGoal]);

  return (
    <main className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 min-h-screen text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} className="text-indigo-600" />
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Dashboard Analítico</h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium ml-7 italic">Análisis de Retención y Prospectos.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border dark:border-zinc-700">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setQuickPeriod(d)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activePeriod === String(d) ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600' : 'text-zinc-500'}`}>
                {d === 7 ? 'SEM' : d === 30 ? 'MES' : 'TRI'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <Calendar size={12} className="text-zinc-400" />
            <input type="date" value={dateRange.start} onChange={(e) => { setDateRange(p => ({...p, start: e.target.value})); setActivePeriod('custom'); }} className="text-[10px] font-bold bg-transparent border-none p-0 focus:ring-0" />
            <span className="text-[10px] text-zinc-300">-</span>
            <input type="date" value={dateRange.end} onChange={(e) => { setDateRange(p => ({...p, end: e.target.value})); setActivePeriod('custom'); }} className="text-[10px] font-bold bg-transparent border-none p-0 focus:ring-0" />
          </div>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Resultado Neto" value={`$${stats.netProfit.toLocaleString()}`} hint="Ganancia Real" color="text-emerald-600" icon={<TrendingUp size={14}/>} />
        <StatCard title="Ingresos Brutos" value={`$${stats.totalIncome.toLocaleString()}`} hint="Suma de Ventas" color="text-indigo-600" icon={<Target size={14}/>} />
        <StatCard title="Recurrentes" value={stats.recurrentes.length} hint="Fidelidad en periodo" color="text-amber-500" icon={<UserCheck size={14}/>} />
        <StatCard title="Prospectos" value={stats.neverAppointed.length} hint="Sin cita agendada" color="text-red-500" icon={<UserMinus size={14}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 space-y-4">
          <div className="p-6 bg-indigo-600 text-white rounded-[2rem] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Trophy size={18} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">Objetivo Mensual</span>
            </div>
            <p className="text-xl font-black mb-1 leading-none italic">${stats.totalIncome.toLocaleString()}</p>
            <div className="h-2 w-full bg-white/20 rounded-full mt-4 overflow-hidden">
               <div className="h-full bg-amber-400" style={{ width: `${stats.goalProgress}%` }} />
            </div>
            <p className="text-[9px] font-black mt-2 text-right">{stats.goalProgress}% alcanzado</p>
          </div>

          <div className="p-6 bg-zinc-900 text-white rounded-[2rem] shadow-xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2 leading-none">
                  <UserPlus size={14} className="text-emerald-400" /> Ingresos por Especialista
              </h3>
              <div className="space-y-4">
                  {stats.specialists.map((esp: any) => (
                      <div key={esp.Especialista} className="flex justify-between items-center border-b border-zinc-800 pb-2 last:border-0">
                          <div>
                            <span className="text-[11px] font-black uppercase block leading-none">{esp.Especialista}</span>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase">{esp.Citas} servicios</span>
                          </div>
                          <span className="text-xs font-black text-emerald-400 shrink-0">${esp.Total.toLocaleString()}</span>
                      </div>
                  ))}
              </div>
          </div>
          
          <div className="p-5 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2rem] shadow-sm">
             <ExpensesManager />
             <div className="mt-2"><DailyPaymentsReport /></div>
          </div>
        </aside>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2rem] shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2 leading-none">
                      <AlertCircle size={14} /> Riesgo (Ausentes +20d)
                  </h3>
                  <button onClick={() => exportToExcel(stats.allAtRisk, "Clientes_en_Riesgo")} className="text-zinc-300 hover:text-indigo-600 transition-colors">
                    <Download size={14} />
                  </button>
                </div>
                <div className="space-y-3 mb-12">
                    {stats.allAtRisk.slice(0, 4).map((c: any) => (
                        <ClientSummaryRow key={c.Cliente} name={c.Cliente} phone={c.Telefono} subtext={c.Ultima_Visita} isRisk />
                    ))}
                </div>
                {stats.allAtRisk.length > 4 && (
                  <button onClick={() => setIsRiskModalOpen(true)} className="absolute bottom-6 left-0 right-0 mx-auto w-fit text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-1.5 rounded-full">Ver todos ({stats.allAtRisk.length})</button>
                )}
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2rem] shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 leading-none">
                      <UserMinus size={14} className="text-red-400" /> Prospectos (Sin cita)
                  </h3>
                  <button onClick={() => exportToExcel(stats.neverAppointed, "Prospectos_Sin_Cita")} className="text-zinc-300 hover:text-indigo-600 transition-colors">
                    <Download size={14} />
                  </button>
                </div>
                <div className="space-y-3 mb-12">
                    {stats.neverAppointed.slice(0, 4).map((c: any) => (
                        <ClientSummaryRow key={c.Cliente} name={c.Cliente} phone={c.Telefono} subtext="Nunca ha agendado" />
                    ))}
                </div>
                {stats.neverAppointed.length > 4 && (
                  <button onClick={() => setIsProspectsModalOpen(true)} className="absolute bottom-6 left-0 right-0 mx-auto w-fit text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-1.5 rounded-full">Ver todos ({stats.neverAppointed.length})</button>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2rem] shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2 leading-none">
                        <UserCheck size={14} /> Recurrentes (Fieles)
                    </h3>
                    <button onClick={() => exportToExcel(stats.recurrentes, "Clientes_Recurrentes")} className="text-zinc-300 hover:text-emerald-600 transition-colors">
                        <Download size={14} />
                    </button>
                </div>
                <div className="space-y-3 mb-12">
                    {stats.recurrentes.slice(0, 4).map((c: any) => (
                        <div key={c.Cliente} className="flex justify-between items-center border-b border-zinc-50 dark:border-zinc-800 pb-2">
                            <span className="text-[11px] font-bold uppercase truncate leading-none">{c.Cliente}</span>
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg shrink-0">{c.Visitas} CITAS</span>
                        </div>
                    ))}
                </div>
                {stats.recurrentes.length > 4 && (
                    <button onClick={() => setIsRecurrentesModalOpen(true)} className="absolute bottom-6 left-0 right-0 mx-auto w-fit text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-1.5 rounded-full">Ver todos ({stats.recurrentes.length})</button>
                )}
            </div>
            <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2rem] shadow-sm">
                <SurveysPanel surveys={data.surveys} />
            </div>
          </div>
        </div>
      </div>

      {/* MODALES REUTILIZABLES */}
      {isProspectsModalOpen && (
        <GenericModal onClose={() => setIsProspectsModalOpen(false)} title="Prospectos sin Citas" color="text-zinc-500">
            {stats.neverAppointed.map((c: any) => (
                <ClientDetailRow key={c.Cliente} name={c.Cliente} phone={c.Telefono} subtext="Nuevo Registro" />
            ))}
        </GenericModal>
      )}

      {isRiskModalOpen && (
        <GenericModal onClose={() => setIsRiskModalOpen(false)} title="Recuperar Clientes (+20d)" color="text-red-500">
            {stats.allAtRisk.map((c: any) => (
                <ClientDetailRow key={c.Cliente} name={c.Cliente} phone={c.Telefono} subtext={`Vino: ${c.Ultima_Visita}`} isRisk />
            ))}
        </GenericModal>
      )}

      {isRecurrentesModalOpen && (
        <GenericModal onClose={() => setIsRecurrentesModalOpen(false)} title="Clientes Recurrentes" color="text-emerald-600">
            {stats.recurrentes.map((c: any) => (
                <ClientDetailRow key={c.Cliente} name={c.Cliente} phone={c.Telefono} subtext={`${c.Visitas} visitas`} />
            ))}
        </GenericModal>
      )}
    </main>
  );
}

// COMPONENTES DE APOYO INTERNOS
function ClientSummaryRow({ name, phone, subtext, isRisk }: any) {
    return (
        <div className="flex justify-between items-center border-b border-zinc-50 dark:border-zinc-800 pb-2 last:border-0">
            <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase truncate leading-none mb-1">{name}</span>
                <span className="text-[9px] font-black text-indigo-500 flex items-center gap-1 leading-none">
                    <Phone size={10} /> {String(phone || "N/A")}
                </span>
            </div>
            <span className={`text-[9px] font-black uppercase shrink-0 ${isRisk ? 'text-red-500' : 'text-zinc-300'}`}>{subtext}</span>
        </div>
    );
}

function GenericModal({ onClose, title, color, children }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-zinc-800">
                <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className={`text-sm font-black uppercase tracking-widest ${color} flex items-center gap-2 leading-none`}>{title}</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={24} /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">{children}</div>
            </div>
        </div>
    );
}

function ClientDetailRow({ name, phone, subtext, isRisk }: any) {
    const phoneNumber = String(phone || "");
    const whatsappLink = `https://wa.me/${phoneNumber.replace(/\D/g, '')}`; 
    return (
        <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
            <div className="overflow-hidden">
                <span className="text-xs font-black uppercase block leading-none mb-1 truncate">{name}</span>
                {phoneNumber ? (
                    <a href={whatsappLink} target="_blank" className="text-[10px] font-black text-indigo-600 flex items-center gap-1 hover:underline leading-none">
                        <Phone size={12} /> {phoneNumber} (WhatsApp)
                    </a>
                ) : <span className="text-[10px] font-bold text-zinc-400 uppercase italic">Sin teléfono</span>}
            </div>
            <div className="text-right shrink-0">
                <span className={`text-[9px] font-black uppercase block ${isRisk ? 'text-red-500' : 'text-zinc-400'}`}>{subtext}</span>
            </div>
        </div>
    );
}

function StatCard({ title, value, hint, color, icon }: any) {
  return (
    <div className="rounded-[2rem] border bg-white dark:bg-zinc-900 p-5 shadow-sm transition-transform hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">{title}</p>
        <div className={`${color} opacity-80`}>{icon}</div>
      </div>
      <p className={`text-xl font-black ${color} leading-none tracking-tight italic`}>{value}</p>
      <p className="text-[9px] text-zinc-400 font-bold mt-2 uppercase italic leading-none">{hint}</p>
    </div>
  );
}