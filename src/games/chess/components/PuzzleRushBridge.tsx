import { useEffect, useRef } from "react";
import { usePuzzle } from "../state/PuzzleContext";
import { usePuzzleRush } from "../state/PuzzleRushContext";

/**
 * Bridge component that connects PuzzleContext and PuzzleRushContext
 * Watches for puzzle solve/fail events and updates rush session accordingly
 */
export function PuzzleRushBridge() {
  const { solved, mistakes, loadRandomPuzzle } = usePuzzle();
  const { isActive, onPuzzleSolved, onPuzzleFailed } = usePuzzleRush();
  
  const lastSolvedRef = useRef(false);
  const lastMistakesRef = useRef(0);

  // Watch for puzzle solved
  useEffect(() => {
    if (!isActive) {
      lastSolvedRef.current = false;
      lastMistakesRef.current = 0;
      return;
    }

    // Detect transition from unsolved to solved
    if (solved && !lastSolvedRef.current) {
      lastSolvedRef.current = true;
      // Small delay to ensure state is stable
      setTimeout(() => {
        onPuzzleSolved(loadRandomPuzzle);
      }, 800);
    } else if (!solved) {
      lastSolvedRef.current = false;
    }
  }, [solved, isActive, onPuzzleSolved, loadRandomPuzzle]);

  // Watch for mistakes (strikes)
  useEffect(() => {
    if (!isActive) return;

    // When mistakes increase, it means a strike occurred
    // Note: We need to detect when a mistake is made, not just count them
    // The mistake count increases when user makes an incorrect move
    if (mistakes > lastMistakesRef.current && lastMistakesRef.current > 0) {
      // A new mistake was made (strike)
      onPuzzleFailed(loadRandomPuzzle);
    }
    lastMistakesRef.current = mistakes;
  }, [mistakes, isActive, onPuzzleFailed, loadRandomPuzzle]);

  return null; // This component doesn't render anything
}

