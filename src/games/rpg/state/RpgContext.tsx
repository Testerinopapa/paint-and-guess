import { createContext, useContext, useState, ReactNode } from "react";

interface Character {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
}

interface RpgState {
  character: Character;
  location: string;
  storyText: string[];
  availableCommands: string[];
}

interface RpgContextType {
  gameState: RpgState;
  setGameState: (state: RpgState) => void;
}

const RpgContext = createContext<RpgContextType | undefined>(undefined);

export function RpgProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<RpgState>({
    character: {
      name: "Wanderer",
      level: 5,
      hp: 75,
      maxHp: 100,
      mana: 40,
      maxMana: 80,
      xp: 1250,
      xpToNextLevel: 2000,
      gold: 347,
    },
    location: "Ruins of Eldrath",
    storyText: [
      "The ancient ruins of Eldrath loom before you, their crumbling stones weathered by countless ages. A cold wind whispers through the broken archways, carrying with it the scent of decay and forgotten magic.",
      "",
      "Your torch flickers in the darkness, casting dancing shadows against walls inscribed with arcane symbols. The air itself seems to hum with dormant power.",
      "",
      "What will you do?",
    ],
    availableCommands: ["Attack", "Investigate Symbols", "Cast Light Spell", "Search for Treasure", "Listen Carefully", "Rest"],
  });

  return <RpgContext.Provider value={{ gameState, setGameState }}>{children}</RpgContext.Provider>;
}

export function useRpg() {
  const context = useContext(RpgContext);
  if (!context) {
    throw new Error("useRpg must be used within RpgProvider");
  }
  return context;
}

