"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useSessionStore } from "@/lib/sessionStore";

export default function LoginPage() {
  const { login, error, isLoading } = useSessionStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // SEGURIDAD PARA TABLETS/MÓVILES: 
  // Si el estado isLoading se queda pegado más de 6 segundos, 
  // forzamos un refresco de la página para limpiar el estado bloqueado.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        // En lugar de solo cambiar el estado, refrescamos para limpiar 
        // cualquier conflicto de sesión/caché en el navegador de la tablet.
        window.location.reload();
      }, 6000); 
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Intentar Login
    const ok = await login(email, password);
    
    if (ok) {
      // 2. Pequeña pausa para asegurar que la cookie se asiente en el navegador
      setTimeout(() => {
        window.location.href = "/inicio"; 
      }, 100);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image 
            src="/images/logo.png" 
            alt="Logo" 
            width={180} 
            height={60} 
            style={{height: 'auto'}} 
            priority 
          />
        </div>
        <form onSubmit={handleLogin} className="rounded-2xl bg-white p-8 shadow-xl border dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="mb-6 text-center text-xl font-bold">Lehana Studio</h2>
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              autoComplete="email"
              className="w-full p-3 rounded-xl border dark:bg-zinc-950 outline-none dark:border-zinc-800" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              autoComplete="current-password"
              className="w-full p-3 rounded-xl border dark:bg-zinc-950 outline-none dark:border-zinc-800" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          
          {error && (
            <div className="mt-4 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xs text-red-500 font-bold text-center">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="mt-8 w-full rounded-xl bg-indigo-600 py-4 text-white font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Validando..." : "Acceder"}
          </button>
        </form>
        
        {/* Ayuda visual para el usuario si se queda pegado */}
        {isLoading && (
          <p className="mt-4 text-center text-[10px] text-gray-400">
          </p>
        )}
      </div>
    </div>
  );
}