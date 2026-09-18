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

// Helper para llamadas internas a tu endpoint de disponibilidad
async function fetchRealAvailability(serviceId: string, sede: string, specialist?: string) {
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://lehanastudio.com';
    let url = `${origin}/api/availability?service_id=${encodeURIComponent(serviceId)}&sede=${encodeURIComponent(sede)}`;
    if (specialist && specialist !== 'Cualquier profesional') {
      url += `&specialist=${encodeURIComponent(specialist)}`;
    }
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.available_dates || [];
  } catch (err) {
    console.error('Error al llamar a /api/availability:', err);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector) {
      return NextResponse.json({ error: 'Faltan campos cifrados de Meta' }, { status: 400 });
    }

    // 1. Descifrado criptográfico con node-forge
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

    if (!decipher.finish()) {
      throw new Error('Tag de autenticación inválido al descifrar el payload');
    }

    const decryptedBody = JSON.parse(forge.util.encodeUtf8(decipher.output.getBytes()));
    const { action, screen, data } = decryptedBody;

    let responsePayload: any = {};

    // ------------------------------------------------------------------
    // MANEJO DINÁMICO EN VIVO CON SUPABASE
    // ------------------------------------------------------------------

    // PASO 1: Apertura del Flow -> Cargar Sedes activas desde specialist_overrides
    if (action === 'INIT') {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: overrides } = await supabase
        .from('specialist_overrides')
        .select('sede')
        .eq('type', 'assigned_sede')
        .gte('date', todayStr);

      const activeSedesMap: Record<string, boolean> = {
        Marquetalia: true,
        Buga: false,
        'Santa Marta': false,
      };

      if (overrides) {
        overrides.forEach((row: any) => {
          if (row.sede) {
            const normalized = row.sede.trim().toLowerCase();
            if (normalized === 'buga') activeSedesMap['Buga'] = true;
            if (normalized === 'santa marta') activeSedesMap['Santa Marta'] = true;
          }
        });
      }

      const locationsList = [
        { id: 'Marquetalia', title: '📍 Marquetalia', description: 'Palomino, La Guajira (Principal)' },
      ];

      if (activeSedesMap['Buga']) {
        locationsList.push({ id: 'Buga', title: '📍 Buga', description: 'Carrera 14 # 6-32, Valle del Cauca' });
      }
      if (activeSedesMap['Santa Marta']) {
        locationsList.push({ id: 'Santa Marta', title: '📍 Santa Marta', description: 'Centro Histórico' });
      }

      responsePayload = {
        screen: 'LOCATION_SCREEN',
        data: { locations_list: locationsList },
      };
    }

    // PASO 2: Selección de Sede -> Cargar Servicios desde Supabase (Excluyendo retoques)
    else if (action === 'data_exchange' && screen === 'LOCATION_SCREEN') {
      const { data: servicesDB } = await supabase.from('services').select('*');

      const filteredServices = (servicesDB || [])
        .filter((s: any) => {
          const catLower = (s.category || '').toLowerCase();
          const nameLower = (s.Servicio || s.servicio || '').toLowerCase();
          return (
            !catLower.includes('retoque') &&
            !catLower.includes('refuerzo') &&
            !nameLower.includes('retoque') &&
            !nameLower.includes('refuerzo')
          );
        })
        .map((s: any) => ({
          id: s.SKU || s.id,
          title: `✨ ${s.Servicio || s.servicio}`,
          description: `${s.duracion || 45} min • $${Number(s.Precio || s.precio || 0).toLocaleString('es-CO')} COP`,
        }));

      responsePayload = {
        screen: 'SERVICES_SCREEN',
        data: { services_list: filteredServices },
      };
    }

    // PASO 3: Selección de Servicio -> Cargar Especialistas calificadas para este servicio
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
          try {
            serviceEspecialistas = JSON.parse(service.especialistas);
          } catch {
            serviceEspecialistas = [service.especialistas];
          }
        } else if (Array.isArray(service.especialistas)) {
          serviceEspecialistas = service.especialistas;
        }
      }

      const specialistsList: Array<{ id: string; title: string; description?: string }> = [
        { id: 'Cualquier profesional', title: '🔀 Cualquier profesional', description: '✨ Máxima disponibilidad de horarios' },
      ];

      serviceEspecialistas.forEach((name) => {
        specialistsList.push({ id: name, title: `🌸 ${name}` });
      });

      responsePayload = {
        screen: 'SPECIALIST_SCREEN',
        data: {
          selected_service: selectedServiceId,
          selected_sede: data.selected_sede,
          specialists_list: specialistsList,
        },
      };
    }

    // PASO 4: Selección de Especialista -> Consultar horas disponibles usando /api/availability
    else if (action === 'data_exchange' && screen === 'SPECIALIST_SCREEN') {
      const serviceId = data.selected_service;
      const sede = data.selected_sede || 'Marquetalia';
      const specialist = data.selected_specialist;

      const availableDates = await fetchRealAvailability(serviceId, sede, specialist);

      const slotsList: Array<{ id: string; title: string }> = [];
      availableDates.forEach((dateItem: any) => {
        (dateItem.slots || []).forEach((slot: any) => {
          slotsList.push({
            id: `${dateItem.date}T${slot.time}`,
            title: `📅 ${dateItem.date} — ⏰ ${slot.time}`,
          });
        });
      });

      const fallbackSlots = slotsList.length > 0 ? slotsList.slice(0, 20) : [{ id: 'NONE', title: 'Sin horarios disponibles' }];

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
        data: {
          selected_service: serviceId,
          selected_sede: sede,
          selected_specialist: specialist,
          slots_list: fallbackSlots,
          country_codes: countryCodes,
        },
      };
    }

    // PASO 5: Selección de Fecha y Contacto -> Mostrar Resumen
    else if (action === 'data_exchange' && screen === 'DATETIME_SCREEN') {
      const [datePart, timePart] = (data.selected_time || '').split('T');
      const fullPhone = `+${data.indicativo} ${data.client_phone}`;

      responsePayload = {
        screen: 'SUMMARY_SCREEN',
        data: {
          summary_text: `Por favor confirma los detalles de tu agendamiento:\n\n👤 *Cliente:* ${data.client_name}\n📱 *WhatsApp:* ${fullPhone}\n📅 *Fecha:* ${datePart || data.selected_date}\n⏰ *Hora:* ${timePart || 'Seleccionada'}\n\nPresiona *Confirmar y Agendar* para asegurar tu espacio.`,
        },
      };
    }

    // PASO 6: Finalización -> Cierre del flujo
    else if (action === 'complete') {
      responsePayload = {
        screen: 'SUCCESS',
        data: { extension_message_response: { params: { status: 'booked' } } },
      };
    }

    // ------------------------------------------------------------------
    // CIFRAR RESPUESTA Y DEVOLVER A META
    // ------------------------------------------------------------------
    let flippedIv = '';
    for (let i = 0; i < ivBytes.length; i++) {
      flippedIv += String.fromCharCode(ivBytes.charCodeAt(i) ^ 0xff);
    }

    const cipher = forge.cipher.createCipher('AES-GCM', decryptedAesKeyBytes);
    cipher.start({ iv: flippedIv, tagLength: 128 });
    cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(JSON.stringify(responsePayload))));
    cipher.finish();

    const encryptedResponseBytes = cipher.output.getBytes() + cipher.mode.tag.getBytes();
    const encryptedBase64 = forge.util.encode64(encryptedResponseBytes);

    return new NextResponse(encryptedBase64, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error('Error al procesar el Flow:', error);
    return new NextResponse(`Error de descifrado: ${error.message}`, { status: 421 });
  }
}