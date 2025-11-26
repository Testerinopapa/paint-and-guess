import { TriviaProvider } from "../state/TriviaContext";
import { ReactNode } from "react";
import { Outlet } from "react-router-dom";

export function TriviaBlitzApp({ children }: { children?: ReactNode }) {
  return (
    <TriviaProvider>
      {children || <Outlet />}
    </TriviaProvider>
  );
}

