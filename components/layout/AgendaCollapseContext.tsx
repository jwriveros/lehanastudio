"use client";

import { createContext, useContext, useRef } from "react";

type ToggleFn = (() => void) | null;

const AgendaCollapseContext = createContext<{
  register: (fn: ToggleFn) => void;
  toggle: () => void;
}>({
  register: () => {},
  toggle: () => {},
});

export function AgendaCollapseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const toggleRef = useRef<ToggleFn>(null);

  return (
    <AgendaCollapseContext.Provider
      value={{
        register: (fn) => {
          toggleRef.current = fn;
        },
        toggle: () => {
          toggleRef.current?.();
        },
      }}
    >
      {children}
    </AgendaCollapseContext.Provider>
  );
}

export function useAgendaCollapse() {
  return useContext(AgendaCollapseContext);
}
