# Guide: Integrating a New Game Mode into the Game Hub

This guide provides step-by-step instructions for IDE agents to integrate a new game mode into the Game Hub system. Follow these steps in order to ensure proper integration.

## Overview

The Game Hub uses a **registry-based plugin architecture** where games register themselves through configuration files. The integration process involves:

1. **Backend Registry Entry** - Add game metadata to the registry
2. **Frontend Game Directory** - Create game components and pages
3. **Hub Entry File** - Optional custom preview component
4. **Route Configuration** - Add routes for the game
5. **Preview Component Registration** - Register custom preview (if used)
6. **Fallback Registry** - Add to fallback for offline support

## Step-by-Step Integration

### Step 1: Add Backend Registry Entry

**File:** `backend/data/game-registry.json`

Add a new entry to the `entries` array:

```json
{
  "id": "my-new-game",
  "version": "1.0.0",
  "name": { "default": "My New Game" },
  "description": { "default": "A fun game description that explains what the game is about." },
  "status": "stable",
  "supportedPlayers": { "min": 2, "max": 8, "recommended": 4 },
  "monetization": "free",
  "category": ["party", "strategy"],
  "badges": ["new"],
  "assets": {
    "thumbnail": "/my-game-thumbnail.png"
  },
  "route": { "slug": "my-new-game" },
  "plugin": {
    "previewComponent": "myGamePreview",
    "moduleId": "@/games/my-new-game"
  },
  "navigation": {
    "category": "party",
    "priority": 80
  },
  "featureFlags": [],
  "visibleIf": ["public"]
}
```

**Required Fields:**
- `id`: Unique identifier (kebab-case, e.g., "word-scramble")
- `version`: Semantic version (e.g., "1.0.0")
- `name`: Object with `default` string (and optional `locales` for i18n)
- `description`: Object with `default` string
- `status`: One of `"alpha"`, `"beta"`, `"stable"`, `"deprecated"`
- `supportedPlayers`: Object with `min`, `max`, and optional `recommended`
- `monetization`: One of `"free"`, `"iap"`, `"premium"`, `"subscription"`
- `category`: Array of category strings
- `assets.thumbnail`: Path to thumbnail image
- `route.slug`: URL slug (usually matches `id`)

**Optional Fields:**
- `badges`: Array of badge strings (e.g., `["new", "hot", "beta"]`)
- `plugin.previewComponent`: String identifier for custom preview
- `plugin.moduleId`: Module path for the game
- `navigation.category`: Category for sidebar grouping
- `navigation.priority`: Number for sorting (higher = first)
- `featureFlags`: Array of required feature flags
- `visibleIf`: Array of visibility rules (default: `["public"]`)

### Step 2: Create Game Directory Structure

**Location:** `src/games/my-new-game/`

Create the following directory structure:

```
src/games/my-new-game/
├── index.ts                    # Export game components/contexts
├── hubEntry.tsx                # Hub integration (preview card, metadata)
└── pages/
    ├── Index.tsx               # Main game page (lobby/home)
    └── [Other pages...]         # Additional pages as needed
```

**Minimum Required Files:**

1. **`index.ts`** - Export your game components:
```typescript
export { default as MyNewGameIndex } from "./pages/Index";
// Export other components as needed
```

2. **`pages/Index.tsx`** - Main game page:
```typescript
export default function MyNewGameIndex() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">My New Game</h1>
        {/* Your game UI here */}
      </div>
    </div>
  );
}
```

### Step 3: Create Hub Entry File (Optional but Recommended)

**File:** `src/games/my-new-game/hubEntry.tsx`

This file provides:
- Custom preview card component (shown in "All Games" grid)
- Local metadata override (for better assets)

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

// Optional: Provide local metadata override
export function getMyNewGamePreviewEntry(): NormalizedGameEntry {
  return {
    id: "my-new-game",
    version: "1.0.0",
    name: { default: "My New Game" },
    description: {
      default: "A fun game description that explains what the game is about.",
    },
    status: "stable",
    supportedPlayers: { min: 2, max: 8, recommended: 4 },
    monetization: "free",
    category: ["party", "strategy"],
    badges: ["new"],
    assets: {
      thumbnail: "/my-game-thumbnail.png",
      // Optional: background image for better preview
      background: "/my-game-background.png",
    },
    navigation: {
      category: "party",
      priority: 80,
    },
    visibleIf: ["public"],
    route: { slug: "my-new-game" },
    featureFlags: [],
    plugin: {
      previewComponent: "myGamePreview",
      moduleId: "@/games/my-new-game",
    },
  };
}

// Custom preview card component (shown in All Games grid)
export function MyNewGamePreviewCard() {
  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="default">New</Badge>
          <CardTitle>My New Game</CardTitle>
        </div>
        <CardDescription>Short tagline about your game.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Additional preview content or features can go here.
      </CardContent>
    </Card>
  );
}

