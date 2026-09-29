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
      try { current = JSON.parse(current); } catch { break; }
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

function formatTime12h(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let hours = parseInt(hStr, 10);
  const minutes = mStr || "00";
  const modifier = hours >= 12 ? "PM" : "AM";
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours < 10 ? `0${hours}` : hours}:${minutes} ${modifier}`;
}

async function getAvailableSlots(serviceId: string, sede: string, explicitSpecialistInput: string | null, filterDate: string | null = null) {
  let explicitSpecialist = explicitSpecialistInput;
  if (
    explicitSpecialist === "undefined" ||
    explicitSpecialist === "null" ||
    explicitSpecialist === "Cualquier profesional" ||
    !explicitSpecialist?.trim()
  ) {
    explicitSpecialist = null;
  }

  const { data: allServicesDB } = await supabase.from("services").select("*");
  const service = (allServicesDB || []).find(
    (s: any) => String(s.SKU) === String(serviceId) || String(s.id) === String(serviceId)
  );

  if (!service) return [];

  const duration = parseInt(service.duracion || "60", 10);
  const serviceSku = service.SKU || service.id;

  let serviceEspecialistas: string[] = [];
  if (typeof service.especialistas === "string") {
    try { serviceEspecialistas = JSON.parse(service.especialistas); } catch { serviceEspecialistas = [service.especialistas]; }
  } else if (Array.isArray(service.especialistas)) {
    serviceEspecialistas = service.especialistas;
  }

  const { data: specialists } = await supabase
    .from("app_users")
    .select("id, name, horario_semanal");

  let qualifiedSpecialists = (specialists || []).filter((sp) =>
    serviceEspecialistas.includes(sp.name)
  );

  if (explicitSpecialist) {
    qualifiedSpecialists = qualifiedSpecialists.filter(
      (sp) => sp.name.toLowerCase() === explicitSpecialist.toLowerCase()
    );
  }

  if (qualifiedSpecialists.length === 0) return [];

  let startDate: Date;
  let endDate: Date;
  const colombiaToday = getColombiaNow();

  if (filterDate) {
    const [fY, fM, fD] = filterDate.split("-").map(Number);
    startDate = new Date(fY, fM - 1, fD, 0, 0, 0);
    endDate = new Date(fY, fM - 1, fD, 23, 59, 59);
  } else {
    startDate = new Date(colombiaToday);
    startDate.setDate(colombiaToday.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(colombiaToday);
    endDate.setDate(colombiaToday.getDate() + 30);
    endDate.setHours(23, 59, 59, 999);
  }

  const startDateStr = formatLocalDate(startDate);
  const endDateStr = formatLocalDate(endDate);

  const { data: overrides } = await supabase
    .from("specialist_overrides")
    .select("*")
    .gte("date", startDateStr)
    .lte("date", endDateStr);

  const { data: existingAppts } = await supabase
    .from("appointments")
    .select("appointment_at, duration, especialista, sede, estado")
    .eq("sede", sede)
    .neq("estado", "Cita cancelada")
    .gte("appointment_at", `${startDateStr} 00:00:00`)
    .lte("appointment_at", `${endDateStr} 23:59:59`);

  const daysOfWeekEs = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

  const candidateSlots: string[] = [];
  for (let m = 9 * 60; m <= 18 * 60; m += 15) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    candidateSlots.push(`${hh < 10 ? `0${hh}` : hh}:${mm < 10 ? `0${mm}` : mm}`);
  }

  const slotsList: Array<{ id: string; title: string }> = [];
  const isMainSede = sede.toLowerCase() === "marquetalia";

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatLocalDate(d);
    const dayName = daysOfWeekEs[d.getDay()];

    const dayAppts = (existingAppts || []).filter((appt) => {
      const normalizedApptAt = (appt.appointment_at || "").replace(" ", "T");
      const [apptDate] = normalizedApptAt.split("T");
      return apptDate === dateStr;
    });

    const hasAnyApptInDay = dayAppts.length > 0;

    const apptsBySpecialist: Record<string, { start: number; end: number }[]> = {};
    dayAppts.forEach((appt) => {
      const normalizedApptAt = (appt.appointment_at || "").replace(" ", "T");
      const [, apptTimePart] = normalizedApptAt.split("T");
      const apptStartMin = timeToMinutes(apptTimePart || "00:00");
      const apptDuration = parseInt(appt.duration || "60", 10);
      const apptEndMin = apptStartMin + apptDuration;

      if (!apptsBySpecialist[appt.especialista]) apptsBySpecialist[appt.especialista] = [];
      apptsBySpecialist[appt.especialista].push({ start: apptStartMin, end: apptEndMin });
    });

    for (const slot of candidateSlots) {
      const slotStartMin = timeToMinutes(slot);
      const slotEndMin = slotStartMin + duration;
      const freeSpecialistsForSlot: string[] = [];

      for (const sp of qualifiedSpecialists) {
        const spOverrides = (overrides || []).filter((b) => {
          const isSameSp = b.specialist_id === sp.id || b.especialista === sp.name;
          return isSameSp && b.date === dateStr;
        });

        let isAvailableInSede = false;

        if (isMainSede) {
          const scheduleObj = safeParseSchedule(sp.horario_semanal);
          const dayConfig = scheduleObj[dayName];

          if (dayConfig && dayConfig.estado === "abierto") {
            const workStartMin = timeToMinutes(dayConfig.inicio || "09:00");
            const lastSlotAllowedMin = timeToMinutes(dayConfig.fin || "18:00");
            if (slotStartMin >= workStartMin && slotStartMin <= lastSlotAllowedMin) {
              isAvailableInSede = true;
            }
          }

          const hasConflictOverride = spOverrides.some((rule) => {
            const bStartMin = timeToMinutes(rule.start_time || "00:00");
            const bEndMin = timeToMinutes(rule.end_time || "23:59");
            const inTimeRange = slotStartMin < bEndMin && slotEndMin > bStartMin;

            if (!inTimeRange) return false;
            if (rule.type === "blocked") return true;
            if (rule.type === "assigned_sede" && rule.sede?.toLowerCase() !== "marquetalia") return true;
            return false;
          });

          if (hasConflictOverride) isAvailableInSede = false;
        } else {
          const assignedSedeOverride = spOverrides.find((rule) => {
            if (rule.type !== "assigned_sede") return false;
            if (!rule.sede || rule.sede.toLowerCase() !== sede.toLowerCase()) return false;
            const bStartMin = timeToMinutes(rule.start_time || "00:00");
            const bEndMin = timeToMinutes(rule.end_time || "23:59");
            return slotStartMin >= bStartMin && slotStartMin <= bEndMin;
          });

          if (assignedSedeOverride) {
            if (
              assignedSedeOverride.allowed_services &&
              Array.isArray(assignedSedeOverride.allowed_services) &&
              assignedSedeOverride.allowed_services.length > 0
            ) {
              const isServiceAllowed =
                assignedSedeOverride.allowed_services.includes(serviceSku) ||
                assignedSedeOverride.allowed_services.includes(service.id);
              if (isServiceAllowed) isAvailableInSede = true;
            } else {
              isAvailableInSede = true;
            }
          }
        }

        if (!isAvailableInSede) continue;

        const spAppts = apptsBySpecialist[sp.name] || [];
        const isOccupied = spAppts.some(
          (appt) => slotStartMin < appt.end && slotEndMin > appt.start
        );

        if (isOccupied) continue;

        if (!hasAnyApptInDay) {
          freeSpecialistsForSlot.push(sp.name);
          continue;
        }

        const spHasApptsToday = spAppts.length > 0;

        if (explicitSpecialist) {
          if (!spHasApptsToday) {
            const isStartOfShift = slotStartMin === 9 * 60 || slotStartMin === 14 * 60;
            if (isStartOfShift) freeSpecialistsForSlot.push(sp.name);
          } else {
            const isAllowedAnchor = spAppts.some((appt) => {
              const isRightAfter = appt.end === slotStartMin;
              const isRightBefore = slotEndMin === appt.start;
              const isOneHourAfter = slotStartMin === appt.end + 60;
              return isRightAfter || isRightBefore || isOneHourAfter;
            });
            if (isAllowedAnchor) freeSpecialistsForSlot.push(sp.name);
          }
        } else {
          if (spHasApptsToday) {
            const isMorningSlot = slotStartMin >= 9 * 60 && slotStartMin < 13 * 60;
            const isAfternoonSlot = slotStartMin >= 13 * 60 && slotStartMin <= 18 * 60;

            const hasApptInMorning = spAppts.some((a) => a.start < 13 * 60);
            const hasApptInAfternoon = spAppts.some((a) => a.end > 13 * 60);

            if ((isMorningSlot && hasApptInMorning) || (isAfternoonSlot && hasApptInAfternoon)) {
              freeSpecialistsForSlot.push(sp.name);
            } else {
              const isAllowedAnchor = spAppts.some((appt) => {
                const isRightAfter = appt.end === slotStartMin;
                const isRightBefore = slotEndMin === appt.start;
                const isOneHourAfter = slotStartMin === appt.end + 60;
                return isRightAfter || isRightBefore || isOneHourAfter;
              });
              if (isAllowedAnchor) freeSpecialistsForSlot.push(sp.name);
            }
          } else {
            const isStartOfShift = slotStartMin === 9 * 60 || slotStartMin === 14 * 60;
            if (isStartOfShift) freeSpecialistsForSlot.push(sp.name);
          }
        }
      }

      if (freeSpecialistsForSlot.length > 0) {
        slotsList.push({
          id: slot,
          title: `⏰ ${formatTime12h(slot)}`
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

    if (action === 'ping') {
      responsePayload = { 
        version: '3.0',
        data: { status: 'active' } 
      };
    }
    // 🎯 INIT: OBJETOS CON SOLO 'id' Y 'title' (ESTRICTO PARA DROPDOWN)
    else if (action === 'INIT') {
      const { data: servicesDB } = await supabase.from('services').select('*');

      const CATEGORIAS_ORDEN = ["Pestañas", "Cejas", "Micropigmentación", "Limpieza facial", "Depilación"];
      const categoryEmojis: Record<string, string> = {
        'Pestañas': '👁️', 'Cejas': '🎨', 'Micropigmentación': '✨', 'Limpieza facial': '💆‍♀️', 'Depilación': '🪒'
      };

      const rawServices = servicesDB || [];
      const filtered = rawServices.filter((s: any) => {
        const cat = (s.category || '').toLowerCase();
        const name = (s.Servicio || s.servicio || '').toLowerCase();
        return !cat.includes('retoque') && !cat.includes('refuerzo') && !name.includes('retoque') && !name.includes('refuerzo');
      });

      const grouped: Record<string, any[]> = {};
      CATEGORIAS_ORDEN.forEach((cat) => { grouped[cat] = []; });
      filtered.forEach((s: any) => {
        const cat = s.category || 'Otros';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(s);
      });

      const formattedList: Array<{ id: string; title: string }> = [];

      CATEGORIAS_ORDEN.forEach((cat) => {
        const items = grouped[cat] || [];
        if (items.length > 0) {
          const emoji = categoryEmojis[cat] || '📌';
          formattedList.push({
            id: `HEADER_${cat}`,
            title: `${emoji} ${cat.toUpperCase()}`
          });

          items.forEach((s: any) => {
            const dur = s.duracion || 45;
            const precio = Number(s.Precio || s.precio || 0).toLocaleString('es-CO');
            formattedList.push({
              id: String(s.SKU || s.id),
              title: `${s.Servicio || s.servicio} (${dur}m • $${precio} COP)`
            });
          });
        }
      });

      responsePayload = {
        version: '3.0',
        screen: 'SERVICES_SCREEN',
        data: { services_list: formattedList },
      };
    }
    else if (action === 'data_exchange' && screen === 'SERVICES_SCREEN') {
      const rawSelectedServiceId = String(data.selected_service || '');

      const { data: allServicesDB } = await supabase.from('services').select('*');

      const matchedService = (allServicesDB || []).find((s: any) => {
        const skuStr = String(s.SKU || '');
        const idStr = String(s.id || '');
        return skuStr === rawSelectedServiceId || idStr === rawSelectedServiceId;
      });

      let serviceEspecialistas: string[] = [];

      if (matchedService && matchedService.especialistas) {
        if (typeof matchedService.especialistas === 'string') {
          try {
            serviceEspecialistas = JSON.parse(matchedService.especialistas);
          } catch {
            serviceEspecialistas = [matchedService.especialistas];
          }
        } else if (Array.isArray(matchedService.especialistas)) {
          serviceEspecialistas = matchedService.especialistas;
        }
      }

      const { data: usersDB } = await supabase
        .from('app_users')
        .select('name')
        .neq('role', 'ADMIN');

      const appUserNames = (usersDB || []).map((u: any) => u.name);

      const qualifiedNames = serviceEspecialistas.filter((name) =>
        appUserNames.includes(name)
      );

      const finalNames = qualifiedNames.length > 0 ? qualifiedNames : serviceEspecialistas;

      const specialistsList: Array<{ id: string; title: string; description?: string }> = [
        {
          id: 'Cualquier profesional',
          title: '🔀 Cualquier profesional',
          description: '✨ Máxima disponibilidad de horarios'
        }
      ];

      finalNames.forEach((name) => {
        if (name && typeof name === 'string' && name.trim()) {
          specialistsList.push({
            id: name.trim(),
            title: `🌸 ${name.trim()}`,
            description: 'Especialista capacitada'
          });
        }
      });

      responsePayload = {
        version: '3.0',
        screen: 'SPECIALIST_SCREEN',
        data: {
          selected_service: rawSelectedServiceId,
          specialists_list: specialistsList
        }
      };
    }
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
        version: '3.0',
        screen: 'LOCATION_SCREEN',
        data: {
          selected_service: data.selected_service,
          selected_specialist: data.selected_specialist,
          locations_list: locationsList,
        },
      };
    }
    else if (action === 'data_exchange' && screen === 'LOCATION_SCREEN') {
      const colombiaToday = getColombiaNow();
      const tomorrow = new Date(colombiaToday);
      tomorrow.setDate(colombiaToday.getDate() + 1);

      const maxDate = new Date(colombiaToday);
      maxDate.setDate(colombiaToday.getDate() + 30);

      responsePayload = {
        version: '3.0',
        screen: 'DATE_SCREEN',
        data: {
          selected_service: data.selected_service,
          selected_specialist: data.selected_specialist,
          selected_sede: data.selected_sede || 'Marquetalia',
          min_date: formatLocalDate(tomorrow),
          max_date: formatLocalDate(maxDate),
        },
      };
    }
    else if (action === 'data_exchange' && screen === 'DATE_SCREEN') {
      const serviceId = data.selected_service;
      const specialist = data.selected_specialist;
      const sede = data.selected_sede || 'Marquetalia';
      const selectedDate = data.selected_date;

      const slotsList = await getAvailableSlots(serviceId, sede, specialist, selectedDate);
      const finalSlots = slotsList.length > 0 ? slotsList : [{ id: 'NONE', title: 'Sin turnos libres en esta fecha' }];

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
        version: '3.0',
        screen: 'TIME_SCREEN',
        data: {
          selected_service: serviceId,
          selected_specialist: specialist,
          selected_sede: sede,
          selected_date: selectedDate,
          slots_list: finalSlots,
          country_codes: countryCodes
        },
      };
    }
    else if (action === 'data_exchange' && screen === 'TIME_SCREEN') {
      const fullPhone = `+${data.indicativo} ${data.client_phone}`;

      responsePayload = {
        version: '3.0',
        screen: 'SUMMARY_SCREEN',
        data: {
          summary_text: `Por favor confirma los detalles de tu agendamiento:\n\n👤 *Cliente:* ${data.client_name}\n📱 *WhatsApp:* ${fullPhone}\n📍 *Sede:* ${data.selected_sede}\n🌸 *Atiende:* ${data.selected_specialist}\n📅 *Fecha:* ${data.selected_date}\n⏰ *Hora:* ${formatTime12h(data.selected_time)}\n\nPresiona *Confirmar y Agendar* para reservar tu espacio.`,
        },
      };
    }
    else if (action === 'complete') {
      responsePayload = { 
        version: '3.0',
        screen: 'SUCCESS', 
        data: { extension_message_response: { params: { status: 'booked' } } } 
      };
    }

    let flippedIv = '';
    for (let i = 0; i < ivBytes.length; i++) flippedIv += String.fromCharCode(ivBytes.charCodeAt(i) ^ 0xff);

    const cipher = forge.cipher.createCipher('AES-GCM', decryptedAesKeyBytes);
    cipher.start({ iv: flippedIv, tagLength: 128 });
    cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(JSON.stringify(responsePayload))));
    cipher.finish();

    const encryptedResponseBytes = cipher.output.getBytes() + cipher.mode.tag.getBytes();
    const encryptedBase64 = forge.util.encode64(encryptedResponseBytes);

    return new NextResponse(encryptedBase64, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message}`, { status: 421 });
  }
}