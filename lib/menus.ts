import { Role } from "./mockData";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
};

export const roleMenus: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "#dashboard", label: "Dashboard", description: "KPIs y estado del día" },
    { href: "#agenda", label: "Agenda", description: "Calendario semanal" },
    { href: "#clients", label: "Clientes", description: "Búsquedas y fichas" },
    { href: "#services", label: "Servicios", description: "Catálogo y precios" },
    { href: "#specialists", label: "Especialistas", description: "Roles y colores" },
    { href: "#chat", label: "Chat", description: "WhatsApp inbox" },
    { href: "#surveys", label: "Encuestas", description: "Satisfacción" },
    { href: "#settings", label: "Configuración" },
  ],
  SPECIALIST: [
    { href: "#agenda", label: "Agenda", description: "Tu calendario" },
    { href: "#clients", label: "Mis clientes" },
    { href: "#progress", label: "Progreso", description: "Evidencia y notas" },
    { href: "#chat", label: "WhatsApp", description: "Responde en vivo" },
    { href: "#surveys", label: "Encuestas" },
  ],
  STAFF: [
    { href: "#dashboard", label: "Dashboard" },
    { href: "#agenda", label: "Agenda" },
    { href: "#chat", label: "Chat" },
  ],
};
