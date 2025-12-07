# Puzzle Mode - Visual Layout Documentation

## Overview

This document describes the visual layout, component structure, and UI organization of the Puzzle Mode feature in the Chess game. Puzzle mode allows users to solve chess puzzles with customizable difficulty, rating ranges, and motif filters.

**Location:** `src/games/chess/pages/Puzzles.tsx` and `src/games/chess/components/PuzzleBoard.tsx`

---

## 1. Puzzle Mode Page Layout

The puzzle mode page consists of two main sections: the Puzzle Settings panel and the Puzzle Board interface.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Puzzle Mode Container                             │
│                    (space-y-6, vertical stack)                       │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Puzzle Settings Card                              │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Card Header                                            │  │  │
│  │  │ Puzzle Settings (CardTitle)                            │  │  │
│  │  │ Choose difficulty, rating range, or motif...           │  │  │
│  │  │ (CardDescription)                                      │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Card Content (space-y-4)                              │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌────────────────────┐  ┌────────────────────┐     │  │  │
│  │  │  │ Difficulty         │  │ Motif (Optional)   │     │  │  │
│  │  │  │                    │  │                    │     │  │  │
│  │  │  │ [Select: Medium ▼] │  │ [Select: All ▼]   │     │  │  │
│  │  │  │                    │  │                    │     │  │  │
│  │  │  └────────────────────┘  └────────────────────┘     │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌────────────────────┐  ┌────────────────────┐     │  │  │
│  │  │  │ Min Rating        │  │ Max Rating         │     │  │  │
│  │  │  │ (conditional)     │  │ (conditional)       │     │  │  │
│  │  │  │ [Input: 0]        │  │ [Input: 10000]     │     │  │  │
│  │  │  └────────────────────┘  └────────────────────┘     │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────────────────────────────────┐     │  │  │
│  │  │  │ [New Puzzle Button] (full width, lg size)  │     │  │  │
│  │  │  │   (disabled when loading)                   │     │  │  │
│  │  │  └──────────────────────────────────────────────┘     │  │  │
│  │  │                                                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Puzzle Board Section                         │  │
│  │                    (PuzzleBoard component)                      │  │
│  │                    (see section 2)                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Single Column)

```
┌─────────────────────────────┐
│   Puzzle Mode Container      │
│                             │
│  ┌───────────────────────┐  │
│  │ Puzzle Settings Card   │  │
│  │                       │  │
│  │   Puzzle Settings     │  │
│  │   Description...      │  │
│  │                       │  │
│  │   Difficulty:         │  │
│  │   [Select ▼]          │  │
│  │                       │  │
│  │   Min Rating:         │  │
│  │   [Input]             │  │
│  │                       │  │
│  │   Max Rating:         │  │
│  │   [Input]             │  │
│  │                       │  │
│  │   Motif:              │  │
│  │   [Select ▼]          │  │
│  │                       │  │
│  │   [New Puzzle]        │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Puzzle Board         │  │
│  │   (stacked cards)      │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### Component Structure (Settings Panel)

```
PuzzlesPage
└── ChessProvider
    └── PuzzleProvider
        └── PuzzlesContent
            └── Container (space-y-6)
                ├── Puzzle Settings Card
                │   ├── CardHeader
                │   │   ├── CardTitle "Puzzle Settings"
                │   │   └── CardDescription
                │   └── CardContent (space-y-4)
                │       ├── Grid Container (grid, gap-4, md:grid-cols-2)
                │       │   ├── Difficulty Selector
                │       │   │   ├── Label "Difficulty"
                │       │   │   └── Select
                │       │   │       ├── SelectTrigger
                │       │   │       └── SelectContent
                │       │   │           ├── "Easy (0-1400)"
                │       │   │           ├── "Medium (1400-2000)"
                │       │   │           ├── "Hard (2000+)"
                │       │   │           └── "Custom Range"
                │       │   │
                │       │   ├── Custom Rating Inputs (conditional)
                │       │   │   ├── Min Rating Input Group
                │       │   │   │   ├── Label "Min Rating"
                │       │   │   │   └── Input (type="number", placeholder="0")
                │       │   │   └── Max Rating Input Group
                │       │   │       ├── Label "Max Rating"
                │       │   │       └── Input (type="number", placeholder="10000")
                │       │   │
                │       │   └── Motif Selector
                │       │       ├── Label "Motif (Optional)"
                │       │       └── Select
                │       │           ├── SelectTrigger
                │       │           └── SelectContent
                │       │               ├── "All motifs"
                │       │               └── [25+ motif options]
                │       │
                │       └── New Puzzle Button
                │           └── Button (size="lg", w-full, disabled={loading})
                │
                └── PuzzleBoard
                    └── (see section 2)
