import type { ReactNode } from "react";

import { AppShell } from "@/components";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
