// jwriveros/lehanastudio/lehanastudio-a2625e82f4ecf3eda68513f691355d3accd1f4cd/app/(app)/layout.tsx

"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "@/components";
import { navByRole, NAV_ITEMS } from "@/lib/nav";
import { useSessionStore, type Role } from "@/lib/sessionStore";
import { supabase } from "@/lib/supabaseClient";

// ... (Código inicial se mantiene igual) ...

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, setUser } = useSessionStore();
  const [isChecking, setIsChecking] = useState(true);

  // 1. Restaurar sesión al recargar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();

      if (authSession?.user?.email) {
        // Buscar datos del usuario en la base de datos
        const { data: userData } = await supabase
          .from('app_users')
          .select('*')
          .eq('email', authSession.user.email)
          .single();
        
        if (userData) {
          // CORRECCIÓN: Mapear el rol a un tipo válido conocido o usar 'ESPECIALISTA' como fallback en caso de duda
          const resolvedRole: Role = (userData.role as Role) || "ESPECIALISTA";
          
          setUser({
            id: authSession.user.id,
            email: userData.email,
            name: userData.name,
            role: resolvedRole,
            color: userData.color
          });
        }
      }
      setIsChecking(false);
    };

    if (!session) {
        checkSession();
    } else {
        setIsChecking(false);
    }
  }, [session, setUser]);

  // 2. Redirigir si no hay sesión
  useEffect(() => {
    if (!isChecking && !session) {
      router.replace("/");
    }
  }, [isChecking, session, router]);

  if (isChecking) {
      return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-zinc-500">Cargando...</div>;
  }

  if (!session) return null;

  // CORRECCIÓN: Verificamos si el rol existe en navByRole, si no, usamos el rol 'ADMIN' como seguro.
  const currentRole = session.role;
  const navItems = navByRole[currentRole as keyof typeof navByRole] || navByRole.ADMIN || NAV_ITEMS;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 pb-24 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-20 pt-4 md:px-8">
        <main className="space-y-6 pb-4">{children}</main>
      </div>
      <BottomNav currentPath={pathname} items={navItems} />
    </div>
  );
}