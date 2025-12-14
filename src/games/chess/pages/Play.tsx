import { ChessProvider, useChess } from "../state/ChessContext";
import { ChessBoard } from "../components/ChessBoard";
import { GameInfo } from "../components/GameInfo";
import { OpponentSelector } from "../components/OpponentSelector";
import { OpponentProfile } from "../components/OpponentProfile";
import { PlayMobileLayout } from "../components/PlayMobileLayout";
import { NewGameMenu } from "../components/NewGameMenu";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Users, Bot } from "lucide-react";
import type { Opponent } from "../data/opponents";
import { getOpponentById, OPPONENTS } from "../data/opponents";
import { useIsMobile } from "@/shared/hooks/use-mobile";

function PlayContent() {
  const { gameState, setGameMode, aiConfig, setAIConfig, resetGame } = useChess();
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [gameMode, setGameModeLocal] = useState<"local" | "ai">("local");
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [showNewGameMenu, setShowNewGameMenu] = useState(false);
  const isMobile = useIsMobile();

  // On mobile, show new game menu initially when no moves have been made
  useEffect(() => {
    if (isMobile && gameState.moves.length === 0 && !aiConfig.enabled) {
      setShowNewGameMenu(true);
    }
  }, [isMobile, gameState.moves.length, aiConfig.enabled]);

  const shouldShowNewGameMenu = isMobile && showNewGameMenu && gameState.moves.length === 0;

  // Sync selectedOpponent with aiConfig.opponentId when it changes
  useEffect(() => {
    if (aiConfig.opponentId) {
      const opponent = getOpponentById(aiConfig.opponentId);
      if (opponent && selectedOpponent?.id !== opponent.id) {
        setSelectedOpponent(opponent);
      }
    } else if (!aiConfig.opponentId && selectedOpponent && !aiConfig.enabled) {
      // Only clear if game is not active and opponentId is cleared
      setSelectedOpponent(null);
    }
  }, [aiConfig.opponentId, aiConfig.enabled, selectedOpponent?.id]);

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

  const handleNewGame = () => {
    // Reset the game and disable AI to show opponent selector again
    resetGame();
    setAIConfig({
      enabled: false,
      color: aiConfig.color,
      elo: aiConfig.elo,
      depth: aiConfig.depth,
      opponentId: aiConfig.opponentId, // Keep the opponent selected
    });
  };

  const handleChangeOpponent = () => {
    // Stop current game and show opponent selector
    resetGame();
    setAIConfig({
      enabled: false,
      color: "black",
      elo: undefined,
      depth: undefined,
      opponentId: undefined,
    });
    setSelectedOpponent(null);
  };

  const handleNewGameMenuStart = (timeLimit?: number, mode?: string) => {
    // Handle mode selection
    if (mode === "ai" || mode === "bot") {
      // Set AI mode
      setGameModeLocal("ai");
      setGameMode("ai");
      
      // Auto-select default opponent (first featured beginner bot, or first available)
      const defaultOpponent = OPPONENTS.beginner.find(opp => opp.featured) || OPPONENTS.beginner[0];
      if (defaultOpponent) {
        setSelectedOpponent(defaultOpponent);
        setAIConfig({
          enabled: true, // Start immediately
          color: defaultOpponent.color || "black",
          elo: defaultOpponent.elo,
          depth: defaultOpponent.depth,
          opponentId: defaultOpponent.id,
        });
      }
    } else if (mode === "friend" || mode === "local") {
      setGameModeLocal("local");
      setGameMode("local");
      // Clear AI config for local mode
      setAIConfig({
        enabled: false,
        color: "black",
        elo: undefined,
        depth: undefined,
        opponentId: undefined,
      });
      setSelectedOpponent(null);
    } else if (mode === "tournament" || mode === "coach") {
      // For now, treat as local game - can be extended later
      setGameModeLocal("local");
      setGameMode("local");
      setAIConfig({
        enabled: false,
        color: "black",
        elo: undefined,
        depth: undefined,
        opponentId: undefined,
      });
      setSelectedOpponent(null);
    }
    
    // Reset game to start fresh
    resetGame();
    
    // Hide the menu
    setShowNewGameMenu(false);
    
    // TODO: Store timeLimit in context for timer functionality
    console.log("Starting game with time limit:", timeLimit, "minutes");
  };

  // Render new game menu on mobile if no game started
  if (shouldShowNewGameMenu) {
    return (
      <div className="md:hidden -m-4 md:m-0 h-[calc(100vh-4rem)]">
        <NewGameMenu
          onStartGame={handleNewGameMenuStart}
          onCancel={() => setShowNewGameMenu(false)}
        />
      </div>
    );
  }

  // Render mobile layout on mobile devices
  if (isMobile) {
    return (
      <div className="md:hidden -m-4 md:m-0 h-[calc(100vh-4rem)]">
        <PlayMobileLayout
          gameMode={gameMode}
          selectedOpponent={selectedOpponent}
          orientation={orientation}
          onFlipBoard={() => setOrientation(orientation === "white" ? "black" : "white")}
          onNewGame={() => setShowNewGameMenu(true)}
        />
      </div>
    );
  }

  // Desktop layout
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
            <GameInfo 
              onNewGame={gameMode === "ai" ? handleNewGame : undefined}
              onChangeOpponent={gameMode === "ai" ? handleChangeOpponent : undefined}
            />
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

