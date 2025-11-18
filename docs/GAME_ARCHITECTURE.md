# Game Architecture Guide

This document outlines the architecture pattern for creating games that integrate seamlessly with the Game Hub system.

## Overview

Games in the hub are self-contained modules that follow a consistent structure. Each game lives under `src/games/{game-id}/` and exports standardized interfaces that the hub can discover and render.

## Directory Structure

```
src/games/{game-id}/
├── components/          # Game-specific UI components
│   ├── avatar/         # Optional: avatar system (if needed)
│   └── ...             # Other game components
├── hooks/              # Game-specific React hooks
│   └── useSocket.ts    # Example: WebSocket connection hook
├── pages/              # Route components
│   ├── Index.tsx       # Single-player/standalone view
│   ├── Lobby.tsx       # Multiplayer lobby
│   ├── Room.tsx        # Active game room
│   └── NotFound.tsx   # 404 handler
├── state/              # State management
│   └── GameContext.tsx # React context for game state
├── hubEntry.tsx        # Hub integration component (optional)
├── index.ts            # Barrel exports (REQUIRED)
└── PaintAndGuessApp.tsx # Standalone app wrapper (optional, deprecated)
```

## Required Files

### 1. `index.ts` - Barrel Exports

**Purpose**: Provides the hub with access to your game's core APIs.

**Required Exports**:
- `GameProvider` - React context provider for game state
- `useGame` - Hook to access game state and actions

**Example**:
```typescript
// src/games/paint-and-guess/index.ts
export { GameProvider, useGame } from "./state/GameContext";
```

**Why**: The hub and other parts of the app need a consistent way to access your game's state management without knowing internal file paths.

### 2. `state/GameContext.tsx` - State Management

**Purpose**: Centralized state management for your game using React Context.

**Required Interface**:
```typescript
interface GameContextType {
  gameState: GameState;
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string, playerName: string, avatar?: string) => void;
  createRoom: (roomName: string, isPublic?: boolean) => Promise<string>;
  leaveRoom: () => void;
  startGame: () => void;
  // ... other game-specific methods
}
```

**Pattern**:
- Use React Context API for state
- Integrate with Socket.io or other real-time systems
- Handle connection lifecycle (connect/disconnect/reconnect)
- Provide game-specific actions (join, leave, start, etc.)

**Example Structure**:
```typescript
export function GameProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useSocket();
  const [gameState, setGameState] = useState<GameState>({ /* ... */ });

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;
    
    socket.on("room-state", (state) => {
      setGameState(prev => ({ ...prev, ...state }));
    });
    
    // ... other handlers
    
    return () => {
      // Cleanup
    };
  }, [socket]);

  return (
    <GameContext.Provider value={{ gameState, socket, isConnected, ...actions }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}
```

### 3. `pages/` - Route Components

**Purpose**: React Router components that handle different game views.

**Standard Routes**:
- `Lobby.tsx` - Main entry point at `/games/{game-id}` (index route)
- `Room.tsx` - Active game room at `/games/{game-id}/room/:roomId`
- `Index.tsx` - Single-player mode at `/games/{game-id}/single`
- `NotFound.tsx` - 404 handler

**Integration**: These are imported and registered in `src/router/index.tsx`:

```typescript
// src/router/index.tsx
<Route path="games">
  <Route path="paint-and-guess">
    <Route index element={<Lobby />} />
    <Route path="single" element={<Index />} />
    <Route path="room/:roomId" element={<Room />} />
  </Route>
</Route>
```

**Best Practices**:
- Use `useGame()` hook to access game state
- Handle loading and error states
- Redirect to lobby if not connected
- Use shared UI components from `@/components/ui/*`

## Optional Files

### 4. `hubEntry.tsx` - Hub Integration Component

**Purpose**: Provides rich content for the hub's "Learn more" dialog.

