import { Guess } from '../lib/gameLogic';
import { getSimilarityColor, getSimilarityPercentage } from '../lib/gameLogic';
import { motion } from 'framer-motion';

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
          <motion.div
            key={`${guess.word}-${index}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm"
          >
            {/* Background gradient based on similarity */}
            <div 
              className="absolute inset-0 opacity-10 transition-all"
              style={{
                background: `linear-gradient(to right, hsl(var(--similarity-${colorClass})) ${percentage}%, transparent ${percentage}%)`,
              }}
            />
            
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-lg capitalize">{guess.word}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Rank</div>
                  <div className="font-bold text-lg">#{guess.rank}</div>
                </div>
                
                <div 
                  className={`w-3 h-3 rounded-full`}
                  style={{ backgroundColor: `hsl(var(--similarity-${colorClass}))` }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

