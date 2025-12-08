import { useState, useEffect } from 'react';
import { GameHeader } from '../components/GameHeader';
import { GuessInput } from '../components/GuessInput';
import { GuessList } from '../components/GuessList';
import { GameComplete } from '../components/GameComplete';
import {
  getDailyWord,
  getSimilarityRank,
  isExactMatch,
  getHint,
  loadGameState,
  saveGameState,
  type GameState,
  type Guess,
} from '../lib/gameLogic';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SemanticIndex() {
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

    // Check for duplicate guess
    if (gameState.guesses.some(g => g.word.toLowerCase() === word.toLowerCase())) {
      toast({
        title: 'Already guessed',
        description: `You've already tried "${word}"`,
        variant: 'destructive',
      });
      return;
    }

    const won = isExactMatch(gameState.targetWord, word);
    const rank = won ? 1 : getSimilarityRank(gameState.targetWord, word);
    
    const newGuess: Guess = {
      word,
      rank,
      similarity: 100 - rank,
    };

    const newGuesses = [newGuess, ...gameState.guesses];

    setGameState({
      ...gameState,
      guesses: newGuesses,
      isComplete: won,
    });

    if (won) {
      toast({
        title: '🎉 Correct!',
        description: `You found the word "${gameState.targetWord}"!`,
      });
    } else if (rank <= 3) {
      toast({
        title: '🔥 Getting warmer!',
        description: `"${word}" is related!`,
      });
    }
  };

  const handleHint = () => {
    if (gameState.hintsUsed >= 3) {
      toast({
        title: 'No hints left',
        description: 'You\'ve used all your hints!',
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
    <div className="flex min-h-screen flex-col items-center bg-background p-4">
      <div className="flex flex-col items-center w-full max-w-2xl">
        <GameHeader
          onHint={handleHint}
          onGiveUp={handleGiveUp}
          hintsRemaining={3 - gameState.hintsUsed}
          guessCount={gameState.guesses.length}
        />

        {!gameState.isComplete ? (
          <>
            <GuessInput onSubmit={handleGuess} disabled={gameState.isComplete} />

            <ScrollArea className="w-full max-w-md max-h-[60vh] mt-6">
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
  );
}

