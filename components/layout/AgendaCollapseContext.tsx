"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// 1. Definición clara de la interfaz del Contexto
interface AgendaCollapseContextType {
  isCollapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
}

// 2. Creación del contexto con valores iniciales por defecto
const AgendaCollapseContext = createContext<AgendaCollapseContextType>({
  isCollapsed: false,
  toggle: () => {},
  collapse: () => {},
  expand: () => {},
});

// 3. Proveedor del Estado de Colapso de la Agenda
export function AgendaCollapseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Alternar entre contraído y expandido
  const toggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Forzar colapso
  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  // Forzar expansión
  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  return (
    <AgendaCollapseContext.Provider
      value={{
        isCollapsed,
        toggle,
        collapse,
        expand,
      }}
    >
      {children}
    </AgendaCollapseContext.Provider>
  );
}

// 4. Hook personalizado para consumir el contexto fácilmente
export function useAgendaCollapse() {
  const context = useContext(AgendaCollapseContext);
  if (!context) {
    throw new Error(
      "useAgendaCollapse debe ser utilizado dentro de un AgendaCollapseProvider"
    );
  }
  return context;
}