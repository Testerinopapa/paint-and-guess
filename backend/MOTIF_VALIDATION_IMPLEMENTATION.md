# Motif-Specific Puzzle Validation Implementation

## Overview

This document describes the implementation of motif-specific validation logic for chess puzzles, as outlined in `puzzle_validation_logic.md`.

## Implementation

### Core Module: `backend/src/lib/puzzleValidation.js`

The validation module provides motif-specific validation functions that verify puzzles meet their stated objectives.

### Validation Functions

#### 1. **Material Gain Puzzles** (`validateMaterialGainPuzzle`)
- **Motifs**: fork, pin, skewer, hangingPiece, capturingDefender
- **Validation**:
  - Verifies material is actually gained (counts pieces before/after)
  - Allows temporary material loss in intermediate positions
  - Requires final evaluation ≥100cp

#### 2. **Sacrifice Puzzles** (`validateSacrificePuzzle`)
- **Motifs**: sacrifice
- **Validation**:
  - Verifies material is actually sacrificed (after first 2 moves)
  - Checks for compensation (mate, material regain, or positional)
  - Allows final evaluation ≥-50cp if compensated

#### 3. **Equality Puzzles** (`validateEqualityPuzzle`)
- **Motifs**: equality
- **Validation**:
  - Final evaluation must be between -20cp and +20cp
  - If starting from disadvantage (<-100cp), allows improvement to ≥-50cp

#### 4. **Defensive Puzzles** (`validateDefensivePuzzle`)
- **Motifs**: defensiveMove
- **Validation**:
  - Defense must prevent significant loss (within 100cp of initial)
  - Final position should be acceptable (≥-50cp)

#### 5. **Advantage Puzzles** (`validateAdvantagePuzzle`)
- **Motifs**: advantage, crushing
- **Validation**:
  - Standard advantage: final evaluation ≥50cp
  - Crushing: final evaluation ≥200cp

#### 6. **Endgame Puzzles** (`validateEndgamePuzzle`)
- **Motifs**: endgame, *Endgame
- **Validation**:
  - Strictly enforces piece count ≤12 (excluding kings)
  - Rejects puzzles that aren't actually endgames

#### 7. **Mate Puzzles** (`validateMatePuzzle`)
- **Motifs**: mate, mateIn1, mateIn2, etc.
- **Validation**:
  - Verifies actual checkmate occurs
  - Verifies solver is the one delivering mate
  - Fast path (no engine needed)

#### 8. **Zugzwang Puzzles** (`validateZugzwangPuzzle`)
- **Motifs**: zugzwang
- **Validation**:
  - Lenient validation (zugzwang is hard to verify automatically)
  - Final evaluation should be between -30cp and +50cp

### Main Validation Function

`validatePuzzleByMotif(puzzle, initialFen, pv)` applies all relevant validation functions based on the puzzle's motifs.

**Validation Priority**:
1. Mate puzzles (fast path)
2. Material gain puzzles
3. Sacrifice puzzles
4. Equality puzzles
5. Defensive puzzles
6. Advantage/crushing puzzles
7. Zugzwang puzzles
8. Endgame puzzles (structural)
9. Default validation (standard evaluation check)

## Integration

### Puzzle Loading (`backend/src/puzzleRoutes.js`)

The validation is integrated into the `getRandomPuzzle` function:

```javascript
// Motif-specific validation
const validationResult = await validatePuzzleByMotif(
  puzzle,
  puzzle.fen,
  solutionPv
);

if (!validationResult.valid) {
  console.log(`[Puzzle API] Puzzle ${puzzle.id} failed validation: ${validationResult.reason}`);
  continue; // Skip this puzzle
}
```

## Engine Requirements

Most validation functions require the Stockfish engine to be available. The validation gracefully handles engine unavailability:

- **With Engine**: Full motif-specific validation
- **Without Engine**: Structural validation only (mate, endgame piece count)

## Usage

The validation is automatically applied when loading puzzles via `/api/puzzles/random`. Puzzles that fail validation are skipped, and the API continues searching for valid puzzles.

## Validation Results

Each validation function returns:
```javascript
{
  valid: boolean,
  reason: string  // Explanation of validation result
}
```

## Benefits

1. **Motif-Specific Logic**: Each puzzle type is validated according to its objective
2. **Material Verification**: Material gain puzzles verify actual material changes
3. **Correct Thresholds**: Equality and defensive puzzles use appropriate thresholds
4. **Quality Control**: Only puzzles that meet their stated objectives are served
5. **Graceful Degradation**: Works without engine for structural validation

## Future Improvements

Based on `puzzle_validation_logic.md`, future enhancements could include:

1. **Solution Uniqueness**: Verify no alternative solutions exist
2. **Pattern Verification**: Verify fork/pin/skewer patterns actually occur
3. **Promotion Verification**: Verify pawn promotion actually happens
4. **Deeper Zugzwang Analysis**: Analyze all opponent moves to verify zugzwang

## Testing

To test the validation:

1. Start the backend server with Stockfish available
2. Request puzzles via `/api/puzzles/random?motif=<motif>`
3. Check server logs for validation results
4. Puzzles that fail validation will be skipped

## Notes

- Validation is performed during puzzle loading, not during puzzle solving
- Failed validation logs the reason but doesn't expose it to the client
- The validation system is designed to be extensible for new motifs

