import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserClient } from '@supabase/ssr'

export type Role = "ADMIN" | "ESPECIALISTA";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Session = {
  id: string;
  email: string;
  name: string;
  role: Role;
  comision_base: number;
  color?: string;
};

type SessionState = {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (session: Session) => void;
};

// CAMBIO AQUÍ: Quitamos los paréntesis extras para ajustarnos a tu lib/zustand.ts
export const useSessionStore = create<SessionState>(
  persist(
    (set) => ({
      session: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const cleanEmail = email.toLowerCase().trim();

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (authError) throw new Error("Credenciales incorrectas");

          const { data: { user }, error: userAuthError } = await supabase.auth.getUser();
          if (userAuthError || !user) throw new Error("Error de validación segura");

          const { data: userData, error: userError } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', cleanEmail)
            .single();

          if (userError || !userData) {
            throw new Error("Usuario no registrado en la base de datos.");
          }

          const newSession: Session = {
            id: user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role as Role,
            comision_base: userData.comision_base || 0, // Mapeo del dato
            color: userData.color
          };

          set({ session: newSession, isLoading: false });
          return true;

        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ session: null, error: null });
          localStorage.removeItem('session-storage');
          window.location.href = "/";
        } catch (error) {
          window.location.href = "/";
        }
      },

      setUser: (session: Session) => set({ session }),
    }),
    {
      name: 'session-storage', 
    }
  ) as any // Usamos 'as any' temporalmente si el middleware choca con tu create local
);