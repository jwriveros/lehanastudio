import { sampleUsers, type Role } from "./mockData";
import { create } from "./zustand";

type Session = {
  role: Role;
  name: string;
  email: string;
};

type SessionState = {
  session: Session | null;
  error: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  error: null,
  login: (email, password) => {
    const user = sampleUsers.find((u) => u.email === email.trim());

    if (!user || user.password !== password.trim()) {
      set({ error: "Correo o contraseña incorrectos" });
      return false;
    }

    set({
      session: {
        role: user.role,
        name: user.name,
        email: user.email,
      },
      error: null,
    });
    return true;
  },
  logout: () => set({ session: null, error: null }),
}));
