import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Error: GEMINI_API_KEY no está definida en .env.local");
      return NextResponse.json(
        { error: "La clave de API de Gemini no está configurada en el servidor." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "El mensaje es obligatorio." },
        { status: 400 }
      );
    }

    // 1. Obtener la data de la tabla appointments
    const { data: appointments, error: supabaseError } = await supabase
      .from("appointments")
      .select("cliente, servicio, especialista, appointment_at, estado, price_final, full_phone, survey, descuento")
      .order("appointment_at", { ascending: false })
      .limit(1000);

    if (supabaseError) {
      console.error("Error consultando Supabase:", supabaseError.message);
      return NextResponse.json(
        { error: "No se pudieron obtener las reservas para el análisis." },
        { status: 500 }
      );
    }

    // 2. Definir las instrucciones para la IA
    const systemInstruction = `
Eres la Inteligencia Artificial analista de negocios de Lehana Studio CRM.
Responde a las preguntas de la dueña del estudio analizando los datos reales de la tabla 'appointments' suministrados.

REGLAS:
- Analiza la información JSON de las citas para responder.
- Si te piden identificar clientes que no han vuelto a agendar entre un rango de fechas, examina el campo 'appointment_at' y muestra la lista de nombres y sus teléfonos ('full_phone').
- Si te preguntan por ingresos, servicios populares o cancelaciones, calcula los valores directamente de los datos.
- Responde siempre de forma amable, profesional y organizada con listas o viñetas.

DATOS DE LA TABLA APPOINTMENTS:
${JSON.stringify(appointments || [], null, 2)}
    `;

    // 🌸 3. Generar respuesta con el nombre de modelo compatible
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // 👈 Cambiado a gemini-2.5-flash
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const aiTextOutput = response.text || "No fue posible generar una respuesta analítica.";

    return NextResponse.json({ output: aiTextOutput });

  } catch (error: any) {
    console.error("Error en API Route de IA directa:", error);
    return NextResponse.json(
      { error: "Error procesando la solicitud con Gemini: " + error.message },
      { status: 500 }
    );
  }
}