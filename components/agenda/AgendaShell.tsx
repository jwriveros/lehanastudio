"use client";

import { useEffect, useState } from "react";

interface Props {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  agenda: React.ReactNode;
}

export default function AgendaShell({ header, sidebar, agenda }: Props) {
  const [sidebarWidth, setSidebarWidth] = useState(320);

  // 🔹 cargar ancho guardado
  useEffect(() => {
    const saved = localStorage.getItem("agenda_sidebar_width");
    if (saved) setSidebarWidth(Number(saved));
  }, []);

  // 🔹 guardar ancho
  useEffect(() => {
    localStorage.setItem("agenda_sidebar_width", String(sidebarWidth));
  }, [sidebarWidth]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* SIDEBAR */}
      <div
        className="relative shrink-0 flex flex-col min-h-0 border-r bg-white"
        style={{ width: sidebarWidth }}
      >
        {sidebar}

        {/* RESIZER */}
        <div
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize
                     bg-transparent hover:bg-indigo-200 transition"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = sidebarWidth;

            const onMove = (ev: MouseEvent) => {
              const next = Math.min(
                520,
                Math.max(260, startWidth + (ev.clientX - startX))
              );
              setSidebarWidth(next);
            };

            const onUp = () => {
              window.removeEventListener("mousemove", onMove);
              window.removeEventListener("mouseup", onUp);
            };

            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
          }}
        />
      </div>

      {/* MAIN */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b bg-white">
          {header}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {agenda}
        </div>
      </div>
    </div>
  );
}
