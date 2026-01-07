import { supabase } from "@/lib/supabaseClient";
import { ChatPanel, ChatUser, ChatStatus } from "@/components/ChatPanel";
import { normalizePhone, getSenderRole } from "@/lib/chatUtils";

export default async function SupportPage() {
  // 1. Obtener sesiones de chat (ÚNICA FUENTE DE VERDAD PARA EL CONTEO)
  // Filtramos aquí para que 'initialThreads' solo contenga lo que NO está resuelto
  const { data: sessions, error: sessionsError } = await supabase
    .from("chat_sessions")
    .select("*")
    .neq("status", "resolved"); // <--- ESTO ASEGURA QUE SEAN 85 Y NO 93

  if (sessionsError) console.error("Error cargando sesiones:", sessionsError);

  if (!sessions || sessions.length === 0) {
    return (
      <section className="relative h-full overflow-hidden bg-white flex flex-col">
        <ChatPanel initialThreads={[]} />
      </section>
    );
  }

  // 2. Obtener Clientes para los nombres
  const { data: clientsData } = await supabase
    .from("clients")
    .select("nombre, nombre_comercial, numberc, celular, telefono");

  const clientCache = new Map<string, string>();
  clientsData?.forEach((c: any) => {
    const phone = normalizePhone(c.numberc ?? c.celular ?? c.telefono);
    if (phone) clientCache.set(phone, c.nombre || c.nombre_comercial || "");
  });

  // 3. Construir los hilos BASADOS ÚNICAMENTE EN LAS SESIONES ACTIVAS
  const initialThreads: ChatUser[] = sessions.map((s) => {
    const phoneNorm = normalizePhone(s.client_phone) || s.client_phone;
    
    // Prioridad de nombre: 1. Tabla Clientes, 2. Nombre en Sesión, 3. Teléfono
    const clientName = clientCache.get(phoneNorm) || s.client_name;
    const finalName = clientName && clientName.length > 0 ? clientName : `+${phoneNorm}`;

    return {
      id: phoneNorm,
      cliente: finalName,
      phone: phoneNorm,
      lastMessage: s.last_message || "Esperando mensaje...", 
      lastActivity: s.updated_at, 
      unread: s.unread_count || 0, 
      status: s.status as ChatStatus, 
    };
  });

  // Ordenar por actividad más reciente
  initialThreads.sort((a, b) => (a.lastActivity > b.lastActivity ? -1 : 1));

  return (
    <section className="relative h-full overflow-hidden bg-white flex flex-col">
      <div className="w-full flex-1 min-h-0">
        <ChatPanel initialThreads={initialThreads} />
      </div>
    </section>
  );
}