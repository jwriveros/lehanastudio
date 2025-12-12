import type { Role } from "./mockData";

export type NavItem = {
  id: "support" | "business" | "dashboard" | "settings";
  label: string;
  emoji: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "support", label: "Soporte", emoji: "💬", href: "/support" },
  { id: "business", label: "Mi negocio", emoji: "🏢", href: "/business" },
  { id: "dashboard", label: "Dashboard", emoji: "📊", href: "/dashboard" },
  { id: "agenda", label: "Agenda", emoji: "🗓️", href: "/agenda" }, // Added Agenda item
  { id: "settings", label: "Ajustes", emoji: "⚙️", href: "/settings" },
];

export const navByRole = {
    ADMIN: NAV_ITEMS, // El administrador ve todo
    ESPECIALISTA: [ // Rutas para especialistas
        NAV_ITEMS.find(item => item.href === '/dashboard')!,
        NAV_ITEMS.find(item => item.href === '/agenda')!,
        NAV_ITEMS.find(item => item.href === '/support')!,
        // ... (otras rutas que quieras)
    ],
    STAFF: NAV_ITEMS.filter((item) => ["support", "dashboard"].includes(item.id)),
  }