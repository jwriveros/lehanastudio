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
  { id: "settings", label: "Ajustes", emoji: "⚙️", href: "/settings" },
];

export const navByRole: Record<Role, NavItem[]> = {
  ADMIN: NAV_ITEMS,
  SPECIALIST: NAV_ITEMS.filter((item) => item.id === "support"),
  STAFF: NAV_ITEMS.filter((item) => ["support", "dashboard"].includes(item.id)),
};
