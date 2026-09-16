import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicialización del cliente administrador
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface BotClientPayload {
  numero?: string;
  nombre?: string;
  sede?: string;
  municipio?: string;
  bsuid?: string;
  userProfile?: string;
  indicativo?: string;
}

// Helper para validar si un valor es información útil
function isValidValue(val: any): boolean {
  if (val === undefined || val === null) return false;
  const str = String(val).trim().toLowerCase();
  return (
    str !== "" &&
    str !== "n/a" &&
    str !== "na" &&
    str !== "null" &&
    str !== "undefined" &&
    str !== "desconocido"
  );
}

// Helper para determinar si una cadena es un BSUID o un identificador no telefónico
function isBSUIDFormat(val: string): boolean {
  if (!val) return false;
  const str = val.trim().toUpperCase();
  // Detecta si incluye letras (como "CO.") o prefijos de BSUID
  const hasLetters = /[A-Z]/.test(str);
  const cleanDigits = str.replace(/\D/g, "");
  return hasLetters || cleanDigits.length > 15;
}

// Helper para validar si una cadena corresponde verdaderamente a un número de teléfono
function isValidPhoneFormat(val: string): boolean {
  if (!isValidValue(val) || isBSUIDFormat(val)) return false;
  const cleanDigits = val.replace(/\D/g, "");
  // Un teléfono válido suele tener entre 7 y 15 dígitos
  return cleanDigits.length >= 7 && cleanDigits.length <= 15;
}

