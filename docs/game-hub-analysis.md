# Game Hub System Analysis

## Overview

The Game Hub is a centralized navigation and discovery system that enables multiple games to coexist within a single application framework. It provides a unified entry point for players to browse, discover, and launch different game experiences. The system uses a registry-based architecture that allows games to register themselves through configuration files, making it easy to add, remove, or modify games without changing core application code.

The hub currently integrates games like "Paint & Guess" and supports additional games in various states (alpha, beta, stable, deprecated). It features game discovery, categorization, feature flagging, visibility controls, and seamless navigation between different game experiences.

## Architecture

### Core Concept

The Game Hub acts as a **plugin system** where:

1. **Games register themselves** via configuration entries in a registry (JSON or code)
2. **The hub discovers and displays** available games dynamically
3. **Games define their own routes** and integrate with the hub's navigation
4. **The hub manages visibility** based on feature flags, targeting rules, and game status
5. **Games can provide custom preview components** for enhanced presentation

### Design Principles

- **Registry-Based Discovery**: Games are registered, not hardcoded
- **Plugin Architecture**: Games plug into the hub via configuration + optional components
- **Progressive Enhancement**: Games work with minimal integration, can add custom features
- **Separation of Concerns**: Hub handles navigation/discovery, games handle gameplay
- **Flexible Routing**: Games define their own URL structure under `/games/{slug}`

## Core Components

### 1. HubLayout Component (`src/components/HubLayout.tsx`)

**Main Responsibilities:**
- Provides consistent navigation structure across all games
- Displays sidebar navigation with registered games
- Manages avatar customization UI
- Renders game-specific pages via React Router `<Outlet />`
- Handles responsive layout (sidebar on desktop, header menu on mobile)

**Key Features:**
- **Sidebar Navigation**: Lists all registered games with active state highlighting
- **Game Categories**: Groups games by category in navigation
- **Avatar Customizer**: Integrated avatar customization button in sidebar
- **Responsive Design**: Sidebar on desktop (≥768px), horizontal menu on mobile
- **Active Route Highlighting**: Visual feedback for current game/page

**Navigation Structure:**
```typescript
{
  label: "All Games", // Special "home" link
  to: "/",
  category: "hub",
  priority: Infinity
},
{
  label: "Paint & Guess", // From game config
  to: "/games/paint-and-guess",
  category: "featured",
  priority: 100
}
```

**Layout Structure:**
```
┌─────────────────────────────────────────────┐
│ Sidebar (desktop) / Header (mobile)        │
│ ├── Game Hub Logo                           │
│ ├── Navigation Links                        │
│ │   ├── All Games                           │
│ │   ├── Paint & Guess                       │
│ │   └── Other games...                      │
│ └── Avatar Customizer Button                │
├─────────────────────────────────────────────┤
│ Header (desktop only)                       │
│ Game Hub Branding                           │
├─────────────────────────────────────────────┤
│ Main Content Area                           │
│ <Outlet /> ← Game pages render here         │
└─────────────────────────────────────────────┘
```

**Key Functions:**
- `buildNavigationLinks(games)`: Processes game registry into navigation structure
- Sorts games by category, then priority, then label
- Filters out hidden/disabled games
- Builds route paths from game configuration

### 2. AllGames Component (`src/pages/AllGames.tsx`)

**Main Responsibilities:**
- Displays grid of all available games as cards
- Shows game metadata (status, badges, player counts, metrics)
- Handles loading and error states
- Provides "Play now" links to individual games

**Key Features:**
- **Game Cards**: Visual tiles with thumbnail, title, description, badges
- **Status Badges**: Visual indicators (stable, beta, alpha, deprecated)
- **Player Information**: Min/max/recommended player counts
- **Metrics Display**: Concurrent users, uptime percentage (if available)
- **Feature Flag Integration**: Only shows games user has access to
- **Loading States**: Skeleton cards while fetching registry
- **Error Handling**: Falls back to bundled registry on API failure

