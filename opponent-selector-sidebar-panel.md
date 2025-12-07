# Opponent Selector Sidebar Panel - Documentation

## Overview

The Opponent Selector is a sidebar panel component that displays AI chess opponents organized by difficulty categories. It provides a visual grid-based interface for selecting opponents, similar to Chess.com's "Play vs..." interface. The panel appears on the right side of the chess game page when in AI mode and no game is active.

## Component Location

**File:** `src/games/chess/components/OpponentSelector.tsx`

**Usage:** Rendered in `src/games/chess/pages/Play.tsx` when:
- Game mode is set to "ai"
- `aiConfig.enabled === false` (no active game)

## Visual Layout

### Overall Structure

```
┌─────────────────────────────────────┐
│ Card Container (h-full flex-col)   │
├─────────────────────────────────────┤
│ Header                              │
│ ┌─────────────────────────────────┐ │
│ │ "Play vs..."                    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ CardContent (flex-1 flex-col)       │
│ ┌─────────────────────────────────┐ │
│ │ Selected Opponent Preview       │ │
│ │ (conditional, if selected)      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Category Tabs                   │ │
│ │ [Beginner] [Intermediate] ...   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ScrollArea (flex-1)              │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Opponent Grid (4 columns)   │ │ │
│ │ │ [Avatar] [Avatar] [Avatar]  │ │ │
│ │ │ [Avatar] [Avatar] [Avatar]  │ │ │
│ │ │ ...                          │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Choose Button (full width)       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Dimensions & Spacing

- **Container:** Full height (`h-full`), flex column layout
- **Card Padding:** `p-4` (16px) for CardContent gap
- **Gap Between Sections:** `gap-4` (16px)
- **Grid Padding:** `p-2` (8px) inside ScrollArea
- **Grid Gap:** `gap-3` (12px) between opponent cards

## Component Sections

### 1. Header Section

**Location:** `CardHeader`

```
┌─────────────────────────────────────┐
│ Play vs...                          │
└─────────────────────────────────────┘
```

- **Title:** "Play vs..."
- **Styling:** Standard CardHeader with CardTitle
- **Height:** Auto (content-based)

### 2. Selected Opponent Preview

**Location:** Top of CardContent (conditional rendering)

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ [Avatar 64x64]  Name            │ │
│ │                  [Rating Badge]  │ │
│ │                  Description... │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Layout Details:**
- **Container:** `border rounded-lg p-4 bg-muted/50`
- **Avatar:** `w-16 h-16` (64px × 64px)
- **Content:** Flex row with `gap-4`
- **Name:** `font-semibold truncate` (prevents overflow)
- **Rating Badge:** `Badge variant="secondary"`
- **Description:** `text-sm text-muted-foreground line-clamp-2` (max 2 lines)
- **Crown Icon:** `w-4 h-4 text-yellow-500` (if featured)

**Conditional Rendering:**
- Only displays when `selectedOpponent !== null`
- Shows large avatar, name, rating, and description
- Featured opponents display a crown icon (Crown from lucide-react)

### 3. Category Tabs

**Location:** Below selected opponent preview

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ [Beginner] [Intermediate] [Advanced]│
│ [Expert] [Master]                   │
└─────────────────────────────────────┘
```

**Layout Details:**
- **Container:** `flex gap-2 border-b overflow-x-auto`
- **Tab Buttons:** `px-3 py-2 text-sm font-medium`
- **Active Tab:**
  - `border-b-2 border-primary text-primary`
- **Inactive Tab:**
  - `border-transparent text-muted-foreground`
  - `hover:text-foreground` on hover
- **Whitespace:** `whitespace-nowrap` prevents wrapping

**Categories:**
1. **Beginner** - Default active category
2. **Intermediate**
3. **Advanced**
4. **Expert**
5. **Master**

**State Management:**
- `activeCategory` state tracks current category
- Default: `"beginner"`
- Updates on tab click via `setActiveCategory`

### 4. Opponent Grid

