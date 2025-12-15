"use client";

import { useState } from "react";

interface Props {
  header: (
    toggleSidebar: () => void,
    collapsed: boolean
  ) => React.ReactNode;

  sidebar: (collapsed: boolean) => React.ReactNode;

  agenda: React.ReactNode;
}

export default function AgendaShell({ header, sidebar, agenda }: Props) {
  /* ==================================================
     ESTADO ÚNICO DE COLAPSO
  ================================================== */
  const [collapsed, setCollapsed] = useState(false); // inicia expandido

  const toggleSidebar = () => {
    setCollapsed((v) => !v);
  };

  const sidebarWidth = collapsed ? 60 : 320;

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* SIDEBAR DERECHO */}
      <div
        className="relative shrink-0 flex flex-col min-h-0 border-r bg-white
                   transition-[width] duration-200 ease-in-out"
        style={{ width: sidebarWidth }}
      >
        {sidebar(collapsed)}
      </div>

      {/* MAIN */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* HEADER */}
        <div className="shrink-0 border-b bg-white">
          {header(toggleSidebar, collapsed)}
        </div>

        {/* AGENDA */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {agenda}
        </div>
      </div>
    </div>
  );
}
