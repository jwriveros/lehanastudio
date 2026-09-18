import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Limpiar la clave privada para asegurar el formato PEM correcto
function getPrivateKey() {
  const rawKey = process.env.WHATSAPP_PRIVATE_KEY || `-----BEGIN RSA PRIVATE KEY-----
AQUÍ_VA_TU_CLAVE_PRIVADA
-----END RSA PRIVATE KEY-----`;

  return rawKey.replace(/\\n/g, '\n');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector) {
      console.error('Campos faltantes en el payload:', body);
      return NextResponse.json(
        { error: 'Faltan campos cifrados de Meta' },
        { status: 400 }
      );
    }

    const privateKeyPem = getPrivateKey();

    // 1. Descifrar la clave AES negociada (RSA-OAEP SHA-256)
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: crypto.createPrivateKey(privateKeyPem),
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encrypted_aes_key, 'base64')
    );

    // 2. Descifrar el payload del flujo con AES-128-GCM
    const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
    const initialVectorBuffer = Buffer.from(initial_vector, 'base64');
    const TAG_LENGTH = 16;

    const encrypted_flow_data_body = flowDataBuffer.subarray(
      0,
      flowDataBuffer.length - TAG_LENGTH
    );
    const encrypted_flow_data_tag = flowDataBuffer.subarray(
      flowDataBuffer.length - TAG_LENGTH
    );

    const decipher = crypto.createDecipheriv(
      'aes-128-gcm',
      decryptedAesKey,
      initialVectorBuffer
    );
    decipher.setAuthTag(encrypted_flow_data_tag);

    const decryptedJSONString = Buffer.concat([
      decipher.update(encrypted_flow_data_body),
      decipher.final(),
    ]).toString('utf-8');

    const decryptedBody = JSON.parse(decryptedJSONString);

    // 3. Responder según la acción enviada por Meta
    let responsePayload = {};
    if (decryptedBody.action === 'ping') {
      responsePayload = {
        data: {
          status: 'active',
        },
      };
    } else {
      responsePayload = {
        screen: 'INIT',
        data: {},
      };
    }

    // 4. Invertir vector de inicialización (XOR 0xFF)
    const flipped_iv = [];
    for (const pair of initialVectorBuffer.entries()) {
      flipped_iv.push(pair[1] ^ 0xff);
    }

    // 5. Cifrar la respuesta final con AES-128-GCM
    const cipher = crypto.createCipheriv(
      'aes-128-gcm',
      decryptedAesKey,
      Buffer.from(flipped_iv)
    );
    const encryptedBase64 = Buffer.concat([
      cipher.update(JSON.stringify(responsePayload), 'utf-8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString('base64');

    return new NextResponse(encryptedBase64, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error: any) {
    console.error('Error detallado de descifrado:', error.message, error.stack);
    return new NextResponse(`Error de descifrado: ${error.message}`, { status: 421 });
  }
}