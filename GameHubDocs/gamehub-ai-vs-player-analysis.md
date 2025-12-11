# GameHub AI vs Player Mode - Analysis

## Overview

The GameHub is the central navigation and game management system for the application. It provides a unified interface for accessing multiple games, with the Chess game featuring an **AI vs Player mode** that allows users to play against a Stockfish-powered chess engine with difficulty-based opponent selection.

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
                        │   └── OpponentProfile (Player vs Opponent display)
                        └── OpponentSelector / GameInfo (Sidebar)
                            ├── OpponentSelector (when selecting)
                            │   ├── Category Tabs (Beginner, Intermediate, Advanced, Expert, Master)
                            │   ├── Opponent Grid
                            │   └── Choose Button
                            └── GameInfo (when playing)
                                ├── AIStatus
                                ├── Current Opponent Card
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
- `aiConfig: AIConfig` - AI settings (enabled, color, elo, depth, opponentId)
- `isAIThinking: boolean` - AI move calculation status

**Opponent Selection State** (`src/games/chess/pages/Play.tsx`):
- `selectedOpponent: Opponent | null` - Currently selected opponent
- Synced with `aiConfig.opponentId` via `useEffect`

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
│  [✏️]   │  │ │              │ │ Opponent     │  │    │
│         │  │ │  Chess Board │ │ Selector     │  │    │
│  [⚙️]   │  │ │  (480x480px) │ │ Game Info    │  │    │
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
│ │ [Player] VS [Opponent]    │ │ Opponent Selector        │  │
│ │                          │ │                          │  │
│ │     Chess Board          │ │ ┌────────────────────┐  │  │
│ │     (480x480px)          │ │ │ Selected Opponent  │  │  │
│ │                          │ │ │ [Avatar] [Rating]  │  │  │
│ │  - 8x8 grid              │ │ │ Description...     │  │  │
│ │  - Click/drag to move    │ │ └────────────────────┘  │  │
│ │  - Legal move highlights │ │                          │  │
│ │  - Last move highlight   │ │ [Beginner] [Intermediate]│  │
│ │                          │ │ [Advanced] [Expert]     │  │
│ │  [Flip Board]            │ │ [Master] ← Category Tabs│  │
│ │                          │ │                          │  │
│ └──────────────────────────┘ │ ┌────────────────────┐  │  │
│                              │ │ Opponent Grid       │  │  │
│                              │ │ [Avatar] [Avatar]   │  │  │
│                              │ │ [Avatar] [Avatar]   │  │  │
│                              │ └────────────────────┘  │  │
│                              │                          │  │
│                              │ [Choose] Button          │  │
│                              └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**When Game is Active:**

```
┌──────────────────────────┐ ┌──────────────────────────┐  │
│ [Player] VS [Opponent]    │ │ Current Opponent Card    │  │
│                          │ │ [Avatar] [Name] [Rating] │  │
│     Chess Board          │ │                          │  │
│     (480x480px)          │ │ Game Status Card         │  │
│                          │ │ [Status Badge]           │  │
│                          │ │                          │  │
│                          │ │ [New Game] [Change Opp] │  │
│                          │ │ [Undo] [Copy PGN]        │  │
│                          │ │                          │  │
│                          │ │ Move History Card        │  │
│                          │ │ ┌────────────────────┐  │  │
│                          │ │ │ 1. e4    AI        │  │  │
│                          │ │ │ 1... e5            │  │  │
│                          │ │ │ ...                │  │  │
│                          │ │ └────────────────────┘  │  │
│                          │ └──────────────────────────┘  │
└──────────────────────────┘
```

**Grid Layout:**
- **Left Column (lg:col-span-2):** Chess board (2/3 width)
- **Right Column (lg:col-span-1):** Opponent selector/Game info (1/3 width)
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

#### 2. Opponent Selector (`OpponentSelector.tsx`)
- **Category Tabs:**
  - Beginner (1000-1200 rating)
  - Intermediate (1300-1500 rating)
  - Advanced (1800-2000 rating)
  - Expert (2200-2400 rating)
  - Master (2600+ rating)
- **Opponent Grid:**
  - 4-column grid of opponent avatars
  - Each opponent shows avatar, name, and rating
  - Featured opponents have crown icon
  - Selected opponent highlighted with primary border
- **Selected Opponent Preview:**
  - Large avatar (64x64px)
  - Name and rating badge
  - Description text
- **Choose Button:** Large primary button to start game

#### 3. Opponent Profile (`OpponentProfile.tsx`)
- **Display:** Above the chess board
- **Layout:**
  - Left: Player avatar and name (White)
  - Center: "VS" divider
  - Right: Opponent avatar and name (Black)
- **Shows:** Player username, opponent name, and ratings

#### 4. Game Info Sidebar (`GameInfo.tsx`)
- **Current Opponent Card:**
  - Avatar and name of active opponent
  - Rating badge
- **Game Status Card:**
  - Status badge (playing/checkmate/stalemate/draw)
  - Action buttons (New Game, Change Opponent, Undo, Copy PGN, Analyze)
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

## Opponent Categories

### Beginner (1000-1200)
- **Beginner Bot** (1000) - Featured
  - Depth: 4
  - Perfect for learning basics
