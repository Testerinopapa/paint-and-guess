# Puzzle Mode - Visual Layout Documentation

## Overview

This document describes the visual layout, component structure, and UI organization of the Puzzle Mode feature in the Chess game. Puzzle mode allows users to solve chess puzzles with customizable difficulty, rating ranges, and motif filters.

**Location:** `src/games/chess/pages/Puzzles.tsx` and `src/games/chess/components/PuzzleBoard.tsx`

---

## 1. Puzzle Mode Page Layout

The puzzle mode page uses a three-column layout: centered chess board with a right sidebar containing all puzzle controls and information.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Puzzle Mode Container                             │
│              (flex, h-[calc(100vh-4rem)], gap-4, p-4)              │
│                                                                       │
│  ┌──────────────────────────────────────┐  ┌───────────────────┐  │
│  │      Center: Chess Board               │  │  Right Sidebar     │  │
│  │      (flex-1, centered)                │  │  (w-80, scroll)   │  │
│  │                                        │  │                    │  │
│  │         ┌──────────────────┐          │  │  ┌──────────────┐  │  │
│  │         │                  │          │  │  │ Header Card  │  │  │
│  │         │                  │          │  │  │              │  │  │
│  │         │   Chess Board    │          │  │  │ [🧩] Puzzles │  │  │
│  │         │   (480×480px)    │          │  │  │ [⚙️] Settings │  │  │
│  │         │                  │          │  │  │              │  │  │
│  │         │                  │          │  │  │ User Info    │  │  │
│  │         │   (Internal      │          │  │  │  │ Rating: 219  │  │  │
│  │         │    labels only)  │          │  │  │ [━━━━] 🔥 6  │  │  │
│  │         │                  │          │  │  │ [━━━━] 🔥 6  │  │  │
│  │         │                  │          │  │  └──────────────┘  │  │
│  │         └──────────────────┘          │  │                    │  │
│  │                                        │  │  [Solve Puzzles]   │  │
│  │         [Move Feedback]                │  │  (large button)   │  │
│  │         (conditional)                  │  │                    │  │
│  │                                        │  │  ┌──────────────┐  │  │
│  │         [💡 Hint] [🔄 Reset]         │  │  │ Settings Card │  │  │
│  │         [ℹ️ Solution]                  │  │  │              │  │  │
│  │                                        │  │  │ Difficulty   │  │  │
│  │         [Solution Display]             │  │  │ Motif        │  │  │
│  │         (conditional)                  │  │  │ Custom Range │  │  │
│  │                                        │  │  └──────────────┘  │  │
│  │                                        │  │                    │  │
│  │                                        │  │  ┌──────────────┐  │  │
│  │                                        │  │  │ More Puzzles │  │  │
│  │                                        │  │  │              │  │  │
│  │                                        │  │  │ Puzzle Rush  │  │  │
│  │                                        │  │  │ Daily Puzzle │  │  │
│  │                                        │  │  │ Puzzle Battle│  │  │
│  │                                        │  │  │ Custom Puzzles│  │  │
│  │                                        │  │  └──────────────┘  │  │
│  │                                        │  │                    │  │
│  │                                        │  │  [📊 Stats]       │  │
│  │                                        │  │                    │  │
│  │                                        │  │  ┌──────────────┐  │  │
│  │                                        │  │  │ Current Puzzle│  │  │
│  │                                        │  │  │ (conditional) │  │  │
│  │                                        │  │  └──────────────┘  │  │
│  └──────────────────────────────────────┘  └───────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Stacked)

