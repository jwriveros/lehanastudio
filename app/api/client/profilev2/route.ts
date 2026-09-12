import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface Appointment {
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
  category?: string;
  sku?: string;
  price?: string | number;
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

// Mapeos de SKUs
const microMapping: Record<string, { sku: string; nombre: string; precio: number }> = {
  micro_cejas_nat: { sku: 'refuerzo_cejas', nombre: 'REFUERZO DE COLOR CEJAS', precio: 60000 },
  micro_cejas: { sku: 'refuerzo_cejas', nombre: 'REFUERZO DE COLOR CEJAS', precio: 60000 },
  micro_cejas_pelo: { sku: 'refuerzo_cejas', nombre: 'REFUERZO DE COLOR CEJAS', precio: 60000 },
  micro_fusion: { sku: 'refuerzo_cejas', nombre: 'REFUERZO DE COLOR CEJAS', precio: 60000 },
  micro_ojos_realce: { sku: 'refuerzo_ojos', nombre: 'REFUERZO DE COLOR OJOS', precio: 60000 },
  micro_ojos_maquillaje: { sku: 'refuerzo_ojos', nombre: 'REFUERZO DE COLOR OJOS', precio: 60000 },
  micro_labios: { sku: 'refuerzo_labios', nombre: 'REFUERZO DE COLOR LABIOS', precio: 130000 }
};

const lashMapping: Record<string, { 
  estandar: { sku: string; nombre: string; precio: number };
  extendido: { sku: string; nombre: string; precio: number };
}> = {
  lash_humedas: {
    estandar: { sku: 'ret_lash_humedas', nombre: 'Retoque PESTAÑAS HUMEDAS (15 a 20 DÍAS)', precio: 60000 },
    extendido: { sku: 'ret_lash_humedas_20_25', nombre: 'Retoque pestañas humedas (20-25)', precio: 75000 }
  },
  lash_gold: {
    estandar: { sku: 'ret_lash_gold', nombre: 'Retoque PESTAÑAS EFECTO VOLUMEN GOLD', precio: 70000 },
    extendido: { sku: 'ret_lash_gold_20_25', nombre: 'Retoque pestañas gold (20-25)', precio: 90000 }
  },
  lash_wispy: {
    estandar: { sku: 'ret_lash_wispy', nombre: 'Retoque EFECTO WISPY', precio: 75000 },
    extendido: { sku: 'ret_lash_wispy_20_25', nombre: 'Retoque pestañas wispy (20-25)', precio: 95000 }
  },
  lash_clasicas: {
    estandar: { sku: 'ret_lash_clasicas', nombre: 'Retoque DE PESTAÑAS CLASICAS NATURAL', precio: 60000 },
    extendido: { sku: 'ret_lash_clasicas_20_25', nombre: 'Retoque pestañas clasicas (20-25)', precio: 75000 }
  },
  lash_foxy: {
    estandar: { sku: 'ret_lash_foxy', nombre: 'Retoque EFECTO FOXY', precio: 75000 },
    extendido: { sku: 'ret_lash_foxy_20_25', nombre: 'Retoque pestañas foxy (20-25)', precio: 95000 }
  },
  lash_russian: {
    estandar: { sku: 'ret_lash_ruso', nombre: 'Retoque VOLUMEN RUSO', precio: 75000 },
    extendido: { sku: 'ret_lash_ruso_20_25', nombre: 'Retoque pestañas Ruso (20-25)', precio: 95000 }
  },
  lash_coffee: {
    estandar: { sku: 'ret_lash_coffee', nombre: 'Retoque VOLUMEN COFFEE (CAFE)', precio: 70000 },
    extendido: { sku: 'ret_lash_coffee_20_25', nombre: 'Retoque pestañas Coffee (20-25)', precio: 90000 }
  },
  lash_light: {
    estandar: { sku: 'ret_lash_light', nombre: 'Retoque PESTAÑAS EFECTO VOLUMEN LIGHT', precio: 65000 },
    extendido: { sku: 'ret_lash_light_20_25', nombre: 'Retoque pestañas light (20-25)', precio: 80000 }
  },
  lash_fantasia: {
    estandar: { sku: 'ret_lash_fantasia', nombre: 'Retoque FANTASÍA', precio: 70000 },
    extendido: { sku: 'ret_lash_fantasia_20_25', nombre: 'Retoque pestañas fantasía (20-25)', precio: 95000 }
  }
};

// Función para sumar días a una fecha
function agregarDias(fecha: Date, dias: number): string {
  const res = new Date(fecha);
  res.setDate(res.getDate() + dias);
  return res.toISOString().split('T')[0];
}

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

function inferirSedePorMunicipio(municipio: string | null): string {
  if (!municipio || municipio === 'N/A') return 'Marquetalia';
  const mun = municipio.toLowerCase();
  if (mun.includes('santa marta')) return 'Santa Marta';
  return 'Marquetalia';
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

    const totalReservas = appointments?.length || 0;
    const citasValidas = (appointments as Appointment[] || []).filter(a => a.estado !== 'Cita cancelada');

    const especialistaCount: Record<string, number> = {};
    const serviciosFrecuentes: string[] = [];
    const sedesUsadas: Record<string, number> = {};
    const diasSemanaCount: Record<string, number> = {};
    const horasCount: Record<string, number> = {};

    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    citasValidas.forEach((app) => {
      if (app.especialista) especialistaCount[app.especialista] = (especialistaCount[app.especialista] || 0) + 1;
      if (app.servicio) serviciosFrecuentes.push(app.servicio);
      if (app.sede) sedesUsadas[app.sede] = (sedesUsadas[app.sede] || 0) + 1;

      if (app.appointment_at) {
        const fecha = new Date(app.appointment_at);
        const diaNombre = diasNombres[fecha.getUTCDay()];
        const hora = fecha.getUTCHours();
        const franja = hora < 12 ? 'Mañana' : 'Tarde';

        diasSemanaCount[diaNombre] = (diasSemanaCount[diaNombre] || 0) + 1;
        horasCount[franja] = (horasCount[franja] || 0) + 1;
      }
    });

    const especialistaFavorita = Object.entries(especialistaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const diaFavorito = Object.entries(diasSemanaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const franjaFavorita = Object.entries(horasCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const sedeHabitual = Object.entries(sedesUsadas).sort((a, b) => b[1] - a[1])[0]?.[0] 
      || clientData?.sede 
      || inferirSedePorMunicipio(clientData?.municipio || null);

    // --- CÁLCULO DE FECHAS Y DÍAS DE DISPONIBILIDAD FUTURA ---
    const ultimaCita = citasValidas[0] || null;
    let evaluacionMantenimiento = {
      aplica: false,
      estado_ventana: 'SIN_REGISTROS',
      categoria: 'Ninguna',
      servicio_sugerido: 'N/A',
      sku_sugerido: 'N/A',
      precio: 0,
      dias_transcurridos: 0,
      fecha_inicio_agendamiento: 'N/A',
      fecha_limite_agendamiento: 'N/A',
      contexto_ia: 'No requiere mantenimiento ni retoque por fechas.'
    };

    if (ultimaCita && ultimaCita.appointment_at) {
      const fechaUltima = new Date(ultimaCita.appointment_at);
      const hoy = new Date();
      const diasTranscurridos = Math.floor((hoy.getTime() - fechaUltima.getTime()) / (1000 * 3600 * 24));
      const skuUltimo = (ultimaCita.sku || '').toLowerCase();

      // 1. Micropigmentación (30 a 60 días)
      if (microMapping[skuUltimo]) {
        const infoRefuerzo = microMapping[skuUltimo];
        const fechaInicio = agregarDias(fechaUltima, 30);
        const fechaLimite = agregarDias(fechaUltima, 60);

        if (diasTranscurridos < 30) {
          evaluacionMantenimiento = {
            aplica: false,
            estado_ventana: 'ESPERAR_FECHA_FUTURA',
            categoria: 'Refuerzo Micropigmentación',
            servicio_sugerido: infoRefuerzo.nombre,
            sku_sugerido: infoRefuerzo.sku,
            precio: infoRefuerzo.precio,
            dias_transcurridos: diasTranscurridos,
            fecha_inicio_agendamiento: fechaInicio,
            fecha_limite_agendamiento: fechaLimite,
            contexto_ia: `Aún no cumple los 30 días mínimos. Su cita de ${infoRefuerzo.nombre} se puede agendar a partir del ${fechaInicio} y tiene plazo hasta el ${fechaLimite}.`
          };
        } else if (diasTranscurridos >= 30 && diasTranscurridos <= 60) {
          evaluacionMantenimiento = {
            aplica: true,
            estado_ventana: 'DENTRO_DE_TIEMPO',
            categoria: 'Refuerzo Micropigmentación',
            servicio_sugerido: infoRefuerzo.nombre,
            sku_sugerido: infoRefuerzo.sku,
            precio: infoRefuerzo.precio,
            dias_transcurridos: diasTranscurridos,
            fecha_inicio_agendamiento: fechaInicio,
            fecha_limite_agendamiento: fechaLimite,
            contexto_ia: `Está dentro del periodo ideal. Puede agendar su ${infoRefuerzo.nombre} por $${infoRefuerzo.precio.toLocaleString()} antes del ${fechaLimite}.`
          };
        } else {
          evaluacionMantenimiento = {
            aplica: false,
            estado_ventana: 'VENTANA_VENCIDA',
            categoria: 'Refuerzo Micropigmentación',
            servicio_sugerido: 'N/A',
            sku_sugerido: 'N/A',
            precio: 0,
            dias_transcurridos: diasTranscurridos,
            fecha_inicio_agendamiento: fechaInicio,
            fecha_limite_agendamiento: fechaLimite,
            contexto_ia: `Han pasado ${diasTranscurridos} días. Superó la fecha límite del ${fechaLimite} para el refuerzo a precio especial.`
          };
        }
      }
      // 2. Pestañas (15 a 25 días)
      else if (lashMapping[skuUltimo]) {
        const configLash = lashMapping[skuUltimo];
        const fechaInicio = agregarDias(fechaUltima, 15);
        const fechaLimiteEst = agregarDias(fechaUltima, 20);
        const fechaLimiteExt = agregarDias(fechaUltima, 25);

        if (diasTranscurridos < 15) {
          evaluacionMantenimiento = {
            aplica: false,
            estado_ventana: 'ESPERAR_FECHA_FUTURA',
            categoria: 'Retoque de Pestañas',
            servicio_sugerido: configLash.estandar.nombre,
            sku_sugerido: configLash.estandar.sku,
            precio: configLash.estandar.precio,
            dias_transcurridos: diasTranscurridos,
            fecha_inicio_agendamiento: fechaInicio,
            fecha_limite_agendamiento: fechaLimiteExt,
            contexto_ia: `Aún no cumple los 15 días de reposo. Puede agendar su retoque a partir del ${fechaInicio} y hasta el ${fechaLimiteExt}.`
          };
        } else if (diasTranscurridos >= 15 && diasTranscurridos <= 20) {
          evaluacionMantenimiento = {
            aplica: true,
            estado_ventana: 'DENTRO_DE_TIEMPO',
            categoria: 'Retoque Pestañas (15-20 días)',
            servicio_sugerido: configLash.estandar.nombre,
            sku_sugerido: configLash.estandar.sku,
            precio: configLash.estandar.precio,
            dias_transcurridos: diasTranscurridos,
            fecha_inicio_agendamiento: fechaInicio,
            fecha_limite_agendamiento: fechaLimiteEst,
            contexto_ia: `Está a tiempo de su ${configLash.estandar.nombre} por $${configLash.estandar.precio.toLocaleString()} (Vence el ${fechaLimiteEst}).`
          };
        } else if (diasTranscurridos > 20 && diasTranscurridos <= 25) {
          evaluacionMantenimiento = {
            aplica: true,
            estado_ventana: 'DENTRO_DE_TIEMPO_EXTENDIDO',
            categoria: 'Retoque Pestañas (20-25 días)',
            servicio_sugerido: configLash.extendido.nombre,
            sku_sugerido: configLash.extendido.sku,
            precio: configLash.extendido.precio,
            dias_transcurridos: diasTranscurridos,
            fecha_inicio_agendamiento: fechaInicio,
            fecha_limite_agendamiento: fechaLimiteExt,
            contexto_ia: `Corresponde el ${configLash.extendido.nombre} por $${configLash.extendido.precio.toLocaleString()} (Vence el ${fechaLimiteExt}).`
          };
        } else {
          evaluacionMantenimiento = {
            aplica: false,
            estado_ventana: 'VENTANA_VENCIDA',
            categoria: 'Postura Nueva Requerida',
            servicio_sugerido: ultimaCita.servicio || 'Postura Nueva de Pestañas',
            sku_sugerido: skuUltimo,
            precio: Number(ultimaCita.price) || 0,
            dias_transcurridos: diasTranscurridos,
            fecha_inicio_agendamiento: fechaInicio,
            fecha_limite_agendamiento: fechaLimiteExt,
            contexto_ia: `Superó el plazo del ${fechaLimiteExt} (25 días). Debe agendar postura completa nueva.`
          };
        }
      }
    }

    const nombreCliente = clientData?.nombre || appointments?.[0]?.cliente || 'N/A';
    const esClienteNuevo = totalReservas === 0 && !clientData;

    const clienteEstructurado = {
      id: clientData?.id || 'N/A',
      nombre: nombreCliente,
      celular: clientData?.celular || phoneVars.celular || 'N/A',
      full_phone: clientData?.numberc || phoneVars.full_phone || 'N/A',
      sede: clientData?.sede || sedeHabitual,
      municipio: clientData?.municipio || 'N/A',
      estado: clientData?.estado || (esClienteNuevo ? 'Cliente Nuevo' : 'Activo'),
      BSUID: clientData?.BSUID || phoneVars.bsuid || 'N/A',
    };

    return NextResponse.json({
      success: true,
      search_identifiers_used: phoneVars,
      cliente: clienteEstructurado,
      insights_ia: {
        es_cliente_nuevo: esClienteNuevo,
        faltan_datos_clave: {
          requiere_nombre: nombreCliente === 'N/A' || nombreCliente.trim() === '',
          requiere_sede: clienteEstructurado.sede === 'N/A',
        },
        agendamiento_habitual: {
          dia_semana_preferido: diaFavorito,
          franja_horaria_preferida: franjaFavorita,
          especialista_favorita: especialistaFavorita,
          sede_habitual: sedeHabitual,
        },
        sugerencia_reserva: {
          ultimo_servicio_realizado: ultimaCita?.servicio || 'N/A',
          especialista_ultimo_servicio: ultimaCita?.especialista || 'N/A',
          fecha_ultimo_servicio: ultimaCita?.appointment_at || 'N/A',
        },
        evaluacion_mantenimiento: evaluacionMantenimiento,
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