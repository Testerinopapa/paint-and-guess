import { ChessProvider, useChess } from "../state/ChessContext";
import { ChessBoard } from "../components/ChessBoard";
import { GameInfo } from "../components/GameInfo";
import { OpponentSelector } from "../components/OpponentSelector";
import { OpponentProfile } from "../components/OpponentProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Users, Bot } from "lucide-react";
import type { Opponent } from "../data/opponents";

function PlayContent() {
  const { gameState, setGameMode, aiConfig, setAIConfig, resetGame } = useChess();
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [gameMode, setGameModeLocal] = useState<"local" | "ai">("local");
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);

  const handleModeChange = (mode: "local" | "ai") => {
    setGameModeLocal(mode);
    if (mode === "ai") {
      setGameMode("ai");
    } else {
      setGameMode("local");
      setSelectedOpponent(null);
      setAIConfig({
        enabled: false,
        color: aiConfig.color,
        elo: aiConfig.elo,
        depth: aiConfig.depth,
        opponentId: undefined,
      });
    }
  };

  const handleSelectOpponent = (opponent: Opponent) => {
    setSelectedOpponent(opponent);
    // Pre-configure AI with opponent's settings
    setAIConfig({
      enabled: false, // Don't start yet, wait for "Choose" button
      color: opponent.color || "black", // Opponent plays black by default
      elo: opponent.elo,
      depth: opponent.depth,
      opponentId: opponent.id,
    });
  };

  const handleStartGame = () => {
    if (!selectedOpponent) return;
    
    setAIConfig({
      enabled: true,
      color: selectedOpponent.color || "black",
      elo: selectedOpponent.elo,
      depth: selectedOpponent.depth,
      opponentId: selectedOpponent.id,
    });
    resetGame();
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      {/* Game Mode Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Tabs value={gameMode} onValueChange={(v) => handleModeChange(v as "local" | "ai")}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="local" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Local Game
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Play vs AI
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chess Board */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <Card className="w-full">
            <CardContent className="p-6">
              {/* Opponent Profile Display */}
              {gameMode === "ai" && (
                <OpponentProfile opponent={selectedOpponent} />
              )}
              
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => setOrientation(orientation === "white" ? "black" : "white")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Flip Board
                </button>
              </div>
              <ChessBoard orientation={orientation} />
            </CardContent>
          </Card>
        </div>
        
        {/* Right: Opponent Selector or Game Info */}
        <div className="lg:col-span-1">
          {gameMode === "ai" && !aiConfig.enabled ? (
            <OpponentSelector
              selectedOpponent={selectedOpponent}
              onSelectOpponent={handleSelectOpponent}
              onStartGame={handleStartGame}
              isGameActive={aiConfig.enabled}
            />
          ) : (
            <GameInfo />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <ChessProvider>
      <PlayContent />
    </ChessProvider>
  );
}

