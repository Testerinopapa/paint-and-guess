# Chess Mode - Layout & Structure

## Overview

This document describes the layout, structure, and organization of the chess game mode in the Game Hub. The chess mode is a fully integrated game featuring play, analysis, and puzzle modes.

## Directory Structure

```
src/games/chess/
├── index.ts                    # Component exports
├── hubEntry.tsx                 # Hub integration (preview card, metadata)
├── state/
│   ├── ChessContext.tsx         # Game state management for play/analyze modes
│   ├── PuzzleContext.tsx        # Puzzle-specific state management
│   ├── puzzleTypes.ts           # TypeScript types for puzzles
│   └── types.ts                 # General chess game types
├── components/
│   ├── ChessBoard.tsx           # Interactive chess board (for play/analyze)
│   ├── PuzzleBoard.tsx          # Standalone puzzle board component
│   └── GameInfo.tsx             # Game status and move history panel
├── data/
│   └── samplePuzzles.ts         # Sample puzzles (fallback when API unavailable)
└── pages/
    ├── Index.tsx                # Main page with tabs (Play, Analyze, Puzzles)
    ├── Play.tsx                 # Play mode page
    ├── Analyze.tsx              # Analysis mode page
    └── Puzzle.tsx               # Puzzle mode page
```

## Component Hierarchy

### Main Entry Point

**`src/games/chess/pages/Index.tsx`**
- Main landing page for chess mode
- Contains tab navigation (Play, Analyze, Puzzles)
- Routes to appropriate sub-pages based on selected tab
- Accessible at `/hub/games/chess`

```
Index.tsx
├── Tabs (Play | Analyze | Puzzles)
    ├── PlayPage (Play tab)
    ├── AnalyzePage (Analyze tab)
    └── PuzzlePage (Puzzles tab)
```

### Play Mode

**`src/games/chess/pages/Play.tsx`**
- Local two-player chess gameplay
- Wrapped in `ChessProvider` for game state
- Uses `ChessBoard` component for interaction
- Displays `GameInfo` panel with status and move history

```
Play.tsx
└── ChessProvider
    ├── ChessBoard (interactive board)
    └── GameInfo (status, history, controls)
```

**Components:**
- `ChessBoard` - Interactive board with click/drag-to-move
- `GameInfo` - Shows game status, move history, action buttons

### Analyze Mode

**`src/games/chess/pages/Analyze.tsx`**
- PGN import/export functionality
- Game replay and analysis
- Wrapped in `ChessProvider` for game state
- Uses `ChessBoard` for visualization

```
Analyze.tsx
└── ChessProvider
    ├── PGN Import UI (textarea, file upload)
    ├── ChessBoard (view-only with replay)
    └── Export Controls (copy PGN, download)
```

**Features:**
- Import PGN from string or file
- Export PGN to clipboard or download
- View game on board
- Clear/reset game

### Puzzle Mode

**`src/games/chess/pages/Puzzle.tsx`**
- Interactive puzzle solving
- Wrapped in `PuzzleProvider` for puzzle state
- Uses `PuzzleBoard` component (standalone, no ChessProvider needed)
- Difficulty and motif filtering

```
Puzzle.tsx
└── PuzzleProvider
    ├── PuzzleBoard (standalone board)
    ├── Puzzle Controls (difficulty, motif filters)
    ├── Progress Tracking (move index, progress bar)
    └── Hint System (3-level hints)
```

**Components:**
- `PuzzleBoard` - Standalone board component (manages own chess instance)
- Filter controls (difficulty, motif dropdowns)
- Progress indicators
- Hint system

## State Management

### ChessContext (`state/ChessContext.tsx`)

**Purpose:** Manages game state for play and analyze modes

**Provides:**
- `game`: Chess.js instance
- `gameState`: Current game state (FEN, PGN, moves, status)
- `makeMove(from, to, promotion?)`: Make a move
- `resetGame()`: Start new game
- `loadFromPgn(pgn)`: Load game from PGN
- `exportPgn()`: Get current game as PGN
- `undoMove()`: Undo last move
- `getLegalMoves(square?)`: Get legal moves

**Used by:**
- `Play.tsx` - Local gameplay
- `Analyze.tsx` - Game analysis
- `ChessBoard.tsx` - Board interaction

### PuzzleContext (`state/PuzzleContext.tsx`)

**Purpose:** Manages puzzle-specific state and solving logic

**Provides:**
- `puzzleState`: Current puzzle state
- `loadPuzzle(difficulty?, motif?)`: Load puzzle from API or samples
- `makeMove(from, to)`: Validate and apply user move
- `getHint()`: Get progressive hints
- `resetPuzzle()`: Reset current puzzle
- `nextPuzzle()`: Load next puzzle
- `currentFen`: Current board position
- `solutionMoves`: Solution sequence (UCI format)
- `currentMoveIndex`: Progress through solution

