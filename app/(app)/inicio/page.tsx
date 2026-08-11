import React from "react";
// Importamos el componente de tarjetas de resumen
import DashboardCards from "@/components/DashboardCards";
// Importamos el package.json para leer la versión de la aplicación
import packageJson from "../../../package.json";

export default function InicioPage() {
  // Extraemos la versión del archivo
  const appVersion = packageJson.version;

  return (
    // Agregamos "flex" y "flex-col" al contenedor principal para poder empujar el footer hacia abajo
    <div className="min-h-[100dvh] flex flex-col bg-gray-50 p-8 dark:bg-gray-900 text-gray-900 dark:text-white">
      
      {/* Contenedor del contenido principal. "flex-1" hace que ocupe todo el espacio sobrante */}
      <div className="flex-1">
        {/* Sección de Bienvenida */}
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold">
            Bienvenido, Admin
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rol: ADMIN | Sesión validada correctamente.
          </p>
        </div>

        {/* Contenido principal del Dashboard */}
        <main className="flex flex-col gap-6">
          <section>
            <DashboardCards />
          </section>
          
          <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
            <h2 className="mb-4 text-xl font-semibold">Resumen de hoy</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Ve a la pestaña de <a href="/agenda" className="text-indigo-500 hover:underline font-medium">Agenda</a> para ver y gestionar todas tus citas.
            </p>
          </section>
        </main>
      </div>

      {/* Footer con la versión de la aplicación */}
      <footer className="mt-12 text-center text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wider">
        v{appVersion}
      </footer>
      
    </div>
  );
}