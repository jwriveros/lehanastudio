"use client";

import AppSidebar from "./AppSidebar";
import { useState } from "react";
import { AgendaCollapseProvider } from "./AgendaCollapseContext";

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AgendaCollapseProvider>
      <div className="h-screen flex bg-zinc-50">
        <AppSidebar />
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </AgendaCollapseProvider>
  );
}
