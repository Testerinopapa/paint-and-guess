# Puzzle Mode: Complete Board Logic Summary

## Overview

This document provides a comprehensive summary of all board-related logic in puzzle mode, including state management, move handling, visual updates, and user interactions.

## Table of Contents

1. [Board State Management](#board-state-management)
2. [Position Computation](#position-computation)
3. [Move Application](#move-application)
4. [User Move Handling](#user-move-handling)
5. [Automatic Moves](#automatic-moves)
6. [Board Orientation](#board-orientation)
7. [Visual Styling](#visual-styling)
8. [Board Controls](#board-controls)
9. [Progress Tracking](#progress-tracking)
10. [Chessboard Integration](#chessboard-integration)

---

## Board State Management

### Core State Variables

**Location:** `src/app/puzzle/page.tsx`

```typescript
const [pz, setPz] = useState<Puzzle | null>(null);        // Current puzzle data
const [fen, setFen] = useState<string | null>(null);     // Current position FEN
const [idx, setIdx] = useState(0);                       // Current move index in solution
const [solved, setSolved] = useState(false);             // Puzzle completion status
const [message, setMessage] = useState<string | null>(null); // User feedback messages
const [showHint, setShowHint] = useState(false);         // Hint visibility
const [playerSide, setPlayerSide] = useState<"white"|"black">("white"); // Player's color
```

### State Initialization

When a new puzzle loads (lines 147-181):

1. **Puzzle data** (`pz`): Set from API response
2. **Initial FEN** (`fen`): Set to puzzle's starting position
3. **Move index** (`idx`): Reset to 0
4. **Solved status** (`solved`): Reset to false
5. **Player side** (`playerSide`): Determined from solution PV
   - Calculates who makes the last move (the solver)
   - Formula: `lastMover = (pv.length % 2 === 1) ? startTurn : oppositeTurn`

### State Update Flow

```
Puzzle Loads
    ↓
setPz(j) → setFen(j.fen) → setIdx(0) → setSolved(false)
    ↓
[If mate puzzle] → Auto-advance move → setFen(newFen) → setIdx(1)
    ↓
boardFen recomputes → Chessboard updates
```

---

## Position Computation

### Board FEN Derivation

**Location:** `src/app/puzzle/page.tsx` (lines 194-199)

```typescript
const boardFen = useMemo(() => {
  const f = fen ?? pz?.fen;  // Use current FEN, fallback to puzzle's initial FEN
  if (!f) return undefined;
  try { 
    const pr = parseFen(f); 
    if (pr.isOk) return f;   // Validate FEN is parseable
  } catch {}
  return undefined;
}, [fen, pz]);
```

**Purpose:**
- Derives current board position from state
- Provides fallback to puzzle's initial FEN if current FEN is null
- Validates FEN format before passing to chessboard

### Side to Move Computation

**Location:** `src/app/puzzle/page.tsx` (lines 201-205)

```typescript
const sideToMove = useMemo<"white"|"black">(() => {
  const f = boardFen;
  try { 
    if (f) { 
      const pr = parseFen(f); 
      if (pr.isOk) return (pr.unwrap().turn as "white"|"black"); 
    } 
  } catch {}
  return (pz?.sideToMove === "black" ? "black" : "white"); // Fallback
}, [boardFen, pz?.sideToMove]);
```

**Purpose:**
- Extracts whose turn it is from current FEN
- Falls back to puzzle's stored `sideToMove` if FEN parsing fails

---

## Move Application

### Core Move Application Function

**Location:** `src/app/puzzle/page.tsx` (lines 211-241)

```typescript
const applyMoveUci = useCallback((fenStr: string, uci: string): string | null => {
  // 1. Parse FEN string
  const setupRes = parseFen(fenStr);
  if (setupRes.isErr) return null;
  
  // 2. Setup chess position
  const res = setupPosition("chess", setupRes.unwrap());
  if (res.isErr) return null;
  const pos: Position = res.unwrap();
  
  // 3. Parse UCI move (e.g., "e2e4")
  const mv = parseUci(uci) as Move | undefined;
  if (!mv) return null;
  
  // 4. Validate move legality
  if (!pos.isLegal(mv)) return null;
  
  // 5. Apply move to position
  pos.play(mv);
  
  // 6. Return new FEN string
  const newFen = makeFen(pos.toSetup());
  return newFen;
}, [addDebugLog]);
```

**Process:**
1. **Parse FEN**: Converts FEN string to position setup
2. **Setup Position**: Creates chess position object using `chessops`
3. **Parse UCI**: Converts UCI move string to move object
4. **Validate**: Checks if move is legal in current position
5. **Apply**: Executes move on position object
6. **Return**: Generates new FEN string from updated position

**Error Handling:**
- Returns `null` if any step fails
- Logs errors to debug log
- Gracefully handles invalid moves/positions

---

## User Move Handling

### Piece Drop Handler

**Location:** `src/app/puzzle/page.tsx` (lines 243-297)

```typescript
const onPieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
  // Early returns
  if (!pz || !fen || solved) return false;
  
  // Get expected move from solution
  const expected = pv[idx];
  if (!expected) return false;
  
  // Compare user move with expected move
  const attempt = `${sourceSquare}${targetSquare}`;
  const normalizedExpected = expected.slice(0, 4); // Ignore promotion suffix
  
  if (attempt !== normalizedExpected) {
    setMessage("Incorrect. Try again.");
    return false; // Reject move
  }
  
  // Apply player's correct move
  const next = applyMoveUci(fen, expected);
  if (!next) return false;
  
  // Update state
  setFen(next);
  setIdx(idx + 1);
  setMessage(null);
  setShowHint(false);
  
  // Auto-play opponent reply
  if (pv[nextIdx]) {
    const afterReply = applyMoveUci(next, pv[nextIdx]);
    if (afterReply) {
      setFen(afterReply);
      setIdx(nextIdx + 1);
    }
  }
  
  // Check if solved
  if (nextIdx >= pv.length) {
    setSolved(true);
  }
  
  return true; // Accept move
}, [pz, fen, pv, idx, solved, applyMoveUci]);
```

### Move Validation Logic

**Steps:**
1. **Pre-checks**: Verify puzzle exists, position exists, puzzle not solved
2. **Get expected move**: Retrieve expected move from solution PV at current index
3. **Normalize comparison**: 
   - User move: `sourceSquare + targetSquare` (e.g., "e2e4")
   - Expected move: First 4 characters of UCI (ignores promotion suffix like "e7e8q")
4. **Compare**: Exact string match required
5. **Apply if correct**: Use `applyMoveUci()` to update position
6. **Auto-play reply**: Automatically apply opponent's next move from PV
7. **Update progress**: Advance index, check completion

**Move Format:**
- **UCI format**: "e2e4" (source + target)
- **Promotion**: "e7e8q" (source + target + promotion piece)
- **Comparison**: Only first 4 characters compared (ignores promotion)

---

## Automatic Moves

### Puzzle Loading Auto-Move

**Location:** `src/app/puzzle/page.tsx` (lines 163-175)

For mate puzzles, if the player's side doesn't match the starting turn:

```typescript
const isMateMotif = selectedMotif && 
  (selectedMotif === "mate" || selectedMotif.startsWith("mateIn"));

if (isMateMotif && lastMover !== startTurn && moves[0]) {
  // Auto-advance first move (opponent's move)
  const n = applyMoveUci(j.fen, moves[0]);
  if (n) { 
    setFen(n); 
    setIdx(1);
  }
}
```

**Purpose:** Ensures player is always the one to move in mate puzzles.

### Opponent Reply Auto-Play

**Location:** `src/app/puzzle/page.tsx` (lines 275-287)

After player makes correct move:

```typescript
// Auto-play opponent reply if exists
if (pv[nextIdx]) {
  const afterReply = applyMoveUci(next, pv[nextIdx]);
  if (afterReply) {
    setFen(afterReply);
    nextIdx += 1;
    setIdx(nextIdx);
  }
}
```

**Purpose:** Automatically plays opponent's response from solution PV.

---

## Board Orientation

### Player Side Determination

**Location:** `src/app/puzzle/page.tsx` (lines 152-162, 207-209)

```typescript
// Calculate who makes the last move (the solver)
const startTurn = parseFen(j.fen).turn; // "white" | "black"
const lastMover: "white"|"black" = 
  (moves.length % 2 === 1) ? startTurn : (startTurn === 'white' ? 'black' : 'white');

setPlayerSide(lastMover);
const orientation = playerSide; // Used for board orientation
```

**Logic:**
- **Odd PV length**: Last mover = starting turn
- **Even PV length**: Last mover = opposite of starting turn

### Side Swapping

**Location:** `src/app/puzzle/page.tsx` (lines 467-482)

For non-mate puzzles, allows player to swap sides:

```typescript
const newSide = orientation === 'white' ? 'black' : 'white';
setPlayerSide(newSide);

// If at start and it's not player's turn, auto-advance one move
if (idx === 0 && pv[0] && boardFen) {
  if (sideToMove !== newSide) {
    const n = applyMoveUci(boardFen, pv[0]);
    if (n) { setFen(n); setIdx(1); }
  }
}
```

**Purpose:** Allows player to view puzzle from opposite side's perspective.

---

## Visual Styling

### Square Styles (Hints)

**Location:** `src/app/puzzle/page.tsx` (lines 338-348)

```typescript
const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
  const styles: Record<string, React.CSSProperties> = {};
  if (showHint && pv[idx]) {
    const uci = pv[idx];
    const from = uci.slice(0, 2);  // Source square
    const to = uci.slice(2, 4);    // Target square
    styles[from] = { 
      outline: "2px solid rgba(234,179,8,.9)", 
      outlineOffset: "-2px", 
      backgroundColor: "rgba(234,179,8,.15)" 
    };
    styles[to] = { 
      outline: "2px solid rgba(234,179,8,.9)", 
      outlineOffset: "-2px", 
      backgroundColor: "rgba(234,179,8,.15)" 
    };
  }
  return styles;
}, [showHint, pv, idx]);
```

**Purpose:** Highlights source and target squares of next expected move when hint is enabled.

**Visual Effect:**
- Yellow outline (`rgba(234,179,8,.9)`)
- Yellow background tint (`rgba(234,179,8,.15)`)
- Applied to both source and target squares

---

## Board Controls

### Reset Function

**Location:** `src/app/puzzle/page.tsx` (lines 299-305)

```typescript
const reset = useCallback(() => {
  if (!pz) return;
  setFen(pz.fen);      // Reset to initial position
  setIdx(0);           // Reset move index
  setSolved(false);    // Clear solved status
  setMessage(null);    // Clear messages
}, [pz]);
```

**Purpose:** Resets puzzle to starting position.

### Play Step Function

**Location:** `src/app/puzzle/page.tsx` (lines 320-336)

```typescript
const playStep = useCallback(() => {
  if (!pz || !fen || solved) return;
  const expected = pv[idx];
  if (!expected) return;
  
  // Apply expected move
  const next = applyMoveUci(fen, expected);
  if (!next) return;
  
  let nextIdx = idx + 1;
  setFen(next);
  setIdx(nextIdx);
  setMessage(null);
  setShowHint(false);
  
  // Auto-play opponent reply
  if (pv[nextIdx]) {
    const afterReply = applyMoveUci(next, pv[nextIdx]);
    if (afterReply) { 
      setFen(afterReply); 
      nextIdx += 1; 
      setIdx(nextIdx); 
    }
  }
  
  // Check completion
  if (nextIdx >= pv.length) setSolved(true);
}, [pz, fen, solved, pv, idx, applyMoveUci]);
```

**Purpose:** Automatically plays the next move in the solution sequence.

### Play All Function

**Location:** `src/app/puzzle/page.tsx` (lines 307-318)

```typescript
const playAll = useCallback(() => {
  if (!pz) return;
  let f = pz.fen;
  
  // Apply all moves in solution
  for (let i = 0; i < pv.length; i++) {
    const n = applyMoveUci(f, pv[i]);
    if (!n) break;
    f = n;
  }
  
  setFen(f);
  setIdx(pv.length);
  setSolved(true);
}, [pz, pv, applyMoveUci]);
```

**Purpose:** Instantly plays entire solution sequence.

---

## Progress Tracking

### Solution PV Parsing

**Location:** `src/app/puzzle/page.tsx` (lines 190-192)

```typescript
const pv = useMemo(() => {
  try { 
    return pz ? (JSON.parse(pz.solutionPv) as string[]) : []; 
  } catch { 
    return []; 
  }
}, [pz]);
```

**Purpose:** Parses solution PV from puzzle data as array of UCI moves.

### Progress Display

**Location:** `src/app/puzzle/page.tsx` (line 458)

```typescript
<div className="text-sm">
  Progress: {idx} / {pv.length} {solved ? "• Solved!" : ""}
</div>
```

**Purpose:** Shows current move index out of total moves in solution.

### Completion Detection

**Location:** `src/app/puzzle/page.tsx` (lines 288-291)

```typescript
if (nextIdx >= pv.length) {
  setSolved(true);
}
```

**Purpose:** Marks puzzle as solved when all moves are completed.

---

## Chessboard Integration

### Component Configuration

**Location:** `src/app/puzzle/page.tsx` (line 453)

```typescript
<Chessboard 
  options={{ 
    position: boardFen === "startpos" ? undefined : boardFen,
    allowDragging: !solved,
    onPieceDrop: ({ sourceSquare, targetSquare }) => 
      onPieceDrop({ sourceSquare, targetSquare: targetSquare || sourceSquare }),
    boardOrientation: orientation,
    squareStyles 
  }} 
/>
```

### Configuration Options

1. **`position`**: Current board FEN (or `undefined` for starting position)
2. **`allowDragging`**: Disabled when puzzle is solved
3. **`onPieceDrop`**: Callback for user move attempts
4. **`boardOrientation`**: Player's perspective ("white" or "black")
5. **`squareStyles`**: Visual hints for next move squares

### Dynamic Import

**Location:** `src/app/puzzle/page.tsx` (line 9)

```typescript
const Chessboard = dynamic(
  () => import("react-chessboard").then(m => m.Chessboard), 
  { ssr: false }
);
```

**Purpose:** Prevents server-side rendering issues with chessboard component.

### Position Update Mechanism

**How it works:**
1. State changes (`fen` updates) trigger React re-renders
2. `boardFen` memo recomputes from `fen` state
3. Chessboard receives new `position` prop
4. `react-chessboard` library handles visual update/animation
5. Pieces automatically move to match new position

**No manual animation code** - library handles transitions automatically.

---

## Complete Flow Diagram

```
User Interaction / Puzzle Load
    ↓
┌─────────────────────────────────────┐
│ State Management                    │
│ - pz (puzzle data)                  │
│ - fen (current position)            │
│ - idx (move index)                  │
│ - solved (completion status)        │
│ - playerSide (orientation)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Position Computation                │
│ - boardFen (derived from fen)        │
│ - sideToMove (from FEN)              │
│ - pv (solution moves)                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Move Handling                       │
│ ├─ User Move (onPieceDrop)          │
│ │  ├─ Validate against expected     │
│ │  ├─ Apply if correct              │
│ │  └─ Auto-play opponent reply      │
│ ├─ Auto-Move (mate puzzle)          │
│ ├─ Play Step (manual)               │
│ └─ Play All (manual)                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Visual Updates                      │
│ - Square styles (hints)             │
│ - Board orientation                 │
│ - Progress display                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ react-chessboard Component          │
│ - Receives position prop            │
│ - Handles piece rendering           │
│ - Animates position changes         │
└─────────────────────────────────────┘
```

---

## Key Dependencies

### Libraries

- **`react-chessboard`** (^5.5.0): Visual chessboard component
- **`chessops`** (^0.14.2): Chess position/move handling
  - `parseFen`, `makeFen`: FEN parsing/generation
  - `setupPosition`: Position creation
  - `parseUci`: UCI move parsing
  - `Position`, `Move`: Type definitions

### React Hooks

- **`useState`**: State management
- **`useEffect`**: Side effects (puzzle loading)
- **`useMemo`**: Computed values (boardFen, pv, squareStyles)
- **`useCallback`**: Memoized functions (move handlers)

---

## Error Handling

### Move Application Errors

- **Invalid FEN**: Returns `null`, logs error
- **Invalid UCI**: Returns `null`, logs error
- **Illegal move**: Returns `null`, logs error
- **Position setup failure**: Returns `null`, logs error

### User Move Errors

- **No puzzle loaded**: Early return, no action
- **Puzzle solved**: Early return, prevents moves
- **No expected move**: Early return, logs error
- **Move mismatch**: Shows "Incorrect. Try again." message
- **Move application failure**: Returns `false`, rejects move

### State Validation

- **FEN parsing**: Validates before passing to chessboard
- **PV parsing**: Handles JSON parse errors gracefully
- **Fallback values**: Provides defaults when parsing fails

---

## Summary

The board logic in puzzle mode is built on a **state-driven architecture**:

1. **State Management**: React state tracks puzzle data, position, and progress
2. **Position Computation**: Derived values compute board position and side to move
3. **Move Application**: Core function applies moves using `chessops` library
4. **User Interaction**: Validates moves against solution, auto-plays replies
5. **Visual Updates**: React re-renders trigger chessboard position updates
6. **Library Integration**: `react-chessboard` handles all visual rendering/animation

The system is **declarative** - state changes automatically trigger visual updates through React's rendering cycle and the chessboard library's position prop handling.

