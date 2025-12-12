import { supabase } from "@/lib/supabaseClient";
import { AgendaBoard, Appointment, ClientRecord, ServiceRecord, SpecialistRecord } from "@/components/AgendaBoard"; // Assuming types are exported

function getLocalMidnight(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function getAppointmentDetails(isoString: string | null) {
  if (!isoString) {
     return { date: new Date(), timeString: "--:--", minutes: 0, dateISO: "" };
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
     return { date: new Date(), timeString: "--:--", minutes: 0, dateISO: "" };
  }
  const dateISO = isoString.split("T")[0];
  const timeString = new Intl.DateTimeFormat('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use the server's local timezone
  }).format(date);
  const minutes = parseTimeToMinutes(timeString);
  return { date, timeString, minutes, dateISO };
}

export default async function AgendaPage() {
  // Fetch initial data on the server
  const baseDate = getLocalMidnight(new Date());

  // 1. Fetch Specialists
  const { data: specialistsData } = await supabase
    .from("app_users")
    .select("id, name, role, color")
    .or('role.eq.ESPECIALISTA,role.eq.SPECIALIST')
    .returns<SpecialistRecord[]>();
  const initialSpecialistRecords: SpecialistRecord[] = specialistsData || [];

  // 2. Fetch Services
  const { data: servicesData } = await supabase
    .from("services")
    .select("Servicio, SKU, Precio, duracion, category")
    .returns<ServiceRecord[]>();
  const initialServiceRecords: ServiceRecord[] = servicesData ? servicesData.map(s => ({...s, Precio: Number(s.Precio), duracion: Number(s.duracion)})) : [];

  // 3. Fetch Clients
  const { data: clientsData } = await supabase
    .from("clients")
    .select("nombre, nombre_comercial, celular, telefono, numberc");
  const initialClientRecords: ClientRecord[] = clientsData ? clientsData.map((c: any) => ({
      nombre: c.nombre || c.nombre_comercial || '',
      celular: String(c.celular || c.telefono || c.numberc || '').replace(/\D/g, '') || null,
      numberc: c.numberc || c.celular || c.telefono || null,
  })).filter(c => c.nombre || c.celular) : [];

  // 4. Fetch Appointments for the current week
  let dateStart = startOfWeek(baseDate);
  let dateEnd = new Date(dateStart);
  dateEnd.setDate(dateStart.getDate() + 7); // For the initial week view

  const startISO = dateStart.toISOString();
  const endISO = dateEnd.toISOString();

  const { data: appointmentsData } = await supabase
    .from('appointments')
    .select('*')
    .gte('appointment_at', startISO)
    .lt('appointment_at', endISO)
    .order('appointment_at', { ascending: true })
    .returns<Appointment[]>();
  const initialAppointmentList: Appointment[] = appointmentsData || [];

  const serviceRecordMap = new Map(initialServiceRecords.map(s => [s.Servicio, s]));
  const specialistColorMap = new Map(initialSpecialistRecords.map(s => [s.name, s.color]));

  const normalizedAppointmentList: Appointment[] = initialAppointmentList.map(appt => {
    const matchedService = serviceRecordMap.get(appt.servicio);
    const duration = appt.duration ?? matchedService?.duracion ?? 60;
    const { dateISO, timeString } = getAppointmentDetails(appt.appointment_at);
    
    const specialistColor = specialistColorMap.get(appt.especialista) ?? appt.bg_color ?? '#94a3b8';
    const finalColor = appt.is_paid ? '#94a3b8' : specialistColor;

    return { 
        ...appt, 
        duration, 
        fecha: dateISO, 
        hora: timeString,
        bg_color: finalColor,
    };
  });

  return (
    <AgendaBoard
      initialSpecialistRecords={initialSpecialistRecords}
      initialServiceRecords={initialServiceRecords}
      initialClientRecords={initialClientRecords}
      initialAppointmentList={normalizedAppointmentList}
    />
  );
}
