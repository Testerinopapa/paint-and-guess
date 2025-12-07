# GameHub AI vs Player Mode - Analysis

## Overview

The GameHub is the central navigation and game management system for the application. It provides a unified interface for accessing multiple games, with the Chess game featuring an **AI vs Player mode** that allows users to play against a Stockfish-powered chess engine.

## Architecture & Connections

### 1. Routing Structure

The GameHub is accessed via the `/hub` route and uses React Router for navigation:

```
/hub (HubLayout)
├── /hub (index) → AllGames component
├── /hub/library → Library component
├── /hub/friends → Friends component
├── /hub/whiteboard/* → Whiteboard component
└── /hub/games/:gameId → GameDetail component
    └── /hub/games/chess → ChessIndex component
        └── Play tab → PlayPage component (AI vs Player mode)
```

**Key Files:**
- `src/router/index.tsx` - Main routing configuration
- `src/components/HubLayout.tsx` - Layout wrapper with Sidebar and TopBar
- `src/pages/AllGames.tsx` - Game listing page
- `src/games/chess/pages/Index.tsx` - Chess game entry point
- `src/games/chess/pages/Play.tsx` - Play page with AI mode

### 2. Component Hierarchy

```
HubLayout
├── Sidebar (Navigation)
├── TopBar (Search, Notifications, User Menu)
└── Outlet (Rendered child routes)
    └── ChessIndex
        └── Tabs (Play | Analyze | Puzzles)
            └── PlayPage
                └── ChessProvider (Context)
                    └── PlayContent
                        ├── Game Mode Selector (Local vs AI)
                        ├── ChessBoard (Main game board)
                        └── GameInfo (Sidebar with controls)
                            ├── AIStatus (AI thinking indicator)
                            ├── AIConfig (AI configuration panel)
                            ├── Game Status Card
                            └── Move History Card
```

### 3. State Management

**ChessContext** (`src/games/chess/state/ChessContext.tsx`):
- Manages game state using `chess.js` library
- Handles AI configuration and move logic
- Provides hooks: `useChess()` for accessing game state
- Auto-triggers AI moves via `useEffect` when it's AI's turn

**Key State:**
- `game: Chess` - Chess.js game instance
- `gameState: GameState` - Current position, moves, status
- `aiConfig: AIConfig` - AI settings (enabled, color, elo, depth)
- `isAIThinking: boolean` - AI move calculation status

### 4. Backend API Connections

**AI Analysis Endpoint:**
- **Route:** `POST /api/analyze`
- **Location:** `backend/src/api/analyze.js`
- **Purpose:** Calculates best move using Stockfish engine
- **Request Body:**
  ```json
  {
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "depth": 8,
    "elo": 1400,
    "limitStrength": true
  }
  ```
- **Response:**
  ```json
  {
    "bestmove": "e2e4",
    "cp": 20,
    "mate": null
  }
  ```

**API Configuration:**
- Base URL: `http://localhost:3001` (configurable via `VITE_API_BASE_URL`)
- Config file: `src/config/api.ts`
- Uses `apiPath()` helper for URL construction

### 5. Policy Pattern for AI Moves

**Opponent Policy** (`src/games/chess/policies/opponent.ts`):
- Determines when the AI engine should make a move
- Prevents AI from moving first when playing as black
- Validates turn and move count before triggering AI move

**Policy Logic:**
```typescript
shouldEngineMove({ turn, playerColor, movesCount }):
  - Returns false if AI not enabled
  - Returns false if not AI's turn
  - Returns false if AI is black and no moves made (waits for player)
  - Returns true otherwise (AI can move)
```

## Visual Layout