```
┌─────────────────────────────┐
│   Puzzle Mode Container      │
│   (flex-col, full height)    │
│                             │
│  ┌───────────────────────┐  │
│  │   Center: Chess Board  │  │
│  │   (flex-1, centered)   │  │
│  │                       │  │
│  │     [Chess Board]     │  │
│  │     (scaled to fit)   │  │
│  │                       │  │
│  │   [Move Feedback]      │  │
│  │   [Controls]          │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Right Sidebar        │  │
│  │   (w-full, scroll)     │  │
│  │                       │  │
│  │   [Header Card]        │  │
│  │   [Solve Puzzles]     │  │
│  │   [Settings Card]     │  │
│  │   [More Puzzles]      │  │
│  │   [Stats]             │  │
│  │   [Current Puzzle]    │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### Component Structure (Page Layout)

```
PuzzlesPage
└── ChessProvider
    └── PuzzleProvider
        └── PuzzlesContent
            └── Container (flex, flex-col lg:flex-row, h-[calc(100vh-4rem)], gap-4, p-4)
                ├── Center: Chess Board Area (flex-1, min-h-0)
                │   └── PuzzleBoard
                │       └── (see section 2)
                │
                └── Right Sidebar (w-full lg:w-80, flex-shrink-0, overflow-y-auto)
                    └── PuzzleSidebar
                        ├── Header Card
                        │   ├── CardHeader (flex-row, justify-between)
                        │   │   ├── Title with Puzzle Icon
                        │   │   └── Settings Button (icon)
                        │   └── CardContent
                        │       ├── User Info Section
                        │       │   ├── Avatar
                        │       │   └── Motivational Text
                        │       └── Rating Display
                        │           ├── Rating Number
                        │           └── Streak Progress Bar
                        │
                        ├── Solve Puzzles Button (size="lg", w-full)
                        │
                        ├── Settings Card
                        │   ├── CardHeader
                        │   │   ├── CardTitle "Settings"
                        │   │   └── CardDescription
                        │   └── CardContent
                        │       ├── Difficulty Selector
                        │       ├── Custom Rating Inputs (conditional)
                        │       └── Motif Selector
                        │
                        ├── More Puzzles Card
                        │   ├── CardHeader
                        │   │   └── CardTitle "More Puzzles"
                        │   └── CardContent
                        │       ├── Puzzle Rush Button
                        │       ├── Daily Puzzle Button
                        │       ├── Puzzle Battle Button
                        │       └── Custom Puzzles Button
                        │
                        ├── Stats Link Button
                        │
                        └── Current Puzzle Card (conditional)
                            ├── CardHeader
                            │   └── CardTitle "Current Puzzle"
                            └── CardContent
                                ├── "You are" Badge
                                ├── Rating Display
                                ├── Motif Badge
                                └── Move Count / Solved Badge
