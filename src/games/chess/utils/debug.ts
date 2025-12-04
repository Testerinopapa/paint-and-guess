/**
 * Debug utility for puzzle and board mode
 * Enable/disable via localStorage or environment variable
 */

const DEBUG_KEY = "chess-debug-enabled";
const DEBUG_PREFIX = {
  PUZZLE: "[PUZZLE]",
  BOARD: "[BOARD]",
  MOVE: "[MOVE]",
  STATE: "[STATE]",
} as const;

// Check if debugging is enabled
export const isDebugEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  
  // Check localStorage first (user override)
  const stored = localStorage.getItem(DEBUG_KEY);
  if (stored !== null) {
    return stored === "true";
  }
  
  // Default to enabled in development mode
  // Check both DEV mode and explicit env var
  const isDev = import.meta.env.MODE === "development" || import.meta.env.DEV;
  const explicitDebug = import.meta.env.VITE_DEBUG_CHESS === "true";
  
  // Enable by default in dev, or if explicitly set
  // If explicitly disabled via localStorage "false", respect that
  const explicitlyDisabled = localStorage.getItem(DEBUG_KEY) === "false";
  if (explicitlyDisabled) return false;
  
  return isDev || explicitDebug;
};

// Toggle debugging
export const toggleDebug = (enabled: boolean): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEBUG_KEY, enabled.toString());
  }
};

