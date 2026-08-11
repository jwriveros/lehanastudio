"use client";

// 1. Definimos únicamente las propiedades que realmente necesitamos
interface Props {
  header: React.ReactNode;
  agenda: React.ReactNode;
}

export default function AgendaShell({
  header,
  agenda,
}: Props) {
  return (
    // 2. Contenedor principal: Ocupa toda la pantalla y organiza los elementos en columna
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      
      {/* --- Encabezado --- */}
      <header className="shrink-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {header}
      </header>
      
      {/* --- Contenido Principal (Calendario) --- */}
      {/* flex-1 permite que esta sección tome todo el espacio vertical sobrante */}
      <main className="flex-1 overflow-auto">
        {agenda}
      </main>
      
    </div>
  );
}