import { Button } from "@/components/ui/button";
import { RotateCcw, Search, ArrowRight } from "lucide-react";

interface PuzzleActionBarProps {
  onRestart?: () => void;
  onAnalysis?: () => void;
  onNext?: () => void;
  canRestart?: boolean;
  canNext?: boolean;
}

export function PuzzleActionBar({
  onRestart,
  onAnalysis,
  onNext,
  canRestart = true,
  canNext = true,
}: PuzzleActionBarProps) {
  return (
    <div className="border-t bg-card px-2 py-3 flex items-center justify-around gap-2">
      {/* Restart Button */}
      {onRestart && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRestart}
          disabled={!canRestart}
          className="flex-1 flex-col h-auto py-2 gap-1 min-h-[44px]"
        >
          <RotateCcw className="h-5 w-5" />
          <span className="text-xs">Restart</span>
        </Button>
      )}

      {/* Analysis Button */}
      {onAnalysis && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAnalysis}
          className="flex-1 flex-col h-auto py-2 gap-1 min-h-[44px]"
        >
          <div className="relative">
            <Search className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 text-xs font-bold text-gray-600">Q</span>
          </div>
          <span className="text-xs">Analysis</span>
        </Button>
      )}

      {/* Next Button - Large green button */}
      {onNext && (
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:hover:bg-gray-400 text-white h-auto py-3 min-h-[56px] min-w-[100px] font-semibold"
          size="lg"
        >
          Next
        </Button>
      )}
    </div>
  );
}