**Structure**:
```typescript
import type { GameHubEntry } from "@/games/registry/schema";

export const myGameHubEntry: GameHubEntry = {
  heroEyebrow: "Live multiplayer",
  heroTitle: "My Game",
  heroDescription: "A compelling description of your game...",
  heroImage: "/placeholder.svg",
  primaryCta: { label: "Host a room", to: "/games/my-game" },
  secondaryCta: { label: "Practice solo", to: "/games/my-game/single" },
  highlights: [
    { title: "Feature 1", description: "What makes it special" },
    { title: "Feature 2", description: "Another highlight" },
  ],
  checklist: [
    { label: "Multiplayer lobby", complete: true },
    { label: "Custom avatars", complete: false },
  ],
};

export const MyGameHubPanel = () => {
  return (
    <div className="space-y-6">
      {/* Rich content for hub dialog */}
    </div>
  );
};
```

**Registration**: Add your component to `src/pages/AllGames.tsx`:

```typescript
const hubComponents: Record<string, ComponentType | undefined> = {
  "paint-and-guess": PaintAndGuessHubPanel,
  "my-game": MyGameHubPanel, // Add your game here
};
```

## Registry Integration

### Game Registry Entry

Your game must be registered in the game registry system. This can be done in two ways:

#### 1. Backend Registry (Recommended)

The hub fetches game entries from `/api/games/registry`. Your backend should return entries matching the `GameRegistryEntry` schema:

```typescript
{
  id: "my-game",
  name: "My Game",
  description: "A fun party game",
  status: "available", // or "coming-soon", "prototype", "retired"
  thumbnail: "/thumbnails/my-game.svg",
  route: "/games/my-game",
  featureFlag: "my-game-beta", // Optional: gate behind feature flag
  tags: ["multiplayer", "party"],
  modes: ["live-multiplayer", "party"],
  players: { min: 2, max: 8 },
  cta: { label: "Play now", to: "/games/my-game" },
  hub: { /* GameHubEntry data */ }
}
```

#### 2. Fallback Registry

For development or when backend is unavailable, add your game to `src/games/registry/fallback.ts`:

```typescript
export const fallbackGameRegistry: GameRegistryPayload = {
  entries: [
    {
      id: "my-game",
      name: "My Game",
      // ... other fields
    },
  ],
  // ...
};
```

### Registry Schema Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (matches directory name) |
| `name` | string | Yes | Display name |
| `description` | string | Yes | Short description for cards |
| `status` | enum | No | `available`, `coming-soon`, `prototype`, `retired` |
| `thumbnail` | string | No | Image path (default: `/placeholder.svg`) |
| `route` | string | No | Base route (default: `#`) |
| `featureFlag` | string | No | Feature flag to gate visibility |
| `tags` | string[] | No | Tags for filtering/categorization |
| `modes` | enum[] | No | Game modes: `singleplayer`, `party`, `live-multiplayer`, etc. |
| `players` | object | No | `{ min?: number, max?: number }` |
| `cta` | object | No | Call-to-action button config |
| `hub` | object | No | Rich hub entry data (see `GameHubEntry`) |

## Routing Conventions

### Route Structure

All games follow this pattern:
- **Lobby**: `/games/{game-id}` (index route)
- **Single-player**: `/games/{game-id}/single`
- **Room**: `/games/{game-id}/room/:roomId`
- **Custom routes**: `/games/{game-id}/custom-path`

### Route Registration

Add your routes to `src/router/index.tsx`:

```typescript
<Route path="games">
  <Route path="my-game">
    <Route index element={<Lobby />} />
    <Route path="single" element={<Index />} />
    <Route path="room/:roomId" element={<Room />} />
    {/* Add custom routes here */}
  </Route>
</Route>
```

### Legacy Route Redirects

If you have old routes, add redirects:

```typescript
<Route path="/old-route" element={<Navigate to="/games/my-game" replace />} />
```

## State Management Patterns

### Context Pattern (Recommended)

Use React Context for game state:

**Advantages**:
- Simple and familiar
- Works well with Socket.io
- Easy to test
- No external dependencies

