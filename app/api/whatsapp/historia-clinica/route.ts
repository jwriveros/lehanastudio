import { NextResponse } from 'next/server';
import forge from 'node-forge';
import { supabase } from '@/lib/supabaseClient';

// Pega aquí tu misma llave privada RSA Pem que usas en el Flow de agendamiento
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

    // 1. Desencriptar la clave AES usando tu llave privada RSA
    const privateKey = forge.pki.privateKeyFromPem(PRIVATE_KEY_PEM);
    const decryptedAesKeyBytes = privateKey.decrypt(
      forge.util.decode64(encrypted_aes_key),
      'RSA-OAEP',
      { md: forge.md.sha256.create(), mgf1: { md: forge.md.sha256.create() } }
    );

    // 2. Desencriptar el payload del Flow usando AES-GCM
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
    const { action, data } = decryptedBody;

    let responsePayload: any = {};

    // Prueba de estado que realiza Meta al configurar el Flow
    if (action === 'ping') {
      responsePayload = {
        version: '3.0',
        data: { status: 'active' }
      };
    }
    // Cuando el paciente hace clic en "Firmar y Guardar 🚀"
    else if (action === 'complete') {
      const {
        patient_id_doc,
        occupation,
        emergency_contact,
        sun_exposure,
        habits_check,
        diet_info,
        sleep_info,
        consult_reason,
        health_conditions,
        allergies_meds_details,
        current_routine,
        consent_acceptances,
        additional_notes,
        patient_signature_name
      } = data;

      // Guardar en la tabla de Supabase
      const { error } = await supabase
        .from('facial_medical_records')
        .insert([
          {
            patient_id_doc: Number(patient_id_doc),
            occupation,
            emergency_contact,
            sun_exposure,
            habits_check: habits_check || [],
            diet_info,
            sleep_info,
            consult_reason,
            health_conditions: health_conditions || [],
            allergies_meds_details: allergies_meds_details || 'Ninguna',
            current_routine,
            consent_acceptances: consent_acceptances || [],
            additional_notes: additional_notes || '',
            patient_signature_name
          }
        ]);

      if (error) {
        console.error('Error insertando en Supabase:', error);
      }

      responsePayload = {
        version: '3.0',
        screen: 'SUCCESS',
        data: {
          extension_message_response: {
            params: { status: 'medical_record_saved' }
          }
        }
      };
    }

    // 3. Encriptar la respuesta de vuelta a Meta
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
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message}`, { status: 421 });
  }
}