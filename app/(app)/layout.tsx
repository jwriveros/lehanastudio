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

  // Restaurar sesión
  useEffect(() => {
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

  // Redirigir sin sesión
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
    <div className="h-screen w-screen flex flex-col overflow-auto bg-white dark:bg-black">

      
      {/* HEADER MINIMALISTA */}
      <header className="h-12 w-full flex items-center justify-between px-4 border-b bg-white dark:bg-zinc-900">
        <div className="font-semibold">Lehana Studio</div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-600 dark:text-zinc-300">Admin</span>

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

      {/* MENÚ INFERIOR */}
      <BottomNav currentPath={pathname} items={navItems} />
    </div>
  );
}
