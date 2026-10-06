import { NextResponse } from 'next/server';
import forge from 'node-forge';
import { supabase } from '@/lib/supabaseClient';

// Pega aquí tu misma llave privada RSA Pem que usas en el Flow de agendamiento
const PRIVATE_KEY_PEM = `-----BEGIN RSA PRIVATE KEY-----
TU_LLAVE_PRIVADA_AQUI
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