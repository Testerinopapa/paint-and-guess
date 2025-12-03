import { useState, useEffect } from "react";
import { ArrowLeft, Settings, List, Flag, Lightbulb, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Chess } from "chess.js";

interface MobileChessLayoutProps {
  board: React.ReactNode;
  showMaterial?: boolean;
  showMoveNotation?: boolean;
  onResign?: () => void;
  onHint?: () => void;
  onUndo?: () => void;
  onOptions?: () => void;
  puzzleMode?: boolean;
  // For puzzle mode - provide game state directly
  game?: Chess | null;
  moves?: Array<{ san: string }>;
  currentMoveIndex?: number;
  onMoveIndexChange?: (index: number) => void;
}

const PIECE_VALUES: Record<string, number> = {
  'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0,
  'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0,
};

function calculateMaterialAdvantage(game: Chess): number {
  const board = game.board();
  let whiteMaterial = 0;
  let blackMaterial = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = PIECE_VALUES[piece.type] || 0;
        if (piece.color === 'w') {
          whiteMaterial += value;
        } else {
          blackMaterial += value;
        }
      }
    }
  }

  return whiteMaterial - blackMaterial;
}

export function MobileChessLayout({
  board,
  showMaterial = true,
  showMoveNotation = true,
  onResign,
  onHint,
  onUndo,
  onOptions,
  puzzleMode = false,
  game: externalGame,
  moves: externalMoves,
  currentMoveIndex: externalMoveIndex,
  onMoveIndexChange,
}: MobileChessLayoutProps) {
  const navigate = useNavigate();
  
  const moves = puzzleMode ? (externalMoves || []) : [];
  const game = puzzleMode ? (externalGame || null) : null;
  
  const [currentMoveIndex, setCurrentMoveIndex] = useState(moves.length > 0 ? moves.length - 1 : -1);

  useEffect(() => {
    if (externalMoveIndex !== undefined) {
      setCurrentMoveIndex(externalMoveIndex);
    } else if (moves.length > 0) {
      setCurrentMoveIndex(moves.length - 1);
    }
  }, [externalMoveIndex, moves.length]);

  const materialAdvantage = showMaterial && game ? calculateMaterialAdvantage(game) : 0;
  const materialDisplay = materialAdvantage > 0 
    ? `+${materialAdvantage}` 
    : materialAdvantage < 0 
    ? `${materialAdvantage}` 
    : null;

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
    }
  };

  const handleMoveNavigation = (direction: 'prev' | 'next') => {
    if (!showMoveNotation || moves.length === 0) return;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentMoveIndex - 1)
      : Math.min(moves.length - 1, currentMoveIndex + 1);
    
    setCurrentMoveIndex(newIndex);
    if (onMoveIndexChange) {
      onMoveIndexChange(newIndex);
    }
  };

  const currentMove = moves[currentMoveIndex];
  const moveNotation = currentMove 
    ? `${Math.floor(currentMoveIndex / 2) + 1}.${currentMoveIndex % 2 === 0 ? '' : '..'}${currentMove.san}`
    : '';

  const title = puzzleMode ? "Chess Puzzle" : "Chess";

  return (
    <div className="flex flex-col h-screen bg-background md:hidden">
      {/* Top Bar */}
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
          <span className="text-lg font-bold">{title}</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onOptions}
          className="h-9 w-9"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Chess Board */}
        <div className="py-4">
          {board}
        </div>

        {/* Material Advantage */}
        {showMaterial && materialDisplay && (
          <div className="px-4 py-2 flex items-center gap-2 justify-center">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-2xl">♔</span>
              <span className="font-semibold">{materialDisplay}</span>
            </div>
          </div>
        )}

        {/* Move Notation with Navigation */}
        {showMoveNotation && moves.length > 0 && (
          <div className="px-4 py-2 flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMoveNavigation('prev')}
              disabled={currentMoveIndex === 0}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="px-4 py-2 bg-muted rounded-md min-w-[120px] text-center">
              <span className="text-sm font-mono">{moveNotation}</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMoveNavigation('next')}
              disabled={currentMoveIndex === moves.length - 1}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="border-t bg-card px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-around gap-2">
          {onOptions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOptions}
              className="flex-1 flex-col h-auto py-2 gap-1"
            >
              <List className="h-5 w-5" />
              <span className="text-xs">Options</span>
            </Button>
          )}
          
          {onResign && !puzzleMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResign}
              className="flex-1 flex-col h-auto py-2 gap-1 text-destructive hover:text-destructive"
            >
              <Flag className="h-5 w-5" />
              <span className="text-xs">Resign</span>
            </Button>
          )}
          
          {onHint && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onHint}
              className="flex-1 flex-col h-auto py-2 gap-1"
            >
              <Lightbulb className="h-5 w-5" />
              <span className="text-xs">Hint</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={moves.length === 0}
            className="flex-1 flex-col h-auto py-2 gap-1"
          >
            <Undo2 className="h-5 w-5" />
            <span className="text-xs">{puzzleMode ? "Reset" : "Undo"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
