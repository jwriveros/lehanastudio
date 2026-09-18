import { NextResponse } from 'next/server';
import forge from 'node-forge';
import { supabase } from '@/lib/supabaseClient';

const PRIVATE_KEY_PEM = `-----BEGIN RSA PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCy6I14OwNRD2fU
gT3lWUtdbRJV89/r+3bfaD5iF0N2U4HrLbBqXgDIAxBChsHIsrQn9DCPAuAnxmQH
s9a+aYn3dgsO5TYe9VlZyep9yzLVmIgWk2vTppoD7JXj4fkz8/FeHGDCq3d/+nqe
8jKe9vW5wy6mNqgOglik7NjHQtpgY5rITVkZ2J4zEfQrqh6MZuSS13eXh5TGGnHm
x5yhGwFEc1oPt9bk3zUQwFNBnDhR5O2Bg3TiP4aekfWATsHBpEdNjNL5qBstGDpb
S/mbj5ljhlsFRYUE2kw6xdtfcmx5cxMOImve3B0VzNdDHjvMfTyV2e0TBxFIyyeu
KQV17zgnAgMBAAECggEALCoAEjfvH6l/5hNpZh5e3lc4eYNUOXq/43JmQ+yeOK1w
ms+Shw9hff5TmziMybBjjKFZA1SgZPEybDxWvHZtGmtHW4v1ijriramMezUX/WZD
4d7OdVbhGiri7Xgw/kQvxx2WPTf6rdr1Phtnp5orGoo2D83aOoquuzfEY5v7MGO8
Z6fNwDIuDp0W8/uHlulPxNewRv91vesEL02PKYKeCnDrLZfzKo87Ne2RhZkyJTLZ
oZan2gdzAaiWv0/4ysH+6TqxV7SClE6/gFqCO8URY9OapBYGYAG1ljlGkhXYpJ8y
IY0NK8Qbk0jQKH+FWW2FmioLKVbsND/6W/MZMeO0IQKBgQDfDwxTEsQ8iMWA7gis
NpcwNGkQodEYQkMnLhmUqYzt+sjM6KoEGczzPq8xoghdkcmRNLPusElq/bFn9rBS
KdZpN+QUD32nuV36PmIlE1cBQBokYM7M7BEMpT7jgxGWPoykR/ctq/4mOIr3Pjkz
5yY9FM2Ob0QiWGY3gHbk4iUUOQKBgQDNVFttY8cHrXoX40zDeTYLDNHisTsccRfq
URmoiBgxpyuuT7xBNGvC1K5uISoXWZVhvI4Ns2F5ETO3mWZaqYO4wJiIcT3QpGml
bqDPJcaEUAfRoI99/aGBSUYT0OpFr8dHfLofM9PxPZZiQt3JL7LbDPgoR0DWA3mg
VPq9uahvXwKBgQCB1ryRzqazpdlxRx19QPmYcamGqOqReGCmecsiId+K1yPzQqtU
X8BRBvfrqCm+bZIrF8Z09eCGis2teocADKJl9Maqdqnp65ishYuTkUJf0/RjoIY/
+lmiRr3oqO6fyiELr2hOCYOSs+8QJAQgFjjH7UgJ1PKQG2zEed67NHfo4QKBgQCM
/IdqrUBUfUGAdYqYDfqVy8+yII++D8mkEtvTZN93+Jl9rzJMc3oq5W6AIDWOoux3
l8jSj4E2aCFix+oIBq1zhos15MvVH4+LEFNK6V1OLMWxotXkZOsoou+DW8gA4Zmr
9HC4TBYTZ36DKfav1hixYE5lGcfjK6+v76nb7EdDcQKBgCWDjOm018jbWU+IbK+x
BaiLJkg5M2ihZZ5E8HOpnuohfn0vZJ5EOjvoZ1PhB23j3UgTvS+hgL5+L4yn7FjX
MkLslSo+6pkc0DLXYU5oiBbP5mIP1OBRnGeDIpinez3GsAa6K946iB2DzcuOhYGl
0hgdcrZYxD6CFAt51jRkpZYe
-----END RSA PRIVATE KEY-----`;

