import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { useChess } from "../state/ChessContext";
import { ChessBoard } from "./ChessBoard";
import { PlayerPanel } from "./PlayerPanel";
import { MoveNotation } from "./MoveNotation";
import { PlayActionBar } from "./PlayActionBar";
import { useAuth } from "@/contexts/AuthContext";
import { getOpponentById } from "../data/opponents";

interface PlayMobileLayoutProps {
  gameMode: "local" | "ai";
  selectedOpponent?: { id: string } | null;
  orientation: "white" | "black";
  onFlipBoard?: () => void;
}

export function PlayMobileLayout({
  gameMode,
  selectedOpponent,
  orientation,
  onFlipBoard,
}: PlayMobileLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameState, aiConfig } = useChess();

  // Get opponent info if AI mode
  const opponent = selectedOpponent?.id ? getOpponentById(selectedOpponent.id) : null;

  // Determine player colors
  // In AI mode, player plays white by default (or opposite of AI color)
  const playerColor: "white" | "black" = gameMode === "ai" && aiConfig.color === "black" ? "white" : "white";
  const opponentColor: "white" | "black" = playerColor === "white" ? "black" : "white";

  // Determine which player is active (whose turn it is)
  const isPlayerTurn = gameState.turn === playerColor;

  // Player names
  const playerName = user?.username || "Player";
  const opponentName = 
    gameMode === "ai" && opponent 
      ? opponent.name 
      : gameMode === "local" 
      ? "Opponent" 
      : "Waiting...";

  // Player ratings (for local mode, could be from user profile or defaults)
  const playerRating = 1500; // TODO: Get from user profile
  const opponentRating = gameMode === "ai" && opponent ? opponent.rating : 1500;

  // Timer values (placeholder - would come from timer state if implemented)
  const playerTimer = "10:00";
  const opponentTimer = "10:00";

  const handleOptions = () => {
    // TODO: Open options/settings sheet
    console.log("Options clicked");
  };

  const handleChat = () => {
    // TODO: Open chat interface
    console.log("Chat clicked");
  };

  const handleMakeMove = () => {
    // This is a placeholder - actual move is made by clicking on the board
    // The star button could trigger hints or best move suggestion
    console.log("Make move clicked");
  };

  const handleBack = () => {
    // Navigate to previous position in move history
    console.log("Back clicked");
    // TODO: Implement move history navigation
  };

  const handleForward = () => {
    // Navigate to next position in move history
    console.log("Forward clicked");
    // TODO: Implement move history navigation
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">Chess</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOptions}
          className="h-9 w-9"
        >
          <Search className="h-5 w-5" />
        </Button>
      </header>

      {/* Move Notation Bar */}
      {gameState.moves.length > 0 && <MoveNotation />}

      {/* Top Player Panel (White/Player) */}
      <PlayerPanel
        name={orientation === "white" ? playerName : opponentName}
        rating={orientation === "white" ? playerRating : opponentRating}
        avatar={orientation === "white" ? undefined : opponent?.avatar}
        country={orientation === "white" ? undefined : opponent?.country}
        timer={orientation === "white" ? playerTimer : opponentTimer}
        color="white"
        isActive={gameState.turn === "white"}
      />

      {/* Chess Board - Responsive */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center py-4">
        <ChessBoard orientation={orientation} responsive={true} />
      </div>

      {/* Bottom Player Panel (Black/Opponent) */}
      <PlayerPanel
        name={orientation === "black" ? playerName : opponentName}
        rating={orientation === "black" ? playerRating : opponentRating}
        avatar={orientation === "black" ? undefined : opponent?.avatar}
        country={orientation === "black" ? undefined : opponent?.country}
        timer={orientation === "black" ? playerTimer : opponentTimer}
        color="black"
        isActive={gameState.turn === "black"}
      />

      {/* Action Bar */}
      <PlayActionBar
        onOptions={handleOptions}
        onChat={gameMode === "local" ? handleChat : undefined}
        onMakeMove={handleMakeMove}
        onBack={handleBack}
        onForward={handleForward}
      />
    </div>
  );
}