**When to use**: Most games, especially real-time multiplayer games.

### Alternative: Zustand / Jotai

For complex state or when you need better performance:

```typescript
import { create } from 'zustand';

interface GameStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  // ...
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: initialState,
  setGameState: (state) => set({ gameState: state }),
}));
```

**When to use**: Games with complex state logic, offline support, or performance-critical updates.

## Shared Resources

### Shared Hooks

Common hooks live in `src/shared/hooks/`:
- `use-mobile.tsx` - Mobile detection
- `use-toast.ts` - Toast notifications
- `useDebounce.ts` - Debounce utility

**Import pattern**:
```typescript
import { useIsMobile } from "@/shared/hooks/use-mobile";
```

### Shared UI Components

Use components from `@/components/ui/*`:
- `Button`, `Card`, `Input`, `Dialog`, etc.
- Consistent styling via Tailwind + shadcn/ui

**Import pattern**:
```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### Shared Libraries

Common utilities in `src/lib/`:
- Avatar system (`src/lib/avatar/`)
- API client (`src/config/api.ts`)
- Feature flags (`src/lib/featureFlags.ts`)

## Best Practices

### 1. Isolation

- Keep game code self-contained in `src/games/{game-id}/`
- Don't import from other games directly
- Use shared resources from `src/shared/` or `src/lib/`

### 2. Type Safety

- Define TypeScript interfaces for game state
- Use Zod schemas for validation (if needed)
- Export types from `index.ts` for external use

### 3. Error Handling

- Handle connection failures gracefully
- Show user-friendly error messages
- Log errors for debugging

### 4. Performance

- Lazy load heavy components
- Memoize expensive computations
- Optimize re-renders with `useMemo`/`useCallback`

### 5. Testing

- Test game logic in isolation
- Mock Socket.io for unit tests
- Test state transitions

### 6. Documentation

- Document game-specific APIs
- Include examples in comments
- Update this guide if you add new patterns

## Example: Minimal Game

Here's a minimal game structure:

```
src/games/minimal-game/
├── index.ts
├── state/
│   └── GameContext.tsx
└── pages/
    ├── Lobby.tsx
    └── NotFound.tsx
```

**`index.ts`**:
```typescript
export { GameProvider, useGame } from "./state/GameContext";
```

**`state/GameContext.tsx`**:
```typescript
import { createContext, useContext, useState, ReactNode } from "react";

interface GameState {
  // Your game state
}

interface GameContextType {
  gameState: GameState;
  // Your game actions
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({ /* ... */ });
  
  return (
    <GameContext.Provider value={{ gameState, /* actions */ }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
```

**`pages/Lobby.tsx`**:
```typescript
import { useGame } from "@/games/minimal-game";

export default function Lobby() {
  const { gameState } = useGame();
  return <div>Lobby content</div>;
}
```

## Integration Checklist

When adding a new game:

- [ ] Create directory structure under `src/games/{game-id}/`
- [ ] Implement `state/GameContext.tsx` with `GameProvider` and `useGame`
- [ ] Export from `index.ts`
- [ ] Create route components in `pages/`
- [ ] Register routes in `src/router/index.tsx`
- [ ] Add game entry to registry (backend or fallback)
- [ ] (Optional) Create `hubEntry.tsx` for rich hub content
- [ ] (Optional) Register hub component in `AllGames.tsx`
- [ ] Test navigation from hub to game
- [ ] Test game state management
- [ ] Test error handling

## Migration from Standalone App

If you have an existing standalone game app:

1. Move components to `src/games/{game-id}/components/`
2. Move pages to `src/games/{game-id}/pages/`
3. Move state to `src/games/{game-id}/state/`
4. Create `index.ts` with exports
5. Update imports to use new paths
6. Register routes in hub router
7. Add to game registry

## Questions?

- Check `src/games/paint-and-guess/` for a complete reference implementation
- Review `src/router/index.tsx` for routing patterns
- See `src/games/registry/schema.ts` for registry field definitions