```

### Responsive Behavior (Settings Panel)

- **Desktop (md and above)**: Two-column grid layout for filters
- **Mobile**: Single column stack
- **Custom Rating Inputs**: Only visible when "Custom Range" is selected
- **Button**: Full width on all screen sizes

---

## 2. Puzzle Board Layout

The puzzle board section displays the current puzzle, chessboard, and controls.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Puzzle Board Container                             │
│                    (space-y-4, vertical stack)                       │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Puzzle Info Card                                  │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Card Content (p-4)                                    │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────────┐  ┌──────────────────────┐   │  │  │
│  │  │  │ Left Badges         │  │ Right Badge          │   │  │  │
│  │  │  │                     │  │                      │   │  │  │
│  │  │  │ [You are: white]    │  │ [Move 1 / 5]        │   │  │  │
│  │  │  │ [Rating: 1500]      │  │ or                   │   │  │  │
│  │  │  │ [fork]              │  │ [✓ Solved!]          │   │  │  │
│  │  │  └──────────────────────┘  └──────────────────────┘   │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────────────────────────────────┐     │  │  │
│  │  │  │ Progress Bar                                │     │  │  │
│  │  │  │ [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] │     │  │  │
│  │  │  │ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │     │  │  │
│  │  │  │ (20% complete)                              │     │  │  │
│  │  │  └──────────────────────────────────────────────┘     │  │  │
│  │  │                                                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Move Feedback Alert (conditional)                 │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ [✓] Correct! Opponent's move played automatically.     │  │  │
│  │  │ or                                                      │  │  │
│  │  │ [✗] Incorrect. Try again.                              │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Chess Board Card                                  │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Card Content (p-6)                                    │  │  │
│  │  │                                                        │  │  │
│  │  │         ┌──────────────────────────────┐              │  │  │
│  │  │         │  Chess Board Container      │              │  │  │
│  │  │         │  (relative positioning)     │              │  │  │
│  │  │         │                              │              │  │  │
│  │  │         │  ┌────────────────────────┐ │              │  │  │
│  │  │         │  │                        │ │              │  │  │
│  │  │         │  │   Chess Board          │ │              │  │  │
│  │  │         │  │   (480×480px)          │ │              │  │  │
│  │  │         │  │                        │ │              │  │  │
│  │  │         │  │   [File labels a-h]    │ │              │  │  │
│  │  │         │  │   [Rank labels 1-8]   │ │              │  │  │
│  │  │         │  │                        │ │              │  │  │
│  │  │         │  └────────────────────────┘ │              │  │  │
│  │  │         │                              │              │  │  │
│  │  │         │  [Debug Panel] (conditional)│              │  │  │
│  │  │         │  [Hint Overlay] (conditional)│              │  │  │
│  │  │         └──────────────────────────────┘              │  │  │
│  │  │                                                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Controls Card                                     │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Card Content (p-4)                                    │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────────────────────────────────────┐ │  │  │
│  │  │  │ Control Buttons (flex-wrap, gap-2, centered)   │ │  │  │
│  │  │  │                                                  │ │  │  │
│  │  │  │ [💡 Hint (0)]  [🔄 Reset]  [ℹ️ Show Solution] │ │  │  │
│  │  │  └──────────────────────────────────────────────────┘ │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────────────────────────────────────┐ │  │  │
│  │  │  │ Solution Display (conditional)                  │ │  │  │
│  │  │  │                                                  │ │  │  │
│  │  │  │ Solution:                                       │ │  │  │
│  │  │  │ [e2→e4] [e7→e5] [f1→c4] [f8→c5] [d1→f3]        │ │  │  │
│  │  │  │ (completed moves highlighted)                   │ │  │  │
│  │  │  └──────────────────────────────────────────────────┘ │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────────────────────────────────────┐ │  │  │
│  │  │  │ Stats (conditional)                              │ │  │  │
│  │  │  │                                                  │ │  │  │
│  │  │  │ Mistakes: 2                                     │ │  │  │
│  │  │  └──────────────────────────────────────────────────┘ │  │  │
│  │  │                                                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────────┐
│   Puzzle Board Container     │
│                             │
│  ┌───────────────────────┐  │
│  │ Puzzle Info Card      │  │
│  │                       │  │
│  │   [You are: white]    │  │
│  │   [Rating: 1500]      │  │
│  │   [fork]              │  │
│  │   [Move 1 / 5]        │  │
│  │                       │  │
│  │   [Progress Bar]      │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Move Feedback         │  │
│  │ [✓] Correct!          │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Chess Board Card      │  │
│  │                       │  │
│  │   [Chess Board]       │  │
│  │   (scaled to fit)     │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Controls Card         │  │
│  │                       │  │
│  │   [💡 Hint]           │  │
│  │   [🔄 Reset]          │  │
│  │   [ℹ️ Solution]       │  │
│  │                       │  │
│  │   [Solution Display]  │  │
│  │   [Stats]             │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### Component Structure (Puzzle Board)

```
PuzzleBoard
├── Container (space-y-4)
│   │
│   ├── Puzzle Info Card
│   │   ├── CardContent (p-4)
│   │   │   ├── Badge Row (flex, justify-between, wrap, gap-4)
│   │   │   │   ├── Left Badges (flex, gap-2)
│   │   │   │   │   ├── Badge "You are: {sideToMove}"
│   │   │   │   │   ├── Badge "Rating: {rating}"
│   │   │   │   │   └── Badge "{motif}" (if exists)
│   │   │   │   │
│   │   │   │   └── Right Badge
│   │   │   │       ├── "Move {index+1} / {total}" (if not solved)
│   │   │   │       └── "✓ Solved!" (if solved)
│   │   │   │
│   │   │   └── Progress Bar (mt-4)
│   │   │       ├── Container (w-full, bg-muted, rounded-full, h-2)
│   │   │       └── Progress Fill (bg-primary, h-2, rounded-full, transition)
│   │   │
│   │
│   ├── Move Feedback Alert (conditional)
│   │   ├── Alert (variant based on result)
│   │   │   ├── CheckCircle2 Icon (if correct)
│   │   │   ├── XCircle Icon (if incorrect)
│   │   │   └── AlertDescription
│   │   │       └── Feedback message
│   │
│   ├── Chess Board Card
│   │   ├── CardContent (p-6)
│   │   │   └── Board Container (flex, justify-center)
│   │   │       └── Relative Container
│   │   │           ├── ChessBoard Component
│   │   │           │   ├── FEN prop
│   │   │           │   ├── Orientation prop
│   │   │           │   ├── onMove callback
│   │   │           │   └── disabled prop
│   │   │           │
│   │   │           ├── Debug Panel (conditional, absolute, top-0, left-0)
│   │   │           │   └── Debug info (FEN, move index, solved, mistakes)
│   │   │           │
│   │   │           └── Hint Overlay (conditional, absolute, inset-0)
│   │   │               └── Yellow border squares (pulse animation)
│   │   │
│   │
│   └── Controls Card
│       ├── CardContent (p-4)
│       │   ├── Control Buttons (flex, flex-wrap, gap-2, justify-center)
│       │   │   ├── Hint Button
│       │   │   │   ├── Lightbulb Icon
│       │   │   │   └── "Hint ({hintsUsed})"
│       │   │   │
│       │   │   ├── Reset Button
│       │   │   │   ├── RotateCcw Icon
│       │   │   │   └── "Reset"
│       │   │   │
│       │   │   └── Solution Button
│       │   │       ├── Info Icon
│       │   │       └── "Show/Hide Solution"
│       │   │
│       │   ├── Solution Display (conditional, mt-4, p-4, bg-muted, rounded-lg)
│       │   │   ├── Title "Solution:"
│       │   │   └── Solution Moves (flex, flex-wrap, gap-2)
│       │   │       └── Badge for each move
│       │   │           ├── Completed moves (default variant)
│       │   │           └── Remaining moves (outline variant)
│       │   │
│       │   └── Stats (conditional, mt-4, text-center, text-sm, muted)
│       │       └── "Mistakes: {mistakes}"
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