// Debug logger
const debugLog = (prefix: string, message: string, data?: any) => {
  if (!isDebugEnabled()) return;
  
  const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
  const logMessage = `${prefix} [${timestamp}] ${message}`;
  
  if (data !== undefined) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

// Puzzle-specific debug functions
export const debugPuzzle = {
  load: (filters?: any) => debugLog(DEBUG_PREFIX.PUZZLE, "Loading puzzle", filters),
  loaded: (puzzle: any) => debugLog(DEBUG_PREFIX.PUZZLE, "Puzzle loaded", {
    id: puzzle?.id,
    rating: puzzle?.rating,
    motifs: puzzle?.motifs,
    fen: puzzle?.fen,
    sideToMove: puzzle?.sideToMove,
    solutionLength: Array.isArray(puzzle?.solutionPv) ? puzzle.solutionPv.length : "unknown",
  }),
  autoAdvance: (from: string, to: string, newFen: string, moveIndex: number) => 
    debugLog(DEBUG_PREFIX.PUZZLE, "Auto-advancing mate puzzle", { from, to, newFen, moveIndex }),
  reset: () => debugLog(DEBUG_PREFIX.PUZZLE, "Resetting puzzle"),
  error: (error: any, context?: string) => 
    debugLog(DEBUG_PREFIX.PUZZLE, `ERROR${context ? ` (${context})` : ""}`, error),
};

// Move-specific debug functions
export const debugMove = {
  attempt: (from: string, to: string, expected: string) => 
    debugLog(DEBUG_PREFIX.MOVE, "Move attempt", { from, to, expected, userMove: `${from}${to}` }),
  correct: (from: string, to: string, newFen: string, moveIndex: number) => 
    debugLog(DEBUG_PREFIX.MOVE, "✓ Correct move", { from, to, newFen, moveIndex }),
  incorrect: (from: string, to: string, expected: string, mistakes: number) => 
    debugLog(DEBUG_PREFIX.MOVE, "✗ Incorrect move", { from, to, expected, mistakes }),
  autoReply: (from: string, to: string, newFen: string) => 
    debugLog(DEBUG_PREFIX.MOVE, "Auto-playing opponent reply", { from, to, newFen }),
  error: (error: any, context?: string) => 
    debugLog(DEBUG_PREFIX.MOVE, `ERROR${context ? ` (${context})` : ""}`, error),
};

// State-specific debug functions
export const debugState = {
  update: (prev: any, next: any, reason?: string) => {
    if (!isDebugEnabled()) return;
    const changes: any = {};
    Object.keys(next).forEach(key => {
      if (prev[key] !== next[key]) {
        changes[key] = { from: prev[key], to: next[key] };
      }
    });
    debugLog(DEBUG_PREFIX.STATE, `State update${reason ? ` (${reason})` : ""}`, changes);
  },
  fen: (oldFen: string, newFen: string, reason?: string) => 
    debugLog(DEBUG_PREFIX.STATE, `FEN changed${reason ? ` (${reason})` : ""}`, { oldFen, newFen }),
  moveIndex: (oldIndex: number, newIndex: number, reason?: string) => 
    debugLog(DEBUG_PREFIX.STATE, `Move index changed${reason ? ` (${reason})` : ""}`, { oldIndex, newIndex }),
  solved: (solved: boolean) => 
    debugLog(DEBUG_PREFIX.STATE, `Puzzle ${solved ? "SOLVED" : "UNSOLVED"}`),
};

// Board-specific debug functions
export const debugBoard = {
  render: (fen: string, orientation: string) => 
    debugLog(DEBUG_PREFIX.BOARD, "Rendering board", { fen, orientation }),
  fenUpdate: (oldFen: string | undefined, newFen: string) => 
    debugLog(DEBUG_PREFIX.BOARD, "FEN prop updated", { oldFen, newFen }),
  gameInstance: (fen: string, valid: boolean) => 
    debugLog(DEBUG_PREFIX.BOARD, `Game instance ${valid ? "created" : "invalid"}`, { fen }),
  selection: (square: string | null, legalMoves: string[]) => 
    debugLog(DEBUG_PREFIX.BOARD, "Square selected", { square, legalMovesCount: legalMoves.length }),
  error: (error: any, context?: string) => 
    debugLog(DEBUG_PREFIX.BOARD, `ERROR${context ? ` (${context})` : ""}`, error),
};

// Helper to log full puzzle state
export const debugPuzzleState = (state: any) => {
  if (!isDebugEnabled()) return;
  debugLog(DEBUG_PREFIX.STATE, "Full puzzle state", {
    puzzleId: state.puzzle?.id,
    currentFen: state.currentFen,
    moveIndex: state.moveIndex,
    solutionLength: state.solutionPv?.length || 0,
    solved: state.solved,
    mistakes: state.mistakes,
    hintsUsed: state.hintsUsed,
    showSolution: state.showSolution,
  });
};

// Expose debug toggle to window for easy console access
if (typeof window !== "undefined") {
  (window as any).toggleChessDebug = (enabled?: boolean) => {
    const newState = enabled !== undefined ? enabled : !isDebugEnabled();
    toggleDebug(newState);
    console.log(`%cChess debugging ${newState ? "ENABLED" : "DISABLED"}`, 
      `color: ${newState ? "green" : "red"}; font-weight: bold;`);
    console.log("Usage: toggleChessDebug(true/false) or toggleChessDebug() to toggle");
  };
  
  // Log current state on load and test
  const enabled = isDebugEnabled();
  if (enabled) {
    console.log("%c[CHESS DEBUG] Debugging is ENABLED", "color: green; font-weight: bold;");
    console.log("Use toggleChessDebug(false) to disable, or toggleChessDebug() to toggle");
    // Test log to verify it's working
    console.log("[CHESS DEBUG] Test log - if you see this, debugging is working!");
  } else {
    // Only show disabled message if we're in dev mode (to avoid spam in production)
    const isDev = import.meta.env.MODE === "development" || import.meta.env.DEV;
    if (isDev) {
      console.log("%c[CHESS DEBUG] Debugging is DISABLED", "color: orange; font-weight: bold;");
      console.log("Use toggleChessDebug(true) to enable");
    }
  }

  // Expose SVG debugging toggle
  (window as any).toggleChessSvgDebug = (enabled?: boolean) => {
    const currentState = !!(window as any).__CHESS_DEBUG__;
    const newState = enabled !== undefined ? enabled : !currentState;
    (window as any).__CHESS_DEBUG__ = newState;
    console.log(`%cChess SVG debugging ${newState ? "ENABLED" : "DISABLED"}`, 
      `color: ${newState ? "green" : "red"}; font-weight: bold;`);
    console.log("This will show red dashed borders around SVG viewBoxes and log rendering details");
    if (newState) {
      console.log("Refresh the page to see the debug overlays");
    }
  };
  
  // Log SVG debug availability
  if (enabled) {
    console.log("Use toggleChessSvgDebug(true) to enable SVG rendering debugging");
  }
}

