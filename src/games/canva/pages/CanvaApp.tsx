import { CanvaProvider } from "../state/CanvaContext";
import { ReactNode } from "react";
import { Outlet } from "react-router-dom";

export function CanvaApp({ children }: { children?: ReactNode }) {
  return (
    <CanvaProvider>
      {children || <Outlet />}
    </CanvaProvider>
  );
}