```

### Responsive Behavior

- **Desktop (lg: 1024px+)**: Three-column layout
  - Center: Chess board (flex-1, takes remaining space)
  - Right: Sidebar (fixed width 320px / w-80)
  - Sidebar scrolls independently when content overflows
  
- **Mobile/Tablet (< lg)**: Stacked layout
  - Top: Chess board area (flex-1)
  - Bottom: Sidebar (full width, scrollable)
  - Both sections maintain full height within viewport

---

## 2. Puzzle Board Layout

The puzzle board section displays the centered chess board with move feedback and controls below.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Puzzle Board Container                             │
│        (flex flex-col, items-center justify-center, h-full, gap-4)    │
│                                                                       │
│         ┌──────────────────────────────────────────┐                │
│         │  Move Feedback Alert (conditional)        │                │
│         │  (max-w-md)                               │                │
│         │                                           │                │
│         │  [✓] Correct! Opponent's move...         │                │
│         │  or                                       │                │
│         │  [✗] Incorrect. Try again.               │                │
│         └──────────────────────────────────────────┘                │
│                                                                       │
│         ┌──────────────────────────────────────────┐                │
│         │  Chess Board Container (relative)         │                │
│         │                                           │                │
│         │  ┌────────────────────────────────────┐  │                │
│         │  │                                    │  │                │
│         │  │   Chess Board (480×480px)          │  │                │
│         │  │                                    │  │                │
│         │  │   (Internal labels in corners)    │  │                │
│         │  │   (a1, a8, h1, h8 only)            │  │                │
│         │  │                                    │  │                │
│         │  │   [Debug Panel] (conditional)      │  │                │
│         │  │   [Hint Overlay] (conditional)     │  │                │
│         │  │                                    │  │                │
│         │  └────────────────────────────────────┘  │                │
│         │                                           │                │
│         └──────────────────────────────────────────┘                │
│                                                                       │
│         ┌──────────────────────────────────────────┐                │
│         │  Control Buttons (flex-wrap, gap-2)        │                │
│         │                                           │                │
│         │  [💡 Hint (0)]  [🔄 Reset]  [ℹ️ Solution]│                │
│         └──────────────────────────────────────────┘                │
│                                                                       │
│         ┌──────────────────────────────────────────┐                │
│         │  Solution Display (conditional, max-w-md)  │                │
│         │                                           │                │
│         │  Solution:                                │                │
│         │  [e2→e4] [e7→e5] [f1→c4] [f8→c5] [d1→f3]│                │
│         │  (completed moves highlighted)            │                │
│         └──────────────────────────────────────────┘                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────────┐
│   Puzzle Board Container     │
│   (flex-col, centered)       │
│                             │
│  ┌───────────────────────┐  │
│  │ Move Feedback         │  │
│  │ [✓] Correct!          │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │                     │  │
│  │   Chess Board       │  │
│  │   (scaled to fit)   │  │
│  │                     │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Controls              │  │
│  │ [💡] [🔄] [ℹ️]        │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Solution Display       │  │
│  │ (if shown)            │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### Component Structure (Puzzle Board)

```
PuzzleBoard
├── Container (flex flex-col, items-center justify-center, h-full, gap-4, relative)
│   │
│   ├── Chess Board (ALWAYS RENDERED)
│   │   └── ChessBoard component (always visible)
│   │
│   ├── Move Feedback Alert (conditional, max-w-md, z-10)
│   │
│   ├── Error Overlay (conditional, absolute, z-30)
│   │   └── Alert (destructive variant, max-w-md)
│   │
│   ├── Empty State Overlay (conditional, absolute, z-30)
│   │   └── Centered text "No puzzle loaded..."
│   │
│   └── Puzzle Content (when puzzle loaded)
│       ├── Move Feedback Alert (conditional, max-w-md)
│       │   ├── Alert (variant based on result)
│       │   │   ├── CheckCircle2 Icon (if correct)
│       │   │   ├── XCircle Icon (if incorrect)
│       │   │   └── AlertDescription
│       │   │       └── Feedback message
│       │
│       ├── Chess Board Container (relative)
│       │   ├── ChessBoard Component (ALWAYS RENDERED)
│       │   │   ├── FEN prop (puzzle FEN when loaded, undefined otherwise)
│       │   │   ├── Orientation prop
│       │   │   ├── onMove callback (only when puzzle active)
│       │   │   └── disabled prop
│       │   │
│       │   ├── Debug Panel (conditional, absolute, top-0, left-0, z-20)
│       │   │   └── Debug info (FEN, move index, solved, mistakes)
│       │   │
│       │   └── Hint Overlay (conditional, absolute, inset-0, z-10)
│       │       └── Yellow border squares (pulse animation)
│       │
│       ├── Control Buttons (flex, flex-wrap, gap-2, justify-center)
│       │   ├── Hint Button
│       │   │   ├── Lightbulb Icon
│       │   │   └── "Hint ({hintsUsed})"
│       │   │
│       │   ├── Reset Button
│       │   │   ├── RotateCcw Icon
│       │   │   └── "Reset"
│       │   │
│       │   └── Solution Button
│       │       ├── Info Icon
│       │       └── "Show/Hide Solution"
│       │
│       └── Solution Display (conditional, max-w-md, p-4, bg-muted, rounded-lg)
│           ├── Title "Solution:"
│           └── Solution Moves (flex, flex-wrap, gap-2)
│               └── Badge for each move
│                   ├── Completed moves (default variant)
│                   └── Remaining moves (outline variant)
```

---

## 3. Chess Board Component Layout

The chess board itself has a specific layout with labels and squares.

### Board Structure

```
┌─────────────────────────────────────────────────────────┐
│              Chess Board Container                       │
│              (flex, flex-direction: column)              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ File Labels (Top - Black orientation only)       │  │
│  │ h  g  f  e  d  c  b  a                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Board Row (flex, align-items: center)           │  │
│  │                                                  │  │
│  │  ┌──┐  ┌──────────────────────┐  ┌──┐         │  │
│  │  │8 │  │                      │  │8 │         │  │
│  │  │7 │  │                      │  │7 │         │  │
│  │  │6 │  │   Chess Board Grid   │  │6 │         │  │
│  │  │5 │  │   (8×8 squares)      │  │5 │         │  │
│  │  │4 │  │   480×480px          │  │4 │         │  │
│  │  │3 │  │                      │  │3 │         │  │
│  │  │2 │  │   [Pieces]           │  │2 │         │  │
│  │  │1 │  │   [Labels in corners]│  │1 │         │  │
│  │  └──┘  │                      │  └──┘         │  │
│  │  Rank  │                      │  Rank         │  │
│  │  Left  │                      │  Right        │  │
│  │  (White│                      │  (Black       │  │
│  │   only)│                      │   only)        │  │
│  │        └──────────────────────┘                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ File Labels (Bottom - White orientation only)   │  │
│  │ a  b  c  d  e  f  g  h                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Square Layout (8×8 Grid)

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 8   │     │     │     │     │     │     │     │
│ a8  │ b8  │ c8  │ d8  │ e8  │ f8  │ g8  │ h8  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 7   │     │     │     │     │     │     │     │
│ a7  │ b7  │ c7  │ d7  │ e7  │ f7  │ g7  │ h7  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 6   │     │     │     │     │     │     │     │
│ a6  │ b6  │ c6  │ d6  │ e6  │ f6  │ g6  │ h6  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 5   │     │     │     │     │     │     │     │
│ a5  │ b5  │ c5  │ d5  │ e5  │ f5  │ g5  │ h5  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 4   │     │     │     │     │     │     │     │
│ a4  │ b4  │ c4  │ d4  │ e4  │ f4  │ g4  │ h4  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 3   │     │     │     │     │     │     │     │
│ a3  │ b3  │ c3  │ d3  │ e3  │ f3  │ g3  │ h3  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 2   │     │     │     │     │     │     │     │
│ a2  │ b2  │ c2  │ d2  │ e2  │ f2  │ g2  │ h2  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 1   │     │     │     │     │     │     │     │
│ a1  │ b1  │ c1  │ d1  │ e1  │ f1  │ g1  │ h1  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
     a     b     c     d     e     f     g     h