- **Rank labels (1-8)**: Top-left corner (white orientation) or top-right corner (black orientation)
- **File labels (a-h)**: Bottom-right corner (white orientation) or top-right corner (black orientation)
- **Label colors**: Dark on light squares (#b58863), light on dark squares (#f0d9b5)

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

```
┌─────────────────────────────────────┐
│         Card                        │
│                                     │
│     "Loading puzzle..."            │
│     (text-muted-foreground,        │
│      centered, p-8)                 │
│                                     │
└─────────────────────────────────────┘
```

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

```
┌─────────────────────────────────────┐
│         Card                        │
│                                     │
│  "No puzzle loaded. Click          │
│   'New Puzzle' to start."           │
│  (text-muted-foreground,           │
│   centered, p-8)                   │
│                                     │
└─────────────────────────────────────┘
```

### Solved State

- **Badge**: Changes from "Move X / Y" to "✓ Solved!" (green background)
- **Buttons**: Hint and Reset buttons disabled
- **Board**: Disabled (no moves allowed)
- **Auto-record**: Attempt automatically recorded

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
            ├── Puzzle Settings Card
            └── PuzzleBoard
                ├── Puzzle Info Card
                ├── Move Feedback Alert (conditional)
                ├── Chess Board Card
                └── Controls Card
```

### Component Dependencies

```
PuzzlesPage
├── ChessProvider (provides chess utilities)
├── PuzzleProvider (provides puzzle state)
├── PuzzleBoard (displays puzzle)
│   ├── ChessBoard (displays board)
│   │   └── ChessPiece (renders pieces)
│   └── UI Components (Card, Badge, Button, Alert)
└── UI Components (Card, Select, Input, Button, Label)
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

Puzzle Mode uses a clean, card-based layout with three main sections:

1. **Puzzle Settings Panel**: Filter controls in a responsive grid
2. **Puzzle Info Card**: Status badges and progress bar
3. **Puzzle Board Section**: Chess board with controls and solution display

The layout is fully responsive, working seamlessly from mobile to desktop screens. The chess board includes coordinate labels (files and ranks) and maintains a fixed aspect ratio. All interactive elements provide clear visual feedback and maintain accessibility standards.

The design follows the GameHub design system using shadcn-ui components and Tailwind CSS styling, ensuring consistency with the rest of the application.

