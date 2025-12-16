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
  onPuzzleFailed: (loadPuzzle: (filters?: PuzzleFilters) => Promise<void>) => void;
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
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPuzzleSolvedRef = useRef(false);
  const lastMistakesRef = useRef(0);

  // Calculate time remaining
  const timeRemaining = session && session.timeLimit !== null && session.isActive
    ? Math.max(0, Math.floor((session.timeLimit - (Date.now() - session.startTime)) / 1000))
    : null;

  // Check if session should end due to time
  useEffect(() => {
    if (!session || !session.isActive) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // For survival mode, no timer
    if (session.timeLimit === null) {
      return;
    }

    // Set up timer interval
    timerIntervalRef.current = setInterval(() => {
      setSession((currentSession) => {
        if (!currentSession || !currentSession.isActive) return currentSession;
        const elapsed = Date.now() - currentSession.startTime;
        if (elapsed >= currentSession.timeLimit!) {
          // Time's up - end session
          const endTime = Date.now();
          const totalTime = endTime - currentSession.startTime;
          const averageTime = currentSession.score > 0 ? totalTime / currentSession.score : 0;

          const finalStats: PuzzleRushStats = {
            puzzlesSolved: currentSession.score,
            totalTime: totalTime,
            averageTimePerPuzzle: averageTime,
            strikesUsed: currentSession.strikes,
            finalRating: currentSession.baseRating + (currentSession.currentPuzzleNumber * DIFFICULTY_INCREMENT),
          };

          setStats(finalStats);

          return {
            ...currentSession,
            endTime,
            isActive: false,
          };
        }
        return currentSession;
      });
    }, 100); // Check every 100ms for smooth countdown

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
    if (!session || !session.isActive) return;

    const newScore = session.score + 1;
    const newPuzzleNumber = session.currentPuzzleNumber + 1;

    // Update session
    const updatedSession: PuzzleRushSession = {
      ...session,
      score: newScore,
      currentPuzzleNumber: newPuzzleNumber,
    };

    setSession(updatedSession);

    // Load next puzzle with increased difficulty
    const ratingRange = calculateRatingRange(newPuzzleNumber);
    const filters: PuzzleFilters = {
      minRating: ratingRange.min,
      maxRating: ratingRange.max,
    };
    
    // Small delay before loading next puzzle
    setTimeout(() => {
      loadPuzzle(filters);
    }, 1000);
  }, [session]);

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

  const onPuzzleFailed = useCallback((loadPuzzle: (filters?: PuzzleFilters) => Promise<void>) => {
    if (!session || !session.isActive) return;

    const newStrikes = session.strikes + 1;

    if (newStrikes >= 3) {
      // End session - 3 strikes
      endSession();
    } else {
      // Continue with a strike
      const updatedSession: PuzzleRushSession = {
        ...session,
        strikes: newStrikes,
      };
      setSession(updatedSession);

      // Load next puzzle (same difficulty level, but new puzzle)
      const ratingRange = calculateRatingRange(session.currentPuzzleNumber);
      const filters: PuzzleFilters = {
        minRating: ratingRange.min,
        maxRating: ratingRange.max,
      };
      
      setTimeout(() => {
        loadPuzzle(filters);
      }, 1000);
    }
  }, [session, endSession]);

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

