# World Map System - Chronicles of the Abyss

## Overview

The **World Map** is a 2-bit Final Fantasy style interactive world map that allows players to explore a procedurally generated world, discover locations, and navigate between different areas of the game. The map features pixel-perfect rendering, character movement, and location discovery mechanics.

**Component:** `src/games/rpg/components/WorldMap.tsx`  
**Utilities:** `src/games/rpg/utils/mapGenerator.ts`  
**Integration:** Accessed via "World Map" action button in ActionPanel

## Features

### Core Functionality

- ✅ **2-bit Final Fantasy Style Rendering** - Pixel-perfect canvas rendering with retro aesthetic
- ✅ **Procedural World Generation** - Dynamically generated terrain with landmasses and islands
- ✅ **Character Movement** - Arrow keys or WASD controls for character navigation
- ✅ **Camera System** - Camera follows character with smooth viewport culling
- ✅ **Location Discovery** - Locations auto-discover when character reaches them
- ✅ **Location Integration** - Connected to RPG store location system
- ✅ **Draggable Window** - Map panel can be moved around the screen
- ✅ **Walkability System** - Character cannot walk on ocean or mountain tiles

### Terrain Types

The map supports five terrain types, each with distinct 2-bit colors:

| Terrain | Color | Hex Code | Walkable |
|---------|-------|----------|----------|
| **Ocean** | Deep Blue | `#1a237e` | ❌ No |
| **Grass** | Green | `#4caf50` | ✅ Yes |
| **Forest** | Dark Green | `#2e7d32` | ✅ Yes |
| **Mountain** | Gray | `#757575` | ❌ No |
| **Desert** | Amber/Yellow | `#ffc107` | ✅ Yes |

### Location Types

Locations are placed on the map and can be discovered:

| Location | Type | Starting Status |
|----------|------|----------------|
| **Ruins of Eldrath** | Ruins | ✅ Discovered (Starting Location) |
| **Lower Sanctum** | Sanctum | ❌ Undiscovered |
| **Ancient Town** | Town | ❌ Undiscovered |

## Visual Layout

### Map Window Structure

```
┌─────────────────────────────────────────────────────────┐
│  🗺️ World Map                                    [X]    │ ← Header (Draggable)
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │         [Canvas: 640x400 pixels]                 │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────┐    │  │
│  │  │  Ocean (Blue)    Grass (Green)          │    │  │
│  │  │  Forest (Dark)   Mountain (Gray)       │    │  │
│  │  │  Desert (Amber)                        │    │  │
│  │  │                                          │    │  │
│  │  │  ● Location Marker (Gold)               │    │  │
│  │  │  ■ Character (Red Square)              │    │  │
│  │  │                                          │    │  │
│  │  └─────────────────────────────────────────┘    │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Use Arrow Keys or WASD to move • Current: Ruins of... │ ← Controls Info
└─────────────────────────────────────────────────────────┘
```

### Canvas Rendering

**Dimensions:**
- Canvas Width: 640 pixels
- Canvas Height: 400 pixels
- Tile Size: 16x16 pixels (Final Fantasy style)
- Viewport: ~40 tiles wide × ~25 tiles tall

**Rendering Properties:**
- `imageRendering: 'pixelated'` - Ensures crisp pixel art rendering
- `imageSmoothingEnabled: false` - Disables anti-aliasing for retro look
- Background: Deep black (`#0a0a0a`)

### Character Rendering

**Character Sprite:**
- Visual: Red square (6x6 pixels)
- Position: Centered on current tile
- Color: `#ff0000`
- Updates: Smooth movement with camera following

**Direction System:**
- `up` - Moving north
- `down` - Moving south
- `left` - Moving west
- `right` - Moving east

### Location Markers

**Visual Design:**
- Shape: Gold circle (4px radius)
- Color: `#ffd700`
- Position: Centered on location tile
- Label: White text (8px monospace) for current location

**Discovery States:**
- **Discovered:** Visible with gold marker
- **Undiscovered:** Hidden until character reaches location
- **Current Location:** Shows name label above marker

