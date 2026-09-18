import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Clave privada RSA inyectada directamente
const HARDCODED_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCy6I14OwNRD2fU
gT3lWUtdbRJV89/r+3bfaD5iF0N2U4HrLbBqXgDIAxBChsHIsrQn9DCPAuAnxmQH
s9a+aYn3dgsO5TYe9VlZyep9yzLVmIgWk2vTppoD7JXj4fkz8/FeHGDCq3d/+nqe
8jKe9vW5wy6mNqgOglik7NjHQtpgY5rITVkZ2J4zEfQrqh6MZuSS13eXh5TGGnHm
x5yhGwFEc1oPt9bk3zUQwFNBnDhR5O2Bg3TiP4aekfWATsHBpEdNjNL5qBstGDpb
S/mbj5ljhlsFRYUE2kw6xdtfcmx5cxMOImve3B0VzNdDHjvMfTyV2e0TBxFIyyeu
KQV17zgnAgMBAAECggEALCoAEjfvH6l/5hNpNpZh5e3lc4eYNUOXq/43JmQ+yeOK1w
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

    // Tomar la variable de entorno o la clave asignada arriba
    const rawKey = process.env.WHATSAPP_PRIVATE_KEY || HARDCODED_PRIVATE_KEY;
    const formattedPem = rawKey.replace(/\\n/g, '\n').trim();

    // 1. Descifrar la clave AES negociada usando RSA-OAEP SHA-256
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: crypto.createPrivateKey({
          key: formattedPem,
          format: 'pem',
        }),
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
    console.error('Error al descifrar:', error);
    return new NextResponse(`Error de descifrado: ${error.message}`, { status: 421 });
  }
}