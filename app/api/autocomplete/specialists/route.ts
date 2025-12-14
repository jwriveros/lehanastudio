// app/api/autocomplete/specialists/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabase = await createSupabaseServerClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  // Evitar queries innecesarias
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("specialists")
    .select("id, name")
    .ilike("name", `%${q}%`)
    .order("name", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error fetching specialists:", error);
    // Respuesta segura y consistente
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}
