# "Solve Puzzles" Button Documentation

## Overview

The "Solve Puzzles" button is the primary action button in the Puzzle Mode interface. It initiates the puzzle loading process by fetching a random puzzle from the backend API based on the user's selected filters (difficulty, rating range, and motif).

**Location:** `src/games/chess/components/PuzzleSidebar.tsx`  
**Parent Component:** `PuzzleSidebar`  
**Handler:** `onLoadPuzzle` (passed from `Puzzles.tsx`)

---

## 1. Visual Design

### Button Appearance

```tsx
<Button
  onClick={onLoadPuzzle}
  size="lg"
  className="w-full h-12 text-base font-semibold"
  disabled={loading}
>
  {loading ? "Loading..." : "Solve Puzzles"}
</Button>
```

### Visual Specifications

- **Size**: Large (`size="lg"`)
- **Width**: Full width (`w-full`)
- **Height**: 48px (`h-12`)
- **Typography**: Base font size, semibold weight (`text-base font-semibold`)
- **Position**: Located directly below the Header Card in the right sidebar
- **Spacing**: `gap-4` margin from Header Card above

### Button States

#### Default State
- **Text**: "Solve Puzzles"
- **Enabled**: Yes (unless loading)
- **Appearance**: Primary button style (default shadcn Button variant)

#### Loading State
- **Text**: "Loading..."
- **Enabled**: No (`disabled={loading}`)
- **Appearance**: Disabled button style (grayed out, non-interactive)
- **Trigger**: When `loading` prop is `true`

#### Disabled State
- **Text**: "Solve Puzzles" or "Loading..."
- **Enabled**: No
- **Appearance**: Disabled button style
- **Trigger**: When puzzle is being fetched from API

---

## 2. Button Location in Layout

### Desktop Layout

```
┌─────────────────────────────────────┐
│  Right Sidebar (w-80)                │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ Header Card                     │ │
│  │ [🧩] Puzzles  [⚙️] Settings   │ │
│  │ User Info                       │ │
│  │ Rating: 219                     │ │
│  │ [━━━━] 🔥 6                     │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ [Solve Puzzles]                 │ │ ← Button here
│  │ (large, full width)             │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ Settings Card                   │ │
│  └─────────────────────────────────┘ │
│  ...                                 │
└─────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────────┐
│  Sidebar (w-full)           │
│                             │
│  [Header Card]              │
│                             │
│  ┌───────────────────────┐ │
│  │ [Solve Puzzles]       │ │ ← Button here
│  │ (full width)          │ │
│  └───────────────────────┘ │
│                             │
│  [Settings Card]            │
│  ...                        │
└─────────────────────────────┘
```

---

## 3. Click Handler Flow

### Handler Chain

```
User clicks "Solve Puzzles"
    ↓
onLoadPuzzle() in PuzzleSidebar
    ↓
handleLoadPuzzle() in Puzzles.tsx
    ↓
loadRandomPuzzle(filters) in PuzzleContext
    ↓
API call to /api/puzzles/random
    ↓
Puzzle data stored in PuzzleContext state
    ↓
UI updates to show puzzle ready state
```

### Handler Implementation

**In `Puzzles.tsx`:**
```tsx
const handleLoadPuzzle = () => {
  const filters: PuzzleFilters = {
    difficulty: difficulty === "custom" ? undefined : difficulty,
    minRating: minRating ? parseInt(minRating) : undefined,
    maxRating: maxRating ? parseInt(maxRating) : undefined,
    motif: motif || undefined,
  };
  loadRandomPuzzle(filters);
};
```

**In `PuzzleSidebar.tsx`:**
```tsx
<Button
  onClick={onLoadPuzzle}  // handleLoadPuzzle passed as prop
  ...
/>
```

---

## 4. Filter Application

### Filter Collection

When the button is clicked, the handler collects filters from the sidebar state:

1. **Difficulty**: 
   - If `difficulty === "custom"`: Set to `undefined` (use custom range instead)
   - Otherwise: Use selected difficulty (easy, medium, hard)

2. **Rating Range**:
   - **Min Rating**: Parsed from `minRating` string (if provided)
   - **Max Rating**: Parsed from `maxRating` string (if provided)
   - Only used when `difficulty === "custom"`

3. **Motif**:
   - Selected motif from dropdown (if any)
   - Empty string converted to `undefined`

### Filter Processing

```tsx
const filters: PuzzleFilters = {
  difficulty: difficulty === "custom" ? undefined : difficulty,
  minRating: minRating ? parseInt(minRating) : undefined,
  maxRating: maxRating ? parseInt(maxRating) : undefined,
  motif: motif || undefined,
};
```

### API Request

Filters are converted to URL query parameters:

