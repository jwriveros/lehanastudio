import { supabase } from "@/lib/supabaseClient";
import { ChatPanel, ChatUser, ChatStatus } from "@/components/ChatPanel";
import { normalizePhone, getSenderRole } from "@/lib/chatUtils";

export default async function SupportPage() {
  // 1. Clientes
  const { data: clientsData, error: clientsError } = await supabase
    .from("clients")
    .select("nombre, nombre_comercial, numberc, celular, telefono");

  if (clientsError) {
    console.error("Error cargando clients:", clientsError);
  }

  const clientCache = new Map<string, string>();

  if (clientsData) {
    clientsData.forEach((c: any) => {
      const rawPhone = c.numberc ?? c.celular ?? c.telefono ?? null;
      const phone = normalizePhone(rawPhone);
      if (!phone) return;

      const nombre: string = c.nombre || c.nombre_comercial || "";
      if (nombre) {
        clientCache.set(phone, nombre);
      }
    });
  }

  // 2. Mensajes para construir hilos (solo necesitamos los más recientes)
  const { data: messagesData, error: messagesError } = await supabase
    .from("mensajes")
    .select("client_phone, content, message, created_at, sender_role")
    .order("created_at", { ascending: false });

  if (messagesError) {
    console.error("Error cargando mensajes:", messagesError);
  }

  // 3. Obtener sesiones de chat (fuente de verdad del estado)
  const { data: sessions, error: sessionsError } = await supabase
    .from("chat_sessions")
    .select("*");

  if (sessionsError) console.error("Error cargando sesiones:", sessionsError);

  // Convertir en map para acceso rápido:
  const sessionMap = new Map<string, any>();
  const threadsMap = new Map<string, ChatUser>(); // Usaremos este mapa para construir la lista final

  if (sessions) {
    sessions.forEach((s) => {
      const phoneNorm = normalizePhone(s.client_phone);
      if (!phoneNorm) return;
      
      sessionMap.set(phoneNorm, s); 

      const realStatus = s.status as ChatStatus;

      // CORRECCIÓN CLAVE: Inicializamos el hilo con data de la sesión (status, cliente)
      if (realStatus !== 'resolved') {
         const clientName = clientCache.get(phoneNorm) || clientCache.get(phoneNorm.slice(-10));
         const finalName = clientName && clientName.length > 0 ? clientName : `+${phoneNorm}`;
         
         threadsMap.set(phoneNorm, {
            id: phoneNorm,
            cliente: finalName,
            phone: phoneNorm,
            lastMessage: s.last_menu_sent || "Esperando mensaje...", 
            lastActivity: s.updated_at, 
            unread: 0, 
            status: realStatus, 
         });
      }
    });
  }

  // 4. Recorrer los mensajes para ENRIQUECER los hilos y agregar nuevos si es necesario
  if (messagesData) {
    messagesData.forEach((m: any) => {
      const phoneNorm = normalizePhone(m.client_phone);
      if (!phoneNorm) return;

      const session = sessionMap.get(phoneNorm);
      const realStatus = session?.status as ChatStatus || "active" as ChatStatus;
      const isClientMsg = getSenderRole(m) === "client";
      
      if (realStatus === 'resolved') return;

      // Si el hilo ya existe (lo agregamos desde sessions)
      if (threadsMap.has(phoneNorm)) {
        const existing = threadsMap.get(phoneNorm)!;
        
        // Aseguramos que la última actividad y mensaje sea del mensaje más reciente
        // Usamos m.created_at ya que messagesData está ordenado descendente
        if (m.created_at > existing.lastActivity) {
            existing.lastMessage = m.content || m.message || "";
            existing.lastActivity = m.created_at;
            // Si el último mensaje es del cliente, marcamos como 1 no leído (luego Realtime lo acumula)
            existing.unread = isClientMsg ? 1 : 0; 
        }

      } else {
        // Si el hilo no existe (es un hilo muy nuevo sin sesión o que el default debe ser 'active')
        const clientName = clientCache.get(phoneNorm) || clientCache.get(phoneNorm.slice(-10));
        const finalName = clientName && clientName.length > 0 ? clientName : `+${phoneNorm}`;

        threadsMap.set(phoneNorm, {
            id: phoneNorm,
            cliente: finalName,
            phone: phoneNorm,
            lastMessage: m.content || m.message || "",
            lastActivity: m.created_at,
            unread: isClientMsg ? 1 : 0,
            status: realStatus, 
        });
      }
    });
  }

  const initialThreads = Array.from(threadsMap.values()).sort((a, b) =>
    a.lastActivity > b.lastActivity ? -1 : 1
  );

  return (
    <section className="relative h-full overflow-hidden bg-white flex flex-col">
      <div className="w-full flex-1 min-h-0">
        <ChatPanel initialThreads={initialThreads} />
      </div>
    </section>
  );
}

