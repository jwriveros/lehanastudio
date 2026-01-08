"use client";
import { useSessionStore } from "@/lib/sessionStore";

export default function InicioPage() {
  const { session } = useSessionStore();
  
  console.log("[Inicio] Datos de sesión en Store:", session);

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold">Bienvenido, {session?.name || 'Usuario'}</h1>
      <p className="text-zinc-500 mt-2">Rol: {session?.role}</p>
      <div className="mt-10 p-4 bg-emerald-50 text-emerald-700 rounded-xl inline-block">
        Sesión validada correctamente.
      </div>
    </div>
  );
}