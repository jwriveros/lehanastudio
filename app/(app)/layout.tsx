// jwriveros/lehanastudio/lehanastudio-910f6b2f23845520141757de8a19232a7486021d/app/(app)/layout.tsx (Ajuste para fusión)

"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "@/components";
import { navByRole, NAV_ITEMS } from "@/lib/nav";
import { useSessionStore, type Role } from "@/lib/sessionStore";
import { supabase } from "@/lib/supabaseClient";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, setUser } = useSessionStore();
  const [isChecking, setIsChecking] = useState(true);

  // Lógica de restauración de sesión (omito por brevedad, el código es el mismo)
  useEffect(() => {
    // ... (Código de useEffect)
    const checkSession = async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();

      if (authSession?.user?.email) {
        const { data: userData } = await supabase
          .from("app_users")
          .select("*")
          .eq("email", authSession.user.email)
          .single();

        if (userData) {
          const resolvedRole: Role = (userData.role as Role) || "ESPECIALISTA";

          setUser({
            id: authSession.user.id,
            email: userData.email,
            name: userData.name,
            role: resolvedRole,
            color: userData.color,
          });
        }
      }

      setIsChecking(false);
    };

    if (!session) checkSession();
    else setIsChecking(false);
  }, [session, setUser]);
  
  useEffect(() => {
    if (!isChecking && !session) router.replace("/");
  }, [isChecking, session, router]);
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">
        Cargando...
      </div>
    );
  }

  if (!session) return null;

  const currentRole = session.role;
  const navItems =
    navByRole[currentRole as keyof typeof navByRole] || navByRole.ADMIN;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-black">

      
      {/* HEADER MINIMALISTA FUSIONADO */}
      {/* CAMBIO 1: Usamos 'h-16' para dar espacio a la fila única, y justify-between para distribuir los elementos. */}
      {/* Usamos flex items-center para centrar verticalmente en la fila. */}
      <header className="h-16 w-full flex items-center justify-between px-4 border-b bg-white dark:bg-zinc-900">
        
        {/* Lado Izquierdo (Logo/Título) */}
        <div className="font-semibold text-lg flex-shrink-0">Lehana Studio</div>
        
        {/* Centro (Menú de Navegación) */}
        {/* CAMBIO 2: Colocamos el BottomNav en el centro. Le pasamos una clase de flex-1 para que ocupe el espacio central. */}
        <div className="flex-1 max-w-xl mx-auto flex justify-center h-full">
            <BottomNav currentPath={pathname} items={navItems} />
        </div>
        
        {/* Lado Derecho (Usuario y Cierre de Sesión) */}
        <div className="flex items-center gap-4 text-sm flex-shrink-0">
          <span className="text-zinc-600 dark:text-zinc-300">{session.name || session.role}</span>
          <button
            className="text-red-500 hover:underline"
            onClick={() => {
              supabase.auth.signOut();
              useSessionStore.getState().logout();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* MENÚ INFERIOR (Eliminado) */}
      {/* El menú inferior se elimina completamente si se fusiona con el header */}
    </div>
  );
}