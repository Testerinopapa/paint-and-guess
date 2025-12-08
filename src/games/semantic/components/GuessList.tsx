import { Guess, getSimilarityColor, getSimilarityPercentage } from '../lib/gameLogic';
import { Progress } from '@/components/ui/progress';

interface GuessListProps {
  guesses: Guess[];
}

export function GuessList({ guesses }: GuessListProps) {
  if (guesses.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p className="text-lg">No guesses yet. Start typing!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full max-w-md">
      {guesses.map((guess, index) => {
        const colorClass = getSimilarityColor(guess.rank);
        const percentage = getSimilarityPercentage(guess.rank);
        
        return (
          <div
            key={`${guess.word}-${index}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
          >
            <span className="text-sm text-muted-foreground w-6">
              #{guesses.length - index}
            </span>
            <span className={`font-medium flex-1 ${colorClass}`}>
              {guess.word}
            </span>
            <div className="w-24">
              <Progress value={percentage} className="h-2" />
            </div>
            <span className={`text-sm font-mono w-12 text-right ${colorClass}`}>
              {guess.rank === 9999 ? '?' : `#${guess.rank}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

