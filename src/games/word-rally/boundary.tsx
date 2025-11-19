import type { ReactNode } from "react";
import { SharedGameBoundary } from "@/components/ErrorBoundary";

export function GameBoundary({ children, resetKeys }: { children: ReactNode; resetKeys?: unknown[] }) {
  return <SharedGameBoundary resetKeys={resetKeys}>{children}</SharedGameBoundary>;
}
