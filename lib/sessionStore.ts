// jwriveros/lehanastudio/lehanastudio-a8a570c007a1557a6ccd13baa5a39a3fe79a534a/lib/sessionStore.ts

import { create } from "./zustand";
import { supabase } from "./supabaseClient";

// Definimos los roles que maneja tu app
export type Role = "ADMIN" | "SPECIALIST" | "STAFF";

type Session = {
  id: string;     // ID de autenticación (UUID)
  email: string;
  name: string;
  role: Role;
  color?: string; // Color para la agenda
};

type SessionState = {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (session: Session) => void; // Para restaurar sesión automáticamente
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      // 1. Intentar loguearse en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw new Error("Credenciales incorrectas");
      if (!authData.user) throw new Error("No se pudo obtener el usuario");

      // 2. Buscar los datos del perfil en tu tabla 'app_users' usando el email
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.error("Usuario logueado pero no encontrado en app_users:", userError);
        throw new Error("Usuario no registrado en la base de datos de personal.");
      }

      // 3. Guardar la sesión en el estado global
      const newSession: Session = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name || "Usuario",
        role: (userData.role as Role) || "STAFF",
        color: userData.color
      };

      set({ session: newSession, isLoading: false });
      return true;

    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, error: null });
  },

  setUser: (session: Session) => set({ session }),
}));