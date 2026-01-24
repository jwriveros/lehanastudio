// lib/availability.ts
import { supabase } from "./supabaseClient";

export async function isSpecialistAvailable(specialistName: string, dateToCheck: Date) {
  const dateStr = dateToCheck.toISOString().split('T')[0];
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const dayName = days[dateToCheck.getDay()];

  // 1. Obtener datos de la especialista (ID y Horario Base)
  const { data: user } = await supabase
    .from("app_users")
    .select("id, horario_semanal")
    .eq("name", specialistName)
    .single();

  if (!user) return false;

  // 2. REGLA DE ORO: Buscar primero en las excepciones (Overrides)
  const { data: override } = await supabase
    .from("specialist_overrides")
    .select("type")
    .eq("specialist_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();

  if (override) {
    // Si hay una excepción, manda lo que diga el campo 'type'
    return override.type === 'available';
  }

  // 3. Si no hay excepción, mirar el horario base JSON
  const scheduleBase = typeof user.horario_semanal === 'string' 
    ? JSON.parse(user.horario_semanal) 
    : user.horario_semanal;

  return scheduleBase?.[dayName]?.estado === 'abierto';
}