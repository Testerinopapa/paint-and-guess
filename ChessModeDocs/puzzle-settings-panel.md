# Puzzle Settings Panel - Documentation

## Overview

The Puzzle Settings Panel is the control interface for filtering and loading chess puzzles in puzzle mode. It provides users with options to select difficulty levels, custom rating ranges, and specific puzzle motifs (themes) to customize their puzzle-solving experience.

**Location:** `src/games/chess/pages/Puzzles.tsx`

## UI Structure

### Component Hierarchy

```
PuzzlesPage
└── ChessProvider
    └── PuzzleProvider
        └── PuzzlesContent
            ├── Puzzle Settings Card
            │   ├── Difficulty Selector
            │   ├── Custom Rating Inputs (conditional)
            │   ├── Motif Selector
            │   └── New Puzzle Button
            └── PuzzleBoard
```

### Visual Layout

The panel is rendered as a Card component with:
- **Header**: "Puzzle Settings" title with description
- **Content**: Grid layout (1 column on mobile, 2 columns on desktop)
- **Controls**: Three main filter controls plus action button

## Filter Options

### 1. Difficulty Selector

**Type:** Dropdown Select  
**Default Value:** `"medium"`  
**Options:**
- **Easy** (0-1400 rating)
- **Medium** (1400-2000 rating)
- **Hard** (2000+ rating)
- **Custom Range** (enables custom rating inputs)

**Behavior:**
- Selecting a preset difficulty automatically sets rating range
- Selecting "Custom Range" reveals Min/Max Rating input fields
- Difficulty presets are defined in `PuzzleContext.tsx`:
  ```typescript
  const RATING_PRESETS = {
    easy: { min: 0, max: 1400 },
    medium: { min: 1400, max: 2000 },
    hard: { min: 2000, max: 10000 },
    custom: { min: 0, max: 10000 },
  };
  ```

### 2. Custom Rating Range

**Visibility:** Only shown when "Custom Range" is selected  
**Fields:**
- **Min Rating**: Number input, placeholder "0"
- **Max Rating**: Number input, placeholder "10000"

**Validation:**
- Values are parsed as integers
- Empty values are treated as `undefined` (no filter applied)
- Backend accepts any integer range (0-10000+)

**Use Case:** Allows users to specify exact rating ranges beyond preset difficulties

### 3. Motif Selector

**Type:** Dropdown Select  
**Default Value:** `""` (All motifs)  
**Label:** "Motif (Optional)"

**Options:**
- **All motifs** (default, no filter)
- 25+ specific motifs organized by difficulty

**Available Motifs:**

#### Easy Motifs (15)
- `advantage` - Positional advantage
- `arabianMate` - Arabian mate pattern
- `attackingF2F7` - Attacking f2/f7 squares
- `backRankMate` - Back rank mate
- `bodenMate` - Boden's mate
- `doubleBishopMate` - Double bishop mate
- `equality` - Equal position
- `fork` - Fork tactic
- `hangingPiece` - Hanging piece
- `hookMate` - Hook mate
- `mateIn1` - Mate in one move
- `oneMove` - Single move tactic
- `pin` - Pin tactic
- `skewer` - Skewer tactic
- `trappedPiece` - Trapped piece

#### Medium Motifs (16)
- `advancedPawn` - Advanced pawn
- `attraction` - Attraction tactic
- `capturingDefender` - Capturing defender
- `clearance` - Clearance sacrifice
- `deflection` - Deflection tactic
- `discoveredAttack` - Discovered attack
- `doubleCheck` - Double check
- `exposedKing` - Exposed king
- `interference` - Interference tactic
- `intermezzo` - Zwischenzug (in-between move)
- `kingsideAttack` - Kingside attack
- `mateIn2` - Mate in two moves
- `mateIn3` - Mate in three moves
- `promotion` - Pawn promotion
- `queensideAttack` - Queenside attack
- `xRayAttack` - X-ray attack

#### Hard Motifs (2)
- `mateIn4` - Mate in four moves
- `zugzwang` - Zugzwang position

#### Other Motifs (4)
- `mate` - General mate pattern
- `sacrifice` - Sacrifice tactic
- `short` - Short puzzle
- `smotheredMate` - Smothered mate

**Behavior:**
- Selecting "All motifs" clears the motif filter
- Selecting a specific motif filters puzzles by that theme
- Motif filtering uses substring matching in the database

## State Management

### Local Component State

```typescript
const [difficulty, setDifficulty] = useState<PuzzleDifficulty>("medium");
const [minRating, setMinRating] = useState<string>("");
const [maxRating, setMaxRating] = useState<string>("");
const [motif, setMotif] = useState<string>("");
```

### Filter Object Construction

When "New Puzzle" is clicked, filters are constructed:

```typescript
const filters: PuzzleFilters = {
  difficulty: difficulty === "custom" ? undefined : difficulty,
  minRating: minRating ? parseInt(minRating) : undefined,
  maxRating: maxRating ? parseInt(maxRating) : undefined,
  motif: motif || undefined,
};
```

**Logic:**
- If difficulty is "custom", it's set to `undefined` (uses min/max rating instead)
- Empty string values are converted to `undefined` (no filter)
- Numeric strings are parsed to integers

## API Integration

### Request Flow

