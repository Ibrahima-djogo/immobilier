"use client";

import type { ReactNode } from "react";

import { AdminSessionProvider } from "@/lib/auth/admin-session";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AdminSessionProvider>{children}</AdminSessionProvider>;
}