// Factory function for preview component
export function getMyNewGamePreviewComponent() {
  return MyNewGamePreviewCard;
}
```

**Note:** If you don't create a custom preview card, the game will use the default card from the registry.

### Step 4: Register Preview Component

**File:** `src/games/registry.ts`

Add your preview component to the registry:

1. **Import your hub entry functions:**
```typescript
import { getMyNewGamePreviewComponent, getMyNewGamePreviewEntry } from "@/games/my-new-game/hubEntry";
```

2. **Add to `getPreviewComponent()` function:**
```typescript
function getPreviewComponent(entry: NormalizedGameEntry) {
  if (entry.plugin?.previewComponent === "paintPreview") {
    return getPaintPreviewComponent();
  }
  // ... other games ...
  
  // Add your game's preview
  if (entry.plugin?.previewComponent === "myGamePreview") {
    return getMyNewGamePreviewComponent();
  }
  return undefined;
}
```

3. **Add to `localHubEntries` map (for asset overrides):**
```typescript
const localHubEntries: Record<string, () => NormalizedGameEntry> = {
  "paint-and-guess": getPaintPreviewEntry,
  // ... other games ...
  "my-new-game": getMyNewGamePreviewEntry, // Add here
};
```

### Step 5: Add Routes

**File:** `src/router/index.tsx`

Add routes for your game inside the `<Route path="games">` block:

```typescript
<Route path="games">
  {/* Existing games... */}
  
  <Route path="my-new-game">
    <Route index element={<MyNewGameIndex />} />
    {/* Add additional routes as needed */}
    <Route path="play" element={<MyNewGamePlay />} />
    <Route path="room/:roomId" element={<MyNewGameRoom />} />
  </Route>
</Route>
```

**Don't forget to import your components at the top:**
```typescript
import MyNewGameIndex from "@/games/my-new-game/pages/Index";
// Import other components as needed
```

**Route Path Convention:**
- Main route: `/hub/games/my-new-game` (matches `route.slug`)
- Additional routes: `/hub/games/my-new-game/play`, `/hub/games/my-new-game/room/:roomId`, etc.

### Step 6: Add to Backend Fallback Registry

**File:** `backend/src/gameRegistry.js`

Add your game to the `fallbackRegistry` object. This ensures your game appears even if the JSON registry file can't be loaded (important for deployment):

```javascript
const fallbackRegistry = {
  updatedAt: new Date().toISOString(),
  source: "fallback",
  entries: [
    // ... existing games ...
    {
      id: "my-new-game",
      version: "1.0.0",
      name: { default: "My New Game" },
      description: { default: "A fun game description that explains what the game is about." },
      status: "stable",
      supportedPlayers: { min: 2, max: 8, recommended: 4 },
      monetization: "free",
      category: ["party", "strategy"],
      badges: ["new"],
      assets: { thumbnail: "/placeholder.svg" },
      featureFlags: [],
      visibleIf: ["public"],
      route: { slug: "my-new-game" },
      plugin: {
        previewComponent: "myGamePreview",
        moduleId: "@/games/my-new-game",
      },
      navigation: {
        category: "party",
        priority: 80,
      },
    },
  ],
};
```

**Important:** The fallback registry should match your main registry entry. This is a safety net for production deployments.

### Step 7: Add Backend Support (If Multiplayer)

**Only needed if your game requires real-time multiplayer functionality.**

If your game needs Socket.IO support:

1. **Create game-specific room class** (optional, if you need custom state management):
   - `backend/src/myNewGameRoom.js` - Similar to `triviaRoom.js` or `gameRoom.js`

2. **Create room repository** (optional):
   - `backend/src/myNewGameRoomRepository.js` - Similar to `triviaRoomRepository.js`

3. **Add Socket.IO handlers in `backend/src/server.js`**:
```javascript
socket.on("my-game:create-room", async ({ roomName, playerName, avatar }) => {
  // Create room logic
});

socket.on("my-game:join-room", async ({ gamePin, playerName, avatar }) => {
  // Join room logic
});

// Add other game-specific events as needed
```

**Note:** For single-player or local multiplayer games, you may not need backend support.

## Integration Checklist

Use this checklist to ensure all steps are completed:

- [ ] **Backend Registry Entry** - Added to `backend/data/game-registry.json`
- [ ] **Game Directory** - Created `src/games/my-new-game/` with `index.ts` and `pages/Index.tsx`
- [ ] **Hub Entry File** - Created `src/games/my-new-game/hubEntry.tsx` (optional but recommended)
- [ ] **Preview Component Registration** - Added to `getPreviewComponent()` in `src/games/registry.ts`
- [ ] **Local Hub Entries** - Added to `localHubEntries` map in `src/games/registry.ts`
- [ ] **Routes** - Added routes in `src/router/index.tsx`
- [ ] **Route Imports** - Imported components in `src/router/index.tsx`
- [ ] **Fallback Registry** - Added to `fallbackRegistry` in `backend/src/gameRegistry.js`
- [ ] **Backend Support** - Added Socket.IO handlers if multiplayer (optional)

## Testing Your Integration

After completing the integration, verify:

1. **Game appears in navigation:**
   - Navigate to `/hub`
   - Check sidebar navigation for your game
   - Verify it's in the correct category

2. **Game appears in "All Games" grid:**
   - Navigate to `/hub` (All Games page)
   - Verify your game card appears
   - Check custom preview card (if implemented)

3. **Routes work:**
   - Navigate to `/hub/games/my-new-game`
   - Verify your main page loads
   - Test additional routes if added

4. **Registry loading:**
   - Check browser console for registry loading messages
   - Verify no errors related to your game

## Common Patterns

### Pattern 1: Simple Single-Page Game

**Structure:**
```
src/games/my-game/
├── index.ts
├── hubEntry.tsx
└── pages/
    └── Index.tsx
