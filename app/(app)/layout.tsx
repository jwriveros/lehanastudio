"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionStore, type Role } from "@/lib/sessionStore";
import { supabase } from "@/lib/supabaseClient";
import { navByRole } from "@/lib/nav";
import { Header, AgendaBoard } from "@/components";
import { useUIStore } from "@/lib/uiStore";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, setUser } = useSessionStore();
  const [isChecking, setIsChecking] = useState(true);

  const {
    isCalendarOpen,
    isBookingModalOpen,
    bookingSignal,
    closeAllModals,
    openBookingModal, // We may need this for a global + button later
  } = useUIStore();

  useEffect(() => {
    closeAllModals();
  }, [pathname, closeAllModals]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

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

    if (!session) {
      checkSession();
    } else {
      setIsChecking(false);
    }
  }, [session, setUser]);

  useEffect(() => {
    if (!isChecking && !session) {
      router.replace("/");
    }
  }, [isChecking, session, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">
        Cargando...
      </div>
    );
  }

  if (!session) {
    return null; // or a redirect
  }

  const currentRole = session.role;
  const navItems =
    navByRole[currentRole as keyof typeof navByRole] || navByRole.ADMIN;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-black">
      <Header navItems={navItems} />
      <main className="flex-1 overflow-hidden">{children}</main>

      {/* Modal Nueva Reserva */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[80] overflow-y-auto p-4 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeAllModals}
          />
          <div className="relative z-10 w-full max-w-xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl bg-white">
            <AgendaBoard
              externalBookingSignal={bookingSignal}
              renderCalendarShell={false}
              onBookingClose={closeAllModals}
            />
            <button
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 p-2 z-[999] bg-white rounded-full shadow-lg"
              onClick={closeAllModals}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal Calendario */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center">
          <div className="relative w-full h-full max-w-[1900px] max-h-[95vh] rounded-3xl overflow-hidden bg-white shadow-2xl">
            <AgendaBoard
              externalBookingSignal={null}
              renderCalendarShell={true}
            />
            <button
              onClick={closeAllModals}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-xl shadow-black/20 hover:bg-white hover:text-zinc-900 active:scale-95 backdrop-blur-md border border-zinc-200 transition-all z-[999]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}