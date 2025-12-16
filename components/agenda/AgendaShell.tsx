"use client";
interface Props {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  agenda: React.ReactNode;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}
export default function AgendaShell({
  header,
  sidebar,
  agenda,
  sidebarCollapsed,
  onToggleSidebar,
}: Props) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      {/* --- Sidebar (Desktop) --- */}
      <aside
        className={`hidden h-full flex-shrink-0 flex-col bg-white transition-all duration-300 ease-in-out dark:bg-gray-900 lg:flex ${
          sidebarCollapsed ? "w-0" : "w-[320px] border-r border-gray-200 dark:border-gray-800"
        }`}
      >
        {sidebar}
      </aside>
      {/* --- Sidebar (Mobile) --- */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-in-out lg:hidden ${
          sidebarCollapsed
            ? "pointer-events-none opacity-0"
            : "opacity-100"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onToggleSidebar}
        />
        <aside className="relative flex h-full w-4/5 max-w-[320px] flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {sidebar}
        </aside>
      </div>
      {/* --- Main Content --- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {header}
        </header>
        <main className="flex-1 overflow-auto">{agenda}</main>
      </div>
    </div>
  );
}