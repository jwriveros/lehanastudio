// lehanastudio/app/api/bookings/create/route.test.ts

import { POST } from './route';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

// Mockear el cliente de Supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn(),
    insert: jest.fn(),
    or: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  },
}));

// Mockear fetch
global.fetch = jest.fn();

describe('/api/bookings/create', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should create a booking with a warning if there is a time conflict', async () => {
    // Arrange
    const conflictingBooking = {
      appointment_at: '2025-12-20T10:00:00.000Z',
      duration: 60,
      specialist: 'fulana',
    };

    const newBookingPayload = {
      ...conflictingBooking,
      service: 'Corte de pelo',
      price: '50',
      cliente: 'Juan Perez',
      celular: '123456789',
      time: '10:00',
      location: 'Sucursal Principal',
    };

    // Mockear la respuesta de Supabase para la verificación de cliente
    (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    // Mockear la respuesta de Supabase para la inserción de cliente
    (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
    });
    
    // Mockear la respuesta de Supabase para la búsqueda de citas existentes
    (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [conflictingBooking], error: null }),
    });

    // Mockear la respuesta de Supabase para la inserción de la cita
    (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 123 }, error: null }),
    });

    // Mockear la respuesta de Supabase para la inserción de la solicitud de reserva
    (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ error: null }),
    });
    
    // Mockear la respuesta de fetch para n8n
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    const request = new Request('http://localhost/api/bookings/create', {
      method: 'POST',
      body: JSON.stringify(newBookingPayload),
    });

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body.created).toBe(true);
    expect(body.warning).toBe('La especialista ya tiene una reserva en este horario.');
  });
});
