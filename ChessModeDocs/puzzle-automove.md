# Puzzle Mode: Automatic Piece Movement Logic

## Overview

When puzzles change in puzzle mode, the chess pieces automatically move to reflect the new position. This document explains how this automatic movement is implemented.

## Key Components

### 1. Puzzle Loading Trigger

**Location:** `src/app/puzzle/page.tsx` (lines 115-188)

When puzzle filters change (difficulty, rating range, or motif), a `useEffect` hook automatically fetches a new puzzle from the API:

```typescript
useEffect(() => {
  // Fetches new puzzle when filters change
  // Sets: setPz(j), setFen(j.fen), setIdx(0)
}, [minRating, maxRating, selectedMotif, difficulty]);
```

**What happens:**
- Fetches puzzle from `/api/puzzles/random`
- Sets initial puzzle state (`pz`)
- Sets initial FEN position (`fen`)
- Resets move index to 0

### 2. Automatic Move Application for Mate Puzzles

**Location:** `src/app/puzzle/page.tsx` (lines 163-175)

For mate puzzles, if the player's side doesn't match the starting turn, the system automatically advances one move from the solution:

```typescript
// If it's a mate puzzle and it's not player's turn at start, 
// advance one PV move so it's the player's turn now
const isMateMotif = selectedMotif && 
  (selectedMotif === "mate" || selectedMotif.startsWith("mateIn"));
if (isMateMotif && lastMover !== startTurn && moves[0]) {
  const n = applyMoveUci(j.fen, moves[0]);
  if (n) { 
    setFen(n);  // Updates position state
    setIdx(1);  // Advances to next move
  }
}
```

**Purpose:** Ensures the player is always the one to move in mate puzzles, automatically playing the opponent's first move if needed.

### 3. Move Application Function

**Location:** `src/app/puzzle/page.tsx` (lines 211-241)

The `applyMoveUci()` function applies a UCI move to a FEN position:

```typescript
const applyMoveUci = (fenStr: string, uci: string): string | null => {
  // 1. Parse FEN string
  // 2. Setup chess position
  // 3. Parse UCI move
  // 4. Validate move legality
  // 5. Apply move to position
  // 6. Return new FEN string
}
```

**Process:**
1. Parses the input FEN string
2. Sets up the chess position using `chessops`
3. Parses the UCI move (e.g., "e2e4")
4. Validates the move is legal
5. Applies the move to the position
6. Returns the new FEN string representing the updated position

### 4. Board Position Computation

**Location:** `src/app/puzzle/page.tsx` (lines 194-199)

The board position is computed from the `fen` state:

```typescript
const boardFen = useMemo(() => {
  const f = fen ?? pz?.fen;
  if (!f) return undefined;
  try { 
    const pr = parseFen(f); 
    if (pr.isOk) return f; 
  } catch {}
  return undefined;
}, [fen, pz]);
```

**Purpose:** Derives the current board position from state, with fallback to puzzle's initial FEN.

### 5. Chessboard Component Update

**Location:** `src/app/puzzle/page.tsx` (line 453)

The `boardFen` is passed to the `react-chessboard` component:

```typescript
<Chessboard 
  options={{ 
    position: boardFen === "startpos" ? undefined : boardFen,
    allowDragging: !solved,
    onPieceDrop: onPieceDrop,
    boardOrientation: orientation,
    squareStyles 
  }} 
/>
```

**How it works:**
- When the `position` prop changes, `react-chessboard` automatically updates the visual board
- The library handles the piece movement animation/transition
- Pieces appear to move automatically because the position state changes

## Flow Diagram

```
Puzzle Filter Changes
    ↓
useEffect Triggered
    ↓
Fetch New Puzzle from API
    ↓
Set Initial State:
  - setPz(j)          (puzzle data)
  - setFen(j.fen)     (initial position)
  - setIdx(0)         (reset move index)
    ↓
Check if Mate Puzzle
    ↓
[If mate puzzle AND player side ≠ starting turn]
    ↓
Auto-apply First Move:
  - applyMoveUci(j.fen, moves[0])
  - setFen(newFen)    (updated position)
  - setIdx(1)         (advance index)
    ↓
boardFen Recomputes (from fen state)
    ↓
Chessboard Component Receives New Position
    ↓
react-chessboard Updates Visual Board
    ↓
Pieces Automatically Move/Appear in New Position
```

## State Management

### Key State Variables

- **`fen`**: Current position FEN string (updates when moves are applied)
- **`pz`**: Current puzzle data object
- **`idx`**: Current move index in solution sequence
- **`boardFen`**: Computed board position (derived from `fen`)

### State Update Chain

1. **Puzzle loads** → `setFen(j.fen)` → `boardFen` updates → Board renders
2. **Auto-move applied** → `setFen(newFen)` → `boardFen` updates → Board animates
3. **User makes move** → `setFen(nextFen)` → `boardFen` updates → Board animates

## Automatic Movement Scenarios

### Scenario 1: Regular Puzzle Change
- User changes difficulty/motif filter
- New puzzle loads with its initial FEN
- Board updates to show new position
- **No automatic moves applied**

### Scenario 2: Mate Puzzle Alignment
- Mate puzzle loads where opponent moves first
- System detects player should be moving
- **Automatically applies opponent's first move**
- Board updates to show position after opponent's move
- Player can now make their move

### Scenario 3: User Makes Correct Move
- User drags piece to correct square
- System validates move
- **Automatically applies opponent's reply** (from solution PV)
- Board updates twice: user move → opponent reply

## Technical Details

### Dependencies

- **`chessops`**: FEN parsing, position setup, move validation
- **`react-chessboard`**: Visual chessboard component that handles position updates
- **React hooks**: `useState`, `useEffect`, `useMemo`, `useCallback` for state management

### Move Format

- **UCI format**: "e2e4" (source square + target square)
- **FEN format**: Standard chess position notation
- **Solution PV**: Array of UCI moves stored as JSON string

## Summary

The automatic piece movement works through a **state-driven update cycle**:

1. **State changes** (`fen` updates) trigger React re-renders
2. **Computed values** (`boardFen`) update based on state
3. **Component props** (Chessboard `position`) receive new values
4. **Library handles** the visual update/animation automatically

The system doesn't manually animate pieces—instead, it updates the position state, and `react-chessboard` handles the visual transition, making pieces appear to move automatically.