### HubLayout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar │ TopBar                                        │
│ (16px)  │ [Menu] My Games | Store | Community          │
│         │ [Search] [🔔] [Avatar ▼]                     │
├─────────┼───────────────────────────────────────────────┤
│         │                                               │
│  Nav    │  Main Content Area                            │
│  Items  │  (Outlet - renders child routes)              │
│         │                                               │
│  [🏠]   │  ┌─────────────────────────────────────┐    │
│  [📚]   │  │ Chess Game Page                      │    │
│  [⏰]   │  │                                      │    │
│  [⭐]   │  │ [Local Game] [Play vs AI] ← Tabs     │    │
│  [📈]   │  │                                      │    │
│  [👤]   │  │ ┌──────────────┐ ┌──────────────┐  │    │
│  [✏️]   │  │ │              │ │ AI Config    │  │    │
│         │  │ │  Chess Board │ │ Game Status  │  │    │
│  [⚙️]   │  │ │  (480x480px) │ │ Move History │  │    │
│         │  │ │              │ │              │  │    │
│         │  │ └──────────────┘ └──────────────┘  │    │
│         │  │                                      │    │
│         │  └─────────────────────────────────────┘    │
│         │                                               │
└─────────┴───────────────────────────────────────────────┘
```

### Chess Play Page Layout (AI Mode)

**Desktop Layout (lg breakpoint and above):**

```
┌─────────────────────────────────────────────────────────────┐
│ Game Mode Selector Card                                     │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ [Local Game] [Play vs AI] ← Active Tab              │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌──────────────────────────┐ ┌──────────────────────────┐  │
│ │                          │ │ AI Status Alert          │  │
│ │                          │ │ (if AI thinking)         │  │
│ │                          │ │                          │  │
│ │     Chess Board          │ │ ┌────────────────────┐  │  │
│ │     (480x480px)          │ │ │ AI Opponent Config │  │  │
│ │                          │ │ │                    │  │  │
│ │  - 8x8 grid              │ │ │ Difficulty: [▼]    │  │  │
│ │  - Click/drag to move    │ │ │ Play as: ○ White   │  │  │
│ │  - Legal move highlights │ │ │        ○ Black     │  │  │
│ │  - Last move highlight   │ │ │                    │  │  │
│ │                          │ │ │ [Start Game vs AI] │  │  │
│ │  [Flip Board]            │ │ └────────────────────┘  │  │
│ │                          │ │                          │  │
│ └──────────────────────────┘ │ ┌────────────────────┐  │  │
│                              │ │ Game Status        │  │  │
│                              │ │ [Status Badge]     │  │  │
│                              │ │                    │  │  │
│                              │ │ [New Game] [Undo] │  │  │
│                              │ │ [Copy PGN]         │  │  │
│                              │ │ [Analyze Game]     │  │  │
│                              │ └────────────────────┘  │  │
│                              │                          │  │
│                              │ ┌────────────────────┐  │  │
│                              │ │ Move History       │  │  │
│                              │ │ ┌────────────────┐ │  │  │
│                              │ │ │ 1. e4    AI    │ │  │  │
│                              │ │ │ 1... e5        │ │  │  │
│                              │ │ │ 2. Nf3         │ │  │  │
│                              │ │ │ ...            │ │  │  │
│                              │ │ └────────────────┘ │  │  │
│                              │ └────────────────────┘  │  │
│                              └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Grid Layout:**
- **Left Column (lg:col-span-2):** Chess board (2/3 width)
- **Right Column (lg:col-span-1):** Game info sidebar (1/3 width)
- **Responsive:** Stacks vertically on mobile/tablet

### Component Visual Details

#### 1. Chess Board (`ChessBoard.tsx`)
- **Size:** 480x480px (60px per square × 8 squares)
- **Colors:**
  - Light squares: `#f0d9b5`
  - Dark squares: `#b58863`
  - Selected square: `#baca44`
  - Legal move indicator: `#f6f669`
  - Last move highlight: `#cdd26a` with inset shadow
- **Features:**
  - Click to select piece and show legal moves
  - Drag and drop support
  - Disabled state when AI is thinking or it's AI's turn
  - Flip board button to change orientation

#### 2. AI Configuration Panel (`AIConfig.tsx`)
- **Difficulty Presets:**
  - Beginner (Elo 1000, Depth 4)
  - Intermediate (Elo 1400, Depth 6)
  - Advanced (Elo 1800, Depth 8)
  - Expert (Elo 2200, Depth 10)
  - Master (Elo 2600, Depth 12)
  - Maximum (No Elo limit, Depth 14)
- **Custom Elo Slider:** Range 1350-2850, step 50
- **Color Selection:** Radio buttons (White/Black)
- **Start Button:** Enables AI and starts game

#### 3. AI Status Indicator (`AIStatus.tsx`)
- **Thinking State:** Blue alert with spinner "AI is thinking..."
- **Waiting State:** Amber alert "Waiting for AI to move..."
- **Hidden:** When not AI's turn or game over

#### 4. Game Info Sidebar (`GameInfo.tsx`)
- **Game Status Card:**
  - Status badge (playing/checkmate/stalemate/draw)
  - Action buttons (New Game, Undo, Copy PGN, Analyze)
  - Game result banner for AI games
- **Move History Card:**
  - Scrollable list of moves
  - AI moves highlighted in blue with "AI" label
  - Move notation (e.g., "1. e4", "1... e5")

### Color Scheme & Styling

**Theme Colors:**
- Primary: Used for active states, buttons
- Secondary: Hover states, backgrounds
- Muted: Disabled text, borders
- Destructive: Error states, checkmate

**Card Styling:**
- Rounded corners with shadow
- Border: `border-border`
- Background: `bg-card`
- Padding: `p-4` to `p-8` depending on screen size

**Responsive Breakpoints:**
- Mobile: `< 768px` (md breakpoint)
- Tablet: `768px - 1024px`
- Desktop: `≥ 1024px` (lg breakpoint)