```

### Square Label Positioning

- **Internal labels only**: Labels appear only inside corner squares (a1, a8, h1, h8)
- **Rank labels (1-8)**: Top-left corner (white orientation) or top-right corner (black orientation)
- **File labels (a-h)**: Bottom-right corner (white orientation) or top-right corner (black orientation)
- **Label colors**: Dark on light squares (#b58863), light on dark squares (#f0d9b5)
- **No external labels**: File labels (a-h) and rank labels (1-8) are NOT displayed around board edges

---

## 4. Visual Design Details

### Color Scheme

- **Background**: System background color
- **Card Background**: Card component default
- **Chess Board Light Squares**: #f0d9b5
- **Chess Board Dark Squares**: #b58863
- **Selected Square**: #baca44
- **Legal Move Highlight**: #f6f669
- **Last Move Highlight**: #cdd26a
- **Hint Overlay**: Yellow border (#yellow-400) with pulse animation
- **Progress Bar Background**: bg-muted
- **Progress Bar Fill**: bg-primary
- **Text Primary**: Default text color
- **Text Muted**: text-muted-foreground

### Typography

- **Card Titles**: CardTitle component (default size)
- **Card Descriptions**: CardDescription component (text-muted-foreground)
- **Labels**: text-sm, font-medium
- **Badge Text**: Badge component default
- **Body Text**: Default
- **Muted Text**: text-muted-foreground, text-sm
- **Board Labels**: 11px, font-weight: 600

### Spacing

- **Page Container**: space-y-6 (24px vertical gap)
- **Puzzle Board Container**: space-y-4 (16px vertical gap)
- **Card Content Padding**: p-4 (16px) or p-6 (24px)
- **Grid Gap**: gap-4 (16px)
- **Button Gap**: gap-2 (8px)
- **Badge Gap**: gap-2 (8px)
- **Square Size**: 60px × 60px
- **Board Size**: 480px × 480px (8 × 60px)

### Interactive Elements

#### Buttons
- **Primary Action**: "New Puzzle" button (size="lg", full width)
- **Control Buttons**: Outline variant (Hint, Reset, Show Solution)
- **Disabled State**: Disabled when puzzle solved or loading
- **Icon + Text**: Icons from lucide-react with text labels

#### Badges
- **Info Badges**: Outline variant (You are, Rating, Motif)
- **Status Badges**: Default variant (Solved!)
- **Progress Badges**: Outline variant (Move count)
- **Solution Badges**: Default for completed, outline for remaining

#### Alerts
- **Success Alert**: Default variant (green) for correct moves
- **Error Alert**: Destructive variant (red) for incorrect moves
- **Auto-dismiss**: 2-3 seconds after display

#### Chess Board
- **Square Interaction**: Click or drag to move pieces
- **Selection Highlight**: Yellow-green (#baca44)
- **Legal Move Indicators**: Yellow dots on empty squares
- **Cursor**: Pointer on interactive squares, not-allowed when disabled

---

## 5. Responsive Breakpoints

### Mobile First Approach

- **Base (Mobile)**: Single column layout
  - Settings panel: Stacked inputs
  - Puzzle board: Stacked cards
  - Buttons: Full width
  - Board: Scaled to fit container

- **Medium (md: 768px+)**: Two-column layout
  - Settings panel: Two-column grid for filters
  - Puzzle board: Maintains stacked cards
  - Board: Full size (480×480px)

### Container Constraints

- **Page Container**: Full width, centered content
- **Card Width**: Full width within container
- **Chess Board**: Fixed 480×480px (scales down on mobile)
- **Square Size**: Fixed 60px × 60px

---

## 6. State-Dependent UI Elements

### Loading State

- **Board**: Always visible (no overlay)
- **Button**: Shows "Loading..." text (disabled state)
- **No loading text overlay**: Board remains visible during loading

### Error State

```
┌─────────────────────────────────────┐
│         Card                        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Alert (destructive variant)  │  │
│  │                               │  │
│  │ "No puzzle found matching    │  │
│  │  your criteria"              │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Empty State (No Puzzle)

