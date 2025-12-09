import { Role } from "@/lib/mockData";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
};

export const roleMenus: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "#dashboard", label: "Dashboard", description: "KPIs y estado del día" },
    { href: "#clients", label: "Clientes", description: "Búsquedas y fichas" },
    { href: "#services", label: "Servicios", description: "Catálogo y precios" },
    { href: "#specialists", label: "Especialistas", description: "Roles y colores" },
    { href: "#chat", label: "Chat", description: "WhatsApp inbox" },
    { href: "#surveys", label: "Encuestas", description: "Satisfacción" },
    { href: "#settings", label: "Configuración" },
  ],
  SPECIALIST: [
    { href: "#clients", label: "Mis clientes" },
    { href: "#progress", label: "Progreso", description: "Evidencia y notas" },
    { href: "#chat", label: "WhatsApp", description: "Responde en vivo" },
    { href: "#surveys", label: "Encuestas" },
  ],
  STAFF: [
    { href: "#dashboard", label: "Dashboard" },
    { href: "#chat", label: "Chat" },
  ],
};
