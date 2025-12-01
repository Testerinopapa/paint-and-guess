import { BottomSheet, BottomSheetHeader, BottomSheetContent } from "../BottomSheet";
import { Badge } from "@/components/ui/badge";

interface MobileGameInfoSheetProps {
  roundNumber: number;
  timeRemaining: number;
  currentWord: string | null;
  isDrawer: boolean;
  progressPercentage: number;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
}

export function MobileGameInfoSheet({
  roundNumber,
  timeRemaining,
  currentWord,
  isDrawer,
  progressPercentage,
  expanded,
  onToggle,
}: MobileGameInfoSheetProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <BottomSheet
      defaultHeight={48}
      maxHeight={120}
      minHeight={48}
      onToggle={onToggle}
    >
      <BottomSheetHeader expanded={expanded} onToggle={() => onToggle(!expanded)}>
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-semibold">Round {roundNumber}</span>
          <span className="text-sm">{formatTime(timeRemaining)}</span>
          {isDrawer && currentWord && (
            <Badge variant="default" className="text-xs">
              {currentWord}
            </Badge>
          )}
          {!isDrawer && !currentWord && (
            <span className="text-sm text-muted-foreground">Guess the word!</span>
          )}
        </div>
      </BottomSheetHeader>
      {expanded && (
        <BottomSheetContent className="px-4 pb-2">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </BottomSheetContent>
      )}
    </BottomSheet>
  );
}

