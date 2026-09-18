import { NextResponse } from 'next/server';
import forge from 'node-forge';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector) {
      return NextResponse.json(
        { error: 'Faltan campos cifrados de Meta' },
        { status: 400 }
      );
    }

    // 1. Descifrar la clave AES negociada (RSA-OAEP SHA-256)
    const privateKey = forge.pki.privateKeyFromPem(PRIVATE_KEY_PEM);
    const encryptedAesKeyBytes = forge.util.decode64(encrypted_aes_key);

    const decryptedAesKeyBytes = privateKey.decrypt(
      encryptedAesKeyBytes,
      'RSA-OAEP',
      {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() },
      }
    );

    // 2. Descifrar el payload del Flow (AES-128-GCM)
    const flowDataBytes = forge.util.decode64(encrypted_flow_data);
    const ivBytes = forge.util.decode64(initial_vector);

    const TAG_LENGTH = 16;
    const encryptedPayload = flowDataBytes.slice(0, flowDataBytes.length - TAG_LENGTH);
    const tag = flowDataBytes.slice(flowDataBytes.length - TAG_LENGTH);

    const decipher = forge.cipher.createDecipher('AES-GCM', decryptedAesKeyBytes);
    decipher.start({
      iv: ivBytes,
      tag: forge.util.createBuffer(tag),
      tagLength: 128,
    });
    decipher.update(forge.util.createBuffer(encryptedPayload));

    if (!decipher.finish()) {
      throw new Error('Tag de autenticación inválido al descifrar el payload');
    }

    const decryptedBody = JSON.parse(forge.util.encodeUtf8(decipher.output.getBytes()));
    const { action, screen, data } = decryptedBody;

    let responsePayload: any = {};

    // ------------------------------------------------------------------
    // MANEJO DINÁMICO DE NAVEGACIÓN Y DATOS DE LEHANA STUDIO
    // ------------------------------------------------------------------

    // PASO 1: Apertura del Flow -> Cargar Sedes
    if (action === 'INIT') {
      responsePayload = {
        screen: 'LOCATION_SCREEN',
        data: {
          locations_list: [
            { id: 'Marquetalia', title: '📍 Marquetalia', description: 'Palomino, La Guajira' },
            { id: 'Buga', title: '📍 Buga', description: 'Valle del Cauca' },
            { id: 'Santa Marta', title: '📍 Santa Marta', description: 'Centro Histórico' }
          ]
        }
      };
    } 

    // PASO 2: Selección de Sede -> Cargar Servicios
    else if (action === 'data_exchange' && screen === 'LOCATION_SCREEN') {
      responsePayload = {
        screen: 'SERVICES_SCREEN',
        data: {
          services_list: [
            { id: 'micro_cejas_sombra', title: '✨ Micropigmentación Sombreada', description: '3 hrs • $350.000 COP' },
            { id: 'cejas_sombreado', title: '🎨 Diseño, Epilación y Sombreado', description: '45 min • $35.000 COP' },
            { id: 'lash_clasicas', title: '👁️ Pestañas Pelo a Pelo Clásicas', description: '2 hrs • $90.000 COP' }
          ]
        }
      };
    }

    // PASO 3: Selección de Servicio -> Cargar Especialistas CALIFICADOS
    else if (action === 'data_exchange' && screen === 'SERVICES_SCREEN') {
    const selectedServiceId = data.selected_service;

    const specialistsByService: Record<string, Array<{ id: string; title: string; description?: string }>> = {
        micro_cejas_sombra: [
        { id: 'Cualquier profesional', title: '🔀 Cualquier profesional', description: '✨ Máxima disponibilidad de horarios' },
        { id: 'Leslie Gutierrez', title: '👑 Leslie Gutierrez', description: 'Especialista principal' }
        ],
        cejas_sombreado: [
        { id: 'Cualquier profesional', title: '🔀 Cualquier profesional', description: '✨ Máxima disponibilidad de horarios' },
        { id: 'Nary Cabrales', title: '🌸 Nary Cabrales' },
        { id: 'Yucelis Moscote', title: '🌸 Yucelis Moscote' },
        { id: 'Leslie Gutierrez', title: '👑 Leslie Gutierrez' }
        ],
        lash_clasicas: [
        { id: 'Cualquier profesional', title: '🔀 Cualquier profesional', description: '✨ Máxima disponibilidad de horarios' },
        { id: 'Yucelis Moscote', title: '🌸 Yucelis Moscote' },
        { id: 'Leslie Gutierrez', title: '👑 Leslie Gutierrez' }
        ]
    };

    const availableSpecialists = specialistsByService[selectedServiceId] || [
        { id: 'Cualquier profesional', title: '🔀 Cualquier profesional', description: '✨ Máxima disponibilidad de horarios' },
        { id: 'Leslie Gutierrez', title: '👑 Leslie Gutierrez' },
        { id: 'Nary Cabrales', title: '🌸 Nary Cabrales' },
        { id: 'Yucelis Moscote', title: '🌸 Yucelis Moscote' }
    ];

    responsePayload = {
        screen: 'SPECIALIST_SCREEN',
        data: {
        specialists_list: availableSpecialists
        }
    };
    }

    // PASO 4: Selección de Especialista -> Cargar Horarios e Indicativos
    else if (action === 'data_exchange' && screen === 'SPECIALIST_SCREEN') {
      const listaPaises = [
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
          slots_list: [
            { id: '09:00', title: '⏰ 09:00 AM' },
            { id: '11:00', title: '⏰ 11:00 AM' },
            { id: '14:30', title: '⏰ 02:30 PM' },
            { id: '16:00', title: '⏰ 04:00 PM' }
          ],
          country_codes: listaPaises
        }
      };
    }

    // PASO 5: Selección de Fecha, Hora y Datos -> Mostrar Resumen Final
    else if (action === 'data_exchange' && screen === 'DATETIME_SCREEN') {
      const fullPhone = `+${data.indicativo} ${data.client_phone}`;

      responsePayload = {
        screen: 'SUMMARY_SCREEN',
        data: {
          summary_text: `Por favor confirma los detalles de tu cita:\n\n👤 *Cliente:* ${data.client_name}\n📱 *WhatsApp:* ${fullPhone}\n📅 *Fecha:* ${data.selected_date}\n⏰ *Hora:* ${data.selected_time}\n\nPresiona *Confirmar y Agendar* para registrar tu cita.`
        }
      };
    }

    // PASO 6: Finalización
    else if (action === 'complete') {
      responsePayload = {
        screen: 'SUCCESS',
        data: { extension_message_response: { params: { status: 'booked' } } }
      };
    }

    // ------------------------------------------------------------------
    // CIFRAR RESPUESTA CON AES-128-GCM Y ENVIAR A META
    // ------------------------------------------------------------------
    let flippedIv = '';
    for (let i = 0; i < ivBytes.length; i++) {
      flippedIv += String.fromCharCode(ivBytes.charCodeAt(i) ^ 0xff);
    }

    const cipher = forge.cipher.createCipher('AES-GCM', decryptedAesKeyBytes);
    cipher.start({
      iv: flippedIv,
      tagLength: 128,
    });
    cipher.update(
      forge.util.createBuffer(
        forge.util.encodeUtf8(JSON.stringify(responsePayload))
      )
    );
    cipher.finish();

    const encryptedResponseBytes =
      cipher.output.getBytes() + cipher.mode.tag.getBytes();
    const encryptedBase64 = forge.util.encode64(encryptedResponseBytes);

    return new NextResponse(encryptedBase64, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error: any) {
    console.error('Error al procesar el Flow:', error);
    return new NextResponse(`Error de descifrado: ${error.message}`, {
      status: 421,
    });
  }
}