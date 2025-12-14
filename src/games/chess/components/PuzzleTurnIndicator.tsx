import { Badge } from "@/components/ui/badge";
import { User, Bot } from "lucide-react";

interface PuzzleTurnIndicatorProps {
  sideToMove: "white" | "black";
  playerSide: "white" | "black";
  isPlayerTurn: boolean;
}

export function PuzzleTurnIndicator({ 
  sideToMove, 
  playerSide, 
  isPlayerTurn 
}: PuzzleTurnIndicatorProps) {
  const displayText = isPlayerTurn 
    ? "Your turn to move" 
    : "Opponent's move...";

  return (
    <div className="px-4 py-2 bg-muted/50 border-y flex items-center justify-center">
      <Badge 
        variant={isPlayerTurn ? "default" : "secondary"} 
        className="flex items-center gap-2 px-3 py-1"
      >
        {isPlayerTurn ? (
          <User className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
        <span className="text-xs font-medium">
          {displayText}
        </span>
        {!isPlayerTurn && (
          <span className="text-xs opacity-75 ml-1">(playing automatically)</span>
        )}
      </Badge>
    </div>
  );
}