**Used by:**
- `Puzzle.tsx` - Puzzle solving interface

**Key Features:**
- Auto-plays opponent replies from solution
- Validates moves against solution PV
- Tracks mistakes and attempts
- Records attempts to API (optional)

## Board Components

### ChessBoard (`components/ChessBoard.tsx`)

**Purpose:** Interactive chess board for play/analyze modes

**Requirements:**
- Must be used within `ChessProvider`
- Uses `useChess()` hook for game state

**Features:**
- Click-to-move and drag-and-drop
- Legal move highlighting
- Selected square highlighting
- Board orientation toggle
- Unicode piece symbols

**Props:**
- `orientation?: "white" | "black"` - Board orientation
- `onMove?: (from: string, to: string) => void` - Move callback

### PuzzleBoard (`components/PuzzleBoard.tsx`)

**Purpose:** Standalone puzzle board (no ChessProvider required)

**Features:**
- Manages own chess instance
- Updates from FEN prop
- Click-to-move and drag-and-drop
- Legal move highlighting
- Disabled state support

**Props:**
- `fen: string` - Current position (FEN)
- `orientation?: "white" | "black"` - Board orientation
- `onMove?: (from: string, to: string) => void` - Move callback
- `disabled?: boolean` - Disable interaction

**Key Difference:**
- Independent of ChessContext
- Receives FEN as prop (reactive updates)
- Perfect for puzzle mode where state is managed separately

## Data Flow

### Play Mode Flow

```
User clicks/drags piece
    ↓
ChessBoard.onMove callback
    ↓
Play.tsx.handleMove
    ↓
ChessContext.makeMove
    ↓
chess.js validates & applies move
    ↓
ChessContext.updateState
    ↓
ChessBoard re-renders with new FEN
    ↓
GameInfo updates (status, history)
```

### Puzzle Mode Flow

```
User clicks/drags piece
    ↓
PuzzleBoard.onMove callback
    ↓
Puzzle.tsx.handleMove
    ↓
PuzzleContext.makeMove
    ↓
Validates against solution PV
    ├─ Correct: Apply move + auto-play reply
    └─ Incorrect: Show error, increment mistakes
    ↓
PuzzleContext.updateState
    ↓
PuzzleBoard receives new FEN prop
    ↓
UI updates (progress, status)
```

### Analysis Mode Flow

```
User imports PGN
    ↓
Analyze.tsx.handleImportPgn
    ↓
ChessContext.loadFromPgn
    ↓
chess.js parses PGN
    ↓
ChessContext.updateState
    ↓
ChessBoard displays position
    ↓
User can replay/view game
```

## API Integration

### Puzzle API Endpoints

**Base URL:** `/api/puzzles`

**Endpoints:**
- `GET /api/puzzles/random?difficulty=&motif=` - Get random puzzle
- `GET /api/puzzles?limit=&motif=` - List puzzles
- `POST /api/puzzles/attempt` - Record solving attempt

**Fallback:**
- If API unavailable or returns 404, falls back to `samplePuzzles.ts`
- Sample puzzles always available for testing

### Error Handling

- API failures are handled gracefully
- Falls back to sample puzzles automatically
- Uses `console.debug` for non-critical errors
- User experience remains smooth even without backend

## Styling & UI

### Layout Structure

**Play & Analyze Modes:**
```
┌─────────────────────────────────────┐
│         Game Header                 │
├──────────────────┬──────────────────┤
│                  │                  │
│   Chess Board    │   Game Info     │
│   (480x480px)    │   Panel         │
│                  │                  │
│                  │   - Status      │
│                  │   - Move History │
│                  │   - Controls    │
└──────────────────┴──────────────────┘
```

**Puzzle Mode:**
```
┌─────────────────────────────────────┐
│         Puzzle Header               │
├──────────────────┬──────────────────┤
│                  │                  │
│   Puzzle Board   │   Controls       │
│   (480x480px)    │   Panel         │
│                  │                  │
│   Progress Bar   │   - Difficulty  │
│                  │   - Motif        │
│   Hint Display   │   - Actions     │
│                  │   - Info        │
└──────────────────┴──────────────────┘
```

### Responsive Design

- **Desktop (lg):** 3-column grid (2 cols board, 1 col sidebar)
- **Mobile:** Single column, stacked layout
- Board size: 480x480px (60px per square × 8)
- Uses Tailwind CSS for responsive breakpoints

### Color Scheme

- **Light squares:** `#f0d9b5`
- **Dark squares:** `#b58863`
- **Selected square:** `#baca44` (green)
- **Legal moves:** `#f6f669` (yellow)
- **Pieces:** Unicode symbols (♔♕♖♗♘♙)

