# Debugging Code Inventory

This document catalogs all debugging code in the project that is not related to Vitest testing. This includes console statements, debug flags, debug utilities, logger systems, and debug scripts.

## Summary

- **Console Statements:** 1,400+ instances across the codebase
- **Debug Flags:** 10+ environment variables and flags
- **Debug Utilities:** 3 dedicated debug files
- **Debug Scripts:** 3 crawler/debug scripts
- **Logger Systems:** 2 custom logger implementations

## Console Statements

### Backend (`backend/src/`)

#### `server.js`
- **Logger System:** Custom logger with levels (error, warn, info, debug)
- **Log Level Configuration:** `process.env.LOG_LEVEL` (default: "info")
- **Console Statements:**
  - `console.error("[Process] UnhandledRejection:")` - Process error handling
  - `console.log("Client connected:")` - Socket connections
  - `console.log("[Server] 🔌 Client disconnected:")` - Socket disconnections
  - **Trivia Blitz Debugging:** 50+ console.log statements with emoji prefixes:
    - `[Trivia] ⚠️` - Warnings
    - `[Trivia] ❌` - Errors
    - `[Trivia] ✅` - Success
    - `[Trivia] 🎯` - Question start
    - `[Trivia] ⏰` - Timer events
    - `[Trivia] 💰` - Scoring
    - `[Trivia] 🏆` - Leaderboard
    - `[Trivia] 🎉` - Game end
    - `[Trivia] 🔄` - State transitions
  - **Canva Debugging:** `console.log("[Server] canva:create-room:")` statements
  - **Paint & Guess Debugging:** Various game state logs

#### `auth/logger.js`
- **Custom Logger:** Level-based logging system
- **Log Levels:** error (0), warn (1), info (2), debug (3)
- **Configuration:** `process.env.LOG_LEVEL`
- **Methods:** `logger.error()`, `logger.warn()`, `logger.info()`, `logger.debug()`

#### `auth/routes.js`
- Uses `logger.info()` and `logger.error()` for:
  - User registration
  - User login
  - User logout
  - Avatar updates

#### `gameRegistry.js`
- **Debug Flag:** `process.env.LOG_LEVEL === "debug" || process.env.NODE_ENV === "development"`
- **Debug Logging:** `debugLog()` function for registry operations

### Frontend (`src/`)

#### Canvas Components

##### `games/paint-and-guess/components/canvas/useCanvasSync.ts`
- **Debug Flag:** `window.__DEBUG_CANVAS_SYNC__` (window global)
- **Debug Utilities:** Exposes `window.__canvasSyncDebug` object with:
  - `getPathDebugInfo(pathId?)` - Get debug info for paths
  - `clearDebugInfo()` - Clear debug data
  - `isEnabled()` - Check if debug is enabled
- **Console Statements:** 30+ debug logs:
  - `[CanvasSync]` - General sync operations
  - `[CanvasSync Debug]` - Detailed debug information
  - Path tracking, event sequencing, buffering logs

##### `games/paint-and-guess/components/canvas/useCanvasDrawing.ts`
- **Debug Flag:** `window.__DEBUG_CANVAS_SYNC__`
- **Console Statements:**
  - `[CanvasDrawing Debug]` - Drawing event logs
  - `[CanvasDrawing]` - Error logs

##### `games/canva/components/Canvas.tsx`
- **Console Statements:** 20+ logs for:
  - Canvas initialization
  - Coordinate calculations
  - Mouse events
  - Path creation/updates
  - Error handling

#### Game Components

##### `games/canva/hooks/useSocket.ts`
- **Console Statements:**
  - `[CanvaSocket] Connected to server`
  - `[CanvaSocket] Disconnected from server`
  - `[CanvaSocket] ❤️ heartbeat-ack`

#### Hub Components

##### `pages/AllGames.tsx`
- **Debug Flag:** `import.meta.env.DEV || import.meta.env.VITE_GAME_HUB_DEBUG === "true"`
- **Console Statements:**
  - `[hub] Rendering loading skeletons`
  - `[hub] AllGames state updated`
  - `[hub] Rendering tile`

##### `components/GameCard.tsx`
- **Console Statements:**
  - `[GameCard]` - Image loading logs
  - Error logging for failed image loads

##### `games/registry.ts`
- **Debug Flag:** `import.meta.env.DEV || import.meta.env.VITE_GAME_REGISTRY_DEBUG === "true"`
- **Debug Function:** `debugLog()` for registry operations
- **Console Statements:**
  - `[registry]` - Registry loading and processing logs

## Debug Flags and Environment Variables

### Backend Environment Variables

