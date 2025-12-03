# Puzzle Mode - Architecture & Workflow

## Overview

The puzzle mode is a self-contained chess puzzle system that can be integrated into a gamehub. It provides puzzle import, selection, validation, and interactive solving capabilities with quality assurance mechanisms.

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  React UI (puzzle/page.tsx) - Interactive chessboard   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP API
┌────────────────────▼────────────────────────────────────┐
│                    API Layer                              │
│  /api/puzzles/random  - Puzzle selection                 │
│  /api/puzzles         - List puzzles                     │
│  /api/puzzles/attempt - Track attempts                  │
└────────────────────┬────────────────────────────────────┘
                     │ Prisma ORM
┌────────────────────▼────────────────────────────────────┐
│                  Data Layer                              │
│  SQLite Database (Prisma)                                 │
│  - Puzzle table                                           │
│  - PuzzleAttempt table                                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              External Services                           │
│  - EnginePool (quality validation)                      │
│  - Import scripts (CSV processing)                       │
└─────────────────────────────────────────────────────────┘
```

### Core Components

1. **Data Models** (`prisma/schema.prisma`)
   - `Puzzle`: Stores puzzle data (FEN, solution, motifs, rating)
   - `PuzzleAttempt`: Tracks user solving attempts

2. **API Endpoints** (`src/app/api/puzzles/`)
   - Random selection with quality validation
   - List puzzles with filtering
   - Attempt tracking

3. **UI Component** (`src/app/puzzle/page.tsx`)
   - Interactive chessboard
   - Move validation
   - Progress tracking

4. **Import System** (`scripts/puzzle_import_csv.ts`)
   - CSV parsing and deduplication
   - Database population

## Data Models

### Puzzle Model

```typescript
{
  id: string;              // CUID identifier
  createdAt: DateTime;     // Import timestamp
  fen: string;             // Starting position (FEN notation)
  sideToMove: string;      // Solver side ("white" | "black")
  solutionPv: string;      // JSON array of UCI moves: ["e2e4", "e7e5", ...]
  motifs: string;          // JSON array of themes: ["mate", "fork", ...]
  source: string;          // Origin: "lichess-puzzle:12345"
  rating: number | null;   // Difficulty rating (0-10000)
}
```

**Key Fields:**
- `sideToMove`: The solver (side that makes the last move in solution)
- `solutionPv`: Complete solution sequence in UCI format
- `motifs`: Array of puzzle themes (54 possible motifs)

### PuzzleAttempt Model

```typescript
{
  id: string;
  createdAt: DateTime;
  puzzleId: string;        // Reference to Puzzle
  timeMs: number;          // Time taken (milliseconds)
  mistakes: number;        // Incorrect attempts
  solved: boolean;         // Success flag
  rating: number | null;  // Optional user rating
}
```

## API Endpoints

### GET /api/puzzles/random

**Purpose:** Select a random puzzle matching criteria with quality validation

**Query Parameters:**
- `difficulty`: "easy" | "medium" | "hard" (optional)
- `minRating`: number (optional, 0-10000)
- `maxRating`: number (optional, 0-10000)
- `motif`: string (optional, motif substring filter)

**Rating Presets:**
- Easy: 0-1400
- Medium: 1400-2000
- Hard: 2000-10000

**Response:**
```typescript
Puzzle | null  // Puzzle object or null if none found
```

**Selection Algorithm:**
1. Build database query with rating and motif filters
2. Random sampling: `min(25, max(5, sqrt(total)))` attempts
3. Quality validation:
   - **Mate puzzles**: Verify solver delivers mate
   - **Non-mate puzzles**: Engine analysis (depth 8) after 2 plies, eval ≥ -50cp
4. Return first valid puzzle or null

**Quality Policies:**
- Mate puzzles: `sideToMove` must match the side that delivers mate
- Non-mate puzzles: After 2 plies, evaluation must not drop below -0.5 pawns
- Lenient mode: With motif filter, threshold relaxed to -100cp near end of attempts

### GET /api/puzzles

**Purpose:** List puzzles with optional filtering

**Query Parameters:**
- `limit`: number (1-100, default 20)
- `motif`: string (optional, motif substring filter)

**Response:**
```typescript
Puzzle[]  // Array of puzzles ordered by creation date (newest first)
```

### POST /api/puzzles/attempt

**Purpose:** Record a puzzle solving attempt

**Request Body:**
```typescript
{
  puzzleId: string;    // Required
  timeMs: number;      // Time taken
  mistakes: number;    // Incorrect attempts
  solved: boolean;     // Success flag
  rating?: number;     // Optional user rating
}
```

**Response:**
```typescript
PuzzleAttempt  // Created attempt record
```

## Workflow

### 1. Puzzle Import Workflow

```
CSV File (zstd compressed)
    ↓