**Game Card Structure:**
```
┌──────────────────────────────────┐
│ [Thumbnail Image]                │
├──────────────────────────────────┤
│ [Status Badge] [Category Badges] │
│ Game Title                        │
│ Game Description                  │
│ [Player Count] [Monetization]    │
│ [Metrics] (optional)             │
│ [Custom Preview Component]       │
│ [Play Now Button]                │
└──────────────────────────────────┘
```

**Key Functions:**
- Uses `useGameRegistry()` hook to fetch game list
- Filters and displays enabled games only
- Formats player counts and metrics for display
- Handles error states gracefully

### 3. Game Registry System

The registry system consists of **three layers**:

#### Layer 1: Backend Registry (`backend/data/game-registry.json`)

**Purpose:** Source of truth for game metadata
**Format:** JSON file with game entries
**Location:** `backend/data/game-registry.json`

**Structure:**
```json
{
  "updatedAt": "2024-11-15T00:00:00.000Z",
  "source": "git",
  "entries": [
    {
      "id": "paint-and-guess",
      "version": "1.1.0",
      "name": { "default": "Paint & Guess" },
      "description": { "default": "Draw prompts, guess sketches..." },
      "status": "stable",
      "supportedPlayers": { "min": 2, "max": 12, "recommended": 6 },
      "monetization": "free",
      "category": ["party", "drawing"],
      "assets": {
        "thumbnail": "/placeholder.svg",
        "patchNotesUrl": "..."
      },
      "badges": ["hot"],
      "route": { "slug": "paint-and-guess" },
      "plugin": {
        "previewComponent": "paintPreview",
        "moduleId": "@/games/paint-and-guess"
      }
    }
  ]
}
```

**Backend API:** `GET /api/games`
- Returns full registry with entries
- Cached server-side (60s TTL)
- Validates entries against schema

#### Layer 2: Frontend Registry (`src/games/registry.ts`)

**Purpose:** Fetches, caches, and processes game registry on client
**Location:** `src/games/registry.ts`

**Key Features:**
- Fetches from `/api/games` endpoint
- Caches responses (60s TTL)
- Falls back to bundled registry on failure
- Processes entries through `attachPlugin()` function
- Handles localization
- Applies feature flags and visibility rules
- Attaches preview components

**Processing Pipeline:**
```
Backend JSON
  ↓
fetchRegistryFromCms()
  ↓
Validate with Zod schema
  ↓
attachPlugin() - For each entry:
  ├── Localize name/description
  ├── Derive route path
  ├── Check feature flags
  ├── Check visibility rules
  ├── Attach preview component
  └── Build navigation metadata
  ↓
HubGame[] (enriched entries)
```

**Key Functions:**
- `useGameRegistry()`: React Query hook for accessing registry
- `loadGameRegistry()`: Async function to fetch and process registry
- `attachPlugin(entry)`: Enriches raw entry with computed properties
- `getPreviewComponent(entry)`: Maps plugin config to React components
- `localizeCopy(localized)`: Handles internationalization

#### Layer 3: Fallback Registry (`src/games/registry/fallback.ts`)

**Purpose:** Bundled backup registry when API unavailable
**Location:** `src/games/registry/fallback.ts`

**Features:**
- Hardcoded minimal game entries
- Ensures hub always works offline
- Used as last resort if all fetching fails
- Includes at least one playable game (Paint & Guess)

### 4. Game Registry Schema (`src/games/registry/schema.ts`)

**Purpose:** Type-safe validation and transformation of game entries
**Technology:** Zod schema validation