**Location:** Inside ScrollArea (scrollable area)

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│ │[A] │ │[A] │ │[A] │ │[A] │        │
│ │Name│ │Name│ │Name│ │Name│        │
│ │1000│ │1200│ │1300│ │1400│        │
│ └────┘ └────┘ └────┘ └────┘        │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│ │[A] │ │[A] │ │[A] │ │[A] │        │
│ │Name│ │Name│ │Name│ │Name│        │
│ │1500│ │1800│ │1900│ │2000│        │
│ └────┘ └────┘ └────┘ └────┘        │
│ ... (scrollable)                     │
└─────────────────────────────────────┘
```

**Grid Layout:**
- **Container:** `grid grid-cols-4 gap-3 p-2`
- **Columns:** 4 columns (responsive)
- **Gap:** `gap-3` (12px) between cards
- **Padding:** `p-2` (8px) inside ScrollArea

**Opponent Card Structure:**
```
┌─────────────────┐
│   [Avatar]      │ ← Full width, aspect-square
│      👑         │ ← Crown icon (if featured)
│                 │
│   Name          │ ← text-xs font-medium truncate
│   1000          │ ← text-xs text-muted-foreground
└─────────────────┘
```

**Card Styling:**
- **Container:** `relative p-2 rounded-lg border-2 transition-all`
- **Hover Effect:** `hover:scale-105` (5% scale increase)
- **Selected State:**
  - `border-primary bg-primary/10` (primary border, light primary background)
- **Unselected State:**
  - `border-border` (default border)
  - `hover:border-primary/50` (primary border on hover)

**Avatar:**
- **Size:** `w-full aspect-square` (maintains 1:1 ratio)
- **Fallback:** First letter of opponent name
- **Image Source:** `opponent.avatar` (DiceBear API URL)

**Featured Indicator:**
- **Crown Icon:** `absolute top-1 right-1 w-3 h-3 text-yellow-500`
- **Position:** Top-right corner of card
- **Only shown if:** `opponent.featured === true`

**Text Elements:**
- **Name:** `text-xs font-medium truncate` (prevents overflow)
- **Rating:** `text-xs text-muted-foreground`

**ScrollArea:**
- **Container:** `ScrollArea` component with `flex-1` (takes remaining space)
- **Scrollable:** Vertical scrolling when content exceeds available height
- **Padding:** `p-2` inside ScrollArea

### 5. Choose Button

**Location:** Bottom of CardContent

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ [▶ Choose]                          │
└─────────────────────────────────────┘
```

**Button Details:**
- **Size:** `size="lg"` (large button)
- **Width:** `w-full` (full width)
- **Icon:** Play icon (`w-4 h-4 mr-2`) from lucide-react
- **Text:** "Choose" (or "Game in Progress" if disabled)
- **Disabled State:**
  - When `!selectedOpponent` (no opponent selected)
  - When `isGameActive === true` (game already in progress)

**Styling:**
- Primary button styling
- Disabled state uses default disabled styles
- Icon positioned before text with `mr-2` margin

## Data Structure

### Opponent Interface

```typescript
interface Opponent {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  avatar: string;                // Avatar image URL
  rating: number;                // Display rating (1000-3200)
  elo: number | undefined;       // Stockfish Elo rating
  depth: number;                 // Search depth (4-14)
  description: string;           // Opponent description
  category: "beginner" | "intermediate" | "advanced" | "expert" | "master";
  country?: string;              // Optional country code
  featured?: boolean;            // Show crown icon
  color?: "white" | "black";     // Which color opponent plays
}
```

### Opponent Categories

**Beginner (1000-1200):**
- Beginner Bot (1000) - Featured
- Casual Player (1200)

**Intermediate (1300-1500):**
- Rapid Player (1300)
- Club Player (1400)
- Improving Player (1500)

**Advanced (1800-2000):**
- Advanced Player (1800)
- Tactical Master (1900)
- Strong Player (2000)

**Expert (2200-2400):**
- Expert (2200)
- Candidate Master (2400)

**Master (2600+):**
- Master (2600)
- Legendary (2800)
- Stockfish Max (3200) - Featured

## State Management

### Component State

```typescript
const [activeCategory, setActiveCategory] = useState<keyof typeof OPPONENTS>("beginner");
```

- **Initial Value:** `"beginner"` (default category)
- **Updates:** When user clicks a category tab
- **Type:** Key of OPPONENTS object

### Props

```typescript
interface OpponentSelectorProps {
  selectedOpponent: Opponent | null;        // Currently selected opponent
  onSelectOpponent: (opponent: Opponent) => void;  // Selection handler
  onStartGame: () => void;                  // Start game handler
  isGameActive: boolean;                    // Game active state
}
```

### Event Handlers

1. **Category Tab Click:**
   - Updates `activeCategory` state
   - Filters opponents by category
   - No opponent selection change

2. **Opponent Card Click:**
   - Calls `onSelectOpponent(opponent)`
   - Updates selected opponent preview
   - Highlights selected card

3. **Choose Button Click:**
   - Calls `onStartGame()`
   - Starts the chess game with selected opponent
   - Replaces OpponentSelector with GameInfo component

## Styling Details

### Color Scheme

- **Primary:** Used for active tabs, selected cards, button
- **Secondary:** Used for rating badges
- **Muted:** Used for descriptions, inactive tabs, ratings
- **Border:** Default border color for cards
- **Background:** `bg-muted/50` for selected opponent preview

### Transitions

- **Hover Scale:** `hover:scale-105` on opponent cards (0.2s transition)
- **Border Color:** Smooth transition on hover
- **Tab Colors:** Smooth color transition on active/inactive

### Typography