- `difficulty` → Rating presets:
  - `easy`: minRating=0, maxRating=1400
  - `medium`: minRating=1400, maxRating=2000
  - `hard`: minRating=2000, maxRating=10000
  - `custom`: Uses provided minRating/maxRating values

- `motif` → `motif` query parameter (if provided)

**Example API Call:**
```
GET /api/puzzles/random?minRating=1400&maxRating=2000&motif=mateIn2
```

---

## 5. State Transitions

### Loading State Flow

```
Initial State
    ↓
User clicks "Solve Puzzles"
    ↓
Button disabled, text → "Loading..."
    ↓
API request in progress
    ↓
Puzzle data received
    ↓
Button enabled, text → "Solve Puzzles"
    ↓
Puzzle data stored (loadedOntoBoard = false)
    ↓
"Start Puzzle" button appears on board
```

### PuzzleContext State Updates

When button is clicked, `loadRandomPuzzle` updates:

1. **Loading State**: `setLoading(true)`
2. **Error State**: `setError(null)` (clears previous errors)
3. **Puzzle State**: After API response:
   ```tsx
   {
     puzzle: Puzzle,           // Full puzzle data
     currentFen: string,        // Initial FEN position
     moveIndex: number,         // Starting move index (0 or 1)
     solutionPv: string[],      // Solution moves array
     solved: false,             // Reset to false
     mistakes: 0,               // Reset to 0
     startTime: 0,             // Will be set when puzzle starts
     hintsUsed: 0,             // Reset to 0
     showSolution: false,       // Reset to false
     loadedOntoBoard: false,   // Puzzle not on board yet
   }
   ```

---

## 6. User Experience Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User selects filters in Settings Card                     │
│    - Difficulty: Medium                                      │
│    - Motif: mateIn2 (optional)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User clicks "Solve Puzzles" button                       │
│    - Button text: "Solve Puzzles"                           │
│    - Button enabled                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Button enters loading state                              │
│    - Button text: "Loading..."                              │
│    - Button disabled                                        │
│    - PuzzleBoard shows "Loading puzzle..."                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. API request to /api/puzzles/random                       │
│    - Query params: minRating=1400&maxRating=2000&motif=...  │
│    - Backend searches puzzle database                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5a. Success: Puzzle found                                   │
│     - Puzzle data stored in PuzzleContext                   │
│     - Button text: "Solve Puzzles"                          │
│     - Button enabled                                        │
│     - PuzzleBoard shows "Start Puzzle" button               │
│     - Current Puzzle Card appears in sidebar                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5b. Error: No puzzle found                                  │
│     - Error message displayed                               │
│     - Button text: "Solve Puzzles"                         │
│     - Button enabled                                        │
│     - PuzzleBoard shows error alert                         │
└─────────────────────────────────────────────────────────────┘
```

### Two-Phase Loading

The puzzle loading process has two distinct phases:

#### Phase 1: Puzzle Data Loading (Button Click)
- **Trigger**: "Solve Puzzles" button click
- **Action**: Fetches puzzle data from API
- **Result**: Puzzle data stored in context (`loadedOntoBoard = false`)
- **UI**: "Start Puzzle" button appears on board

#### Phase 2: Puzzle Board Loading (Start Puzzle Click)
- **Trigger**: "Start Puzzle" button click on board
- **Action**: `loadPuzzleOntoBoard()` called
- **Result**: Puzzle position loaded onto chess board
- **UI**: Board shows puzzle position, controls enabled

---

## 7. Error Handling

### Error States

#### No Puzzle Found
- **Condition**: API returns `null` or empty response
- **Error Message**: "No puzzle found matching your criteria"
- **UI**: Error alert displayed in PuzzleBoard
- **Button State**: Re-enabled, ready for retry

#### Network Error
- **Condition**: API request fails (network error, timeout)
- **Error Message**: "Failed to load puzzle" or error message from API
- **UI**: Error alert displayed in PuzzleBoard
- **Button State**: Re-enabled, ready for retry

#### Invalid Filters
- **Condition**: Invalid filter values (e.g., minRating > maxRating)
- **Error Message**: Handled by backend validation
- **UI**: Error alert displayed
- **Button State**: Re-enabled

### Error Recovery

Users can:
1. Adjust filters in Settings Card
2. Click "Solve Puzzles" again to retry
3. Button remains functional after error

---

## 8. Integration Points

### Dependencies

1. **PuzzleContext** (`PuzzleContext.tsx`):
   - Provides `loadRandomPuzzle()` function
   - Manages `loading` state
   - Manages `error` state
   - Stores puzzle data

2. **Puzzles.tsx**:
   - Manages filter state (difficulty, minRating, maxRating, motif)
   - Provides `handleLoadPuzzle()` handler
   - Passes handler to `PuzzleSidebar`

3. **PuzzleSidebar.tsx**:
   - Receives `onLoadPuzzle` prop
   - Receives `loading` prop
   - Renders button with proper state

4. **PuzzleBoard.tsx**:
   - Reacts to puzzle state changes
   - Shows "Start Puzzle" button when `loadedOntoBoard === false`
   - Displays loading/error states

### API Integration

**Endpoint**: `GET /api/puzzles/random`

**Query Parameters**:
- `minRating` (number): Minimum puzzle rating
- `maxRating` (number): Maximum puzzle rating
- `motif` (string, optional): Puzzle motif filter

**Response**:
```json
{
  "id": "puzzle-id",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "solutionPv": ["e2e4", "e7e5", "f1c4"],
  "rating": 1500,
  "sideToMove": "white",
  "motifs": ["mateIn2", "fork"]
}
```

---

## 9. Accessibility

### Keyboard Navigation
- **Tab Order**: Button is focusable via keyboard navigation
- **Activation**: Can be activated with Enter or Space key
- **Focus Indicator**: Visible focus ring when focused

### Screen Reader Support
- **Label**: Button text "Solve Puzzles" is read by screen readers
- **State Announcement**: Loading state announced ("Loading...")
- **Disabled State**: Screen readers announce when button is disabled

### ARIA Attributes
- Button uses semantic `<button>` element
- `disabled` attribute properly set during loading
- Button text changes reflect state changes

---

## 10. Styling Details

### Tailwind Classes

```tsx
className="w-full h-12 text-base font-semibold"
```

- `w-full`: Full width of container (sidebar width)
- `h-12`: Height of 48px (3rem)
- `text-base`: Base font size (16px)
- `font-semibold`: Font weight 600

### Button Variant

Uses default shadcn Button variant (primary style):
- Background: Primary color
- Text: Primary foreground color
- Hover: Darker shade
- Active: Pressed state
- Disabled: Muted colors, reduced opacity

---

## 11. Testing Considerations

### Test Cases

1. **Default Click**:
   - Click button with default filters
   - Verify API call with correct parameters
   - Verify loading state transition

2. **Custom Filters**:
   - Set custom difficulty and rating range
   - Click button
   - Verify API call includes custom filters

3. **Loading State**:
   - Click button
   - Verify button disabled during loading
   - Verify text changes to "Loading..."

4. **Error Handling**:
   - Simulate API error
   - Verify error message displayed
   - Verify button re-enabled after error

5. **Success Flow**:
   - Click button with valid filters
   - Verify puzzle data loaded
   - Verify "Start Puzzle" button appears

6. **Multiple Clicks**:
   - Click button multiple times rapidly
   - Verify only one API request (loading state prevents duplicate)

---

## 12. Code Reference

### Button Component

**File**: `src/games/chess/components/PuzzleSidebar.tsx`

```tsx
<Button
  onClick={onLoadPuzzle}
  size="lg"
  className="w-full h-12 text-base font-semibold"
  disabled={loading}
