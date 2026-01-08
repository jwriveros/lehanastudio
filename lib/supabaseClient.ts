import { createClient } from "@supabase/supabase-js";

// Variables cargadas desde .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1. Cliente Público (Navegador y Servidor)
// Se usa para autenticación y RLS estándar
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 2. Cliente de Administrador (SOLO SERVIDOR)
 * Usamos una función o una validación para que el navegador no falle.
 */
export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey) 
  : null;

// Log de depuración solo en el servidor para confirmar que la clave cargó
if (typeof window === 'undefined' && !serviceRoleKey) {
  console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY no detectada en el servidor.");
}