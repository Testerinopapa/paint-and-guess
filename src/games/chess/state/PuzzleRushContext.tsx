import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import type { PuzzleRushMode, PuzzleRushSession, PuzzleRushStats } from "./puzzleRushTypes";
import type { PuzzleFilters } from "./puzzleTypes";

interface PuzzleRushContextType {
  // State
  session: PuzzleRushSession | null;
  stats: PuzzleRushStats | null;
  
  // Computed
  timeRemaining: number | null; // seconds remaining (null for survival)
  isActive: boolean;
  
  // Actions
  startSession: (mode: PuzzleRushMode, loadPuzzle: (filters?: PuzzleFilters) => Promise<void>) => void;
  endSession: () => void;
  onPuzzleSolved: (loadPuzzle: (filters?: PuzzleFilters) => Promise<void>) => void;
  onPuzzleFailed: () => void;
}

const PuzzleRushContext = createContext<PuzzleRushContextType | undefined>(undefined);

// Progressive difficulty: increase rating range as puzzles are solved
// Formula: baseRating + (puzzleNumber * difficultyIncrement)
const DIFFICULTY_INCREMENT = 50; // increase by 50 rating points per puzzle
const BASE_RATING_MIN = 800;
const BASE_RATING_MAX = 1200;

function calculateRatingRange(puzzleNumber: number): { min: number; max: number } {
  const baseMin = BASE_RATING_MIN;
  const baseMax = BASE_RATING_MAX;
  const increment = DIFFICULTY_INCREMENT * puzzleNumber;
  
  return {
    min: baseMin + increment,
    max: baseMax + increment,
  };
}

export function PuzzleRushProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PuzzleRushSession | null>(null);
  const [stats, setStats] = useState<PuzzleRushStats | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPuzzleSolvedRef = useRef(false);
  const lastMistakesRef = useRef(0);

  // Real-time timer update and session end check
  useEffect(() => {
    if (!session || !session.isActive) {
      setTimeRemaining(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // For survival mode, no timer
    if (session.timeLimit === null) {
      setTimeRemaining(null);
      return;
    }

    // Update timer every second for real-time display
    const updateTimer = () => {
      const elapsed = Date.now() - session.startTime;
      const remaining = Math.max(0, Math.floor((session.timeLimit! - elapsed) / 1000));
      setTimeRemaining(remaining);

      // Check if time's up
      if (elapsed >= session.timeLimit!) {
        // Time's up - end session
        const endTime = Date.now();
        const totalTime = endTime - session.startTime;
        const averageTime = session.score > 0 ? totalTime / session.score : 0;

        const finalStats: PuzzleRushStats = {
          puzzlesSolved: session.score,
          totalTime: totalTime,
          averageTimePerPuzzle: averageTime,
          strikesUsed: session.strikes,
          finalRating: session.baseRating + (session.currentPuzzleNumber * DIFFICULTY_INCREMENT),
          mode: session.mode,
        };

        setStats(finalStats);
        setSession({
          ...session,
          endTime,
          isActive: false,
        });
        setTimeRemaining(0);
      }
    };

    // Initial update
    updateTimer();

    // Set up interval to update every second for real-time display
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [session]);

  const startSession = useCallback((mode: PuzzleRushMode, loadPuzzle: (filters?: PuzzleFilters) => Promise<void>) => {
    const timeLimit = mode === "standard-3min" ? 3 * 60 * 1000 
                    : mode === "standard-5min" ? 5 * 60 * 1000 
                    : null; // survival mode

    const newSession: PuzzleRushSession = {
      mode,
      startTime: Date.now(),
      endTime: null,
      timeLimit,
      strikes: 0,
      score: 0,
      currentPuzzleNumber: 0,
      baseRating: BASE_RATING_MIN,
      isActive: true,
    };

    setSession(newSession);
    setStats(null);
    lastPuzzleSolvedRef.current = false;
    lastMistakesRef.current = 0;

    // Load first puzzle
    const ratingRange = calculateRatingRange(0);
    const filters: PuzzleFilters = {
      minRating: ratingRange.min,
      maxRating: ratingRange.max,
    };
    loadPuzzle(filters);
  }, []);

  const onPuzzleSolved = useCallback((loadPuzzle: (filters?: PuzzleFilters) => Promise<void>) => {
    // Use functional update to ensure we have the latest session state
    setSession((currentSession) => {
      if (!currentSession || !currentSession.isActive) return currentSession;

      const newScore = currentSession.score + 1;
      const newPuzzleNumber = currentSession.currentPuzzleNumber + 1;

      console.log("[PUZZLE RUSH] Puzzle solved! Score:", newScore, "Puzzle #:", newPuzzleNumber);

      // Update session
      const updatedSession: PuzzleRushSession = {
        ...currentSession,
        score: newScore,
        currentPuzzleNumber: newPuzzleNumber,
      };

      // Load next puzzle with increased difficulty (outside of setState to avoid timing issues)
      const ratingRange = calculateRatingRange(newPuzzleNumber);
      const filters: PuzzleFilters = {
        minRating: ratingRange.min,
        maxRating: ratingRange.max,
      };
      
      // Small delay before loading next puzzle to let user see success
      setTimeout(() => {
        loadPuzzle(filters);
      }, 1000);

      return updatedSession;
    });
  }, []);

  const endSession = useCallback(() => {
    if (!session) return;

    const endTime = Date.now();
    const totalTime = endTime - session.startTime;
    const averageTime = session.score > 0 ? totalTime / session.score : 0;

    const finalStats: PuzzleRushStats = {
      puzzlesSolved: session.score,
      totalTime: totalTime,
      averageTimePerPuzzle: averageTime,
      strikesUsed: session.strikes,
      finalRating: session.baseRating + (session.currentPuzzleNumber * DIFFICULTY_INCREMENT),
    };

    const endedSession: PuzzleRushSession = {
      ...session,
      endTime,
      isActive: false,
    };

    setSession(endedSession);
    setStats(finalStats);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [session]);

  const onPuzzleFailed = useCallback(() => {
    // Use functional update to ensure we have the latest session state
    setSession((currentSession) => {
      if (!currentSession || !currentSession.isActive) return currentSession;

      const newStrikes = currentSession.strikes + 1;
      console.log("[PUZZLE RUSH] Puzzle failed! Strikes:", newStrikes);

      if (newStrikes >= 3) {
        // End session - 3 strikes
        endSession();
        return currentSession; // endSession will handle the update
      } else {
        // Continue with a strike - just update the strikes count
        // Don't load a new puzzle, let the user continue with the current puzzle
        const updatedSession: PuzzleRushSession = {
          ...currentSession,
          strikes: newStrikes,
        };

        return updatedSession;
      }
    });
  }, [endSession]);

  return (
    <PuzzleRushContext.Provider
      value={{
        session,
        stats,
        timeRemaining,
        isActive: session?.isActive ?? false,
        startSession,
        endSession,
        onPuzzleSolved,
        onPuzzleFailed,
      }}
    >
      {children}
    </PuzzleRushContext.Provider>
  );
}

export function usePuzzleRush() {
  const context = useContext(PuzzleRushContext);
  if (context === undefined) {
    throw new Error("usePuzzleRush must be used within a PuzzleRushProvider");
  }
  return context;
}

