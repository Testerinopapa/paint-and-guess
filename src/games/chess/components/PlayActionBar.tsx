import { Button } from "@/components/ui/button";
import { Menu, MessageSquare, Star, ArrowLeft, ArrowRight } from "lucide-react";
import { useChess } from "../state/ChessContext";
import { useState } from "react";

interface PlayActionBarProps {
  onOptions?: () => void;
  onChat?: () => void;
  onMakeMove?: () => void; // Primary action (star button)
  onBack?: () => void; // Navigate to previous move
  onForward?: () => void; // Navigate to next move
}

export function PlayActionBar({
  onOptions,
  onChat,
  onMakeMove,
  onBack,
  onForward,
}: PlayActionBarProps) {
  const { gameState } = useChess();
  const [currentMoveIndex, setCurrentMoveIndex] = useState(gameState.moves.length - 1);

  const canGoBack = currentMoveIndex > 0;
  const canGoForward = currentMoveIndex < gameState.moves.length - 1;

  const handleBack = () => {
    if (canGoBack && onBack) {
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      onBack();
    }
  };

  const handleForward = () => {
    if (canGoForward && onForward) {
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      onForward();
    }
  };

  return (
    <div className="border-t bg-card px-2 py-2 flex items-center justify-around gap-1">
      {/* Options */}
      {onOptions && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onOptions}
          className="flex-1 flex-col h-auto py-2 gap-1 min-h-[44px]"
        >
          <Menu className="h-5 w-5" />
          <span className="text-xs">Options</span>
        </Button>
      )}

      {/* Chat */}
      {onChat && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onChat}
          className="flex-1 flex-col h-auto py-2 gap-1 min-h-[44px]"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs">Chat</span>
        </Button>
      )}

      {/* Primary Action (Star) - Large green button */}
      {onMakeMove && (
        <Button
          onClick={onMakeMove}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white h-auto py-3 min-h-[56px] min-w-[80px]"
          size="lg"
        >
          <Star className="h-6 w-6" />
        </Button>
      )}

      {/* Back */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={!canGoBack}
          className="flex-1 flex-col h-auto py-2 gap-1 min-h-[44px]"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-xs">Back</span>
        </Button>
      )}

      {/* Forward */}
      {onForward && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForward}
          disabled={!canGoForward}
          className="flex-1 flex-col h-auto py-2 gap-1 min-h-[44px]"
        >
          <ArrowRight className="h-5 w-5" />
          <span className="text-xs">Forward</span>
        </Button>
      )}
    </div>
  );
}