**Entry Schema:**
```typescript
{
  id: string,                    // Unique game identifier
  version: string,               // Semantic version
  name: { default: string, locales?: Record<string, string> },
  description: { default: string, locales?: Record<string, string> },
  status: "alpha" | "beta" | "stable" | "deprecated",
  supportedPlayers: { min: number, max: number, recommended?: number },
  monetization: "free" | "iap" | "premium" | "subscription",
  category: string[],
  assets: { thumbnail: string, trailerUrl?: string, patchNotesUrl?: string },
  schedule?: { startsAt?: string, endsAt?: string },
  badges: string[],
  featureFlags: string[],
  visibleIf: string[],
  route: { slug: string, path: string }, // Auto-derived if not provided
  metrics?: { concurrentUsers?: number, uptimePercentage?: number },
  plugin?: { previewComponent?: string, moduleId?: string },
  navigation?: { label?: string, category?: string, priority?: number, hidden?: boolean }
}
```

**Transformation:**
- Automatically derives `route.path` from `route.slug` if not provided
- Path format: `/games/{slug}`

## Data Flow

### Game Discovery Flow

1. **Application Startup**
   - `App.tsx` renders `HubLayout` as root route wrapper
   - `HubLayout` calls `useGameRegistry()` hook
   - `AllGames` page also calls `useGameRegistry()` for game listing

2. **Registry Fetching**
   ```
   useGameRegistry()
     ↓
   React Query fetches from `/api/games`
     ↓
   Backend reads `backend/data/game-registry.json`
     ↓
   Validates with Zod schema
     ↓
   Returns JSON response
   ```

3. **Client-Side Processing**
   ```
   Registry JSON received
     ↓
   attachPlugin() processes each entry:
     ├── Localizes text based on browser language
     ├── Derives route: `/games/{slug}`
     ├── Checks feature flags (isFeatureEnabled)
     ├── Checks visibility rules (matchesTargeting)
     ├── Maps plugin.previewComponent to React component
     └── Builds navigation metadata
     ↓
   HubGame[] array ready
   ```

4. **UI Rendering**
   ```
   HubGame[] → HubLayout navigation
   HubGame[] → AllGames grid
   HubGame[] → Route configuration
   ```

### Game Navigation Flow

1. **User Clicks Game Link**
   - Link in sidebar or game card
   - Route: `/games/{game-slug}` or specific game route

2. **Router Resolution**
   ```
   /games/paint-and-guess
     ↓
   Router matches `/games/paint-and-guess`
     ↓
   Renders game's page component (via <Outlet />)
   ```

3. **Game Page Renders**
   - Game-specific components handle their own routing
   - Example: Paint & Guess has `/games/paint-and-guess`, `/games/paint-and-guess/room/:roomId`

## How Games Plug Into the Hub

### Integration Steps for a New Game

#### Step 1: Create Game Registry Entry

Add entry to `backend/data/game-registry.json`:

```json
{
  "id": "my-new-game",
  "version": "1.0.0",
  "name": { "default": "My New Game" },
  "description": { "default": "A fun game description" },
  "status": "stable",
  "supportedPlayers": { "min": 2, "max": 8, "recommended": 4 },
  "monetization": "free",
  "category": ["party"],
  "assets": {
    "thumbnail": "/my-game-thumbnail.png"
  },
  "badges": ["new"],
  "route": { "slug": "my-new-game" },
  "plugin": {
    "previewComponent": "myGamePreview",
    "moduleId": "@/games/my-new-game"
  }
}
```

#### Step 2: Create Game Directory Structure

```
src/games/my-new-game/
├── index.ts              # Export game components/contexts
├── hubEntry.tsx          # Optional: Custom preview component
└── pages/
    ├── Index.tsx         # Main game page
    └── Other pages...
```

#### Step 3: Create Hub Entry (Optional)

Create `src/games/my-new-game/hubEntry.tsx`:

```typescript
export function getMyGamePreviewEntry(): NormalizedGameEntry {
  return {
    // Same structure as registry JSON
    id: "my-new-game",
    // ... full entry
  };
}

export function MyGamePreviewCard() {
  return (
    <Card>
      <CardContent>
        Custom preview content
      </CardContent>
    </Card>
  );
}

export function getMyGamePreviewComponent() {
  return MyGamePreviewCard;
}
```

**Register the preview component** in `src/games/registry.ts`:

