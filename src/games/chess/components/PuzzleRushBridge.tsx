import { useEffect, useRef } from "react";
import { usePuzzle } from "../state/PuzzleContext";
import { usePuzzleRush } from "../state/PuzzleRushContext";

/**
 * Bridge component that connects PuzzleContext and PuzzleRushContext
 * Watches for puzzle solve/fail events and updates rush session accordingly
 */
export function PuzzleRushBridge() {
  const { solved, mistakes, pz, loadRandomPuzzle } = usePuzzle();
  const { isActive, onPuzzleSolved, onPuzzleFailed } = usePuzzleRush();
  
  const lastSolvedRef = useRef(false);
  const lastMistakesRef = useRef(0);
  const currentPuzzleIdRef = useRef<string | null>(null);

  // Reset tracking when puzzle changes
  useEffect(() => {
    if (pz && pz.id !== currentPuzzleIdRef.current) {
      // New puzzle loaded - reset tracking
      currentPuzzleIdRef.current = pz.id;
      lastSolvedRef.current = false;
      lastMistakesRef.current = 0;
    }
  }, [pz]);

  // Watch for puzzle solved
  useEffect(() => {
    if (!isActive) {
      lastSolvedRef.current = false;
      lastMistakesRef.current = 0;
      return;
    }

    // Only process if we have an active puzzle
    if (!pz) return;

    // Detect transition from unsolved to solved
    if (solved && !lastSolvedRef.current) {
      lastSolvedRef.current = true;
      console.log("[PUZZLE RUSH] Puzzle solved! Incrementing score and loading next puzzle");
      // Small delay to ensure state is stable and user sees the success
      setTimeout(() => {
        onPuzzleSolved(loadRandomPuzzle);
      }, 800);
    } else if (!solved && lastSolvedRef.current) {
      // Puzzle was reset (new puzzle loaded)
      lastSolvedRef.current = false;
    }
  }, [solved, isActive, onPuzzleSolved, loadRandomPuzzle, pz]);

  // Watch for mistakes (strikes)
  // Track mistakes per puzzle - when mistakes increase, it's a strike
  useEffect(() => {
    if (!isActive) {
      lastMistakesRef.current = 0;
      return;
    }

    // When mistakes increase, it means the user made an incorrect move (strike)
    // Detect any increase in mistakes count
    if (mistakes > lastMistakesRef.current) {
      // A new mistake was made - this is a strike
      // Only trigger if we're actually in an active puzzle (not during loading or solved)
      if (!solved && pz) {
        // Update ref immediately to prevent double-triggering
        const currentMistakes = mistakes;
        lastMistakesRef.current = currentMistakes;
        
        // Trigger strike with a small delay to ensure state is stable
        const timeoutId = setTimeout(() => {
          onPuzzleFailed();
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    }
    
    // Reset mistake tracking when puzzle is solved or new puzzle loads
    if (solved) {
      lastMistakesRef.current = 0;
    } else if (mistakes === 0) {
      // Puzzle was reset or new puzzle loaded, reset tracking
      lastMistakesRef.current = 0;
    } else if (mistakes === lastMistakesRef.current) {
      // Keep the ref in sync when mistakes haven't changed
      // (no-op, but ensures ref stays current)
    }
  }, [mistakes, isActive, onPuzzleFailed, solved, pz]);

  return null; // This component doesn't render anything
}

