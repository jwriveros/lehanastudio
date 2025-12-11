// app/api/bookings/create/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient"; 

// --- CAMBIO CLAVE: Cambiar el webhook a la ruta estructurada 'app' ---
// La URL es deducida de la URL anterior de 'crm-outgoing' y el path 'app' del JSON que proporcionaste.
const N8N_STRUCTURED_WEBHOOK_URL = "https://n8n.srv1151368.hstgr.cloud/webhook/app"; 

export async function POST(request: Request) {
  const payload = await request.json();

  if (!supabaseAdmin) {
    return NextResponse.json({ 
      error: "Error de Configuración: La clave SUPABASE_SERVICE_ROLE_KEY no está configurada."
    }, { status: 500 });
  }

  // Desestructuramos para obtener los datos necesarios y EXCLUIR campos que causan el error.
  // Extraemos service, specialist, price, date, time, location para el mensaje.
  const { duration, notes, notas, cliente, celular, appointment_at, service, specialist, price, date, time, location, ...restOfPayload } = payload; 

  // Objeto de datos limpios para insertar en appointments
  const appointmentPayload = {
      ...restOfPayload,
      cliente,
      celular,
      appointment_at,
      servicio: service, // Usamos 'service' del payload del formulario para 'servicio' en la DB
      especialista: specialist,
      price: Number(price), 
      is_paid: !!restOfPayload.is_paid,
      // NOTA: 'duration', 'notes', y 'notas' han sido excluidos del payload de appointments.
  };
  
  const normalizedCelular = String(celular).replace(/\D/g, '');


  try {
    // **********************************************
    // 1. LÓGICA DE CREACIÓN/VERIFICACIÓN DE CLIENTE
    // **********************************************
    
    // Buscar si el cliente ya existe por número de celular
    const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('nombre')
        .or(`celular.eq.${normalizedCelular},numberc.eq.${normalizedCelular}`)
        .limit(1)
        .maybeSingle(); 

    
    // Si el cliente NO existe, crearlo con valores por defecto
    if (!existingClient) {
        const newClientData = {
            nombre: cliente,
            celular: normalizedCelular,
            creado_desde: 'CRM_BOOKING',
            tipo: 'Contacto', 
            estado: 'Activo', 
        };

        const { error: clientInsertError } = await supabaseAdmin
            .from('clients')
            .insert([newClientData]);

        if (clientInsertError) {
             console.error(`DB WARNING: Client insertion failed for ${cliente}. Details:`, clientInsertError);
        }
    }


    // **********************************************
    // 2. LÓGICA DE CREACIÓN DE CITA
    // **********************************************
    
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

    // 3. Insertar el registro de la solicitud en 'booking_requests'
    await supabaseAdmin
      .from('booking_requests')
      .insert([{ 
          status: 'PENDING',
          created_at: appointment_at || new Date().toISOString(), 
          appointment_id: appointmentData.id,
          client_phone: normalizedCelular,
      }]);
    
    // **********************************************
    // 4. LÓGICA DE ENVÍO DE CONFIRMACIÓN POR WHATSAPP (ESTRUCTURADO)
    // **********************************************
    let whatsappStatus = "NOT_SENT";
    
    // Formatear la fecha para el mensaje (el n8n espera 'formattedDate' como solo la fecha)
    const apptDate = new Date(appointment_at);
    // Usamos 'es-ES' ya que el formato de fecha del Confirmar node es como '17 de Febrero de 2025'
    const dateStr = apptDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Construir el payload que coincide con lo que el n8n flow espera (acción: CREATE y campos de datos)
    const whatsappPayload = {
        action: "CREATE", // Clave para que el nodo Switch lo redirija a 'Confirmar'
        customerPhone: `+${normalizedCelular}`, 
        customerName: cliente,
        formattedDate: dateStr, // Requerido por el nodo Confirmar
        time: time,             // Requerido por el nodo Confirmar
        location: location,
        service: service,
        price: price,           
        appointmentId: appointmentData.id,
    };
    
    try {
        // Enviar el payload estructurado al nuevo webhook
        const n8nResponse = await fetch(N8N_STRUCTURED_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(whatsappPayload),
        });

        if (n8nResponse.ok) {
            whatsappStatus = "SENT_TO_N8N_OK";
        } else {
            const errorText = await n8nResponse.text();
            console.error(`Error de n8n al enviar WhatsApp: ${n8nResponse.status} - ${errorText}`);
            whatsappStatus = `N8N_ERROR: ${n8nResponse.status}`;
        }
    } catch (e) {
        console.error("Error de red al llamar a n8n para WhatsApp:", e);
        whatsappStatus = "NETWORK_ERROR";
    }

    // 5. Devolver la respuesta al cliente
    return NextResponse.json({
      created: true,
      status: "PENDING",
      message: "Reserva agendada y cliente verificado/creado con éxito.",
      whatsapp_status: whatsappStatus,
      appointment_id: appointmentData.id,
    });

  } catch (e: any) {
    console.error("API Processing Error:", e);
    return NextResponse.json({ error: "Internal server error.", details: e.message }, { status: 500 });
  }
}