import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("services")
    .select(`"SKU","Servicio","Precio","duracion"`)
    .ilike("Servicio", `%${q}%`)
    .order("Servicio", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}
