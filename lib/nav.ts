import type { Role } from "./mockData";

export type NavItem = {
  id: "support" | "agenda" | "business" | "dashboard" | "settings";
  label: string;
  emoji: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "support", label: "Soporte", emoji: "💬", href: "/support" },
  { id: "agenda", label: "Agenda", emoji: "📅", href: "/agenda" },
  { id: "business", label: "Mi negocio", emoji: "🏢", href: "/business" },
  { id: "dashboard", label: "Dashboard", emoji: "📊", href: "/dashboard" },
  { id: "settings", label: "Ajustes", emoji: "⚙️", href: "/settings" },
];

export const navByRole: Record<Role, NavItem[]> = {
  ADMIN: NAV_ITEMS,
  SPECIALIST: NAV_ITEMS.filter((item) => ["support", "agenda"].includes(item.id)),
  STAFF: NAV_ITEMS.filter((item) => ["support", "agenda", "dashboard"].includes(item.id)),
};
