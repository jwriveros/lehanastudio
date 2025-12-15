import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    // si quieres que muestre todos con 1 letra, deja esto así.
    // si quieres mínimo 2 letras, cambia a < 2
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("id,name,role,color")
    .in("role", ["ESPECIALISTA", "SPECIALIST"])
    .ilike("name", `%${q}%`)
    .order("name", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error fetching specialists:", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}
