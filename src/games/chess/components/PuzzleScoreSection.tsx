import { Flame, Puzzle } from "lucide-react";

interface PuzzleScoreSectionProps {
  rating: number;
  scoreChange?: number; // e.g., +56 or -20
  streak?: number; // e.g., "11 in a row"
  progress?: number; // 0-100 for progress bar
  nextPuzzleNumber?: number;
}

export function PuzzleScoreSection({
  rating,
  scoreChange,
  streak,
  progress = 0,
  nextPuzzleNumber,
}: PuzzleScoreSectionProps) {
  return (
    <div className="px-4 py-3 bg-card border-y">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Rating and Score Change */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{rating}</span>
            {scoreChange !== undefined && scoreChange !== 0 && (
              <span className={`text-sm font-semibold ${scoreChange > 0 ? "text-green-600" : "text-red-600"}`}>
                {scoreChange > 0 ? "+" : ""}{scoreChange}
              </span>
            )}
          </div>
          {streak !== undefined && streak > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">{streak} in a row</span>
            </div>
          )}
        </div>

        {/* Center: Progress Bar */}
        <div className="flex-1 max-w-[120px]">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div 
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Right: Next Puzzle Indicator */}
        {nextPuzzleNumber !== undefined && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Puzzle className="w-6 h-6 text-amber-700" />
              <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {nextPuzzleNumber}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