## Map Generation

### Procedural Algorithm

The map uses a procedural generation algorithm to create a varied world:

1. **Initialization:** All tiles start as ocean
2. **Main Continent:** Circular landmass centered on map
   - Radius varies with noise for organic shape
   - Terrain distribution based on distance from center:
     - **Center (0-30%):** Mountains and forests
     - **Mid (30-60%):** Mix of grass and forest
     - **Outer (60-100%):** Mostly grass, some desert
3. **Islands:** Random small islands scattered in ocean
   - Size: 3-8 tiles
   - Terrain: Grass and forest mix

### Map Data Structure

```typescript
interface MapData {
  width: number;        // Map width in tiles (default: 100)
  height: number;       // Map height in tiles (default: 100)
  tiles: TileType[][]; // 2D array of terrain types
  locations: MapLocation[]; // Array of location objects
}

interface MapLocation {
  id: string;          // Unique identifier
  name: string;        // Display name
  x: number;          // Tile X coordinate
  y: number;          // Tile Y coordinate
  discovered: boolean; // Discovery status
  type: 'ruins' | 'sanctum' | 'town' | 'dungeon';
}
```

## Controls & Interaction

### Keyboard Controls

| Key | Action |
|-----|--------|
| **Arrow Up** / **W** | Move character north |
| **Arrow Down** / **S** | Move character south |
| **Arrow Left** / **A** | Move character west |
| **Arrow Right** / **D** | Move character east |

### Mouse Controls

- **Click & Drag Header:** Move map window around screen
- **Click X Button:** Close map window

### Movement System

**Movement Speed:**
- Base speed: 0.1 tiles per frame (normalized to 60fps)
- Uses `requestAnimationFrame` for smooth animation
- Delta time calculation for frame-rate independence

**Collision Detection:**
- Checks tile type at destination before movement
- Blocks movement on ocean and mountain tiles
- Allows movement on grass, forest, and desert tiles

**Location Discovery:**
- Triggers when character is within 2 tiles of location
- Automatically marks location as discovered
- Updates RPG store location state
- Adds location to discovered locations list

## Camera System

### Camera Behavior

**Follow Mode:**
- Camera position tracks character position
- Smooth following with no lag
- Viewport centered on character

**Viewport Calculation:**
```typescript
viewportWidth = Math.floor(canvas.width / TILE_SIZE);   // ~40 tiles
viewportHeight = Math.floor(canvas.height / TILE_SIZE); // ~25 tiles

startX = Math.max(0, Math.floor(camera.x - viewportWidth / 2));
endX = Math.min(mapData.width, startX + viewportWidth);
startY = Math.max(0, Math.floor(camera.y - viewportHeight / 2));
endY = Math.min(mapData.height, startY + viewportHeight);
```

**Viewport Culling:**
- Only renders tiles visible in viewport
- Improves performance for large maps
- Calculates visible tile range based on camera position

## Integration with RPG System

### Store Integration

The World Map integrates with the RPG Zustand store:

```typescript
// Read current location
const location = useRpgStore((state) => state.location);

// Update location when discovered
const setLocation = useRpgStore((state) => state.setLocation);
```

### Location Synchronization

**From Map to Game:**
- When character reaches a location, `setLocation()` is called
- Updates RPG store location state
- Story window reflects new location
- Available commands may change based on location

**From Game to Map:**
- Map listens to location changes in store
- Character position updates when location changes
- Camera centers on new location
- Location marker highlights current location

### Action Panel Integration

**World Map Button:**
- Added to main actions in ActionPanel
- Icon: Map icon from Lucide React
- Action: `"worldmap"`
- Handler: Opens/closes WorldMap component

## Component Architecture

### WorldMap Component

**Props:**
```typescript
interface WorldMapProps {
  isOpen: boolean;    // Controls visibility
  onClose: () => void; // Close handler
}
```

