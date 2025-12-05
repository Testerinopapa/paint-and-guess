import { ChessProvider, useChess } from "../state/ChessContext";
import { ChessBoard } from "../components/ChessBoard";
import { GameInfo } from "../components/GameInfo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Users, Bot } from "lucide-react";

function PlayContent() {
  const { gameState, setGameMode, aiConfig, setAIConfig } = useChess();
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [gameMode, setGameModeLocal] = useState<"local" | "ai">("local");

  const handleModeChange = (mode: "local" | "ai") => {
    setGameModeLocal(mode);
    if (mode === "ai") {
      setGameMode("ai");
      // Initialize AI config if not already set
      if (!aiConfig.enabled) {
        setAIConfig({
          enabled: false,
          color: "black",
          elo: 1400,
          depth: 12,
        });
      }
    } else {
      setGameMode("local");
      setAIConfig({
        enabled: false,
        color: aiConfig.color,
        elo: aiConfig.elo,
        depth: aiConfig.depth,
      });
    }
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
        <div className="lg:col-span-2 flex flex-col items-center">
          <Card>
            <CardContent className="p-6">
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
        
        <div className="lg:col-span-1">
          <GameInfo />
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

