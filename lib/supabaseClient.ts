// jwriveros/lehanastudio/lehanastudio-a8a570c007a1557a6ccd13baa5a39a3fe79a534a/lib/supabaseClient.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js"; // Importamos SupabaseClient type

// 1. Cliente Público (Para el navegador)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cliente de Supabase para las rutas de la API de Next.js (Server-Side).
 * Usa la Service Role Key para operaciones con RLS deshabilitado o de alto privilegio.
 */
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 2. Cliente de Administrador (Para las rutas de API)
let adminClient: SupabaseClient | null = null; // Inicializamos como null

if (serviceRoleKey && supabaseUrl) {
    adminClient = createClient(supabaseUrl, serviceRoleKey);
} else {
    // Esto lo vemos solo en el server (rutas /api), no en el navegador
    console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. API routes requiring elevated privileges will fail.");
}

export const supabaseAdmin = adminClient;