- **Board**: Always visible (shows default/starting position)
- **Overlay**: Absolute positioned overlay with message
- **Message**: "No puzzle loaded. Click 'Solve Puzzles' to start."
- **Styling**: Centered text, no blur backdrop

### Solved State

- **Badge**: Changes from "Move X / Y" to "✓ Solved!" (green background)
- **Buttons**: Hint and Reset buttons disabled
- **Board**: Disabled (no moves allowed)
- **Auto-record**: Attempt automatically recorded

### Puzzle Loading Flow

1. **User clicks "Solve Puzzles"**:
   - Button shows "Loading..." and becomes disabled
   - Board remains visible (no loading overlay)
   
2. **Puzzle data loads**:
   - `resetGame()` called first (same as "New Game" button)
   - Puzzle FEN loaded into ChessContext
   - Pieces update automatically via React reactivity
   
3. **Puzzle ready**:
   - Board shows puzzle position immediately
   - Controls appear below board
   - Timer starts automatically

### Hint State

- **Overlay**: Yellow border squares appear on source and target
- **Animation**: Pulse effect (1s infinite)
- **Duration**: 3 seconds, then auto-hides
- **Counter**: Increments in button label

### Solution Display State

- **Visibility**: Toggleable via "Show/Hide Solution" button
- **Layout**: Badge list showing all moves
- **Visual**: Completed moves highlighted, remaining moves outlined
- **Format**: "from→to" (e.g., "e2→e4")

---

## 7. Layout Hierarchy

### Page Structure

```
Page Container
└── ChessProvider (Context Provider)
    └── PuzzleProvider (Context Provider)
        └── PuzzlesContent
            └── Flex Container (flex, flex-col lg:flex-row)
                ├── Center: PuzzleBoard (flex-1)
                │   ├── Move Feedback Alert (conditional)
                │   ├── Chess Board
                │   ├── Control Buttons
                │   └── Solution Display (conditional)
                │
                └── Right: PuzzleSidebar (w-80)
                    ├── Header Card
                    ├── Solve Puzzles Button
                    ├── Settings Card
                    ├── More Puzzles Card
                    ├── Stats Link
                    └── Current Puzzle Card (conditional)
```

### Component Dependencies

```
PuzzlesPage
├── ChessProvider (provides chess utilities)
├── PuzzleProvider (provides puzzle state)
├── PuzzlesContent
│   ├── PuzzleBoard (displays centered puzzle)
│   │   ├── ChessBoard (displays board)
│   │   │   └── ChessPiece (renders pieces)
│   │   └── UI Components (Button, Badge, Alert)
│   │
│   └── PuzzleSidebar (right sidebar controls)
│       ├── Header Card (user info, rating, streak)
│       ├── Settings Card (filters)
│       ├── More Puzzles Card (other modes)
│       └── Current Puzzle Card (puzzle info)
└── UI Components (Card, Select, Input, Button, Label, Badge, Progress)
```

---

## 8. Navigation Flow

```
┌─────────────┐
│   GameHub   │
└──────┬──────┘
       │
       ├───> /games/chess/puzzles
       │     │
       │     └───> PuzzlesPage
       │           │
       │           ├─── Select Filters ──┐
       │           │                      │
       │           ├─── Click "New Puzzle" ──┐
       │           │                          │
       │           │                          ▼
       │           │              PuzzleBoard displays puzzle
       │           │                          │
       │           │                          ├─── Solve puzzle
       │           │                          │
       │           │                          ├─── Use hints
       │           │                          │
       │           │                          ├─── Reset puzzle
       │           │                          │
       │           │                          └─── Show solution
       │           │
       │           └─── Click "New Puzzle" again ──> New puzzle with same/different filters
       │
```