1. **`LOG_LEVEL`** (default: "info")
   - Controls logger verbosity
   - Values: "error", "warn", "info", "debug"
   - Used in: `server.js`, `auth/logger.js`, `gameRegistry.js`

2. **`NODE_ENV`**
   - Used to enable debug mode when "development"
   - Used in: `gameRegistry.js`

### Frontend Environment Variables

1. **`VITE_GAME_HUB_DEBUG`**
   - Enables hub debugging
   - Used in: `pages/AllGames.tsx`

2. **`VITE_GAME_REGISTRY_DEBUG`**
   - Enables registry debugging
   - Used in: `src/games/registry.ts`

3. **`VITE_DEBUG_RPG`**
   - Enables RPG game debugging
   - Used in: `src/games/rpg/utils/debug.ts`

4. **`VITE_DEBUG_CONTENT`**
   - Enables content generation debugging
   - Used in: `src/games/rpg/utils/debug.ts`

5. **`VITE_DEBUG_INVENTORY`**
   - Enables inventory debugging
   - Used in: `src/games/rpg/utils/debug.ts`

6. **`VITE_DEBUG_ANIMATIONS`**
   - Enables animation debugging
   - Used in: `src/games/rpg/utils/debug.ts`

7. **`import.meta.env.DEV`**
   - Automatically true in development mode
   - Used throughout frontend for conditional debug logging

### Window Global Debug Flags

1. **`window.__DEBUG_CANVAS_SYNC__`**
   - Enables canvas synchronization debugging
   - Can be set in browser console: `window.__DEBUG_CANVAS_SYNC__ = true`
   - Used in: `useCanvasSync.ts`, `useCanvasDrawing.ts`

2. **`window.__canvasSyncDebug`**
   - Debug utility object exposed to window
   - Provides methods for inspecting canvas sync state
   - Created in: `useCanvasSync.ts`

3. **`window.__RPG_DEBUG_INTEGRATION__`**
   - Comprehensive RPG debug utilities
   - Provides content generation, inventory, logging, and performance tracking
   - Created in: `src/games/rpg/utils/debug.ts`

4. **`window.__canvasDebugLog`**
   - Canvas debug log array
   - Used in: `scripts/test-canvas-sync-debug.ts`

5. **`window.__lastObjectCount`**
   - Tracks canvas object count
   - Used in: `scripts/test-canvas-sync-debug.ts`

6. **`window.__debugLabel`**
   - Debug label for test pages
   - Used in: `scripts/test-canvas-sync-debug.ts`

## Debug Utilities

### 1. RPG Debug Utilities (`src/games/rpg/utils/debug.ts`)

**Purpose:** Centralized debugging system for RPG game

**Features:**
- **DebugLogger Class:**
  - Stores logs in memory (max 1000)
  - Categorizes logs by category and level
  - Provides stats and export functionality
  - Color-coded console output

- **Category-Specific Loggers:**
  - `contentDebug` - Content generation debugging
  - `inventoryDebug` - Inventory operations
  - `animationDebug` - Animation tracking

- **PerformanceTracker Class:**
  - Tracks performance metrics
  - Provides statistics (avg, min, max, total)

- **Window Integration:**
  - Exposes `window.__RPG_DEBUG_INTEGRATION__` with:
    - Logger utilities (getAll, getStats, clear, export)
    - Content generation helpers
    - Inventory management helpers
    - Performance tracking
    - Help command

**Usage:**
```javascript
// In browser console
__RPG_DEBUG_INTEGRATION__.help()
__RPG_DEBUG_INTEGRATION__.content.generateItem()
__RPG_DEBUG_INTEGRATION__.logs.getStats()
```

### 2. Canvas Sync Debug (`src/games/paint-and-guess/components/canvas/useCanvasSync.ts`)

**Purpose:** Debug canvas synchronization between drawer and guessers

**Features:**
- Path tracking with debug info
- Event sequencing
- Buffering state tracking
- Window utility object

**Usage:**
```javascript
// Enable in browser console
window.__DEBUG_CANVAS_SYNC__ = true

// Access debug utilities
window.__canvasSyncDebug.getPathDebugInfo()
window.__canvasSyncDebug.clearDebugInfo()
```

### 3. Registry Debug (`src/games/registry.ts`)

**Purpose:** Debug game registry loading and processing

**Features:**
- Conditional debug logging
- Registry fetch tracking
- Plugin attachment logging

## Debug Scripts

### 1. `scripts/debug-multiplayer-crawler.ts`

**Purpose:** Multiplayer game flow testing with diagnostics