```

**Routes:**
```typescript
<Route path="my-game">
  <Route index element={<MyGameIndex />} />
</Route>
```

### Pattern 2: Multiplayer Game with Rooms

**Structure:**
```
src/games/my-game/
├── index.ts
├── hubEntry.tsx
├── state/
│   └── GameContext.tsx      # React Context for state
├── hooks/
│   └── useSocket.ts          # Socket.IO hook
├── pages/
│   ├── Lobby.tsx             # Create/join room
│   └── Room.tsx              # Game room
└── components/
    └── [Game components...]
```

**Routes:**
```typescript
<Route path="my-game" element={<MyGameApp />}>
  <Route index element={<MyGameLobby />} />
  <Route path="room/:roomId" element={<MyGameRoom />} />
</Route>
```

**Example:** See `trivia-blitz` or `paint-and-guess` for full implementation.

### Pattern 3: Game with Provider Wrapper

If your game needs a Context Provider:

**Wrapper Component:**
```typescript
// src/games/my-game/pages/MyGameApp.tsx
import { MyGameProvider } from "../state/MyGameContext";

export function MyGameApp({ children }: { children: React.ReactNode }) {
  return <MyGameProvider>{children}</MyGameProvider>;
}
```

**Routes:**
```typescript
<Route path="my-game" element={<MyGameApp />}>
  <Route index element={<MyGameIndex />} />
  {/* Other routes */}
</Route>
```

## Troubleshooting

### Game doesn't appear in navigation

**Check:**
1. Registry entry has correct `id` and `route.slug`
2. `visibleIf` includes `"public"` (or user matches targeting rules)
3. All `featureFlags` are enabled
4. Fallback registry includes your game

### Routes return 404

**Check:**
1. Routes added in `src/router/index.tsx`
2. Route path matches `route.slug` from registry
3. Components imported correctly
4. Route path starts with `/hub/games/` (not just `/games/`)

### Preview component not showing

**Check:**
1. `hubEntry.tsx` exports `getMyGamePreviewComponent()`
2. Registered in `getPreviewComponent()` function
3. `plugin.previewComponent` in registry matches the string in `getPreviewComponent()`

### Game appears but clicking doesn't work

**Check:**
1. Route path in registry matches route configuration
2. Component exports are correct
3. No console errors when navigating

## Examples

### Example 1: Trivia Blitz (Full Integration)

**Files:**
- `backend/data/game-registry.json` - Registry entry
- `src/games/trivia-blitz/hubEntry.tsx` - Custom preview
- `src/games/trivia-blitz/pages/Lobby.tsx` - Lobby page
- `src/games/trivia-blitz/pages/Room.tsx` - Game room
- `src/games/trivia-blitz/state/TriviaContext.tsx` - State management
- `src/router/index.tsx` - Routes with provider wrapper
- `backend/src/gameRegistry.js` - Fallback entry

### Example 2: Ping Pong (Simple Integration)

**Files:**
- `backend/data/game-registry.json` - Registry entry
- `src/games/ping-pong/hubEntry.tsx` - Custom preview
- `src/games/ping-pong/pages/Index.tsx` - Single page
- `src/router/index.tsx` - Simple route

## Additional Resources

- **Game Hub Architecture:** See `GameHubDocs/game-hub-analysis.md` for detailed architecture
- **Existing Games:** Reference `paint-and-guess`, `trivia-blitz`, or `ping-pong` for patterns
- **Registry Schema:** See `src/games/registry/schema.ts` for TypeScript types

## Quick Reference

**File Locations:**
- Backend registry: `backend/data/game-registry.json`
- Frontend registry: `src/games/registry.ts`
- Fallback registry: `backend/src/gameRegistry.js`
- Routes: `src/router/index.tsx`
- Game directory: `src/games/{game-id}/`

**Key Functions:**
- `getPreviewComponent()` - Maps preview component IDs to components
- `localHubEntries` - Maps game IDs to local metadata overrides
- `attachPlugin()` - Processes registry entries into `HubGame` objects

**Route Convention:**
- Registry `route.slug: "my-game"` → Route path: `/hub/games/my-game`
- Always prefix with `/hub` in the router configuration