```typescript
import { getMyGamePreviewComponent } from "@/games/my-new-game/hubEntry";

function getPreviewComponent(entry: NormalizedGameEntry) {
  if (entry.plugin?.previewComponent === "paintPreview") {
    return getPaintPreviewComponent();
  }
  // Add your game's preview
  if (entry.plugin?.previewComponent === "myGamePreview") {
    return getMyGamePreviewComponent();
  }
  return undefined;
}
```

#### Step 4: Add Routes

Update `src/router/index.tsx`:

```typescript
<Route path="games">
  <Route path="paint-and-guess">
    {/* existing routes */}
  </Route>
  <Route path="my-new-game">
    <Route index element={<MyGameIndex />} />
    <Route path="play" element={<MyGamePlay />} />
  </Route>
</Route>
```

#### Step 5: Add to Fallback Registry (Optional)

Update `src/games/registry/fallback.ts` to include your game entry in the fallback registry.

### Paint & Guess Integration Example

Paint & Guess integrates with the hub through:

**1. Registry Entry** (`backend/data/game-registry.json`):
```json
{
  "id": "paint-and-guess",
  "version": "1.1.0",
  "name": { "default": "Paint & Guess" },
  "description": { "default": "Draw prompts, guess sketches, and keep the points flowing." },
  "status": "stable",
  "supportedPlayers": { "min": 2, "max": 12, "recommended": 6 },
  "monetization": "free",
  "category": ["party", "drawing"],
  "assets": {
    "thumbnail": "/placeholder.svg",
    "patchNotesUrl": "https://example.com/paint-and-guess/patch-notes"
  },
  "badges": ["hot"],
  "route": { "slug": "paint-and-guess" },
  "plugin": {
    "previewComponent": "paintPreview",
    "moduleId": "@/games/paint-and-guess"
  },
  "navigation": {
    "category": "featured",
    "priority": 100
  }
}
```

**2. Hub Entry File** (`src/games/paint-and-guess/hubEntry.tsx`):
- Exports `getPaintPreviewEntry()`: Provides entry metadata
- Exports `PaintPreviewCard`: Custom preview component
- Exports `getPaintPreviewComponent()`: Factory function

**3. Routes** (`src/router/index.tsx`):
```typescript
<Route path="games">
  <Route path="paint-and-guess">
    <Route index element={<Lobby />} />
    <Route path="single" element={<Index />} />
    <Route path="room/:roomId" element={<Room />} />
  </Route>
</Route>
```

**4. Preview Component Registration** (`src/games/registry.ts`):
```typescript
import { getPaintPreviewComponent } from "@/games/paint-and-guess/hubEntry";

function getPreviewComponent(entry: NormalizedGameEntry) {
  if (entry.plugin?.previewComponent === "paintPreview") {
    return getPaintPreviewComponent();
  }
  return undefined;
}
```

**Result:**
- ✅ Game appears in hub navigation
- ✅ Game appears in "All Games" grid
- ✅ Custom preview card shown in game tile
- ✅ Routes work: `/games/paint-and-guess`, `/games/paint-and-guess/room/:roomId`
- ✅ Game can be launched from hub

## Registry System Details

### Backend Registry (`backend/src/gameRegistry.js`)

**File Path:** `backend/data/game-registry.json`

**Responsibilities:**
- Reads JSON registry file
- Validates entries with Zod schema
- Caches registry in memory (60s TTL)
- Provides API endpoint: `GET /api/games`
- Falls back to hardcoded registry if file missing

**API Endpoint:** `GET /api/games`

**Response Format:**
```json
{
  "updatedAt": "2024-11-15T00:00:00.000Z",
  "source": "git",
  "entries": [
    {
      "id": "paint-and-guess",
      "version": "1.1.0",
      // ... full entry
    }
  ]
}
```

**Caching:**
- In-memory cache with 60-second TTL
- Cache key: `cachedRegistry`, `cachedAt`
- Force refresh available via parameter

