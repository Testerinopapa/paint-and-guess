import { useState, useCallback } from 'react';
import { GameHeader } from '../components/GameHeader';
import { GuessInput } from '../components/GuessInput';
import { GuessList } from '../components/GuessList';
import { GameComplete } from '../components/GameComplete';
import {
  createInitialGameState,
  calculateSimilarity,
  getHint,
  type GameState,
  type Guess,
} from '../lib/gameLogic';
import { toast } from '@/hooks/use-toast';

const MAX_HINTS = 3;

export default function SemanticIndex() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());

  const handleGuess = useCallback((word: string) => {
    // Check if word was already guessed
    if (gameState.guesses.some((g) => g.word.toLowerCase() === word.toLowerCase())) {
      toast({
        title: 'Already guessed',
        description: `You already guessed "${word}"`,
        variant: 'destructive',
      });
      return;
    }

    const rank = calculateSimilarity(word, gameState.targetWord);

    const newGuess: Guess = {
      word,
      rank,
      timestamp: Date.now(),
    };

    setGameState((prev) => {
      const won = rank === 1;
      return {
        ...prev,
        guesses: [...prev.guesses, newGuess],
        isComplete: won,
        won,
      };
    });

    if (rank === 1) {
      toast({
        title: '🎉 You found it!',
        description: `The word was "${gameState.targetWord}"`,
      });
    } else if (rank <= 10) {
      toast({
        title: '🔥 Getting hot!',
        description: 'Very close!',
      });
    } else if (rank <= 50) {
      toast({
        title: '🌡️ Warm',
        description: "You're on the right track",
      });
    }
  }, [gameState.guesses, gameState.targetWord]);

  const handleHint = useCallback(() => {
    if (gameState.hintsUsed >= MAX_HINTS) return;

    const hint = getHint(gameState.targetWord, gameState.hintsUsed);
    toast({
      title: 'Hint',
      description: hint,
    });

    setGameState((prev) => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
    }));
  }, [gameState.hintsUsed, gameState.targetWord]);

  const handleGiveUp = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isComplete: true,
      won: false,
    }));
  }, []);

  const handleShare = useCallback(() => {
    // Analytics or other share tracking could go here
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 pt-8 gap-6">
      <GameHeader
        onHint={handleHint}
        onGiveUp={handleGiveUp}
        hintsRemaining={MAX_HINTS - gameState.hintsUsed}
        guessCount={gameState.guesses.length}
      />

      {gameState.isComplete ? (
        <GameComplete
          won={gameState.won}
          targetWord={gameState.targetWord}
          guessCount={gameState.guesses.length}
          onShare={handleShare}
        />
      ) : (
        <>
          <GuessInput onSubmit={handleGuess} disabled={gameState.isComplete} />
          <GuessList guesses={gameState.guesses} />
        </>
      )}
    </div>
  );
}