Import Script (puzzle_import_csv.ts)
    ↓
Parse & Filter
    ├─ Rating range filter
    ├─ Motif filter (optional)
    └─ Deduplication (FEN + first 3 moves)
    ↓
Calculate Solver Side
    ├─ Parse FEN → starting turn
    ├─ Calculate last mover from PV length
    └─ Set sideToMove = last mover
    ↓
Store in Database
    └─ Puzzle record created
```

**Import Command:**
```bash
npm run puzzle:import [file] [source] [limit] [minRating] [maxRating] [motifFilter]
```

**Key Logic:**
- Solver side calculated from solution PV (who makes last move)
- Deduplication prevents exact repeats
- Filters applied before database insertion

### 2. Puzzle Selection Workflow

```
User Request (filters)
    ↓
API Endpoint (/api/puzzles/random)
    ↓
Build Query
    ├─ Rating range (from difficulty or custom)
    └─ Motif filter (if provided)
    ↓
Database Query
    └─ Count matching puzzles
    ↓
Random Sampling Loop
    ├─ Select random puzzle
    ├─ Parse solution PV
    ├─ Quality Validation
    │   ├─ Mate: Check solver = last mover
    │   └─ Non-mate: Engine analysis (depth 8)
    └─ Return if valid
    ↓
Return Puzzle or Null
```

**Quality Validation Details:**
- **Mate puzzles**: Verify `sideToMove` matches side that delivers mate
- **Non-mate puzzles**: 
  - Apply first 2 plies of solution
  - Engine analysis at depth 8
  - Check evaluation ≥ -50cp (or -100cp in lenient mode)
- **Fallback**: With motif filter, return any valid puzzle if quality checks fail

### 3. Puzzle Solving Workflow

```
Load Puzzle
    ├─ Fetch from API
    ├─ Parse solution PV
    └─ Determine player side (solver)
    ↓
