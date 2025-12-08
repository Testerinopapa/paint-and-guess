import { motion } from 'framer-motion';
import type { Guess } from '../lib/gameLogic';
import { getSimilarityColor, getSimilarityPercentage } from '../lib/gameLogic';

interface GuessListProps {
  guesses: Guess[];
}

export function GuessList({ guesses }: GuessListProps) {
  if (guesses.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No guesses yet. Start typing to guess the word!</p>
      </div>
    );
  }

  const sortedGuesses = [...guesses].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-2 w-full max-w-md">
      {sortedGuesses.map((guess, index) => {
        const colorClass = getSimilarityColor(guess.rank);
        const percentage = getSimilarityPercentage(guess.rank);

        // Map color class to actual colors
        const colorMap: Record<string, string> = {
          perfect: 'rgb(34, 197, 94)',    // green-500
          excellent: 'rgb(16, 185, 129)', // emerald-500
          great: 'rgb(234, 179, 8)',      // yellow-500
          good: 'rgb(249, 115, 22)',      // orange-500
          cold: 'rgb(59, 130, 246)',      // blue-500
        };

        const color = colorMap[colorClass] || colorMap.cold;

        return (
          <motion.div
            key={`${guess.word}-${index}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm"
          >
            {/* Background heat gradient */}
            <div
              className="absolute inset-0 opacity-10 transition-all"
              style={{
                background: `linear-gradient(to right, ${color} ${percentage}%, transparent ${percentage}%)`,
              }}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-lg capitalize">{guess.word}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Closeness</div>
                  <div className="font-bold text-lg">#{guess.rank}</div>
                </div>

                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

