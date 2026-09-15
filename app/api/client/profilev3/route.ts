import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// 1. Definición de tipos para las tablas de la base de datos
interface Appointment {
  id: number;
  cliente: string | null;
  servicio: string | null;
  especialista: string | null;
  celular: string | null;
  appointment_at: string | null;
  estado: string;
  price_final: string | number | null;
  full_phone: string | null;
  bsuid: string | null;
  [key: string]: unknown;
}

interface Payment {
  id: string;
  created_at: string;
  full_phone: string;
  amount_extracted: string | number | null;
  appointment_ids: string[] | null;
  status: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parámetros de búsqueda requeridos
  const queryPhone = searchParams.get('phone');
  const queryBsuid = searchParams.get('bsuid');

  if (!queryPhone && !queryBsuid) {
    return NextResponse.json(
      { error: 'Se requiere el parámetro "phone" o "bsuid"' },
      { status: 400 }
    );
  }

  // 2. Normalización de formato de teléfono
  let cleanPhone = '';
  let fullPhone = '';

  if (queryPhone) {
    cleanPhone = queryPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('57') && cleanPhone.length > 10) {
      cleanPhone = cleanPhone.substring(2);
    }
    fullPhone = `+57${cleanPhone}`;
  }

  // 3. Consulta de citas a la tabla 'appointments'
  let appointmentsQuery = supabase.from('appointments').select('*');

  if (queryBsuid) {
    appointmentsQuery = appointmentsQuery.eq('bsuid', queryBsuid);
  } else {
    appointmentsQuery = appointmentsQuery.or(
      `full_phone.eq.${fullPhone},celular.eq.${cleanPhone}`
    );
  }

  const { data: appointmentsData, error: appError } = await appointmentsQuery;

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 });
  }

  const appointments: Appointment[] = appointmentsData || [];

  if (appointments.length === 0) {
    return NextResponse.json({
      cliente: null,
      citas_activas: [],
      historial_citas: [],
      pagos: []
    });
  }

  // 4. Consulta de pagos asociados a la tabla 'payments'
  const phoneToSearch = appointments[0]?.full_phone || fullPhone;
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('*')
    .eq('full_phone', phoneToSearch);

  const payments: Payment[] = paymentsData || [];

  // 5. Procesamiento de citas (mismo día y futuras)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const citasActivas = appointments
    .filter((app: Appointment) => {
      return app.appointment_at && app.appointment_at >= todayStart;
    })
    .map((app: Appointment) => {
      const esGestionable = ['Nueva reserva creada', 'Cita confirmada'].includes(app.estado);

      // Cálculo de pagos/abonos realizados
      const abonosApp = payments
        .filter((p: Payment) => p.appointment_ids && p.appointment_ids.includes(String(app.id)))
        .reduce((acc: number, p: Payment) => acc + (Number(p.amount_extracted) || 0), 0);

      const precioFinal = Number(app.price_final) || 0;
      const saldoPendiente = Math.max(0, precioFinal - abonosApp);

      return {
        ...app,
        es_cancelable: esGestionable,
        es_modificable: esGestionable,
        total_abonado: abonosApp,
        saldo_pendiente: saldoPendiente
      };
    });

  // Citas pasadas o canceladas
  const historialCitas = appointments.filter((app: Appointment) => {
    return !app.appointment_at || app.appointment_at < todayStart || app.estado === 'Cita cancelada';
  });

  // Información básica del cliente
  const clienteInfo = {
    nombre: appointments[0]?.cliente || 'Cliente',
    celular: appointments[0]?.celular,
    full_phone: appointments[0]?.full_phone,
    bsuid: appointments[0]?.bsuid
  };

  return NextResponse.json({
    cliente: clienteInfo,
    citas_activas: citasActivas,
    historial_citas: historialCitas,
    pagos: payments
  });
}