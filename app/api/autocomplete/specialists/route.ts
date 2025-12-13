import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient(); // ✅ await aquí

  const { data, error } = await supabase
    .from("app_users")
    .select("id, name, color")
    .or("role.eq.ESPECIALISTA")
    .order("name");

  if (error) {
    console.error("Error fetching specialists:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? []);
}