- **Header:** CardTitle (default heading style)
- **Opponent Name (Preview):** `font-semibold`
- **Opponent Name (Card):** `text-xs font-medium`
- **Description:** `text-sm text-muted-foreground`
- **Rating:** `text-xs text-muted-foreground`

## Responsive Behavior

### Desktop (lg breakpoint and above)

- **Panel Width:** `lg:col-span-1` (1/3 of grid, ~33%)
- **Grid Columns:** 4 columns
- **Full Height:** Panel takes full available height
- **ScrollArea:** Scrolls vertically when needed

### Tablet/Mobile (below lg breakpoint)

- **Panel Width:** Full width (stacks below board)
- **Grid Columns:** 4 columns (may be cramped, could adjust)
- **Category Tabs:** Horizontal scroll if needed (`overflow-x-auto`)
- **Height:** Auto (content-based, not full height)

## Interaction Flow

### Selection Flow

```
1. User clicks category tab
   ↓
2. Grid updates to show opponents in that category
   ↓
3. User clicks opponent card
   ↓
4. Card highlights (border-primary, bg-primary/10)
   ↓
5. Selected opponent preview appears/updates
   ↓
6. Choose button becomes enabled
   ↓
7. User clicks "Choose"
   ↓
8. Game starts, OpponentSelector replaced by GameInfo
```

### Visual Feedback

- **Hover on Card:** Scale increases (105%), border color changes
- **Selected Card:** Primary border, light primary background
- **Active Tab:** Primary border bottom, primary text color
- **Inactive Tab:** Transparent border, muted text (hover: foreground color)
- **Button Disabled:** Standard disabled styling

## Avatar System

### Avatar Source

- **API:** DiceBear API (bottts style)
- **URL Pattern:** `https://api.dicebear.com/7.x/bottts/svg?seed={opponent-name}`
- **Seed:** Uses opponent name or ID for consistent avatar generation

### Avatar Fallback

- **Fallback Text:** First letter of opponent name
- **Styling:** `text-xs` for grid cards, default size for preview
- **Background:** Default Avatar fallback background

## Accessibility

### Keyboard Navigation

- **Tabs:** Navigable with arrow keys (standard button behavior)
- **Cards:** Clickable buttons, keyboard accessible
- **Choose Button:** Standard button, keyboard accessible

### Screen Reader Support

- **Avatar Alt Text:** `alt={opponent.name}`
- **Button Labels:** Clear text labels ("Choose", category names)
- **Selected State:** Visual indication (border, background)

## Performance Considerations

### Rendering

- **Conditional Rendering:** Selected opponent preview only renders when needed
- **Grid Rendering:** Only renders opponents in active category
- **ScrollArea:** Virtual scrolling not implemented (could be added for large lists)

### Image Loading

- **Avatar Images:** External URLs (DiceBear API)
- **Lazy Loading:** Not currently implemented (could add `loading="lazy"`)
- **Fallback:** Immediate fallback to text if image fails

## Integration Points

### Parent Component (Play.tsx)

```typescript
{gameMode === "ai" && !aiConfig.enabled ? (
  <OpponentSelector
    selectedOpponent={selectedOpponent}
    onSelectOpponent={handleSelectOpponent}
    onStartGame={handleStartGame}
    isGameActive={aiConfig.enabled}
  />
) : (
  <GameInfo />
)}
```

### Data Source

- **Opponents:** Imported from `src/games/chess/data/opponents.ts`
- **Constants:** `OPPONENTS` object with category keys
- **Helpers:** `getOpponentById()` for lookup

## Future Enhancements

### Potential Improvements

1. **Search/Filter:** Add search bar to filter opponents by name
2. **Sorting:** Sort opponents by rating within categories
3. **Favorites:** Allow users to favorite opponents
4. **Recent Opponents:** Show recently played opponents
5. **Custom Opponents:** Allow users to create custom difficulty settings
6. **Avatar Customization:** Allow custom avatar uploads
7. **Statistics:** Show win/loss record against each opponent
8. **Difficulty Indicator:** Visual indicator of opponent strength
9. **Lazy Loading:** Implement lazy loading for avatar images
10. **Virtual Scrolling:** For categories with many opponents

## Summary

The Opponent Selector sidebar panel provides an intuitive, visual interface for selecting AI chess opponents. It features:

- **5 Difficulty Categories:** Beginner through Master
- **11 Pre-configured Opponents:** Ranging from 1000 to 3200 rating
- **Visual Grid Layout:** 4-column grid with avatars and ratings
- **Selected Preview:** Large preview of selected opponent
- **Smooth Interactions:** Hover effects, transitions, and visual feedback
- **Responsive Design:** Adapts to different screen sizes
- **Accessible:** Keyboard navigable with screen reader support

The component seamlessly integrates with the chess game flow, allowing users to easily browse, select, and start games against AI opponents of varying difficulty levels.

