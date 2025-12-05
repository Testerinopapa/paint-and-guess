import { useChess } from "../state/ChessContext";
import { Loader2, Bot } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AIStatus() {
  const { aiConfig, isAIThinking, gameState } = useChess();

  if (!aiConfig.enabled) {
    return null;
  }

  if (isAIThinking) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription>
          <div className="flex items-center gap-2 text-blue-800">
            <Bot className="w-4 h-4" />
            <span>AI is thinking...</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (gameState.turn === aiConfig.color && !gameState.inCheckmate && !gameState.inStalemate && !gameState.inDraw) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <Bot className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Waiting for AI to move...
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