// Helper para obtener únicamente los dígitos del celular sin el indicativo
function cleanCelular(phone: string, indicativo: string = "57"): string {
  if (!isValidPhoneFormat(phone)) return "";
  let digits = phone.replace(/\D/g, "");
  const cleanInd = indicativo.replace(/\D/g, "");

  if (cleanInd && digits.startsWith(cleanInd)) {
    digits = digits.slice(cleanInd.length);
  }
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const payloadArray: BotClientPayload[] = Array.isArray(rawBody) ? rawBody : [rawBody];

    if (payloadArray.length === 0) {
      return NextResponse.json(
        { ok: false, error: "El cuerpo de la petición debe contener al menos un elemento." },
        { status: 400 }
      );
    }

    const results = [];

    for (const item of payloadArray) {
      let rawNumero = item.numero || "";
      let rawBsuid = item.bsuid || "";
      const rawIndicativo = item.indicativo || "57";
      const cleanIndDigits = rawIndicativo.replace(/\D/g, "") || "57";

      // 🎯 REDIRECCIÓN INTELIGENTE: Si 'numero' es un BSUID, corregimos la asignación
      if (isBSUIDFormat(rawNumero)) {
        if (!isValidValue(rawBsuid)) {
          rawBsuid = rawNumero;
        }
        rawNumero = ""; // Limpiamos la variable para que no afecte 'celular'
      }

      const cleanPhoneDigits = cleanCelular(rawNumero, cleanIndDigits);
      const rawNumeroEsValido = isValidPhoneFormat(rawNumero);
      const rawBsuidEsValido = isValidValue(rawBsuid);

      let existingClient: any = null;
      let matchedBy = "";

      /* =========================
         1️⃣ BÚSQUEDA JERÁRQUICA
      ========================= */
      // Paso 1: Buscar numero en la columna 'numberc' (Solo si es un teléfono válido)
      if (rawNumeroEsValido) {
        const { data } = await supabaseAdmin
          .from("clients")
          .select("*")
          .eq("numberc", rawNumero)
          .maybeSingle();
        if (data) {
          existingClient = data;
          matchedBy = "numberc_exact";
        }
      }

      // Paso 2: Buscar numero en la columna 'celular'
      if (!existingClient && rawNumeroEsValido) {
        const { data } = await supabaseAdmin
          .from("clients")
          .select("*")
          .eq("celular", rawNumero)
          .maybeSingle();
        if (data) {
          existingClient = data;
          matchedBy = "celular_raw";
        }
      }

      // Paso 3: Buscar por celular limpio de dígitos
      if (!existingClient && isValidValue(cleanPhoneDigits)) {
        const { data } = await supabaseAdmin
          .from("clients")
          .select("*")
          .eq("celular", cleanPhoneDigits)
          .maybeSingle();
        if (data) {
          existingClient = data;
          matchedBy = "celular_clean";
        }
      }

      // Paso 4: Buscar bsuid en la columna 'BSUID'
      if (!existingClient && rawBsuidEsValido) {
        const { data } = await supabaseAdmin
          .from("clients")
          .select("*")
          .eq("BSUID", rawBsuid)
          .maybeSingle();
        if (data) {
          existingClient = data;
          matchedBy = "BSUID";
        }
      }

      // Paso 5: Buscar bsuid en la columna 'celular' (por compatibilidad previa)
      if (!existingClient && rawBsuidEsValido) {
        const { data } = await supabaseAdmin
          .from("clients")
          .select("*")
          .eq("celular", rawBsuid)
          .maybeSingle();
        if (data) {
          existingClient = data;
          matchedBy = "celular_bsuid";
        }
      }

      /* =========================
         2️⃣ CREACIÓN O ACTUALIZACIÓN
      ========================= */
      if (!existingClient) {
        // CLIENTE NUEVO
        const finalNombre = isValidValue(item.nombre) ? item.nombre!.trim() : "Desconocido";
        const finalNombreComercial = isValidValue(item.userProfile) ? item.userProfile!.trim() : null;

        const newRecord: any = {
          nombre: finalNombre,
          celular: isValidValue(cleanPhoneDigits) ? cleanPhoneDigits : null,
          indicador: isValidValue(cleanPhoneDigits) ? Number(cleanIndDigits) : null,
          sede: isValidValue(item.sede) ? item.sede : "Marquetalia",
          municipio: isValidValue(item.municipio) ? item.municipio : null,
          BSUID: rawBsuidEsValido ? rawBsuid : null,
          nombre_comercial: finalNombreComercial,
          tipo: "Contacto",
          estado: "Activo",
          creado_desde: "BOT_WHATSAPP",
          last_incoming_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from("clients")
          .insert([newRecord])
          .select()
          .single();

        if (insertError) {
          results.push({ ok: false, error: insertError.message, payload: item });
        } else {
          results.push({ ok: true, action: "CREATED", client: inserted });
        }
      } else {
        // CLIENTE EXISTENTE (ACTUALIZACIÓN DELTA)
        const updates: any = {};

        // Solo actualiza celular e indicador si enviamos un teléfono REALMENTE válido
        if (isValidValue(cleanPhoneDigits) && (!isValidValue(existingClient.celular) || existingClient.celular !== cleanPhoneDigits)) {
          updates.celular = cleanPhoneDigits;
          updates.indicador = Number(cleanIndDigits);
        }

        // Actualizar nombre
        if (isValidValue(item.nombre) && (!isValidValue(existingClient.nombre) || existingClient.nombre === "Desconocido")) {
          if (item.nombre!.trim() !== existingClient.nombre) {
            updates.nombre = item.nombre!.trim();
          }
        }

        // Actualizar municipio
        if (isValidValue(item.municipio) && (!isValidValue(existingClient.municipio) || item.municipio !== existingClient.municipio)) {
          updates.municipio = item.municipio;
        }

        // Actualizar sede
        if (isValidValue(item.sede) && (!isValidValue(existingClient.sede) || item.sede !== existingClient.sede)) {
          updates.sede = item.sede;
        }

        // Actualizar BSUID si viene un valor válido y no estaba asignado o es diferente
        if (rawBsuidEsValido && (!isValidValue(existingClient.BSUID) || rawBsuid !== existingClient.BSUID)) {
          updates.BSUID = rawBsuid;
        }

        // Actualizar nombre_comercial con userProfile
        if (isValidValue(item.userProfile) && (!isValidValue(existingClient.nombre_comercial) || item.userProfile !== existingClient.nombre_comercial)) {
          updates.nombre_comercial = item.userProfile;
        }

        // Marca de tiempo de última interacción
        updates.last_incoming_at = new Date().toISOString();

        const hasRealUpdates = Object.keys(updates).some((key) => key !== "last_incoming_at");

        if (hasRealUpdates) {
          const { data: updated, error: updateError } = await supabaseAdmin
            .from("clients")
            .update(updates)
            .eq("id", existingClient.id)
            .select()
            .single();

          if (updateError) {
            results.push({ ok: false, error: updateError.message, payload: item });
          } else {
            results.push({ ok: true, action: "UPDATED", matched_by: matchedBy, updated_fields: Object.keys(updates), client: updated });
          }
        } else {
          results.push({ ok: true, action: "NO_CHANGES_NEEDED", matched_by: matchedBy, client: existingClient });
        }
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    console.error("Error en upsert-bot API:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}