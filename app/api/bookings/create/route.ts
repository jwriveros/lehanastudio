import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();

  return NextResponse.json({
    created: true,
    status: "PENDING",
    message: "Booking request recibida y pendiente de confirmación",
    payload,
    instructions:
      "Inserta en booking_requests y crea un borrador en appointments. Dispara notificación a especialista y webhook n8n.",
  });
}
