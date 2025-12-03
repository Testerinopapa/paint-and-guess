import { useChess } from "../state/ChessContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GameInfo() {
  const { gameState, resetGame, undoMove, exportPgn } = useChess();

  const getStatusMessage = () => {
    if (gameState.inCheckmate) {
      return gameState.turn === "white" ? "Black wins by checkmate!" : "White wins by checkmate!";
    }
    if (gameState.inStalemate) {
      return "Draw by stalemate!";
    }
    if (gameState.inDraw) {
      return "Draw!";
    }
    if (gameState.inCheck) {
      return `${gameState.turn === "white" ? "White" : "Black"} is in check!`;
    }
    return `${gameState.turn === "white" ? "White" : "Black"} to move`;
  };

  const getStatusColor = () => {
    if (gameState.inCheckmate || gameState.inStalemate || gameState.inDraw) {
      return "destructive";
    }
    if (gameState.inCheck) {
      return "default";
    }
    return "secondary";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Game Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()} className="text-xs md:text-sm">{getStatusMessage()}</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={resetGame} variant="outline" size="sm" className="h-9 md:h-8 text-xs md:text-sm flex-1 sm:flex-none">
              New Game
            </Button>
            <Button 
              onClick={undoMove} 
              variant="outline" 
              size="sm"
              disabled={gameState.moves.length === 0}
              className="h-9 md:h-8 text-xs md:text-sm flex-1 sm:flex-none"
            >
              Undo Move
            </Button>
            <Button 
              onClick={() => {
                const pgn = exportPgn();
                navigator.clipboard.writeText(pgn);
              }}
              variant="outline" 
              size="sm"
              className="h-9 md:h-8 text-xs md:text-sm flex-1 sm:flex-none"
            >
              Copy PGN
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Move History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px] md:h-[200px]">
            {gameState.moves.length === 0 ? (
              <p className="text-sm text-muted-foreground">No moves yet</p>
            ) : (
              <div className="space-y-1">
                {gameState.moves.map((move, index) => (
                  <div key={index} className="text-sm flex gap-2">
                    <span className="text-muted-foreground">
                      {Math.floor(index / 2) + 1}.
                      {index % 2 === 0 ? "" : ".."}
                    </span>
                    <span>{move.san}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

