import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Interfaces para tipado seguro en TypeScript
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

// Función auxiliar para normalizar búsquedas telefónicas
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

    // Procesamiento de datos de citas
    const totalReservas = appointments?.length || 0;
    const especialistaCount: Record<string, number> = {};
    const serviciosFrecuentes: string[] = [];
    const sedesUsadas: Record<string, number> = {};

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

    const especialistaFavorita = Object.entries(especialistaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const sedeHabitual = Object.entries(sedesUsadas).sort((a, b) => b[1] - a[1])[0]?.[0] || clientData?.sede || 'N/A';

    // 1. Estructura garantizada del cliente (Con valores "N/A" si no existe)
    const clienteEstructurado = clientData ? {
      ...clientData,
      nombre: clientData.nombre || appointments?.[0]?.cliente || 'N/A',
      celular: clientData.celular || phoneVars.celular || 'N/A',
      full_phone: clientData.numberc || phoneVars.full_phone || 'N/A',
      sede: clientData.sede || sedeHabitual,
      estado: clientData.estado || 'N/A',
      tipo: clientData.tipo || 'N/A',
    } : {
      id: 'N/A',
      nombre: appointments?.[0]?.cliente || 'N/A',
      celular: phoneVars.celular || 'N/A',
      full_phone: phoneVars.full_phone || 'N/A',
      sede: 'N/A',
      estado: 'Cliente Nuevo',
      tipo: 'N/A',
      BSUID: phoneVars.bsuid || 'N/A',
      correo_electronico: 'N/A',
      direccion: 'N/A',
      municipio: 'N/A',
      notas: 'N/A'
    };

    // 2. Respuesta limpia y predecible
    return NextResponse.json({
      success: true,
      search_identifiers_used: phoneVars,
      cliente: clienteEstructurado,
      insights_ia: {
        total_citas: totalReservas,
        especialista_favorita: especialistaFavorita,
        sede_habitual: sedeHabitual,
        servicios_realizados: serviciosFrecuentes.length > 0 ? [...new Set(serviciosFrecuentes)] : ['N/A'],
        observaciones_tecnicas: (fichas && fichas.length > 0)
          ? (fichas as FichaTecnica[]).map((f: FichaTecnica) => ({
              trabajo: f.job || 'N/A',
              notas: f.observaciones || 'N/A'
            }))
          : [],
        ultimo_seguimiento: seguimientos?.[0] || 'N/A',
        ultima_encuesta: encuestas?.[0] || 'N/A',
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