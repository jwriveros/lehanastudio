import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  // ✅ OBLIGATORIO: await
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from("services")
      .select("Servicio, SKU, Precio, duracion, category")
      .ilike("Servicio", `%${query}%`)
      .order("Servicio", { ascending: true });

    if (error) {
      console.error("Error fetching services:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