---

## 9. Accessibility Considerations

### Visual Structure

- **Semantic HTML**: Proper heading hierarchy
- **Labels**: All inputs have associated labels
- **Icon + Text**: Icons paired with text labels
- **ARIA Labels**: Interactive elements properly labeled

### Interactive Elements

- **Keyboard Navigation**: All inputs and buttons are keyboard accessible
- **Enter Key**: Submits "New Puzzle" when focused
- **Focus States**: Visible focus indicators
- **Disabled States**: Clearly indicated

### Color Contrast

- **Text**: Meets contrast requirements
- **Board Labels**: High contrast on squares
- **Badges**: Readable on all backgrounds
- **Muted Text**: Still readable for secondary information

### Screen Reader Support

- **Button Labels**: Descriptive text ("Hint (0)", "Reset", etc.)
- **Status Messages**: Move feedback announced
- **Progress**: Progress bar has accessible label
- **Board State**: Current position and move count communicated

---

## 10. Component Dependencies

### UI Components Used

- **Button**: From `@/components/ui/button`
- **Input**: From `@/components/ui/input`
- **Label**: From `@/components/ui/label`
- **Select**: From `@/components/ui/select`
- **Card**: From `@/components/ui/card`
- **Badge**: From `@/components/ui/badge`
- **Alert**: From `@/components/ui/alert`

### Icons Used

- **Lightbulb**: From `lucide-react` (hint button)
- **RotateCcw**: From `lucide-react` (reset button)
- **Info**: From `lucide-react` (solution button)
- **CheckCircle2**: From `lucide-react` (correct move, solved)
- **XCircle**: From `lucide-react` (incorrect move)

### External Libraries

- **chess.js**: Game state management
- **chessops**: FEN parsing and position setup
- **React Context**: State management (PuzzleContext, ChessContext)

---

## 11. Special Features

### Hint System

- **Visual**: Yellow border overlay on source and target squares
- **Animation**: Pulse effect (1s infinite)
- **Duration**: 3 seconds auto-hide
- **Tracking**: Counter increments in button

### Progress Tracking

- **Visual Bar**: Horizontal progress bar showing completion percentage
- **Calculation**: `(moveIndex / solutionPv.length) * 100`
- **Update**: Real-time as moves are made
- **Visual**: Primary color fill, muted background

### Auto-Play

- **Opponent Moves**: Automatically played after correct player move
- **Visual Feedback**: Board updates immediately
- **No Interaction**: Opponent moves cannot be controlled

### Debug Panel

- **Visibility**: Only when debug mode enabled
- **Position**: Absolute, top-left corner of board
- **Content**: FEN, move index, solved status, mistakes
- **Style**: Black background with white text, monospace font

---

## Summary

Puzzle Mode uses a modern three-column layout inspired by Chess.com:

1. **Center Area**: Centered chess board with move feedback and controls below
2. **Right Sidebar**: All puzzle controls, settings, and information in a scrollable sidebar

### Key Layout Features

- **Three-Column Desktop Layout**: Board centered, sidebar on right (320px fixed width)
- **Stacked Mobile Layout**: Board on top, sidebar below (both full width)
- **Sidebar Sections**:
  - Header with user info, rating, and streak progress
  - Large "Solve Puzzles" action button
  - Settings card for difficulty and motif filters
  - More puzzle modes section
  - Stats link
  - Current puzzle info card (when puzzle is loaded)

- **Centered Board**: Chess board is centered without card wrappers, with controls and solution display below
- **Always Rendered**: Board component is always mounted, preventing re-rendering issues
- **Direct Loading**: Puzzles load directly onto board (no "Start Puzzle" step)
- **Internal Labels Only**: Coordinate labels appear only in corner squares, not around board edges
- **Responsive Design**: Seamlessly adapts from mobile to desktop
- **Independent Scrolling**: Sidebar scrolls independently when content overflows

The layout is fully responsive, working seamlessly from mobile to desktop screens. The chess board includes coordinate labels (files and ranks) and maintains a fixed aspect ratio. All interactive elements provide clear visual feedback and maintain accessibility standards.

The design follows the GameHub design system using shadcn-ui components and Tailwind CSS styling, ensuring consistency with the rest of the application.

