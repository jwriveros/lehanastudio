"use client";

interface Props {
  header: (toggleSidebar: () => void, collapsed: boolean) => React.ReactNode;
  sidebar: (collapsed: boolean) => React.ReactNode;
  agenda: React.ReactNode;
  collapsed: boolean;
  toggleSidebar: () => void;
}

export default function AgendaShell({
  header,
  sidebar,
  agenda,
  collapsed,
  toggleSidebar,
}: Props) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 relative">
      {/* SIDEBAR */}
      <aside
        className={`
          flex-shrink-0 bg-white z-40 h-full
          transition-[width,margin] duration-300 ease-in-out
          /* Desktop: relative para empujar | Móvil: fixed para flotar */
          fixed md:relative 
          ${
            collapsed
              ? "w-0 overflow-hidden opacity-0 border-none"
              : "w-[85%] md:w-[320px] opacity-100 visible shadow-lg md:shadow-none md:border-r md:border-slate-100"
          }
        `}
      >
        {/* Contenedor interno con ancho bloqueado para que el contenido 
            no se deforme mientras el padre (aside) se encoge a 0 */}
        <div className="w-[320px] h-full flex flex-col overflow-hidden">
          {sidebar(collapsed)}
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL (Agenda) */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden h-full">
        <header className="shrink-0 border-b border-slate-100 bg-white z-30">
          {header(toggleSidebar, collapsed)}
        </header>

        {/* El flex-1 aquí hará que el main se estire automáticamente 
            cuando el aside de arriba pase a medir w-0 */}
        <main className="flex-1 min-h-0 overflow-hidden relative bg-slate-50">
          {agenda}
        </main>
      </div>

      {/* Overlay para móvil */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/10 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}