- **Casual Player** (1200)
  - Depth: 5
  - Relaxed games for practice

### Intermediate (1300-1500)
- **Rapid Player** (1300)
  - Depth: 5
  - Fast-paced games
- **Club Player** (1400)
  - Depth: 6
  - Solid fundamentals
- **Improving Player** (1500)
  - Depth: 6
  - Good opening knowledge

### Advanced (1800-2000)
- **Advanced Player** (1800)
  - Depth: 8
  - Excellent tactical awareness
- **Tactical Master** (1900)
  - Depth: 8
  - Great at tactics
- **Strong Player** (2000)
  - Depth: 9
  - Deep strategic understanding

### Expert (2200-2400)
- **Expert** (2200)
  - Depth: 10
  - Master level strength
- **Candidate Master** (2400)
  - Depth: 11
  - Extremely challenging

### Master (2600+)
- **Master** (2600)
  - Depth: 12
  - Grandmaster level
- **Legendary** (2800)
  - Depth: 13
  - Super Grandmaster level
- **Stockfish Max** (3200) - Featured
  - Depth: 14
  - Full Stockfish strength, nearly unbeatable

## Data Flow: AI vs Player Mode

### 1. Initialization Flow

```
User clicks "Play vs AI" tab
  ↓
PlayPage sets gameMode to "ai"
  ↓
OpponentSelector component renders (AI disabled by default)
  ↓
User browses categories (Beginner, Intermediate, Advanced, Expert, Master)
  ↓
User selects an opponent from grid
  ↓
Selected opponent preview appears
  ↓
User clicks "Choose" button
  ↓
setAIConfig({ enabled: true, opponentId, elo, depth })
  ↓
ChessContext updates gameMode to "ai"
  ↓
GameInfo component replaces OpponentSelector
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

### 3. Opponent Change Flow

```
User clicks "Change Opponent" button
  ↓
handleChangeOpponent() called
  ↓
resetGame() clears board
  ↓
setAIConfig({ enabled: false, opponentId: undefined })
  ↓
setSelectedOpponent(null)
  ↓
OpponentSelector replaces GameInfo
  ↓
User can select new opponent
```

### 4. New Game Flow

```
User clicks "New Game" button
  ↓
handleNewGame() called
  ↓
resetGame() clears board
  ↓
setAIConfig({ enabled: false, opponentId: kept })
  ↓
OpponentSelector appears with same opponent selected
  ↓
User can click "Choose" to restart with same opponent
```

### 5. Error Handling

- **API Timeout:** 30 second timeout, falls back to random legal move
- **Invalid Move:** Validates against legal moves, uses fallback if invalid
- **Safety Timeout:** 60 second max thinking time, forces reset
- **Network Errors:** Catches fetch errors, attempts fallback move

## Key Features

### Opponent Selection
- **5 Difficulty Categories:** Beginner, Intermediate, Advanced, Expert, Master
- **11 Pre-configured Opponents:** Ranging from 1000 to 3200 rating
- **Visual Selection:** Grid view with avatars, names, and ratings
- **Featured Opponents:** Crown icon for recommended opponents
- **Category Tabs:** Easy navigation between difficulty levels

### AI Configuration
- **Automatic Configuration:** Opponent selection automatically sets Elo and depth
- **Color Selection:** Player always plays White, opponent plays Black
- **Difficulty Matching:** Each opponent has appropriate Elo and depth settings

### Game Controls
- **New Game:** Resets to starting position, keeps same opponent selected
- **Change Opponent:** Clears game and shows opponent selector
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
- **Opponent Profile:** Player vs Opponent display above board

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
│       ├── data/
│       │   └── opponents.ts   # Opponent definitions by difficulty
│       ├── pages/
│       │   ├── Index.tsx      # Chess game entry (tabs)
│       │   └── Play.tsx       # Play page with AI mode
│       ├── components/
│       │   ├── ChessBoard.tsx # Main chess board
│       │   ├── OpponentSelector.tsx # Opponent selection panel
│       │   ├── OpponentProfile.tsx # Player vs Opponent display
│       │   ├── AIStatus.tsx   # AI status indicator
│       │   └── GameInfo.tsx  # Game info sidebar
│       ├── state/
│       │   └── ChessContext.tsx # Game state management
│       └── policies/
│           └── opponent.ts   # AI move policy logic
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
2. **Difficulty-Based Opponents:** 5 categories with 11 opponents ranging from beginner to master level
3. **AI Integration:** Stockfish engine integration via REST API for move calculation
4. **Visual Opponent Selection:** Chess.com-style interface with category tabs and opponent grid
5. **Real-time Feedback:** Visual indicators for AI thinking, move highlights, and game status
6. **Policy-based Logic:** Clean separation of concerns for AI move triggering
7. **Responsive Design:** Works on mobile, tablet, and desktop with adaptive layouts
8. **Error Resilience:** Multiple fallback mechanisms for API failures
9. **Opponent Management:** Easy switching between opponents with "Change Opponent" button
10. **Game Persistence:** "New Game" keeps opponent selected for quick restarts

The architecture follows React best practices with context-based state management, component composition, and clear separation between UI, logic, and API layers. The difficulty-based categorization makes it easy for players to find opponents at their skill level.