**Error Handling:**
- If file read fails: Returns fallback registry
- If validation fails: Logs warning, returns fallback
- Fallback ensures hub always functional

### Frontend Registry (`src/games/registry.ts`)

**Responsibilities:**
- Fetches registry from `/api/games`
- Processes entries through `attachPlugin()`
- Caches with React Query (60s staleTime)
- Falls back to bundled registry on error
- Provides `useGameRegistry()` hook

**Hook Usage:**
```typescript
const { games, isLoading, error, source } = useGameRegistry();
```

**Returns:**
- `games: HubGame[]`: Array of enriched game entries
- `isLoading: boolean`: Loading state
- `error: Error | null`: Error if fetch failed
- `source: string`: Registry source ("cms", "git", "fallback", "cache")

**Processing Pipeline:**

1. **Fetch Registry**
   - Attempts `/api/games`
   - Falls back to `fallbackRegistry` on error

2. **Attach Plugins** (for each entry):
   ```typescript
   attachPlugin(entry) → {
     ...entry,
     displayName: localizeCopy(entry.name),
     displayDescription: localizeCopy(entry.description),
     derivedRoute: entry.route.path,
     isEnabled: checkFeatureFlags() && checkVisibility(),
     PreviewComponent: getPreviewComponent(entry),
     navLabel: entry.navigation?.label ?? displayName,
     navCategory: entry.navigation?.category ?? entry.category[0],
     navPriority: entry.navigation?.priority ?? 0,
     navHidden: entry.navigation?.hidden ?? false
   }
   ```

3. **Feature Flag & Visibility Checks:**
   - `isFeatureEnabled(flag)`: Checks if feature flag enabled
   - `matchesTargeting(visibleIf)`: Checks visibility rules (cohort:beta, internal, public, etc.)
   - Game only enabled if all flags pass and visibility matches

### Fallback Registry (`src/games/registry/fallback.ts`)

**Purpose:** Ensures hub works when API unavailable

**Content:**
- Hardcoded minimal game entries
- Includes Paint & Guess (fully playable)
- Includes example games (mystery-mashup, trivia-trails)
- Uses same schema as backend registry

**Usage:**
- Loaded when API fetch fails
- Loaded during build time
- Ensures offline functionality

## Navigation & Routing

### Route Structure

```
/                           → AllGames page (hub home)
/games/{game-slug}          → Game index/lobby
/games/{game-slug}/{path}   → Game-specific routes
```

**Example Routes:**
- `/` → All Games grid
- `/games/paint-and-guess` → Paint & Guess lobby
- `/games/paint-and-guess/room/:roomId` → Paint & Guess game room
- `/games/paint-and-guess/single` → Paint & Guess single player

### Router Configuration (`src/router/index.tsx`)

**Structure:**
```typescript
<Route path="/" element={<HubLayout />}>
  <Route index element={<AllGames />} />
  <Route path="games">
    <Route path="paint-and-guess">
      <Route index element={<Lobby />} />
      <Route path="single" element={<Index />} />
      <Route path="room/:roomId" element={<Room />} />
    </Route>
    {/* Other games */}
  </Route>
</Route>
```

**HubLayout as Wrapper:**
- All routes nested under `HubLayout`
- HubLayout provides consistent sidebar/header
- Game pages render in `<Outlet />` within HubLayout
- Navigation remains visible across all pages

### Navigation Building

**Process:**
1. `HubLayout` calls `buildNavigationLinks(games)`
2. Filters enabled, non-hidden games
3. Sorts by category, priority, label
4. Adds "All Games" link at top
5. Renders as `NavLink` components

**Sorting:**
1. Category alphabetical
2. Priority (higher first)
3. Label alphabetical

**Active State:**
- React Router `NavLink` handles active styling
- `isActive` prop determines highlight
- `end` prop ensures exact match for home

## Feature Flags & Visibility

### Feature Flags

**Purpose:** Enable/disable features per user

**Check:** `isFeatureEnabled(flag)` in `@/lib/featureFlags`

