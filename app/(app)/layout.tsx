// jwriveros/lehanastudio/lehanastudio-a8a570c007a1557a6ccd13baa5a39a3fe79a534a/app/(app)/layout.tsx

"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "@/components";
import { navByRole, NAV_ITEMS } from "@/lib/nav";
import { useSessionStore, Role } from "@/lib/sessionStore"; // Importar Role
import { supabase } from "@/lib/supabaseClient";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, setUser } = useSessionStore();
  const [isChecking, setIsChecking] = useState(true);

  // Efecto para restaurar la sesión al recargar la página
  useEffect(() => {
    const checkSession = async () => {
      // 1. Ver si hay sesión activa en Supabase Auth
      const { data: { session: authSession } } = await supabase.auth.getSession();

      if (authSession?.user?.email) {
        // 2. Si hay sesión, buscar datos en app_users para obtener el rol
        const { data: userData } = await supabase
          .from('app_users')
          .select('*')
          .eq('email', authSession.user.email)
          .single();
        
        if (userData) {
          setUser({
            id: authSession.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role as Role,
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

  // Redirección si no hay sesión después del chequeo
  useEffect(() => {
    if (!isChecking && !session) {
      router.replace("/");
    }
  }, [isChecking, session, router]);

  const navItems = useMemo(() => {
    if (!session) return NAV_ITEMS;
    return navByRole[session.role];
  }, [session]);

  if (isChecking) {
      return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-zinc-500">Cargando sesión...</div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 pb-24 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-20 pt-4 md:px-8">
        <main className="space-y-6 pb-4">{children}</main>
      </div>

      <BottomNav currentPath={pathname} items={navItems} />
    </div>
  );
}