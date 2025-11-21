import { createContext, useContext, useState, ReactNode } from "react";

interface PingPongState {
  score: { player1: number; player2: number };
}

interface PingPongContextType {
  gameState: PingPongState;
  setGameState: (state: PingPongState) => void;
}

const PingPongContext = createContext<PingPongContextType | undefined>(undefined);

export function PingPongProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<PingPongState>({
    score: { player1: 0, player2: 0 },
  });

  return <PingPongContext.Provider value={{ gameState, setGameState }}>{children}</PingPongContext.Provider>;
}

export function usePingPong() {
  const context = useContext(PingPongContext);
  if (!context) {
    throw new Error("usePingPong must be used within PingPongProvider");
  }
  return context;
}