>
  {loading ? "Loading..." : "Solve Puzzles"}
</Button>
```

### Handler Function

**File**: `src/games/chess/pages/Puzzles.tsx`

```tsx
const handleLoadPuzzle = () => {
  const filters: PuzzleFilters = {
    difficulty: difficulty === "custom" ? undefined : difficulty,
    minRating: minRating ? parseInt(minRating) : undefined,
    maxRating: maxRating ? parseInt(maxRating) : undefined,
    motif: motif || undefined,
  };
  loadRandomPuzzle(filters);
};
```

### Context Function

**File**: `src/games/chess/state/PuzzleContext.tsx`

```tsx
const loadRandomPuzzle = useCallback(async (filters?: PuzzleFilters) => {
  setLoading(true);
  setError(null);
  
  // Build query parameters
  const params = new URLSearchParams();
  // ... filter processing ...
  
  // API call
  const response = await fetch(`${apiPath("/api/puzzles/random")}?${params.toString()}`);
  const puzzle: Puzzle | null = await response.json();
  
  // Store puzzle data
  setPuzzleState({
    puzzle,
    currentFen: initialFen,
    moveIndex: initialMoveIndex,
    solutionPv,
    // ... other state ...
    loadedOntoBoard: false, // Key: puzzle not on board yet
  });
  
  setLoading(false);
}, []);
```

---

## Summary

The "Solve Puzzles" button is the primary entry point for puzzle mode. It:

1. **Collects filters** from the Settings Card (difficulty, rating range, motif)
2. **Triggers API request** to fetch a random puzzle matching the filters
3. **Manages loading state** with visual feedback (disabled button, "Loading..." text)
4. **Handles errors** gracefully with error messages
5. **Stores puzzle data** in PuzzleContext (but doesn't load it onto the board yet)
6. **Enables two-phase loading** where users must click "Start Puzzle" to begin solving

The button is prominently placed in the sidebar, uses clear visual states, and provides a smooth user experience with proper loading and error handling.

