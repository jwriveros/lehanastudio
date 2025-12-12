import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q || q.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    // Detectar si es búsqueda por número
    const isPhone = /^\d+$/.test(q);

    let query = supabase.from("clients").select(`
      nombre,
      celular,
      numberc
    `);

    if (isPhone) {
      // Buscar celular como string porque Supabase guarda números sin formato exacto
      query = query.or(`celular.eq.${q},numberc.ilike.%${q}%`);
    } else {
      // Buscar coincidencia parcial por nombre (ignora acentos en la DB)
      query = query.ilike("nombre", `%${q}%`);
    }

    const { data, error } = await query.limit(15);

    if (error) {
      console.error("Autocomplete clients error:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    const cleaned = data
      .filter((c) => c.nombre)
      .map((c) => ({
        nombre: c.nombre,
        celular: c.celular ? String(c.celular) : "",
        numberc: c.numberc || ""
      }))
      .filter((c, index, self) =>
        index === self.findIndex((x) => x.celular === c.celular)
      );

    return NextResponse.json(cleaned, { status: 200 });
  } catch (err: any) {
    console.error("Fatal error in autocomplete/clients:", err);
    return NextResponse.json(
      { error: "Fatal server error", details: err.message },
      { status: 500 }
    );
  }
}
