import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();

  return NextResponse.json({
    updated: true,
    status: payload?.status ?? "CONFIRMED",
    message: "Cita actualizada con nuevo estado",
    instructions:
      "Actualiza appointments.estado y marca is_paid cuando corresponda. Envía recordatorios 24h/4h vía n8n webhook.",
  });
}