## Integration Points

### Hub Integration

**Registry Entry:**
- `backend/data/game-registry.json` - Game metadata
- `src/games/registry.ts` - Frontend registry
- `backend/src/gameRegistry.js` - Fallback registry

**Routes:**
- `src/router/index.tsx` - Route configuration
- Path: `/hub/games/chess`

**Preview Component:**
- `src/games/chess/hubEntry.tsx` - Custom preview card
- Registered in `src/games/registry.ts`

### Database Schema

**Prisma Models:**
- `Puzzle` - Puzzle data (FEN, solution, motifs, rating)
- `PuzzleAttempt` - User solving attempts

**Location:** `backend/prisma/schema.prisma`

## File Dependencies

### Component Dependencies

```
ChessBoard
├── ChessContext (useChess hook)
└── chess.js (Square type)

PuzzleBoard
├── chess.js (Chess, Square)
└── No context dependencies

GameInfo
└── ChessContext (useChess hook)

Play.tsx
├── ChessProvider
├── ChessBoard
└── GameInfo

Analyze.tsx
├── ChessProvider
├── ChessBoard
└── PGN import/export UI

Puzzle.tsx
├── PuzzleProvider
├── PuzzleBoard
└── Filter controls
```

### External Dependencies

**Libraries:**
- `chess.js` (^1.4.0) - Game logic, move validation, PGN
- `chessops` (^0.15.0) - Advanced features (future)
- `pgn-parser` (^2.2.1) - PGN file parsing

**UI Components:**
- `@/components/ui/*` - shadcn/ui components
- `sonner` - Toast notifications
- `lucide-react` - Icons

## State Flow Diagrams

### Play Mode State

```
Initial State
    ↓
ChessProvider creates new Chess()
    ↓
User makes move
    ↓
ChessContext.makeMove validates
    ↓
chess.js applies move
    ↓
State updates (FEN, PGN, moves)
    ↓
Components re-render
    ↓
Game continues or ends
```

### Puzzle Mode State

```
Initial State
    ↓
PuzzleProvider.loadPuzzle()
    ├─ Fetch from API
    └─ Fallback to samples
    ↓
Parse solution PV
    ↓
Initialize chess position from FEN
    ↓
User makes move
    ↓
PuzzleContext.makeMove validates
    ├─ Correct: Apply + auto-play reply
    └─ Incorrect: Show error
    ↓
Update progress (moveIndex)
    ↓
Check if solved
    ↓
Record attempt (if solved)
```

## Key Design Decisions

### 1. Separate Board Components

**Why:** `PuzzleBoard` is separate from `ChessBoard`
- Puzzles need independent state management
- Avoids ChessProvider dependency
- Cleaner separation of concerns

### 2. Context-Based State

**Why:** Use React Context for state
- Shared state across components
- Clean API for components
- Easy to extend

### 3. Fallback to Sample Puzzles

**Why:** Sample puzzles always available
- Works without backend
- Better UX during development
- Testing without database

### 4. UCI Move Format

**Why:** Use UCI for puzzle solutions
- Standard format
- Easy to validate
- Compatible with chess engines

### 5. Auto-Play Opponent Moves

**Why:** Auto-play in puzzles
- Seamless solving experience
- User focuses on their moves
- Matches chessanalyzer behavior

## Future Enhancements

### Planned Features

1. **Stockfish Integration**
   - Move analysis
   - Position evaluation
   - Best move suggestions

2. **Multiplayer Support**
   - Socket.IO integration
   - Real-time game rooms
   - Matchmaking

3. **AI Opponent**
   - Difficulty levels
   - Configurable strength
   - Time controls

4. **Advanced Analysis**
   - CAPS1-style grading
   - Blunder detection
   - Move annotations

5. **Puzzle Enhancements**
   - Quality validation with engine
   - More puzzle sources
   - User ratings

## Testing Considerations

### Component Testing

- Test move validation logic
- Test puzzle solution matching
- Test auto-play functionality
- Test PGN import/export

### Integration Testing

- Test API fallback behavior
- Test state updates across components
- Test error handling
- Test responsive layouts

### E2E Testing

- Test complete game flow
- Test puzzle solving flow
- Test PGN import flow
- Test error scenarios

## Performance Notes

### Optimizations

- `useCallback` for event handlers
- `useMemo` for computed values
- Lazy loading for puzzle data
- Efficient re-renders with React Context

### Considerations

- Board re-renders on every move
- Puzzle API calls are async
- Large PGN files may be slow to parse
- Engine analysis (future) will be async

## Related Documentation

- [Chess Game Mode Summary](./chess-game-mode.md)
- [Puzzle Mode Architecture](../ChessModeDocs/puzzle_mode_summary.md)
- [Game Hub Integration Guide](./integrating-new-game-mode.md)

