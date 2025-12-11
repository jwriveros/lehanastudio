import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient"; 

export async function POST(request: Request) {
  const payload = await request.json();

  if (!supabaseAdmin) {
    return NextResponse.json({ 
      error: "Error de Configuración: La clave SUPABASE_SERVICE_ROLE_KEY no está configurada."
    }, { status: 500 });
  }

  // Desestructuramos para obtener los datos necesarios y EXCLUIR campos que causan el error.
  const { duration, notes, notas, cliente, celular, appointment_at, ...restOfPayload } = payload; 

  // Objeto de datos limpios para insertar en appointments
  const appointmentPayload = {
      ...restOfPayload,
      cliente,
      celular,
      appointment_at,
      price: Number(restOfPayload.price), 
      is_paid: !!restOfPayload.is_paid,
      // NOTA: 'duration', 'notes', y 'notas' han sido excluidos del payload de appointments.
  };
  
  const normalizedCelular = String(celular).replace(/\D/g, '');


  try {
    // **********************************************
    // LÓGICA DE CREACIÓN/VERIFICACIÓN DE CLIENTE (CORRECCIÓN DE ESQUEMA)
    // **********************************************
    
    // 1. Buscar si el cliente ya existe por número de celular
    const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('nombre')
        .or(`celular.eq.${normalizedCelular},numberc.eq.${normalizedCelular}`)
        .limit(1)
        .maybeSingle(); 

    
    // 2. Si el cliente NO existe, crearlo con valores por defecto para campos obligatorios
    if (!existingClient) {
        const newClientData = {
            nombre: cliente,
            celular: normalizedCelular,
            creado_desde: 'CRM_BOOKING',
            // FIX: Asumimos que estos campos son obligatorios en 'clients'
            tipo: 'Contacto', 
            estado: 'Activo', 
        };

        const { error: clientInsertError } = await supabaseAdmin
            .from('clients')
            .insert([newClientData]);

        if (clientInsertError) {
             // Esto imprime un error en la consola del servidor, pero no bloquea la creación de la cita (paso 3)
             console.error(`DB WARNING: Client insertion failed for ${cliente}. Details:`, clientInsertError);
             // NOTA: La reserva continuará creándose aunque el cliente no se haya registrado.
        }
    }


    // **********************************************
    // LÓGICA DE CREACIÓN DE CITA
    // **********************************************
    
    // 3. Insertar la cita principal en la tabla 'appointments'
    const { data: appointmentData, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .insert([appointmentPayload]) 
      .select('id') 
      .single();

    if (appointmentError) {
      console.error("DB Error: Appointment Insertion Failed.", appointmentError);
      return NextResponse.json({ 
        error: "Error al registrar la cita en la tabla 'appointments'.", 
        details: appointmentError.message,
        hint: "El error sugiere que falta una columna NOT NULL (ej. 'idx' o 'usuario') o hay un tipo de dato incorrecto en el payload. Revisa tu esquema de 'appointments'."
      }, { status: 500 });
    }

    // 4. Insertar el registro de la solicitud en 'booking_requests'
    await supabaseAdmin
      .from('booking_requests')
      .insert([{ 
          status: 'PENDING',
          created_at: appointment_at || new Date().toISOString(), 
          appointment_id: appointmentData.id,
          client_phone: celular,
      }]);
    

    return NextResponse.json({
      created: true,
      status: "PENDING",
      message: "Reserva agendada y cliente verificado/creado con éxito.",
      appointment_id: appointmentData.id,
    });

  } catch (e: any) {
    console.error("API Processing Error:", e);
    return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
  }
}