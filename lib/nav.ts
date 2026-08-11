// lib/nav.ts
import type { Role } from "./sessionStore";

export type NavItem = {
  id: "business" | "dashboard" | "settings" | "agenda";
  label: string;
  emoji: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "business", label: "Mi negocio", emoji: "🏢", href: "/business" },
  { id: "dashboard", label: "Dashboard", emoji: "📊", href: "/dashboard" },
  { id: "agenda", label: "Agenda", emoji: "🗓️", href: "/agenda" },
  { id: "settings", label: "Ajustes", emoji: "⚙️", href: "/settings" },
];

export const navByRole: Record<Role, NavItem[]> = {
  ADMIN: NAV_ITEMS,
  ESPECIALISTA: NAV_ITEMS.filter((item) =>
    ["dashboard", "agenda"].includes(item.id)
  ),
};