**Usage in Registry:**
```json
{
  "featureFlags": ["feature:mystery_beta"]
}
```

**Behavior:**
- Game only enabled if ALL feature flags pass
- If any flag disabled → game disabled

### Visibility Rules

**Purpose:** Control who can see games

**Check:** `matchesTargeting(visibleIf)` in `@/lib/featureFlags`

**Values:**
- `["public"]`: Everyone can see
- `["internal"]`: Internal only
- `["cohort:beta"]`: Beta cohort only
- Multiple rules: ALL must match

**Usage in Registry:**
```json
{
  "visibleIf": ["public"]  // or ["cohort:beta", "internal"]
}
```

### Combined Rules

**Game Enabled When:**
```
ALL featureFlags enabled AND
ALL visibleIf rules match
```

**Game Disabled When:**
```
ANY featureFlag disabled OR
ANY visibleIf rule fails
```

## UI Structure

### Hub Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (Desktop) / Header (Mobile)                         │
│ ┌─────────────────────┐                                     │
│ │ Game Hub            │                                     │
│ ├─────────────────────┤                                     │
│ │ All Games           │ ← Active link highlighted          │
│ │ Paint & Guess       │                                     │
│ │ Mystery Mashup      │                                     │
│ │ Trivia Trails       │                                     │
│ ├─────────────────────┤                                     │
│ │ [Avatar] Name       │ ← Avatar customizer button         │
│ │ Customize avatar    │                                     │
│ └─────────────────────┘                                     │
├─────────────────────────────────────────────────────────────┤
│ Header (Desktop)                                             │
│ Game Hub                                        [Mobile Nav] │
├─────────────────────────────────────────────────────────────┤
│ Main Content                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │  <Outlet /> ← Game pages render here                    │ │
│ │                                                         │ │
│ │  Example: AllGames grid or Paint & Guess lobby          │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### All Games Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ All Games                                                    │
│ Browse live, prototype, and upcoming party experiences.      │
│ Registry source: git                                         │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │ Thumbnail   │ │ Thumbnail   │ │ Thumbnail   │           │
│ │             │ │             │ │             │           │
│ ├─────────────┤ ├─────────────┤ ├─────────────┤           │
│ │ [Stable]    │ │ [Beta]      │ │ [Alpha]     │           │
│ │ [Hot]       │ │ [Limited]   │ │ [New]       │           │
│ │ Paint &     │ │ Mystery     │ │ Trivia      │           │
│ │ Guess       │ │ Mashup      │ │ Trails      │           │
│ │ Draw prompts│ │ A surprise  │ │ Battle your │           │
│ │ ...         │ │ ...         │ │ ...         │           │
│ │ 2-12        │ │ 3-8         │ │ 2-6 players │           │
│ │ players     │ │ players     │ │             │           │
│ │             │ │             │ │             │           │
│ │ [Play now]  │ │ [Unavailable│ │ [Unavailable│           │
│ │             │ │  for cohort]│ │  for cohort]│           │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Hierarchy

```
HubLayout
├── Sidebar Navigation
│   ├── All Games (link to /)
│   ├── Paint & Guess (link to /games/paint-and-guess)
│   ├── Mystery Mashup (link to /games/mystery-mashup)
│   └── Trivia Trails (link to /games/trivia-trails)
├── Header
│   └── Game Hub branding + mobile nav
└── Main Content (<Outlet />)
    ├── AllGames (at /)
    ├── Paint & Guess Pages (at /games/paint-and-guess/*)
    └── Other Game Pages
```

## Component Integration Points

### App.tsx Integration

**Current Setup:**
```typescript
<QueryClientProvider>
  <TooltipProvider>
    <GameProvider>  {/* Paint & Guess context - game-specific */}
      <BrowserRouter>
        <AppRoutes />  {/* Routes with HubLayout wrapper */}
      </BrowserRouter>
    </GameProvider>
  </TooltipProvider>
</QueryClientProvider>
```