1. **User clicks "New Puzzle"**
2. **Filters are constructed** from component state
3. **`loadRandomPuzzle(filters)` is called** from PuzzleContext
4. **URL parameters are built** in PuzzleContext:
   ```typescript
   const params = new URLSearchParams();
   
   if (filters?.difficulty && filters.difficulty !== "custom") {
     const preset = RATING_PRESETS[filters.difficulty];
     params.append("minRating", preset.min.toString());
     params.append("maxRating", preset.max.toString());
   } else {
     if (filters?.minRating !== undefined) {
       params.append("minRating", filters.minRating.toString());
     }
     if (filters?.maxRating !== undefined) {
       params.append("maxRating", filters.maxRating.toString());
     }
   }
   
   if (filters?.motif) {
     params.append("motif", filters.motif);
   }
   ```
5. **API request sent** to `/api/puzzles/random?[params]`
6. **Backend processes filters** and returns matching puzzle

### Backend Processing

**Endpoint:** `GET /api/puzzles/random`  
**Location:** `backend/src/puzzleRoutes.js`

**Query Parameters:**
- `difficulty`: "easy" | "medium" | "hard" (optional)
- `minRating`: number (optional)
- `maxRating`: number (optional)
- `motif`: string (optional)

**Backend Logic:**
1. If `difficulty` is provided, uses preset rating ranges
2. Otherwise, uses `minRating` and `maxRating` from query
3. Builds Prisma where clause with rating range
4. Adds motif filter using substring search if provided
5. Performs random sampling with quality validation
6. Returns puzzle or `null` if no match found

## User Flow

### Standard Flow

1. **User opens puzzle mode** → Settings panel displayed
2. **User selects difficulty** (e.g., "Medium")
3. **User optionally selects motif** (e.g., "fork")
4. **User clicks "New Puzzle"**
5. **Loading state** → Button shows "Loading..."
6. **Puzzle loads** → PuzzleBoard displays puzzle
7. **User solves puzzle** → Can click "New Puzzle" again with same/different filters

### Custom Range Flow

1. **User selects "Custom Range"** from difficulty dropdown
2. **Min/Max Rating inputs appear**
3. **User enters values** (e.g., Min: 1500, Max: 1800)
4. **User clicks "New Puzzle"**
5. **Puzzle loads** with custom rating range

### Filter Combination

Filters can be combined:
- **Difficulty + Motif**: e.g., "Medium" + "fork"
- **Custom Range + Motif**: e.g., 1500-1800 + "pin"
- **Difficulty only**: e.g., "Hard" (no motif)
- **Motif only**: e.g., "mateIn2" (no difficulty filter)
- **No filters**: Returns random puzzle from entire database

## Loading States

### Button States

- **Default**: "New Puzzle"
- **Loading**: "Loading..." (button disabled)
- **Disabled**: When `loading === true` from PuzzleContext

### Error Handling

If no puzzle matches filters:
- Error message displayed in PuzzleBoard: "No puzzle found matching your criteria"
- User can adjust filters and try again

## Responsive Design

### Layout Breakpoints

- **Mobile** (`< md`): Single column grid
- **Desktop** (`>= md`): Two column grid

**Grid Structure:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Difficulty */}
  {/* Custom Rating Inputs (conditional) */}
  {/* Motif */}
</div>
```

### Conditional Rendering

Custom rating inputs only render when:
```tsx
{difficulty === "custom" && (
  <>
    <MinRatingInput />
    <MaxRatingInput />
  </>
)}
```

## Type Definitions

### PuzzleDifficulty

```typescript
export type PuzzleDifficulty = "easy" | "medium" | "hard" | "custom";
```

### PuzzleFilters

```typescript
export interface PuzzleFilters {
  difficulty?: PuzzleDifficulty;
  minRating?: number;
  maxRating?: number;
  motif?: string;
}
```

## Integration Points

### PuzzleContext

The settings panel uses `usePuzzle()` hook:
- `loadRandomPuzzle(filters)`: Loads puzzle with filters
- `loading`: Indicates loading state

### ChessProvider

Wrapped in ChessProvider for shared chess utilities (though not directly used in settings panel)

## UI Components Used

- **Card**: Container for settings panel
- **CardHeader**: Title and description
- **CardContent**: Filter controls
- **Select**: Dropdown for difficulty and motif
- **Input**: Number inputs for custom rating
- **Label**: Form labels
- **Button**: "New Puzzle" action button

## Best Practices

### Filter Selection

1. **Start with difficulty presets** for quick selection
2. **Use custom range** for specific rating targets
3. **Combine with motifs** to practice specific tactics
4. **Clear motif filter** to get variety

### Performance Considerations

- Filters are applied server-side (efficient database queries)
- Random sampling limits database load
- Quality validation ensures puzzle validity

## Future Enhancements

Potential improvements:
- **Save favorite filters**: Remember user preferences
- **Recent puzzles**: Avoid showing same puzzle twice
- **Filter presets**: Save custom filter combinations
- **Motif categories**: Group motifs by type (tactics, endgame, etc.)
- **Rating history**: Track solved puzzle ratings
- **Difficulty adjustment**: Auto-adjust based on solve rate

## Related Documentation

- [Puzzle Mode Summary](./puzzle_mode_summary.md) - Overall puzzle system
- [Puzzle Context](./puzzle_mode_summary.md#puzzle-uiinteraction) - State management
- [Puzzle API](./puzzle_mode_summary.md#puzzle-selection-api) - Backend endpoints