Display Position
    ├─ Render chessboard
    ├─ Show current FEN
    └─ Set board orientation (solver's perspective)
    ↓
User Makes Move
    ├─ Drag & drop piece
    ├─ Validate move (compare with expected PV move)
    │   ├─ Correct: Apply move, auto-play opponent reply
    │   └─ Incorrect: Show error, allow retry
    └─ Update progress (move index / total moves)
    ↓
Puzzle Complete
    ├─ All moves correct
    ├─ Mark as solved
    └─ (Optional) Record attempt via API
```

**Move Validation:**
- Compare user move (sourceSquare + targetSquare) with expected UCI move
- Normalize by ignoring promotion suffix
- Auto-play opponent replies from solution PV
- Track progress through solution sequence

**Player Side Alignment:**
- For mate puzzles: Auto-align so player delivers mate
- If solver doesn't match starting turn, auto-advance one PV move
- For non-mate puzzles: Allow side swapping

## Integration Points

### Required Dependencies

```json
{
  "chessops": "^0.14.2",        // FEN parsing, move handling
  "react-chessboard": "^5.5.0", // Interactive chessboard
  "@prisma/client": "^6.14.0",  // Database ORM
  "prisma": "^6.14.0"           // Database schema management
}
```

### Database Setup

1. **Schema**: Include `Puzzle` and `PuzzleAttempt` models in Prisma schema
2. **Migration**: Run `npx prisma migrate dev` to create tables
3. **Indexes**: Ensure `createdAt` index on Puzzle, `(puzzleId, createdAt)` on PuzzleAttempt

### Engine Integration

**EnginePool** (`src/lib/enginePool.ts`):
- Required for non-mate puzzle quality validation
- Provides `analyze(fen, depth, multiPv)` method
- Returns evaluation scores for position validation

**Usage in Selection:**
```typescript
const res = await EnginePool.analyze({ fen: afterTwo, depth: 8, multiPv: 1 });
const cp = scoreToCp(res.info?.score);
if (cp >= threshold) {
  // Puzzle passes quality check
}
```

### UI Integration

**Component Structure:**
- Main component: `src/app/puzzle/page.tsx`
- Chessboard: `react-chessboard` (dynamic import for SSR)
- State management: React hooks (useState, useMemo, useCallback)

**Key State:**
- `pz`: Current puzzle data
- `fen`: Current position (updates as moves are made)
- `idx`: Current move index in solution
- `solved`: Completion status

**Move Handling:**
- `onPieceDrop`: Validates and applies user moves
- `applyMoveUci`: Helper to apply UCI moves to position
- Auto-plays opponent replies from solution PV

## Data Flow Diagrams

### Puzzle Selection Flow

```
┌─────────────┐
│ User Request│
│ (filters)   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ API: /random    │
│ Build query     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Database Query  │
│ Count matches   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Random Sampling │
│ Loop (up to N)  │
└──────┬──────────┘
       │
       ├─► Parse PV
       ├─► Check mate/non-mate
       ├─► Quality validation
       │   ├─ Mate: Verify solver
       │   └─ Non-mate: Engine eval
       │
       ▼
┌─────────────────┐
│ Return Puzzle   │
│ or Null         │
└─────────────────┘
```

### Puzzle Solving Flow

```
┌─────────────┐
│ Load Puzzle │
│ from API    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Parse Solution  │
│ Determine Solver│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Display Board   │
│ Set Orientation │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ User Makes Move │
└──────┬──────────┘
       │
       ├─► Validate Move
       │   ├─ Correct: Apply + auto-play reply
       │   └─ Incorrect: Show error
       │
       ▼
┌─────────────────┐
│ Update Progress │
│ Check Complete  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Record Attempt  │
│ (optional)      │
└─────────────────┘
```

## Key Algorithms

### Solver Side Calculation

```typescript
// Determine who makes the last move (the solver)
const startTurn = parseFen(fen).turn; // "white" | "black"
const lastMover = (pv.length % 2 === 1) 
  ? startTurn 
  : (startTurn === "white" ? "black" : "white");
const sideToMove = lastMover; // Solver is the last mover
```

**Logic:**
- If PV length is odd: Last mover = starting turn
- If PV length is even: Last mover = opposite of starting turn

### Quality Validation

**Mate Puzzles:**
```typescript
const expectedSolver = puzzle.sideToMove;
const lastMover = calculateLastMover(puzzle.fen, puzzle.solutionPv);
if (lastMover !== expectedSolver) {
  // Reject: Solver doesn't match mate deliverer
}
```

**Non-Mate Puzzles:**
```typescript
const afterTwo = applyUciPlies(puzzle.fen, pv, 2);
const analysis = await EnginePool.analyze({ fen: afterTwo, depth: 8 });
const cp = scoreToCp(analysis.info?.score);
if (cp >= -50) { // -50cp = -0.5 pawns
  // Accept: Position is still good for solver
}
```

### Random Sampling

```typescript
const baseAttempts = Math.min(25, Math.max(5, Math.floor(Math.sqrt(total))));
const attempts = motif ? Math.min(50, baseAttempts * 2) : baseAttempts;

for (let i = 0; i < attempts; i++) {
  const skip = Math.floor(Math.random() * total);
  const puzzle = await prisma.puzzle.findMany({ 
    where, skip, take: 1 
  })[0];
  // Validate puzzle...
}
```

## Configuration

### Rating Presets

```typescript
const RATING_PRESETS = {
  easy: { min: 0, max: 1400 },
  medium: { min: 1400, max: 2000 },
  hard: { min: 2000, max: 10000 },
};
```

### Quality Thresholds

- **Non-mate evaluation**: -50cp (standard), -100cp (lenient with motif filter)
- **Engine depth**: 8 plies
- **Sampling attempts**: `min(25, max(5, sqrt(total)))` base, doubled with motif filter

### Motif Categories

54 total motifs organized by difficulty:
- **Easy** (15): advantage, fork, pin, mateIn1, etc.
- **Medium** (16): mateIn2, mateIn3, deflection, etc.
- **Hard** (2): mateIn4, zugzwang
- **Meta** (8): crushing, master, superGM, etc.
- **Phase** (9): opening, middlegame, endgame, etc.
- **Other** (4): mate, sacrifice, short, smotheredMate

## Error Handling

### API Errors

- **Invalid rating range**: Returns 400 with error message
- **No puzzles found**: Returns `null` (not an error)
- **Engine failure**: Logs warning, continues with fallback if motif filter active

### Validation Errors

- **Invalid FEN**: Skipped during import/selection
- **Empty PV**: Rejected during selection
- **Illegal moves**: Rejected during validation
- **Parse failures**: Logged and skipped

## Performance Considerations

### Database Queries

- **Indexes**: `createdAt` on Puzzle for efficient querying
- **Random sampling**: Uses `skip` with random offset (may be inefficient for very large datasets)
- **Motif search**: Substring matching on JSON string (SQLite compatible)

### Engine Analysis

- **Depth**: Fixed at 8 plies (balance between quality and speed)
- **Caching**: EnginePool manages engine instances
- **Timeout**: Engine failures handled gracefully with fallback

### Client-Side

- **Chessboard**: Dynamically imported to avoid SSR issues
- **State updates**: Optimized with useMemo and useCallback
- **Move validation**: Client-side for immediate feedback

## Testing & Validation

### Automated Testing

**Puzzle Crawler** (`scripts/puzzle_crawler.ts`):
- Database integrity checks
- Puzzle validation (FEN, PV parsing, move legality)
- Selection logic tests (mate/non-mate validation)
- API endpoint testing
- Performance benchmarks

**Run:**
```bash
npm run puzzle:crawl
```

### Manual Validation

- **Import verification**: Check solver side calculation
- **Selection quality**: Verify mate/non-mate puzzles pass validation
- **UI interaction**: Test move validation, auto-play, progress tracking

## Migration & Maintenance

### Fixing Existing Puzzles

**Migration Script** (`scripts/fix_puzzle_solver_side.ts`):
- Recalculates `sideToMove` from solution PV
- Updates incorrect records
- Preserves valid puzzles

**Run:**
```bash
npm run puzzle:fix-solver
```

### Database Maintenance

- **Deduplication**: Handled during import
- **Index optimization**: Monitor query performance
- **Data validation**: Use puzzle crawler for integrity checks

## Integration Checklist

- [ ] Add Puzzle and PuzzleAttempt models to Prisma schema
- [ ] Run database migrations
- [ ] Set up EnginePool for quality validation
- [ ] Implement API endpoints (`/api/puzzles/*`)
- [ ] Create puzzle UI component
- [ ] Set up import scripts
- [ ] Configure rating presets and thresholds
- [ ] Test puzzle selection and validation
- [ ] Verify move validation and auto-play
- [ ] Set up attempt tracking (optional)
- [ ] Configure logging and error handling

## Notes

- **Solver Side**: Critical that `sideToMove` represents the solver (last mover), not just starting turn
- **Quality Validation**: Engine analysis ensures puzzle quality but adds latency
- **Motif Filtering**: Lenient mode ensures puzzles are returned even with strict filters
- **Auto-Play**: Opponent replies automatically played from solution PV for seamless experience
- **Attempt Tracking**: Infrastructure exists but UI integration is optional

