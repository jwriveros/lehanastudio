import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  const { searchParams } = new URL(request.url);
  const qRaw = searchParams.get("q")?.trim() ?? "";

  // Evitar queries innecesarias
  if (!qRaw || qRaw.length < 2) {
    return NextResponse.json([]);
  }

  // Si viene número, buscamos en numberc (text con +) por "contiene"
  const onlyDigits = qRaw.replace(/[^\d]/g, "");
  const isNumeric = onlyDigits.length >= 2;

  let query = supabase
    .from("clients")
    .select("nombre, celular, numberc, indicador")
    .order("nombre", { ascending: true })
    .limit(10);

  if (isNumeric) {
    // numberc = "+<indicador><celular>", así que con contiene por dígitos funciona
    query = query.ilike("numberc", `%${onlyDigits}%`);
  } else {
    query = query.ilike("nombre", `%${qRaw}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}
