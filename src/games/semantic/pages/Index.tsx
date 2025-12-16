import { useState, useEffect } from 'react';
import { GameHeader } from '../components/GameHeader';
import { GuessInput } from '../components/GuessInput';
import { GuessList } from '../components/GuessList';
import { GameComplete } from '../components/GameComplete';
import {
  getDailyWord,
  getSimilarityRank,
  getHint,
  loadGameState,
  saveGameState,
  type GameState,
  type Guess,
} from '../lib/gameLogic';
import { useToast } from '@/shared/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SemanticIndex() {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>(() => {
    const loaded = loadGameState();
    if (loaded) return loaded;
    
    return {
      targetWord: getDailyWord(),
      guesses: [],
      isComplete: false,
      gaveUp: false,
      hintsUsed: 0,
    };
  });

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const handleGuess = (word: string) => {
    if (gameState.isComplete) return;

    const rank = getSimilarityRank(gameState.targetWord, word);
    const newGuess: Guess = {
      word,
      rank,
      similarity: 100 - rank,
    };

    const newGuesses = [newGuess, ...gameState.guesses];
    const won = rank === 1;

    setGameState({
      ...gameState,
      guesses: newGuesses,
      isComplete: won,
    });

    if (won) {
      toast({
        title: '🎉 You won!',
        description: `You found "${gameState.targetWord}" in ${newGuesses.length} guesses!`,
      });
    } else if (rank <= 10) {
      toast({
        title: '🔥 Getting hot!',
        description: `Rank ${rank} - very close!`,
      });
    } else if (rank <= 50) {
      toast({
        title: '👍 Good guess!',
        description: `Rank ${rank} - you're on the right track!`,
      });
    }
  };

  const handleHint = () => {
    if (gameState.hintsUsed >= 3) {
      toast({
        title: 'No hints left',
        description: 'You have used all available hints.',
        variant: 'destructive',
      });
      return;
    }

    const hint = getHint(gameState.targetWord, gameState.hintsUsed);
    if (hint) {
      setGameState({
        ...gameState,
        hintsUsed: gameState.hintsUsed + 1,
      });
      toast({
        title: '💡 Hint',
        description: `Try: "${hint}"`,
      });
    }
  };

  const handleGiveUp = () => {
    setGameState({
      ...gameState,
      isComplete: true,
      gaveUp: true,
    });
    toast({
      title: 'Game Over',
      description: `The word was "${gameState.targetWord}"`,
    });
  };

  const handleShare = () => {
    // Analytics or tracking could go here
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-similarity-excellent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-similarity-great/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto">
          <GameHeader
            onHint={handleHint}
            onGiveUp={handleGiveUp}
            hintsRemaining={3 - gameState.hintsUsed}
            guessCount={gameState.guesses.length}
          />

          {!gameState.isComplete ? (
            <>
              <GuessInput onSubmit={handleGuess} disabled={gameState.isComplete} />

              <ScrollArea className="w-full max-w-md max-h-[60vh]">
                <GuessList guesses={gameState.guesses} />
              </ScrollArea>
            </>
          ) : (
            <GameComplete
              won={!gameState.gaveUp}
              targetWord={gameState.targetWord}
              guessCount={gameState.guesses.length}
              onShare={handleShare}
            />
          )}
        </div>
      </div>
    </div>
  );
}