function getColombiaNow(): Date {
  const now = new Date();
  const colStr = now.toLocaleString("en-US", { timeZone: "America/Bogota" });
  return new Date(colStr);
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeParseSchedule(rawSchedule: any): any {
  if (!rawSchedule) return {};
  let current = rawSchedule;
  while (typeof current === "string") {
    try {
      let trimmed = current.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) trimmed = trimmed.slice(1, -1);
      current = JSON.parse(trimmed.replace(/\\"/g, '"'));
    } catch {
      break;
    }
  }
  return typeof current === "object" && current !== null ? current : {};
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleanTime = timeStr.trim().split(" ")[0].split("T").pop() || "";
  const parts = cleanTime.substring(0, 5).split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

// ALGORITMO INTEGRADO DE DISPONIBILIDAD DE AGENDA
async function getAvailableSlots(serviceId: string, sede: string, explicitSpecialist: string | null) {
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .or(`id.eq.${serviceId},SKU.eq.${serviceId}`)
    .single();

  if (!service) return [];

  const duration = parseInt(service.duracion || "60", 10);

  let serviceEspecialistas: string[] = [];
  if (typeof service.especialistas === "string") {
    try { serviceEspecialistas = JSON.parse(service.especialistas); } catch { serviceEspecialistas = [service.especialistas]; }
  } else if (Array.isArray(service.especialistas)) {
    serviceEspecialistas = service.especialistas;
  }

  const { data: specialists } = await supabase.from("app_users").select("id, name, horario_semanal");
  let qualifiedSpecialists = (specialists || []).filter((sp) => serviceEspecialistas.includes(sp.name));

  if (explicitSpecialist && explicitSpecialist !== "Cualquier profesional") {
    qualifiedSpecialists = qualifiedSpecialists.filter((sp) => sp.name.toLowerCase() === explicitSpecialist.toLowerCase());
  }

  if (qualifiedSpecialists.length === 0) return [];

  const colombiaToday = getColombiaNow();
  const startDate = new Date(colombiaToday);
  startDate.setDate(colombiaToday.getDate() + 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(colombiaToday);
  endDate.setDate(colombiaToday.getDate() + 15);
  endDate.setHours(23, 59, 59, 999);

  const startDateStr = formatLocalDate(startDate);
  const endDateStr = formatLocalDate(endDate);

  const { data: overrides } = await supabase.from("specialist_overrides").select("*").gte("date", startDateStr).lte("date", endDateStr);
  const { data: existingAppts } = await supabase
    .from("appointments")
    .select("appointment_at, duration, especialista, sede, estado")
    .eq("sede", sede)
    .neq("estado", "Cita cancelada")
    .gte("appointment_at", `${startDateStr} 00:00:00`)
    .lte("appointment_at", `${endDateStr} 23:59:59`);

  const daysOfWeekEs = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const candidateSlots: string[] = [];
  for (let m = 9 * 60; m <= 18 * 60; m += 30) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    candidateSlots.push(`${hh < 10 ? `0${hh}` : hh}:${mm < 10 ? `0${mm}` : mm}`);
  }

  const slotsList: Array<{ id: string; title: string }> = [];
  const isMainSede = sede.toLowerCase() === "marquetalia";

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatLocalDate(d);
    const dayName = daysOfWeekEs[d.getDay()];

    const dayAppts = (existingAppts || []).filter((appt) => (appt.appointment_at || "").replace(" ", "T").startsWith(dateStr));
    const apptsBySpecialist: Record<string, { start: number; end: number }[]> = {};
    dayAppts.forEach((appt) => {
      const apptStartMin = timeToMinutes(appt.appointment_at || "00:00");
      const apptEndMin = apptStartMin + parseInt(appt.duration || "60", 10);
      if (!apptsBySpecialist[appt.especialista]) apptsBySpecialist[appt.especialista] = [];
      apptsBySpecialist[appt.especialista].push({ start: apptStartMin, end: apptEndMin });
    });

    for (const slot of candidateSlots) {
      const slotStartMin = timeToMinutes(slot);
      const slotEndMin = slotStartMin + duration;
      let hasAvailableSpecialist = false;

      for (const sp of qualifiedSpecialists) {
        let isAvailableInSede = false;
        if (isMainSede) {
          const scheduleObj = safeParseSchedule(sp.horario_semanal);
          const dayConfig = scheduleObj[dayName];
          if (dayConfig && dayConfig.estado === "abierto") isAvailableInSede = true;
        } else {
          const assignedSedeOverride = (overrides || []).find(
            (rule) => rule.type === "assigned_sede" && rule.sede?.toLowerCase() === sede.toLowerCase() && rule.date === dateStr
          );
          if (assignedSedeOverride) isAvailableInSede = true;
        }

        if (!isAvailableInSede) continue;
        const spAppts = apptsBySpecialist[sp.name] || [];
        const isOccupied = spAppts.some((appt) => slotStartMin < appt.end && slotEndMin > appt.start);

        if (!isOccupied) {
          hasAvailableSpecialist = true;
          break;
        }
      }

      if (hasAvailableSpecialist) {
        slotsList.push({
          id: `${dateStr}T${slot}`,
          title: `📅 ${dateStr} — ⏰ ${slot}`,
        });
      }
    }
  }

  return slotsList.slice(0, 25);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    const privateKey = forge.pki.privateKeyFromPem(PRIVATE_KEY_PEM);
    const decryptedAesKeyBytes = privateKey.decrypt(
      forge.util.decode64(encrypted_aes_key),
      'RSA-OAEP',
      { md: forge.md.sha256.create(), mgf1: { md: forge.md.sha256.create() } }
    );

    const flowDataBytes = forge.util.decode64(encrypted_flow_data);
    const ivBytes = forge.util.decode64(initial_vector);
    const TAG_LENGTH = 16;
    const encryptedPayload = flowDataBytes.slice(0, flowDataBytes.length - TAG_LENGTH);
    const tag = flowDataBytes.slice(flowDataBytes.length - TAG_LENGTH);

    const decipher = forge.cipher.createDecipher('AES-GCM', decryptedAesKeyBytes);
    decipher.start({ iv: ivBytes, tag: forge.util.createBuffer(tag), tagLength: 128 });
    decipher.update(forge.util.createBuffer(encryptedPayload));
    decipher.finish();

    const decryptedBody = JSON.parse(forge.util.encodeUtf8(decipher.output.getBytes()));
    const { action, screen, data } = decryptedBody;

    let responsePayload: any = {};

    // PASO 1: Apertura del Flow (ping de Meta o inicio del usuario)
    if (action === 'INIT') {
      const { data: servicesDB } = await supabase.from('services').select('*');

      const filteredServices = (servicesDB || [])
        .filter((s: any) => {
          const cat = (s.category || '').toLowerCase();
          const name = (s.Servicio || s.servicio || '').toLowerCase();
          return !cat.includes('retoque') && !cat.includes('refuerzo') && !name.includes('retoque') && !name.includes('refuerzo');
        })
        .map((s: any) => ({
          id: s.SKU || s.id,
          title: `✨ ${s.Servicio || s.servicio}`,
          description: `${s.duracion || 45} min • $${Number(s.Precio || s.precio || 0).toLocaleString('es-CO')} COP`,
        }));

      responsePayload = {
        version: '3.0',
        screen: 'SERVICES_SCREEN',
        data: {
          services_list: filteredServices.length > 0 ? filteredServices : [
            { id: 'lash_clasicas', title: '✨ Pestañas Clásicas', description: '120 min • $90.000 COP' }
          ]
        },
      };
    }

    // PASO 2: Selección de Servicio -> Cargar Especialistas Calificadas
    else if (action === 'data_exchange' && screen === 'SERVICES_SCREEN') {
      const selectedServiceId = data.selected_service;

      const { data: service } = await supabase
        .from('services')
        .select('especialistas')
        .or(`id.eq.${selectedServiceId},SKU.eq.${selectedServiceId}`)
        .single();

      let serviceEspecialistas: string[] = [];
      if (service && service.especialistas) {
        if (typeof service.especialistas === 'string') {
          try { serviceEspecialistas = JSON.parse(service.especialistas); } catch { serviceEspecialistas = [service.especialistas]; }
        } else if (Array.isArray(service.especialistas)) {
          serviceEspecialistas = service.especialistas;
        }
      }

      const specialistsList: Array<{ id: string; title: string; description?: string }> = [
        { id: 'Cualquier profesional', title: '🔀 Cualquier profesional', description: '✨ Máxima disponibilidad' },
      ];
      serviceEspecialistas.forEach((name) => specialistsList.push({ id: name, title: `🌸 ${name}` }));

      responsePayload = {
        screen: 'SPECIALIST_SCREEN',
        data: { selected_service: selectedServiceId, specialists_list: specialistsList },
      };
    }

    // PASO 3: Selección de Especialista -> Cargar Sedes Activas
    else if (action === 'data_exchange' && screen === 'SPECIALIST_SCREEN') {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: overrides } = await supabase.from('specialist_overrides').select('sede').eq('type', 'assigned_sede').gte('date', todayStr);

      const activeSedesMap: Record<string, boolean> = { Marquetalia: true, Buga: false, 'Santa Marta': false };
      if (overrides) {
        overrides.forEach((row: any) => {
          if (row.sede) {
            const norm = row.sede.trim().toLowerCase();
            if (norm === 'buga') activeSedesMap['Buga'] = true;
            if (norm === 'santa marta') activeSedesMap['Santa Marta'] = true;
          }
        });
      }

      const locationsList = [{ id: 'Marquetalia', title: '📍 Marquetalia', description: 'Palomino, La Guajira' }];
      if (activeSedesMap['Buga']) locationsList.push({ id: 'Buga', title: '📍 Buga', description: 'Valle del Cauca' });
      if (activeSedesMap['Santa Marta']) locationsList.push({ id: 'Santa Marta', title: '📍 Santa Marta', description: 'Centro Histórico' });

      responsePayload = {
        screen: 'LOCATION_SCREEN',
        data: {
          selected_service: data.selected_service,
          selected_specialist: data.selected_specialist,
          locations_list: locationsList,
        },
      };
    }

    // PASO 4: Selección de Sede -> Cargar Horarios Disponibles
    else if (action === 'data_exchange' && screen === 'LOCATION_SCREEN') {
      const serviceId = data.selected_service;
      const specialist = data.selected_specialist;
      const sede = data.selected_sede || 'Marquetalia';

      const slotsList = await getAvailableSlots(serviceId, sede, specialist);
      const finalSlots = slotsList.length > 0 ? slotsList : [{ id: 'NONE', title: 'Sin turnos libres en estos días' }];

      const countryCodes = [
        { id: '57', title: '🇨🇴 Colombia (+57)' },
        { id: '1', title: '🇺🇸 Estados Unidos (+1)' },
        { id: '34', title: '🇪🇸 España (+34)' },
        { id: '52', title: '🇲🇽 México (+52)' },
        { id: '54', title: '🇦🇷 Argentina (+54)' },
        { id: '56', title: '🇨🇱 Chile (+56)' },
        { id: '51', title: '🇵🇪 Perú (+51)' },
        { id: '58', title: '🇻🇪 Venezuela (+58)' },
      ];

      responsePayload = {
        screen: 'DATETIME_SCREEN',
        data: { slots_list: finalSlots, country_codes: countryCodes },
      };
    }

    // PASO 5: Selección de Fecha/Hora y Contacto -> Resumen Final
    else if (action === 'data_exchange' && screen === 'DATETIME_SCREEN') {
      const [datePart, timePart] = (data.selected_time || '').split('T');
      const fullPhone = `+${data.indicativo} ${data.client_phone}`;

      responsePayload = {
        screen: 'SUMMARY_SCREEN',
        data: {
          summary_text: `Por favor confirma los detalles de tu agendamiento:\n\n👤 *Cliente:* ${data.client_name}\n📱 *WhatsApp:* ${fullPhone}\n📅 *Fecha:* ${datePart || 'Día seleccionado'}\n⏰ *Hora:* ${timePart || 'Hora seleccionada'}\n\nPresiona *Confirmar y Agendar* para reservar tu espacio.`,
        },
      };
    }

    // PASO 6: Finalización
    else if (action === 'complete') {
      responsePayload = { screen: 'SUCCESS', data: { extension_message_response: { params: { status: 'booked' } } } };
    }

    let flippedIv = '';
    for (let i = 0; i < ivBytes.length; i++) flippedIv += String.fromCharCode(ivBytes.charCodeAt(i) ^ 0xff);

    const cipher = forge.cipher.createCipher('AES-GCM', decryptedAesKeyBytes);
    cipher.start({ iv: flippedIv, tagLength: 128 });
    cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(JSON.stringify(responsePayload))));
    cipher.finish();

    const encryptedResponseBytes = cipher.output.getBytes() + cipher.mode.tag.getBytes();
    const encryptedBase64 = forge.util.encode64(encryptedResponseBytes);

    return new NextResponse(encryptedBase64, { status: 200, headers: { 'Content-Type': 'text/plain','ngrok-skip-browser-warning': 'true', } });
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message}`, { status: 421 });
  }
  
}