**Note:** `GameProvider` is currently Paint & Guess specific. For multi-game support, this could be:
- Moved into Paint & Guess routes only
- Made generic with game ID parameter
- Or each game provides its own provider

### Router Integration

**HubLayout as Layout Route:**
- Wraps all routes
- Provides consistent navigation
- Game pages render within its `<Outlet />`

**Route Hierarchy:**
```
/ (HubLayout)
├── / (AllGames)
└── /games (HubLayout still active)
    └── /paint-and-guess (Game routes)
        ├── / (Lobby)
        ├── /single (Single player)
        └── /room/:roomId (Multiplayer room)
```

### Registry Integration

**Components Using Registry:**
1. **HubLayout**: Builds navigation from registry
2. **AllGames**: Displays game grid from registry
3. **Future**: Game discovery pages, search, filters

**Hook Usage:**
```typescript
const { games, isLoading, error, source } = useGameRegistry();
```

**Benefits:**
- Single source of truth
- Automatic updates when registry changes
- Cached for performance
- Error handling built-in

## File Structure

### Frontend Structure

```
src/
├── components/
│   └── HubLayout.tsx              # Main hub navigation/layout
├── pages/
│   └── AllGames.tsx               # Game discovery page
├── games/
│   ├── registry.ts                # Frontend registry hook/system
│   ├── registry/
│   │   ├── schema.ts              # Zod schemas for validation
│   │   └── fallback.ts            # Bundled fallback registry
│   └── paint-and-guess/
│       ├── hubEntry.tsx           # Hub integration (preview, metadata)
│       ├── index.ts               # Game exports
│       ├── pages/
│       │   ├── Index.tsx          # Single player
│       │   ├── Lobby.tsx          # Multiplayer lobby
│       │   └── Room.tsx           # Game room
│       └── ...                    # Other game files
└── router/
    └── index.tsx                  # Route configuration
```

### Backend Structure

```
backend/
├── src/
│   ├── gameRegistry.js            # Backend registry loader/API
│   └── server.js                  # Express server with /api/games endpoint
└── data/
    └── game-registry.json         # Source of truth for game metadata
```

## Registry Entry Schema Reference

### Required Fields

- `id: string`: Unique identifier (e.g., "paint-and-guess")
- `version: string`: Semantic version (e.g., "1.1.0")
- `name: { default: string, locales?: Record<string, string> }`: Game name
- `description: { default: string, locales?: Record<string, string> }`: Game description
- `status: "alpha" | "beta" | "stable" | "deprecated"`: Release status
- `supportedPlayers: { min: number, max: number, recommended?: number }`: Player counts
- `monetization: "free" | "iap" | "premium" | "subscription"`: Business model
- `assets: { thumbnail: string, ... }`: Visual assets

### Optional Fields

- `category: string[]`: Game categories (e.g., ["party", "drawing"])
- `badges: string[]`: Display badges (e.g., ["hot", "new", "beta"])
- `featureFlags: string[]`: Required feature flags
- `visibleIf: string[]`: Visibility rules (default: ["public"])
- `route: { slug?: string, path?: string }`: Custom routing (auto-derived if not provided)
- `metrics: { concurrentUsers?: number, uptimePercentage?: number }`: Live metrics
- `plugin: { previewComponent?: string, moduleId?: string }`: Custom preview component
- `navigation: { label?: string, category?: string, priority?: number, hidden?: boolean }`: Nav customization
- `schedule: { startsAt?: string, endsAt?: string }`: Time-based availability

### Auto-Derived Fields

- `route.path`: Automatically set to `/games/{slug}` if not provided
- `route.slug`: Automatically set to `id` if not provided

## Adding a New Game: Step-by-Step Guide

### Complete Integration Checklist

