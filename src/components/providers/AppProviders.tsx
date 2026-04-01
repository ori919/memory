"use client";

import { MemoryProvider } from "@/context/MemoryContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <MemoryProvider>{children}</MemoryProvider>;
}
