import { useState, useRef, useEffect } from "react";
import { BottomSheet, BottomSheetHeader, BottomSheetContent } from "../BottomSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GuessEntry {
  guess: string;
  player: { id: string; name: string };
  correct: boolean;
  timestamp: number;
}

interface MobileAnswersSheetProps {
  guessHistory: GuessEntry[];
  isDrawer: boolean;
  isRoundActive: boolean;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  onSubmit: (guess: string) => void;
}

export function MobileAnswersSheet({
  guessHistory,
  isDrawer,
  isRoundActive,
  expanded,
  onToggle,
  onSubmit,
}: MobileAnswersSheetProps) {
  const [guessInput, setGuessInput] = useState("");
  const guessHistoryEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) {
      guessHistoryEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [guessHistory, expanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = guessInput.trim();
    if (!guess || isDrawer || !isRoundActive) return;
    onSubmit(guess);
    setGuessInput("");
  };

  return (
    <BottomSheet
      defaultHeight={56}
      maxHeight={200}
      minHeight={56}
      disabled={isDrawer}
      onToggle={onToggle}
    >
      <BottomSheetHeader expanded={expanded} onToggle={() => onToggle(!expanded)}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-semibold">ANSWERS</span>
          {guessHistory.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {guessHistory.length}
            </Badge>
          )}
        </div>
      </BottomSheetHeader>
      <BottomSheetContent className="flex flex-col px-4 pb-2">
        <div className="flex-1 overflow-y-auto space-y-1 mb-2 pr-2">
          {guessHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No guesses yet
            </p>
          ) : (
            guessHistory.map((entry, i) => (
              <div
                key={i}
                className={`text-sm ${
                  entry.correct ? "text-green-600 font-semibold" : "text-muted-foreground"
                }`}
              >
                {entry.correct && "✓ "}
                {entry.guess}
                {entry.correct && entry.player && ` (${entry.player.name})`}
              </div>
            ))
          )}
          <div ref={guessHistoryEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 flex-shrink-0">
          <Input
            placeholder="Type your guess..."
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            disabled={isDrawer || !isRoundActive}
            className="flex-1 h-10"
          />
          <Button
            type="submit"
            disabled={!guessInput.trim() || isDrawer || !isRoundActive}
            className="h-10 px-4"
          >
            Guess
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