**State Management:**
- `mapDataRef`: Persistent map data (generated once)
- `camera`: Camera position (x, y)
- `character`: Character position and direction
- `keys`: Active keyboard keys (Set<string>)

**Effects:**
1. **Initialization:** Generates map on first mount
2. **Location Sync:** Updates character position when location changes
3. **Keyboard Input:** Handles keydown/keyup events
4. **Movement:** Animation frame loop for character movement
5. **Rendering:** Canvas rendering on state changes

### Map Generator Utilities

**Functions:**
- `generateWorldMap()` - Creates procedural map data
- `getTileColor()` - Returns color for terrain type
- `isWalkable()` - Checks if tile allows movement
- `getLocationAt()` - Finds location at coordinates
- `getLocationByName()` - Finds location by name

## Styling & Theming

### Window Styling

**Container:**
- Background: `bg-secondary/95` with backdrop blur
- Border: 2px primary color with 50% opacity
- Border radius: `rounded-lg`
- Shadow: `shadow-2xl`
- Z-index: 50 (above other panels)

**Header:**
- Background: Transparent with bottom border
- Border: Primary color with 30% opacity
- Cursor: `cursor-move` for dragging
- Padding: `p-2`

**Canvas Container:**
- Padding: `p-4`
- Border: Primary color with 30% opacity
- Border radius: `rounded`

### Color Scheme

Matches RPG game dark fantasy theme:
- **Primary:** Gold/amber (`text-primary`)
- **Secondary:** Deep violet background
- **Accent:** Neon cyan for special effects
- **Muted:** Gray for controls text

## Performance Considerations

### Optimization Strategies

1. **Viewport Culling:** Only renders visible tiles
2. **Ref-based Map Data:** Map generated once, stored in ref
3. **Animation Frame:** Efficient movement loop
4. **Conditional Rendering:** Component only renders when open

### Performance Metrics

- **Map Generation:** ~50-100ms for 100x100 tile map
- **Rendering:** 60fps with viewport culling
- **Memory:** ~400KB for 100x100 tile map data

## Future Enhancements

### Potential Improvements

1. **Character Sprite:** Replace red square with pixel art sprite
2. **Animation:** Add walking animation frames
3. **Fast Travel:** Click location markers to teleport
4. **Map Zoom:** Zoom in/out functionality
5. **Mini-map:** Small overview map in corner
6. **Location Icons:** Different icons for different location types
7. **Pathfinding:** Auto-pathfinding to selected location
8. **Map Persistence:** Save discovered locations to localStorage
9. **Multiple Maps:** Support for different world regions
10. **Weather Effects:** Visual effects based on location

## Technical Notes

### Dependencies

- **react-draggable:** Window dragging functionality
- **framer-motion:** Animation for window open/close
- **lucide-react:** Map icon
- **zustand:** State management integration

### Browser Compatibility

- Requires HTML5 Canvas support
- `imageRendering: 'pixelated'` CSS property
- `requestAnimationFrame` API for smooth movement

### Accessibility

- Keyboard navigation support
- Clear visual feedback for interactions
- Text labels for current location
- High contrast colors for visibility

## Usage Example

```typescript
// In Index.tsx
const [worldMapOpen, setWorldMapOpen] = useState(false);

// In ActionPanel
<Button onClick={() => onAction("worldmap")}>
  <Map icon={Map} />
  World Map
</Button>

// In handleAction
if (action.toLowerCase() === "worldmap") {
  setWorldMapOpen(!worldMapOpen);
  return;
}

// Render WorldMap
<WorldMap
  isOpen={worldMapOpen}
  onClose={() => setWorldMapOpen(false)}
/>
```

## Related Documentation

- **Visual Layout:** [`docs/rpg-game-visual-layout.md`](./rpg-game-visual-layout.md)
- **Game Analysis:** [`docs/rpg-game-analysis.md`](./rpg-game-analysis.md)
- **Component Source:** `src/games/rpg/components/WorldMap.tsx`
- **Utilities Source:** `src/games/rpg/utils/mapGenerator.ts`