**Features:**
- Playwright-based browser automation
- Collects console logs and screenshots
- Shorter rounds for faster iteration
- Generates debug reports

**Usage:**
```bash
npm run test:multiplayer:debug
```

**Output:**
- Screenshots directory
- Debug report JSON
- Console logs per player

### 2. `scripts/debug-prisma-persistence-crawler.ts`

**Purpose:** Test Prisma database persistence

**Features:**
- Health check validation
- Room creation and persistence
- Socket connection testing
- Database state verification

**Usage:**
```bash
npm run test:persistence:prisma
```

### 3. `scripts/test-canvas-sync-debug.ts`

**Purpose:** Canvas synchronization debugging

**Features:**
- Multi-page Playwright test
- Canvas state tracking
- Object count monitoring
- Debug log collection

**Usage:**
```bash
npx tsx scripts/test-canvas-sync-debug.ts
```

## Logger Systems

### 1. Backend Logger (`backend/src/auth/logger.js`)

**Implementation:**
- Level-based filtering
- Configurable via `LOG_LEVEL` env var
- Methods: `error()`, `warn()`, `info()`, `debug()`

**Usage:**
```javascript
import { logger } from './auth/logger.js';

logger.info("User logged in", { userId: user.id });
logger.error("Registration failed", { error: error.message });
```

### 2. Server Logger (`backend/src/server.js`)

**Implementation:**
- Similar to auth logger
- Used for server-wide logging
- Integrated with Socket.IO events

## Debug Patterns by Category

### Trivia Blitz Debugging
- **Location:** `backend/src/server.js`
- **Pattern:** Emoji-prefixed console logs
- **Count:** 50+ statements
- **Categories:**
  - Game flow transitions
  - Question timing
  - Answer submissions
  - Scoring calculations
  - Leaderboard updates

### Canvas Debugging
- **Location:** Canvas components
- **Pattern:** `[CanvasSync Debug]`, `[CanvasDrawing Debug]`
- **Count:** 50+ statements
- **Categories:**
  - Path tracking
  - Event sequencing
  - Buffering state
  - Coordinate calculations

### Hub Debugging
- **Location:** Hub components
- **Pattern:** `[hub]` prefix
- **Count:** 10+ statements
- **Categories:**
  - Registry loading
  - Game rendering
  - State updates

### Registry Debugging
- **Location:** `src/games/registry.ts`
- **Pattern:** `[registry]` prefix
- **Count:** 10+ statements
- **Categories:**
  - Registry fetching
  - Entry processing
  - Plugin attachment

## Recommendations

### For Production

1. **Remove or Conditionally Compile:**
   - All `console.log()` statements (except errors)
   - Debug-specific console statements
   - Window debug objects (or guard with `NODE_ENV`)

2. **Keep:**
   - `console.error()` for actual errors
   - Logger system (but set default to "warn" or "error")
   - Error handling logs

3. **Environment-Based:**
   - Use environment variables to control debug output
   - Consider build-time removal of debug code
   - Use source maps for production debugging

### For Development

1. **Organize:**
   - Group debug logs by feature/component
   - Use consistent prefixes
   - Create debug utility functions

2. **Document:**
   - Document debug flags and their purposes
   - Provide examples of debug utility usage
   - Create debug guides for common issues

3. **Optimize:**
   - Use debug flags to reduce noise
   - Implement log levels
   - Consider structured logging

## Debug Code Statistics

### By File Type
- **Backend JS:** ~200 console statements
- **Frontend TS/TSX:** ~1,200 console statements
- **Debug Utilities:** 3 files
- **Debug Scripts:** 3 files

### By Category
- **Game Logic:** ~400 statements
- **Canvas Operations:** ~100 statements
- **Network/Socket:** ~200 statements
- **UI Components:** ~300 statements
- **Utilities:** ~100 statements

### By Severity
- **Error:** ~100 statements
- **Warn:** ~50 statements
- **Info/Debug:** ~1,250 statements

## Quick Reference

### Enable Debugging

**Backend:**
```bash
LOG_LEVEL=debug npm run dev:backend
```

**Frontend:**
```bash
# In browser console
window.__DEBUG_CANVAS_SYNC__ = true
window.__RPG_DEBUG_INTEGRATION__.help()
```

**Environment Variables:**
```bash
VITE_GAME_HUB_DEBUG=true
VITE_GAME_REGISTRY_DEBUG=true
VITE_DEBUG_RPG=true
```

### Disable Debugging

**Backend:**
```bash
LOG_LEVEL=error npm run dev:backend
```

**Frontend:**
- Remove or set debug flags to `false`
- Use production build (automatically removes many debug statements)

