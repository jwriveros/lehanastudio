import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const secret = process.env.METABASE_SECRET_KEY;
    
    if (!secret) {
      return NextResponse.json({ error: "Falta METABASE_SECRET_KEY en el servidor" }, { status: 500 });
    }

    const payload = {
      resource: { dashboard: 2 }, // El ID de tu dashboard en Metabase
      params: {},
      exp: Math.round(Date.now() / 1000) + (60 * 10) // Expira en 10 minutos
    };

    const token = jwt.sign(payload, secret);

    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: "Error generando el token" }, { status: 500 });
  }
}