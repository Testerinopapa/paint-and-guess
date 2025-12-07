# Puzzle Generator Analysis

## Overview

The chess puzzle system in this codebase does **not generate puzzles** - instead, it imports puzzles from an external database and serves them through a REST API. However, the infrastructure exists for potential puzzle generation using the Stockfish chess engine.

## Current Architecture

### Puzzle Source

Puzzles are **imported** from an external database located at:
```
ChessModeDocs/CorrectDBARch/prisma/dev.db
```

The import process is handled by `backend/scripts/import-dev-db.js`, which:
- Connects to the source SQLite database
- Reads all puzzles and puzzle attempts
- Imports them into the main application database
- Skips duplicates based on puzzle ID or source
- Validates foreign key relationships

### Database Schema

Puzzles are stored in a Prisma-managed SQLite database with the following structure:

```prisma
model Puzzle {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  fen         String                    // Starting position in FEN notation
  sideToMove  String                   // "white" | "black"
  solutionPv  String                   // JSON array of UCI moves (principal variation)
  motifs      String                   // JSON array of puzzle themes/tags
  source      String                   // Source identifier
  rating      Int?                     // Puzzle difficulty rating
  attempts    PuzzleAttempt[]
  
  @@index([createdAt])
}
```

### Puzzle Data Structure

Each puzzle contains:
- **FEN**: The starting position
- **sideToMove**: Which side the solver should play
- **solutionPv**: Array of UCI moves (e.g., `["e2e4", "e7e5", "g1f3"]`)
- **motifs**: Array of puzzle themes (e.g., `["fork", "mate", "pin"]`)
- **source**: Origin identifier
- **rating**: Difficulty rating (0-10000+)

## Puzzle Serving System

### API Endpoints

The puzzle system exposes three REST API endpoints:

#### 1. `GET /api/puzzles/random`

Fetches a random puzzle matching specified filters.

**Query Parameters:**
- `difficulty`: `"easy" | "medium" | "hard"` (maps to rating ranges)
- `minRating`: Custom minimum rating
- `maxRating`: Custom maximum rating
- `motif`: Filter by puzzle theme (e.g., `"fork"`, `"mate"`, `"pin"`)

**Rating Presets:**
- Easy: 0-1400
- Medium: 1400-2000
- Hard: 2000-10000

**Selection Algorithm:**
1. Counts total puzzles matching filters
2. Uses random sampling: `min(25, max(5, sqrt(total)))` attempts
3. For motif filters, doubles attempts to `min(50, baseAttempts * 2)`
4. Validates each sampled puzzle before returning

**Validation Logic:**
- Parses and validates solution PV (must be non-empty array)
- For mate puzzles: Verifies `sideToMove` matches the last mover in the solution
- Skips puzzles with invalid FEN or empty PV

**Implementation:** `backend/src/puzzleRoutes.js` (lines 44-154)

#### 2. `GET /api/puzzles`

Lists puzzles with optional filtering.

**Query Parameters:**
- `limit`: Maximum number of puzzles (1-100, default: 20)
- `motif`: Filter by puzzle theme

**Returns:** Array of puzzle objects ordered by creation date (newest first)

**Implementation:** `backend/src/puzzleRoutes.js` (lines 156-189)

#### 3. `POST /api/puzzles/attempt`

Records a puzzle attempt for analytics.

**Request Body:**
```json
{
  "puzzleId": "string",
  "timeMs": number,
  "mistakes": number,
  "solved": boolean,
  "rating": number | null
}
```

**Returns:** Created attempt object

**Implementation:** `backend/src/puzzleRoutes.js` (lines 191-223)

## Puzzle Validation

### Mate Puzzle Validation

The system includes special validation for mate puzzles:

```javascript
function isMatePuzzle(motifs) {
  // Checks if motifs array contains "mate" (but not "mateIn1", "mateIn2", etc.)
  return motifs.some((m) => m.includes("mate") && !m.includes("mateIn"));
}

function calculateLastMover(fen, pv) {
  // Determines which side makes the last move in the solution
  // Uses chessops library to parse FEN and calculate based on PV length
}
```

For mate puzzles, the system verifies that:
- The `sideToMove` field matches the side that delivers mate
- This ensures the puzzle is presented correctly to the solver

### Quality Checks

The random puzzle endpoint performs several quality checks:
1. **FEN Validation**: Uses `chessops/fen` to validate FEN strings
2. **PV Validation**: Ensures solution PV is a valid, non-empty array
3. **Mate Puzzle Validation**: Special handling for mate puzzles
4. **Data Integrity**: Skips puzzles with parsing errors

## Infrastructure for Puzzle Generation

While puzzles are not currently generated, the codebase includes infrastructure that could support puzzle generation:

### Stockfish Engine Integration

The system has a fully integrated Stockfish chess engine:

**Engine Pool:** `backend/src/lib/enginePool.js`
- Manages Stockfish engine instances
- Handles engine lifecycle (start, stop, restart)
- Provides analysis capabilities

**Analysis API:** `backend/src/api/analyze.js`
- `POST /api/analyze`: Analyzes a chess position
- Returns best move, evaluation, and principal variation
- Supports depth control, ELO limiting, and multi-PV analysis

**Engine Features:**
- Position analysis with configurable depth (1-20)
- ELO-based strength limiting (1350-2850)
- Multi-PV support (multiple principal variations)
- Health check endpoint: `GET /api/health/engine`

### Potential Puzzle Generation Workflow

With the existing infrastructure, puzzle generation could work as follows:

1. **Source Positions:**
   - Extract positions from game databases (PGN files)
   - Identify tactical positions (forks, pins, mates, etc.)
   - Filter by evaluation (positions with winning chances)

2. **Analysis:**
   - Use Stockfish to analyze candidate positions
   - Extract principal variation (solution)
   - Calculate evaluation scores
   - Identify tactical motifs

3. **Validation:**
   - Verify solution is unique/best
   - Check puzzle quality (not too easy, not too hard)
   - Validate FEN and move legality
   - Assign difficulty ratings

4. **Storage:**
   - Store validated puzzles in database
   - Tag with motifs and themes
   - Assign ratings based on difficulty

## Import Scripts

### `backend/scripts/import-dev-db.js`

Main import script that transfers puzzles from source database.

**Features:**
- Reads from source SQLite database
- Imports puzzles with duplicate checking
- Imports puzzle attempts (with foreign key validation)
- Progress reporting (every 100 items)
- Error handling and skipping of invalid records

**Usage:**
```bash
node backend/scripts/import-dev-db.js
```

### `backend/scripts/test-puzzle-db.js`

Database testing and validation script.

**Tests:**
1. Database connection
2. Puzzle count
3. Sample puzzle retrieval
4. Difficulty distribution (easy/medium/hard)
5. Random puzzle selection
6. Motif filtering
7. Puzzle attempt statistics
8. Data integrity validation
9. Database summary (oldest/newest, average rating)

**Usage:**
```bash
node backend/scripts/test-puzzle-db.js
```

## Puzzle Motifs

The system supports 25+ puzzle motifs/tags:

**Easy Motifs:**
- `advantage`, `fork`, `pin`, `mateIn1`, `oneMove`, `hangingPiece`, `trappedPiece`
- `equality`, `arabianMate`, `attackingF2F7`, `backRankMate`, `bodenMate`
- `doubleBishopMate`, `hookMate`, `skewer`

**Medium Motifs:**
- `mateIn2`, `mateIn3`, `deflection`, `discoveredAttack`, `doubleCheck`
- `advancedPawn`, `attraction`, `capturingDefender`, `clearance`, `exposedKing`
- `interference`, `intermezzo`, `kingsideAttack`, `promotion`, `queensideAttack`, `xRayAttack`

**Hard Motifs:**
- `mateIn4`, `zugzwang`

**Other:**
- `mate`, `sacrifice`, `short`, `smotheredMate`

## Frontend Integration

Puzzles are served to the frontend through:

1. **PuzzleContext** (`src/games/chess/state/PuzzleContext.tsx`):
   - Manages puzzle state
   - Handles puzzle loading via API
   - Validates moves against solution
   - Tracks progress and mistakes

2. **PuzzleBoard** (`src/games/chess/components/PuzzleBoard.tsx`):
   - Renders chess board with puzzle position
   - Handles move input and validation
   - Shows hints and feedback

3. **PuzzleSidebar** (`src/games/chess/components/PuzzleSidebar.tsx`):
   - Puzzle settings and filters
   - Current puzzle information
   - Controls (hint, reset, show solution)

## Future Enhancements

### Potential Puzzle Generation Features

1. **Automatic Extraction:**
   - Parse PGN files from online databases
   - Extract tactical positions using engine analysis
   - Identify motifs automatically

2. **Rating Calculation:**
   - Use attempt statistics to adjust puzzle ratings
   - Implement ELO-based rating system
   - Personalize difficulty based on user performance

3. **Quality Improvements:**
   - Engine validation for all puzzles (not just mates)
   - Verify solution uniqueness
   - Check for alternative solutions

4. **Generation Pipeline:**
   - Batch processing of game databases
   - Automated motif detection
   - Quality scoring and filtering

## Summary

The puzzle system is currently an **import-and-serve** architecture:
- Puzzles are imported from an external database
- Served through REST API with filtering and validation
- Infrastructure exists for potential generation (Stockfish engine)
- No active puzzle generation code exists

The system is well-designed for serving puzzles with robust validation, but puzzle generation would require additional development to extract positions from games, analyze them, and create new puzzles automatically.

