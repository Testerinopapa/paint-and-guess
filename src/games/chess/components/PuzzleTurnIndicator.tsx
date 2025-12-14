import { Badge } from "@/components/ui/badge";

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
  const displayText = `${sideToMove === "white" ? "White" : "Black"} to Move`;
  const colorClass = sideToMove === "white" 
    ? "bg-white text-black border-black" 
    : "bg-black text-white border-white";

  return (
    <div className="px-4 py-2 bg-muted/50 border-y flex items-center justify-center">
      <Badge 
        variant="outline" 
        className={`flex items-center gap-2 px-3 py-1 border-2 font-semibold ${colorClass}`}
      >
        <span className="text-xs">
          {displayText}
        </span>
      </Badge>
    </div>
  );
}
