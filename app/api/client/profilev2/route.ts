import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// 1. Definición de interfaces para tipar los objetos y evitar errores de 'any'
interface Appointment {
  idx?: number;
  id?: number;
  cliente?: string;
  servicio?: string;
  especialista?: string;
  celular?: string;
  full_phone?: string;
  bsuid?: string;
  appointment_at?: string;
  estado?: string;
  sede?: string;
  price?: string;
  [key: string]: unknown;
}

interface FichaTecnica {
  id?: string;
  celular?: number | string;
  job?: string;
  observaciones?: string;
  created_at?: string;
  [key: string]: unknown;
}

// 2. Función auxiliar para normalizar búsquedas telefónicas
function normalizePhone(input: string) {
  const clean = input.replace(/\D/g, '');
  
  let full_phone = '';
  let celular = '';
  let bsuid = '';

  if (clean.startsWith('57') && clean.length === 12) {
    full_phone = `+${clean}`;
    celular = clean.substring(2);
  } else if (clean.length === 10) {
    celular = clean;
    full_phone = `+57${clean}`;
  } else if (input.startsWith('+')) {
    full_phone = input;
    celular = clean.replace(/^57/, '');
  } else {
    celular = clean;
    full_phone = `+57${clean}`;
  }

  bsuid = `CO.${clean.slice(-10)}`;

  return { full_phone, celular, bsuid, raw: input };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParam = searchParams.get('query') || searchParams.get('phone');

    if (!queryParam) {
      return NextResponse.json(
        { error: 'Debes proporcionar un parámetro de búsqueda (?query=... o ?phone=...)' },
        { status: 400 }
      );
    }

    const phoneVars = normalizePhone(queryParam);

    // Búsquedas paralelas en Supabase
    const [
      { data: clientData },
      { data: appointments },
      { data: fichas },
      { data: payments },
      { data: campaigns },
      { data: encuestas },
      { data: seguimientos }
    ] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .or(`celular.eq.${phoneVars.celular},celular.eq.${phoneVars.full_phone},BSUID.eq.${phoneVars.bsuid},BSUID.eq.${phoneVars.raw}`)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('appointments')
        .select('*')
        .or(`full_phone.eq.${phoneVars.full_phone},celular.eq.${phoneVars.celular},bsuid.eq.${phoneVars.bsuid}`)
        .order('appointment_at', { ascending: false }),
      supabase
        .from('fichas_tecnicas')
        .select('*')
        .or(`celular.eq.${phoneVars.celular},celular.eq.${phoneVars.full_phone}`),
      supabase
        .from('payments')
        .select('*')
        .eq('full_phone', phoneVars.full_phone),
      supabase
        .from('campaign')
        .select('*')
        .or(`phone.eq.${phoneVars.full_phone},bsuid.eq.${phoneVars.bsuid}`),
      supabase
        .from('encuestas')
        .select('*')
        .eq('cliente', phoneVars.full_phone),
      supabase
        .from('seguimientos_enviados')
        .select('*')
        .or(`telefono.eq.${phoneVars.full_phone},telefono.eq.${phoneVars.celular}`)
    ]);

    // Procesar información con parámetros tipados explícitamente
    const totalReservas = appointments?.length || 0;
    const especialistaCount: Record<string, number> = {};
    const serviciosFrecuentes: string[] = [];
    const sedesUsadas: Record<string, number> = {};

    // Solución al error de 'app' con tipo explícito (app: Appointment)
    (appointments as Appointment[] | null)?.forEach((app: Appointment) => {
      if (app.especialista) {
        especialistaCount[app.especialista] = (especialistaCount[app.especialista] || 0) + 1;
      }
      if (app.servicio) {
        serviciosFrecuentes.push(app.servicio);
      }
      if (app.sede) {
        sedesUsadas[app.sede] = (sedesUsadas[app.sede] || 0) + 1;
      }
    });

    const especialistaFavorita = Object.entries(especialistaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const sedeHabitual = Object.entries(sedesUsadas).sort((a, b) => b[1] - a[1])[0]?.[0] || clientData?.sede || 'Marquetalia';

    return NextResponse.json({
      success: true,
      search_identifiers_used: phoneVars,
      cliente: clientData || {
        nombre: appointments?.[0]?.cliente || 'Cliente no registrado',
        celular: phoneVars.celular,
        full_phone: phoneVars.full_phone,
        sede_principal: sedeHabitual,
      },
      insights_ia: {
        total_citas: totalReservas,
        especialista_favorita: especialistaFavorita,
        sede_habitual: sedeHabitual,
        servicios_realizados: [...new Set(serviciosFrecuentes)],
        // Solución al error de 'f' con tipo explícito (f: FichaTecnica)
        observaciones_tecnicas: (fichas as FichaTecnica[] | null)?.map((f: FichaTecnica) => ({
          trabajo: f.job,
          notas: f.observaciones
        })) || [],
        ultimo_seguimiento: seguimientos?.[0] || null,
        ultima_encuesta: encuestas?.[0] || null,
      },
      historial_completo: {
        reservas: appointments || [],
        fichas_tecnicas: fichas || [],
        pagos: payments || [],
        campanas_recibidas: campaigns || [],
        seguimientos: seguimientos || [],
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    );
  }
}