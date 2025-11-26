# State Management Refactor - Summary

## Overview

Refactored the Paint & Guess game state management to eliminate overlapping flags and create a single source of truth. This reduces complexity, prevents state inconsistencies, and makes the codebase more maintainable.

## Changes Made

### 1. Consolidated State Structure

**Before:**
```typescript
interface GameState {
  isGameActive: boolean;        // Redundant with gamePhase
  gamePhase: GamePhase;          // Overlaps with isGameActive
  isDrawer: boolean;             // Redundant (can be derived)
  currentDrawer: Player | null;  // Used to compute isDrawer
  currentWord: string | null;     // Confusing with revealedWord
  revealedWord: string | null;   // Separate from currentWord
  roundNumber: number;
  timeLeft: number;
  roundTime: number;
  roundWinner: Player | null;
  // ... many more fields
}
```

**After:**
```typescript
interface RoundState {
  number: number;
  drawer: Player | null;
  word: string | null;           // For drawer only
  revealedWord: string | null;   // Shown at round end
  timeLeft: number;
  roundTime: number;
  winner: Player | null;
}

interface GameState {
  phase: GamePhase;              // Single source of truth
  round: RoundState;              // Consolidated round data
  // ... other fields
  // Removed: isGameActive, isDrawer (now computed)
}
```

### 2. Created Derived Value Functions

**New Helper Functions:**
```typescript
function getIsGameActive(phase: GamePhase): boolean {
  return phase !== "lobby" && phase !== "game-ended";
}

function getIsDrawer(state: GameState): boolean {
  return state.selfId !== null && state.round.drawer?.id === state.selfId;
}

function getCurrentWord(state: GameState): string | null {
  return getIsDrawer(state) ? state.round.word : null;
}
// ... and more
```

**Benefits:**
- Single source of truth for computed values
- No risk of state getting out of sync
- Easier to test and debug
- Clearer intent

### 3. Updated Context Interface

**Before:**
```typescript
interface GameContextType {
  gameState: GameState;
  // Components had to compute values themselves
}
```

**After:**
```typescript
interface GameContextType {
  gameState: GameState;
  // Computed values exposed for convenience
  isGameActive: boolean;
  isDrawer: boolean;
  currentDrawer: Player | null;
  currentWord: string | null;
  roundNumber: number;
  timeLeft: number;
  roundTime: number;
  revealedWord: string | null;
  roundWinner: Player | null;
  // ... actions
}
```

**Benefits:**
- Components can use computed values directly
- Backward compatible (old code still works)
- No need to recompute in every component

### 4. Updated All Components

**Components Updated:**
- ✅ `GameContext.tsx` - Core state management
- ✅ `Canvas.tsx` - Drawing logic
- ✅ `GameHeader.tsx` - Header display
- ✅ `Chat.tsx` - Chat/guess input
- ✅ `PlayerList.tsx` - Player display
- ✅ `Room.tsx` - Room layout
- ✅ `RoundSummary.tsx` - Round summary overlay

**Changes:**
- Replaced `gameState.isGameActive` → `isGameActive`
- Replaced `gameState.isDrawer` → `isDrawer`
- Replaced `gameState.currentDrawer` → `currentDrawer`
- Replaced `gameState.currentWord` → `currentWord`
- Replaced `gameState.roundNumber` → `roundNumber`
- Replaced `gameState.timeLeft` → `timeLeft`
- Replaced `gameState.gamePhase` → `gameState.phase`
- Replaced `gameState.revealedWord` → `revealedWord`
- Replaced `gameState.roundWinner` → `roundWinner`

### 5. Fixed State Update Logic

**Before:**
```typescript
// Multiple places computing isDrawer
const isDrawer = prev.selfId ? drawer.id === prev.selfId : false;
setGameState(prev => ({ ...prev, isDrawer, ... }));
```

**After:**
```typescript
// Single place, computed automatically
setGameState(prev => ({
  ...prev,
  round: { ...prev.round, drawer }
}));
// isDrawer is computed from state.round.drawer
```

## Benefits

### 1. **Eliminated Redundancy**
- Removed `isGameActive` (derived from `phase`)
- Removed `isDrawer` (derived from `round.drawer`)
- Consolidated round-related fields into `RoundState`

### 2. **Single Source of Truth**
- `phase` is the only indicator of game state
- `round.drawer` is the only source for drawer info
- No risk of flags getting out of sync

### 3. **Improved Maintainability**
- Clearer state structure
- Easier to understand data flow
- Less code duplication

### 4. **Better Type Safety**
- Round state is grouped logically
- Clearer relationships between fields
- Easier to validate state transitions

### 5. **Performance**
- Computed values are memoized in context
- No redundant state updates
- Fewer re-renders

## Migration Guide

### For Components

**Old Way:**
```typescript
const { gameState } = useGame();
const isDrawer = gameState.isDrawer;
const isGameActive = gameState.isGameActive;
```

**New Way:**
```typescript
const { isDrawer, isGameActive } = useGame();
// Or access via gameState if needed
const phase = gameState.phase;
```

### For State Updates

**Old Way:**
```typescript
setGameState(prev => ({
  ...prev,
  isGameActive: true,
  isDrawer: prev.selfId === drawer.id,
  currentDrawer: drawer,
  roundNumber: 1,
}));
```

**New Way:**
```typescript
setGameState(prev => ({
  ...prev,
  phase: "drawing",
  round: {
    ...prev.round,
    number: 1,
    drawer,
  },
}));
// isGameActive and isDrawer computed automatically
```

## Testing Checklist

- [ ] Game starts correctly
- [ ] Round transitions work
- [ ] Drawer role switches correctly
- [ ] Word is shown only to drawer
- [ ] Word is revealed at round end
- [ ] Timer counts down correctly
- [ ] Canvas clears on round transitions
- [ ] All UI components show correct state
- [ ] No console errors
- [ ] State persists across reconnections

## Files Changed

1. `src/games/paint-and-guess/state/GameContext.tsx` - Core refactor
2. `src/games/paint-and-guess/components/Canvas.tsx` - Updated to use new state
3. `src/games/paint-and-guess/components/GameHeader.tsx` - Updated to use new state
4. `src/games/paint-and-guess/components/Chat.tsx` - Updated to use new state
5. `src/games/paint-and-guess/components/PlayerList.tsx` - Updated to use new state
6. `src/games/paint-and-guess/components/RoundSummary.tsx` - Updated to use new state
7. `src/games/paint-and-guess/pages/Room.tsx` - Updated to use new state

## Next Steps

1. **Test thoroughly** - Verify all state transitions work
2. **Monitor for bugs** - Watch for any state-related issues
3. **Consider further refactoring**:
   - Split Canvas component
   - Remove custom DOM events
   - Add state machine for phase transitions
   - Add unit tests for state helpers

## Notes

- All changes are backward compatible via computed values
- Old code patterns still work but should be migrated
- State structure is now more scalable for future features
- Round state is now clearly separated from game state