1. ✅ **Add registry entry** to `backend/data/game-registry.json`
2. ✅ **Create game directory** under `src/games/{game-id}/`
3. ✅ **Create hub entry file** `src/games/{game-id}/hubEntry.tsx` (optional)
4. ✅ **Register preview component** in `src/games/registry.ts` (if using custom preview)
5. ✅ **Add routes** in `src/router/index.tsx`
6. ✅ **Add to fallback registry** in `src/games/registry/fallback.ts` (optional but recommended)
7. ✅ **Test game appears** in hub navigation and All Games page
8. ✅ **Test game routes** work correctly
9. ✅ **Test feature flags** and visibility rules if applicable

### Example: Adding "Word Scramble" Game

**1. Registry Entry:**
```json
{
  "id": "word-scramble",
  "version": "1.0.0",
  "name": { "default": "Word Scramble" },
  "description": { "default": "Unscramble words faster than your friends!" },
  "status": "beta",
  "supportedPlayers": { "min": 2, "max": 6, "recommended": 4 },
  "monetization": "free",
  "category": ["word", "party"],
  "assets": { "thumbnail": "/word-scramble-thumb.png" },
  "badges": ["new"],
  "route": { "slug": "word-scramble" },
  "navigation": { "priority": 50 }
}
```

**2. Create Game Structure:**
```
src/games/word-scramble/
├── index.ts
├── hubEntry.tsx  (optional)
└── pages/
    └── Index.tsx
```

**3. Add Routes:**
```typescript
<Route path="games">
  <Route path="word-scramble">
    <Route index element={<WordScrambleIndex />} />
  </Route>
</Route>
```

**4. Add to Fallback:**
```typescript
// src/games/registry/fallback.ts
import { getWordScrambleEntry } from "@/games/word-scramble/hubEntry";

export const fallbackRegistry = {
  entries: [
    getPaintPreviewEntry(),
    getWordScrambleEntry(),  // Add here
    // ... other games
  ]
};
```

**Result:** Game appears in hub, can be navigated to, and functions independently.

## Current Games

### Paint & Guess

**Status:** Stable  
**Route:** `/games/paint-and-guess`  
**Integration:** Full (preview component, routes, context)

**Features:**
- Custom preview card
- Multiple routes (lobby, single, room)
- Full multiplayer support
- Integrated with hub navigation

### Mystery Mashup

**Status:** Beta  
**Route:** `/games/mystery-mashup`  
**Integration:** Registry only (no implementation yet)

**Features:**
- Scheduled release date
- Feature flag: `feature:mystery_beta`
- Visibility: `cohort:beta`
- Premium monetization

### Trivia Trails

**Status:** Alpha  
**Route:** `/games/trivia-trails`  
**Integration:** Registry only (no implementation yet)

**Features:**
- Localized (English/Spanish)
- Feature flag: `feature:trivia_alpha`
- Visibility: `internal`
- IAP monetization

## Future Enhancements

### Potential Improvements

1. **Game Search & Filtering**
   - Search by name/category
   - Filter by status, player count, monetization
   - Sort options

2. **Enhanced Preview Cards**
   - Live player counts
   - Screenshots/videos
   - Ratings/reviews
   - Recent activity

3. **Game Management**
   - Admin UI for registry editing
   - A/B testing support
   - Analytics integration
   - Dynamic scheduling

4. **Cross-Game Features**
   - Universal user profiles
   - Shared achievements
   - Game recommendations
   - Social features

5. **Plugin System Enhancements**
   - Custom game icons
   - Rich preview embeds
   - Game-specific settings
   - Launch parameters

## Notes

- The hub is designed to be **game-agnostic**: games are discovered dynamically, not hardcoded
- **Registry is the source of truth**: Games are added by editing JSON, not code
- **Progressive enhancement**: Games work with minimal config, can add custom features
- **Separation of concerns**: Hub handles discovery/navigation, games handle gameplay
- **Feature flags and visibility** ensure games can be rolled out gradually
- **Fallback registry** ensures hub always works, even offline
- **Caching** (60s TTL) balances freshness with performance
- Current `GameProvider` in `App.tsx` is Paint & Guess specific; consider making it game-agnostic for true multi-game support

