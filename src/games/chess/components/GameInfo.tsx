import { useChess } from "../state/ChessContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIStatus } from "./AIStatus";
import { useNavigate } from "react-router-dom";
import { BarChart3, Trophy } from "lucide-react";
import { apiPath } from "@/config/api";
import { useState } from "react";
import { getOpponentById } from "../data/opponents";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RefreshCw } from "lucide-react";

interface GameInfoProps {
  onNewGame?: () => void;
  onChangeOpponent?: () => void;
}

export function GameInfo({ onNewGame, onChangeOpponent }: GameInfoProps = {}) {
  const { gameState, resetGame, undoMove, exportPgn, aiConfig, isAIThinking } = useChess();
  const navigate = useNavigate();
  const [generatingReport, setGeneratingReport] = useState(false);

  const isGameOver = gameState.inCheckmate || gameState.inStalemate || gameState.inDraw;
  const isAIGame = gameState.gameMode === "ai" && aiConfig.enabled;
  const currentOpponent = aiConfig.opponentId ? getOpponentById(aiConfig.opponentId) : null;

  const handleAnalyzeGame = async () => {
    if (!gameState.moves || gameState.moves.length === 0) {
      return;
    }

    try {
      setGeneratingReport(true);
      
      // Collect FENs and SANs from the game
      const { Chess } = await import("chess.js");
      const tempGame = new Chess();
      const fens: string[] = [];
      const sans: string[] = [];

      fens.push(tempGame.fen());

      for (const move of gameState.moves) {
        try {
          tempGame.move({ from: move.from, to: move.to, promotion: move.promotion });
          fens.push(tempGame.fen());
          sans.push(move.san);
        } catch (e) {
          console.error("Error replaying move:", e);
        }
      }

      if (fens.length === 0 || sans.length === 0) {
        return;
      }

      const response = await fetch(apiPath("/api/report/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fens,
          sans,
          pgn: gameState.pgn,
          depth: 12,
          multiPv: 3,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const data = await response.json();
      navigate(`/hub/games/chess/report/${data.id}`);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusMessage = () => {
    if (gameState.inCheckmate) {
      if (isAIGame) {
        const playerWon = (gameState.turn === "white" && aiConfig.color === "black") ||
                         (gameState.turn === "black" && aiConfig.color === "white");
        return playerWon ? "You win by checkmate! 🎉" : "AI wins by checkmate!";
      }
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
    if (isAIGame && gameState.turn === aiConfig.color) {
      return "AI to move...";
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
      {/* AI Status Indicator */}
      <AIStatus />

      {/* Current Opponent Info */}
      {isAIGame && currentOpponent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Opponent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={currentOpponent.avatar} alt={currentOpponent.name} />
                <AvatarFallback>{currentOpponent.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{currentOpponent.name}</div>
                <Badge variant="secondary" className="text-xs mt-1">
                  {currentOpponent.rating}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Game Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()}>{getStatusMessage()}</Badge>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={onNewGame || resetGame} 
              variant="outline" 
              size="sm"
            >
              New Game
            </Button>
            {isAIGame && onChangeOpponent && (
              <Button 
                onClick={onChangeOpponent} 
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Change Opponent
              </Button>
            )}
            <Button 
              onClick={undoMove} 
              variant="outline" 
              size="sm"
              disabled={gameState.moves.length === 0 || isAIThinking}
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
            >
              Copy PGN
            </Button>
            {isGameOver && gameState.moves.length > 0 && (
              <Button 
                onClick={handleAnalyzeGame}
                variant="default"
                size="sm"
                disabled={generatingReport}
                className="bg-primary"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {generatingReport ? "Analyzing..." : "Analyze Game"}
              </Button>
            )}
          </div>
          
          {/* Game Result Banner for AI Games */}
          {isGameOver && isAIGame && (
            <div className="mt-4 p-3 bg-muted rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-sm">Game Over</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {gameState.inCheckmate && (
                  (gameState.turn === "white" && aiConfig.color === "black") ||
                  (gameState.turn === "black" && aiConfig.color === "white")
                    ? "Congratulations! You won!"
                    : "The AI won this game."
                )}
                {(gameState.inStalemate || gameState.inDraw) && "The game ended in a draw."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Move History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {gameState.moves.length === 0 ? (
              <p className="text-sm text-muted-foreground">No moves yet</p>
            ) : (
              <div className="space-y-1">
                {gameState.moves.map((move, index) => {
                  const isAIMove = isAIGame && (
                    (index % 2 === 0 && aiConfig.color === "white") ||
                    (index % 2 === 1 && aiConfig.color === "black")
                  );
                  return (
                    <div 
                      key={index} 
                      className={`text-sm flex gap-2 items-center ${
                        isAIMove ? "text-blue-600 font-medium" : ""
                      }`}
                    >
                      <span className="text-muted-foreground">
                        {Math.floor(index / 2) + 1}.
                        {index % 2 === 0 ? "" : ".."}
                      </span>
                      <span>{move.san}</span>
                      {isAIMove && (
                        <span className="text-xs text-blue-500 ml-auto">AI</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

