"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  role: Role;
  onRoleChange: (role: Role) => void;
};

export function Sidebar({ role, onRoleChange }: Props) {
  const menu = roleMenus[role];
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`rounded-3xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900/80 ${open ? "w-64" : "w-16"}`}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-zinc-900 dark:text-zinc-50">Lizto CRM</div>
        <button
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
          onClick={() => setOpen((v) => !v)}
          aria-label="alternar barra"
        >
          {open ? "⏴" : "⏵"}
        </button>
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Rol activo</div>
        <div className="flex flex-wrap gap-2">
          {sampleUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => onRoleChange(user.role)}
              className={`flex-1 rounded-full border px-3 py-2 text-left text-xs transition ${
                user.role === role
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-zinc-200 hover:border-indigo-200"
              }`}
            >
              <div className="font-semibold">{user.role}</div>
              <div className="text-[11px] text-zinc-500">{user.name}</div>
            </button>
          ))}
        </div>
      </div>

      <nav className="mt-6 space-y-1 text-sm">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-zinc-700 transition hover:bg-indigo-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <div>
              <div className="font-medium">{item.label}</div>
              {item.description ? (
                <div className="text-[11px] text-zinc-500">{item.description}</div>
              ) : null}
            </div>
            <span className="text-xs text-zinc-400">→</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