## Data Flow: AI vs Player Mode

### 1. Initialization Flow

```
User clicks "Play vs AI" tab
  ↓
PlayPage sets gameMode to "ai"
  ↓
AIConfig component renders (AI disabled by default)
  ↓
User selects difficulty and color
  ↓
User clicks "Start Game vs AI"
  ↓
setAIConfig({ enabled: true, ... })
  ↓
ChessContext updates gameMode to "ai"
  ↓
Board becomes interactive
```

### 2. Move Flow

```
Player makes a move
  ↓
makeMove(from, to) called
  ↓
Chess.js validates and applies move
  ↓
updateState() updates gameState
  ↓
useEffect detects isAITurn() === true
  ↓
shouldAIMoveNow evaluates to true
  ↓
makeAIMove() called after 100ms delay
  ↓
isAIThinking = true (shows spinner)
  ↓
POST /api/analyze with FEN, depth, elo
  ↓
Backend Stockfish calculates best move
  ↓
Response: { bestmove: "e2e4", cp: 20 }
  ↓
parseUCIMove() converts to { from, to }
  ↓
makeMove() applies AI move
  ↓
isAIThinking = false
  ↓
Player's turn again
```

### 3. Error Handling

- **API Timeout:** 30 second timeout, falls back to random legal move
- **Invalid Move:** Validates against legal moves, uses fallback if invalid
- **Safety Timeout:** 60 second max thinking time, forces reset
- **Network Errors:** Catches fetch errors, attempts fallback move

## Key Features

### AI Configuration
- **6 Difficulty Presets:** From Beginner to Maximum strength
- **Custom Elo Rating:** Slider for fine-tuned difficulty (1350-2850)
- **Color Selection:** Choose to play as White or Black
- **Depth Control:** Search depth varies by difficulty (4-14)

### Game Controls
- **New Game:** Resets to starting position
- **Undo Move:** Reverts last move (disabled during AI thinking)
- **Copy PGN:** Exports game notation to clipboard
- **Analyze Game:** Generates detailed analysis report (after game ends)
- **Flip Board:** Changes board orientation

### Visual Feedback
- **Move Highlights:** Selected squares and legal moves highlighted
- **Last Move Indicator:** Previous move squares highlighted
- **AI Status:** Real-time indicator when AI is thinking
- **Move History:** Color-coded moves (AI moves in blue)
- **Game Status:** Badge showing current game state

## Dependencies

### Frontend
- `react` - UI framework
- `react-router-dom` - Routing
- `chess.js` - Chess game logic
- `framer-motion` - Animations (for game cards)
- `lucide-react` - Icons
- `@tanstack/react-query` - Data fetching

### Backend
- `express` - HTTP server
- `stockfish` - Chess engine (via analyze API)
- `prisma` - Database ORM
- `sqlite` - Database (for puzzles, reports)

## File Structure

```
src/
├── components/
│   ├── HubLayout.tsx          # Main hub layout wrapper
│   ├── Sidebar.tsx            # Navigation sidebar
│   ├── TopBar.tsx             # Top navigation bar
│   └── GameCard.tsx           # Game card component
├── pages/
│   ├── AllGames.tsx           # Game listing page
│   └── GameDetail.tsx         # Individual game details
├── games/
│   └── chess/
│       ├── pages/
│       │   ├── Index.tsx      # Chess game entry (tabs)
│       │   └── Play.tsx       # Play page with AI mode
│       ├── components/
│       │   ├── ChessBoard.tsx # Main chess board
│       │   ├── AIConfig.tsx   # AI configuration panel
│       │   ├── AIStatus.tsx   # AI status indicator
│       │   └── GameInfo.tsx   # Game info sidebar
│       ├── state/
│       │   └── ChessContext.tsx # Game state management
│       └── policies/
│           └── opponent.ts    # AI move policy logic
└── router/
    └── index.tsx              # Route definitions

backend/
├── src/
│   ├── server.js              # Express server setup
│   └── api/
│       └── analyze.js        # Stockfish analysis endpoint
└── prisma/
    └── schema.prisma         # Database schema
```

## Summary

The GameHub's AI vs Player mode provides a complete chess playing experience with:

1. **Centralized Navigation:** HubLayout provides consistent navigation across all games
2. **AI Integration:** Stockfish engine integration via REST API for move calculation
3. **Flexible Difficulty:** 6 presets plus custom Elo rating for any skill level
4. **Real-time Feedback:** Visual indicators for AI thinking, move highlights, and game status
5. **Policy-based Logic:** Clean separation of concerns for AI move triggering
6. **Responsive Design:** Works on mobile, tablet, and desktop with adaptive layouts
7. **Error Resilience:** Multiple fallback mechanisms for API failures

The architecture follows React best practices with context-based state management, component composition, and clear separation between UI, logic, and API layers.

