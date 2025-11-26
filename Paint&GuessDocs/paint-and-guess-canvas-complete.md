# Paint & Guess Canvas System - Complete Documentation

## Overview

The canvas system in Paint & Guess is a real-time collaborative drawing framework that enables players to draw and share their artwork synchronously during gameplay. The system uses Fabric.js for canvas manipulation, Socket.io for real-time synchronization, and provides a comprehensive set of drawing tools including brushes, erasers, color selection, and canvas management features.

**Last Updated:** After Toolbar and ColorPalette improvements (accessibility, persistence, keyboard shortcuts, debouncing)

---

## Architecture

### Component Structure

The canvas system has been refactored from a monolithic 559-line component into a modular architecture:

```
src/games/paint-and-guess/components/
├── Canvas.tsx                    # Main component (~218 lines)
├── Toolbar.tsx                   # Drawing tools toolbar (~105 lines)
├── ColorPalette.tsx              # Color selection component (~199 lines)
├── canvas/
│   ├── index.ts                  # Barrel export
│   ├── useCanvasLifecycle.ts     # Lifecycle management (~288 lines)
│   ├── useCanvasDrawing.ts       # Drawing functionality (~205 lines)
│   └── useCanvasSync.ts          # Synchronization (~190 lines)
```

### Core Components

#### 1. Canvas Component (`src/games/paint-and-guess/components/Canvas.tsx`)

**Main Responsibilities:**
- UI layout and rendering
- Tool state management (color, brush size, tool type)
- Composing hooks for lifecycle, drawing, and sync
- User interactions and keyboard shortcuts
- Preference persistence

**Key Features:**
- **Modular Architecture**: Uses three custom hooks for separation of concerns
- **State Management**: Manages activeColor, brushSize, activeTool
- **Preference Persistence**: Saves/loads drawing preferences to localStorage
- **Debounced Brush Size**: 100ms debounce to prevent excessive re-renders
- **Keyboard Shortcuts**: B (brush), E (eraser), Ctrl+U/Cmd+U (undo)
- **Role-Based Rendering**: Only shows Toolbar/ColorPalette for drawers during drawing phase

**State Management:**
```typescript
const [activeColor, setActiveColor] = useState(preferences.color);
const [brushSize, setBrushSize] = useState(preferences.size);
const [debouncedBrushSize, setDebouncedBrushSize] = useState(preferences.size);
const [activeTool, setActiveTool] = useState<"draw" | "erase">(preferences.tool);
```

**Preference Persistence:**
- Storage key: `"paint-and-guess-drawing-preferences"`
- Persists: color, brush size, active tool
- Loads on component mount
- Saves on any preference change

**Keyboard Shortcuts:**
- `B` or `b`: Switch to brush tool
- `E` or `e`: Switch to eraser tool
- `Ctrl+U` / `Cmd+U`: Undo last action
- Shortcuts only active when drawer and game is active
- Shortcuts disabled when typing in inputs

**Canvas Configuration:**
```typescript
{
  width: Calculated from container (maintains 4:3 aspect ratio),
  height: Calculated from container (maintains 4:3 aspect ratio),
  backgroundColor: "#ffffff",
  isDrawingMode: gameState.isGameActive && gameState.isDrawer,
  skipTargetFind: !gameState.isDrawer,
  selection: gameState.isDrawer,
  renderOnAddRemove: true
}
```

#### 2. Toolbar Component (`src/games/paint-and-guess/components/Toolbar.tsx`)

**Main Responsibilities:**
- Provides drawing tool selection (Brush/Eraser)
- Controls brush size via slider (1-50px)
- Offers undo and clear actions
- Displays active tool state

**Features:**
- **Tool Selection**: Toggle between "draw" and "erase" modes
- **Brush Size Control**: Slider with visual feedback (1-50 range)
- **Action Buttons**: Undo (removes last path) and Clear (clears canvas)
- **Disabled State**: Automatically disabled for guessers or when game not active
- **Responsive Design**: Adapts layout for mobile/desktop
- **Accessibility**: Full ARIA support, keyboard navigation hints

**Props Interface:**
```typescript
interface ToolbarProps {
  activeTool: "draw" | "erase";
  brushSize: number;
  onToolChange: (tool: "draw" | "erase") => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  disabled?: boolean;
}
```

**Accessibility Features:**
- `aria-label` on all buttons
- `aria-pressed` for tool buttons (indicates active state)
- `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` on slider
- Screen reader text for keyboard shortcuts
- Focus rings for keyboard navigation

**UI Elements:**
- Brush button with paintbrush icon + "Brush" label (hidden on small screens)
- Eraser button with eraser icon + "Eraser" label (hidden on small screens)
- Size slider with numeric display
- Undo button with curved arrow icon + "Undo" label
- Clear button with trash icon + "Clear" label (destructive variant)

#### 3. Color Palette Component (`src/games/paint-and-guess/components/ColorPalette.tsx`)

**Main Responsibilities:**
- Provides preset color selection (12 colors)
- Tracks and displays recent colors (last 6)
- Offers custom color picker (HTML5 input + hex text input)
- Shows active color preview
- Persists recent colors to localStorage

**Features:**
- **Preset Colors**: 12 predefined colors (black, white, red, orange, yellow, green, cyan, blue, purple, pink, violet, amber)
- **Recent Colors**: Tracks last 6 used colors, persists across sessions
- **Custom Color Picker**: HTML5 color input + hex text input with validation
- **Active Color Display**: Visual preview with hex code
- **Color Validation**: Validates hex color format (#RRGGBB)
- **State Synchronization**: Syncs with parent activeColor prop via useEffect
- **Accessibility**: Full ARIA support, keyboard navigation

**Props Interface:**
```typescript
interface ColorPaletteProps {
  activeColor: string;
  onColorChange: (color: string) => void;
}
```

**State Management:**
- `customColor`: Synced with `activeColor` prop via useEffect
- `recentColors`: Loaded from localStorage on mount, persisted on changes
- Storage key: `"paint-and-guess-recent-colors"`
- Maximum recent colors: 6

**Color Validation:**
```typescript
const isValidHexColor = (value: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(value);
};
```

**Accessibility Features:**
- `aria-label` on all color buttons
- `aria-pressed` for active color indication
- Focus rings for keyboard navigation
- Screen reader friendly labels

**Color Selection Flow:**
1. User clicks preset/recent color or picks custom color
2. `handleColorSelect()` called
3. `onColorChange(color)` called once (no double calls)
4. `customColor` state updated
5. Color added to recent colors (removes duplicates, maintains order)
6. Recent colors persisted to localStorage

#### 4. Canvas Hooks

##### `useCanvasLifecycle.ts` (~288 lines)

**Responsibilities:**
- Canvas initialization
- Canvas disposal
- Size calculation based on container
- ResizeObserver setup
- Window resize handling
- Canvas validation

**Key Features:**
- Handles Fabric.js canvas creation
- Manages canvas disposal
- Calculates optimal canvas size based on container (maintains 4:3 aspect ratio)
- Accounts for toolbar and color palette space
- Sets up resize observers
- Validates canvas state before operations

**Exports:**
```typescript
{
  fabricCanvas: FabricCanvas | null;
  isDisposed: boolean;
  isCanvasValid: (canvas: FabricCanvas | null) => boolean;
}
```

**Size Calculation:**
- Calculates based on container dimensions
- Maintains 4:3 aspect ratio
- Accounts for UI elements (toolbar, color palette)
- Responsive: adapts to mobile/desktop
- Minimum sizes enforced

##### `useCanvasDrawing.ts` (~205 lines)

**Responsibilities:**
- Brush property updates
- Drawing mode management
- Sending drawing events (drawer)
- Undo functionality
- Clear functionality

**Key Features:**
- Updates brush color and size
- Manages drawing mode based on role
- Captures path:created events
- Sends incremental path updates during drawing
- Sends final path on completion
- Provides undo/clear handlers

**Exports:**
```typescript
{
  handleUndo: () => void;
  handleClear: (clearCanvas: () => void) => void;
}
```

**Drawing Event Flow:**
1. User starts drawing → `mouse:down` → sends `path-start` event
2. User moves mouse → `mouse:move` → sends `path-update` events (throttled)
3. User releases mouse → `path:created` → sends `path-complete` event

##### `useCanvasSync.ts` (~190 lines)

**Responsibilities:**
- Receiving drawing events (guessers)
- Canvas clearing synchronization
- Round transition handling
- Making objects non-interactive

**Key Features:**
- Listens for drawing events from server
- Uses `enlivenObjects` for efficient rendering
- Handles canvas clear events
- Listens for round-started/round-ended events
- Ensures guesser objects are non-interactive

---

## Data Flow

### Drawing Event Flow

1. **User Draws on Canvas** (Drawer)
   - User interacts with Fabric.js canvas
   - Fabric.js fires `path:created` event
   - Canvas component captures path data via `path.toJSON()`

2. **Event Transmission** (Drawer → Server)
   - `sendDrawingEvent()` called with path data
   - GameContext validates drawer role
   - Socket.io emits `drawing-event` to server
   - Event payload: `{ type: "path", data: pathJSON }`

3. **Server Processing** (Backend)
   - Server receives `drawing-event` from socket
   - Validates room exists and game is active
   - Verifies sender is current drawer
   - Broadcasts event to all other players in room
   - Server code: `socket.to(roomId).emit("drawing-event", event)`

4. **Event Reception** (Guessers)
   - GameContext receives `drawing-event` via socket
   - Dispatches custom DOM event: `window.dispatchEvent(new CustomEvent("drawing-event", { detail: event }))`
   - Canvas component listens for custom event
   - Extracts path data from event detail

5. **Canvas Update** (Guessers)
   - Gets existing canvas objects
   - Adds new path to object array
   - Sets new path as non-interactive (selectable: false, evented: false)
   - Uses `enlivenObjects` for efficient rendering
   - Renders updated canvas with `requestRenderAll()`

### Clear Canvas Flow

1. **User Clears Canvas** (Drawer)
   - User clicks "Clear" button
   - Canvas component calls `fabricCanvas.clear()`
   - Calls `clearCanvas()` from GameContext

2. **Clear Transmission** (Drawer → Server)
   - GameContext emits `clear-canvas` socket event
   - Server validates and broadcasts to room

3. **Clear Reception** (Guessers)
   - Server broadcasts `canvas-cleared` event
   - GameContext dispatches custom DOM event
   - Canvas component listens and clears local canvas
   - Resets background to white

### Canvas State Synchronization

**Initialization:**
- Canvas created when game becomes active
- Drawing mode enabled only for drawer
- Canvas cleared at round start
- Size adjusted based on viewport
- Preferences loaded from localStorage

**Round Transitions:**
- Canvas automatically cleared when new round starts
- Drawing mode updated based on new drawer
- All objects reset to clean state
- Preferences maintained across rounds

**Role Changes:**
- When player becomes drawer: Canvas becomes interactive
- When player becomes guesser: Canvas becomes read-only
- All objects marked as non-interactive for guessers
- Toolbar/ColorPalette visibility updated

---

## Real-Time Synchronization

### Socket.io Events

**Client → Server:**
- `drawing-event`: Sends path data (drawer only)
- `clear-canvas`: Requests canvas clear (drawer only)

**Server → Client:**
- `drawing-event`: Broadcasts path data to guessers
- `canvas-cleared`: Broadcasts clear action to guessers

### Event Validation

**Server-Side Checks:**
- Room exists and is active
- Game is in progress
- Sender is current drawer
- Player is connected to room

**Client-Side Checks:**
- Canvas is valid and not disposed
- Player has drawer role
- Game is active
- Not currently receiving (prevents echo)

### Echo Prevention

- `isReceivingRef` flag prevents processing own events
- Drawer's local canvas doesn't receive broadcast events
- Only guessers process incoming drawing events

---

## UI Structure

### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│ GameHeader: Room ID | "You're Drawing!" | Timer | Round    │
│                      Word: FOREST (drawer only)             │
├──────────┬──────────────────────────────┬───────────────────┤
│          │                              │                   │
│ Players  │      Canvas Area             │      Chat         │
│ List     │                              │                   │
│          │  ┌────────────────────────┐  │                   │
│ - Alice  │  │                        │  │  Chat Messages   │
│ - Bob    │  │                        │  │                  │
│ - Carol  │  │    Drawing Canvas      │  │  [Input Field]   │
│ - Diana  │  │    (container-adaptive)│  │                  │
│          │  │                        │  │                  │
│ [Ready]  │  └────────────────────────┘  │                  │
│ [Start]  │                              │                   │
│          │  ┌────────────────────────┐  │                   │
│          │  │ Toolbar:              │  │                   │
│          │  │ [Brush] [Eraser]      │  │                   │
│          │  │ Size: [━━━━━━━━] 15   │  │                   │
│          │  │ [Undo] [Clear]        │  │                   │
│          │  └────────────────────────┘  │                   │
│          │                              │                   │
│          │  ┌────────────────────────┐  │                   │
│          │  │ Color Palette:         │  │                   │
│          │  │ [●][●][●][●][●][●]    │  │                   │
│          │  │ [●][●][●][●][●][●]    │  │                   │
│          │  │ Recent: [●][●][●]      │  │                   │
│          │  │ Custom: [■] #000000   │  │                   │
│          │  │ Active: [●] #000000   │  │                   │
│          │  └────────────────────────┘  │                   │
│          │                              │                   │
└──────────┴──────────────────────────────┴───────────────────┘
```

### Component Hierarchy

```
Room
├── GameHeader
│   ├── Room ID
│   ├── Drawer Badge
│   ├── Timer
│   ├── Round Info
│   └── Current Word (drawer only)
│
├── PlayerList (Left Sidebar)
│   ├── Player Cards
│   ├── Ready Button
│   └── Start Game Button (host only)
│
├── Canvas (Center)
│   ├── Toolbar (drawer only, during drawing phase)
│   │   ├── Brush Button
│   │   ├── Eraser Button
│   │   ├── Size Slider
│   │   ├── Undo Button
│   │   └── Clear Button
│   │
│   ├── Fabric.js Canvas Element
│   │   └── Drawing Surface
│   │
│   └── ColorPalette (drawer only, during drawing phase)
│       ├── Preset Colors Grid
│       ├── Recent Colors
│       ├── Custom Color Picker
│       └── Active Color Display
│
└── Chat (Right Sidebar)
    ├── Message List
    └── Input Field
```

### Responsive Behavior

**Desktop (>768px):**
- Canvas: Container-adaptive sizing (maintains 4:3 aspect ratio)
- Toolbar: Horizontal layout
- Color Palette: 12-column grid

**Mobile (≤768px):**
- Canvas: Container-adaptive sizing (maintains 4:3 aspect ratio)
- Toolbar: Vertical/stacked layout
- Color Palette: 6-column grid
- Reduced padding and spacing

---

## Drawer vs Guesser Perspectives

The canvas system provides fundamentally different experiences for drawers and guessers.

### Drawer Perspective

#### Visual Interface

**GameHeader:**
- ✅ **"You're Drawing!" badge** - Purple badge indicating active role
- ✅ **Current Word Display** - Shows the word to draw (e.g., "Word: FOREST")
- ✅ Timer and round information

**Canvas Area:**
- ✅ **Interactive Canvas** - Full drawing capabilities
- ✅ **Toolbar** - Fully enabled with all tools (only during drawing phase):
  - Brush button (active)
  - Eraser button (active)
  - Size slider (1-50px, functional)
  - Undo button (removes last path)
  - Clear button (clears entire canvas)
- ✅ **Color Palette** - Visible and fully functional (only during drawing phase):
  - 12 preset colors (clickable)
  - Recent colors section (persists across sessions)
  - Custom color picker
  - Active color preview
- ✅ **Drawing Surface** - Can draw, erase, and interact with canvas

**Canvas Behavior:**
- `isDrawingMode: true` - Drawing enabled
- `skipTargetFind: false` - Object selection enabled
- `selection: true` - Can select objects
- Interactive cursors (drawing cursor, selection cursor)
- All Fabric.js interactions enabled

#### Capabilities

**Drawing Actions:**
- ✅ Draw freehand paths with brush
- ✅ Erase using eraser tool (white strokes)
- ✅ Change brush size (1-50px, debounced)
- ✅ Change brush color (12 presets + custom)
- ✅ Undo last drawing action
- ✅ Clear entire canvas
- ✅ Keyboard shortcuts (B, E, Ctrl+U/Cmd+U)

**Event Transmission:**
- ✅ Sends `drawing-event` to server on each path creation
- ✅ Sends `clear-canvas` event when clearing
- ✅ Events broadcast to all guessers in room
- ❌ Does NOT receive own drawing events (echo prevention)

### Guesser Perspective

#### Visual Interface

**GameHeader:**
- ❌ **No "You're Drawing!" badge** - No special indicator
- ❌ **No Current Word Display** - Word is hidden (must guess)
- ✅ Timer and round information (same as drawer)

**Canvas Area:**
- ✅ **Read-Only Canvas** - View-only, no interaction
- ❌ **Toolbar** - Hidden (not rendered)
- ❌ **Color Palette** - Hidden (not rendered)
- ✅ **"Watch and guess the word!" Overlay** - Instructional message at top of canvas
- ✅ **Drawing Surface** - Can only view, cannot interact

**Canvas Behavior:**
- `isDrawingMode: false` - Drawing disabled
- `skipTargetFind: true` - Object selection disabled
- `selection: false` - Cannot select objects
- `defaultCursor: 'default'` - Standard cursor (no drawing cursor)
- All objects marked as `selectable: false, evented: false`

#### Capabilities

**Viewing Actions:**
- ✅ Watch drawings appear in real-time
- ✅ See canvas clear when drawer clears
- ✅ View all drawing actions synchronously
- ❌ Cannot draw
- ❌ Cannot erase
- ❌ Cannot change colors
- ❌ Cannot undo
- ❌ Cannot clear

**Event Reception:**
- ✅ Receives `drawing-event` from server
- ✅ Receives `canvas-cleared` event
- ✅ Processes events and renders on canvas
- ❌ Does NOT send any drawing events

### Side-by-Side Comparison

| Feature | Drawer | Guesser |
|---------|--------|---------|
| **Canvas Interaction** | ✅ Full drawing | ❌ View only |
| **Toolbar** | ✅ Visible & enabled (drawing phase) | ❌ Hidden |
| **Color Palette** | ✅ Visible & functional (drawing phase) | ❌ Hidden |
| **Current Word** | ✅ Shown in header | ❌ Hidden |
| **Drawing Badge** | ✅ "You're Drawing!" | ❌ None |
| **Canvas Overlay** | ❌ None | ✅ "Watch and guess!" |
| **Send Events** | ✅ Yes | ❌ No |
| **Receive Events** | ❌ No (echo prevention) | ✅ Yes |
| **Undo/Clear** | ✅ Available | ❌ N/A |
| **Brush Controls** | ✅ Functional | ❌ N/A |
| **Keyboard Shortcuts** | ✅ B, E, Ctrl+U | ❌ N/A |
| **Preference Persistence** | ✅ Yes | ❌ N/A |
| **Cursor Type** | Drawing cursor | Default cursor |

---

## Recent Improvements

### Toolbar & ColorPalette Enhancements (Latest Update)

#### 1. State Synchronization
- ✅ **Fixed**: ColorPalette now syncs `customColor` with `activeColor` prop via useEffect
- ✅ **Fixed**: Removed double `onColorChange` calls that were causing strokes to be deleted
- ✅ **Result**: Color selection works correctly without side effects

#### 2. Accessibility Features
- ✅ **Added**: Full ARIA support on all interactive elements
- ✅ **Added**: `aria-label` on buttons and inputs
- ✅ **Added**: `aria-pressed` for tool buttons
- ✅ **Added**: `aria-valuemin`, `aria-valuemax`, `aria-valuenow` on slider
- ✅ **Added**: Screen reader text for keyboard shortcuts
- ✅ **Added**: Focus rings for keyboard navigation

#### 3. Keyboard Shortcuts
- ✅ **Added**: `B` or `b` - Switch to brush tool
- ✅ **Added**: `E` or `e` - Switch to eraser tool
- ✅ **Added**: `Ctrl+U` / `Cmd+U` - Undo last action
- ✅ **Smart**: Shortcuts disabled when typing in inputs
- ✅ **Smart**: Shortcuts only active when drawer and game is active

#### 4. Preference Persistence
- ✅ **Added**: Drawing preferences saved to localStorage
  - Active color
  - Brush size
  - Active tool (brush/eraser)
- ✅ **Added**: Recent colors persisted to localStorage
- ✅ **Result**: User preferences maintained across sessions

#### 5. Performance Optimizations
- ✅ **Added**: Brush size changes debounced (100ms)
- ✅ **Result**: Prevents excessive canvas re-renders during slider movement
- ✅ **Result**: Smoother drawing experience

#### 6. Color Validation
- ✅ **Improved**: Better hex color validation
- ✅ **Fixed**: Prevents invalid colors from being set
- ✅ **Improved**: Better handling of partial hex input while typing

#### 7. UI/UX Improvements
- ✅ **Fixed**: Toolbar and ColorPalette only show during "drawing" phase
- ✅ **Fixed**: Proper disabled state based on game state
- ✅ **Improved**: Recent colors section always visible (with empty state)
- ✅ **Removed**: Unnecessary toast notifications on tool changes

---

## Integration Points

### GameContext Integration

**Functions Provided:**
- `sendDrawingEvent(event)`: Sends drawing path to server
- `clearCanvas()`: Sends clear request to server
- `gameState`: Provides role, game status, round info

**State Dependencies:**
- `gameState.isDrawer`: Controls drawing mode
- `gameState.isGameActive`: Enables/disables canvas
- `gameState.phase`: Controls Toolbar/ColorPalette visibility
- `gameState.roundNumber`: Triggers canvas clear on change

### Socket Integration

**Connection:**
- Managed by `useSocket` hook
- Auto-reconnects on disconnect
- Session persistence via sessionStorage

**Event Handlers:**
- `drawing-event`: Receives path data
- `canvas-cleared`: Receives clear signal
- Custom DOM events bridge socket to canvas

### Room Integration

**Layout:**
- Canvas occupies center area
- Responsive grid layout
- Player list and chat flank canvas

**State Coordination:**
- Room page manages overall layout
- Canvas component handles drawing logic
- GameHeader displays game state

---

## Rendering & Performance

### Fabric.js Rendering

**Rendering Methods:**
- `renderAll()`: Standard render
- `requestRenderAll()`: Optimized render (preferred)
- `renderOnAddRemove`: Auto-render on object changes

**Performance Optimizations:**
- Object caching disabled for guessers (ensures visibility)
- Batch updates via `enlivenObjects` for multiple objects
- `requestAnimationFrame` for smooth animations
- Canvas disposal on unmount to prevent memory leaks
- **Debounced brush size changes** (100ms) to prevent excessive re-renders

### Canvas Lifecycle

**Initialization:**
1. Create FabricCanvas instance
2. Configure drawing brush (PencilBrush)
3. Set initial drawing mode
4. Set up event listeners
5. Load preferences from localStorage
6. Mark canvas as ready

**Active State:**
- Drawing events captured and sent
- Receiving events processed and rendered
- Tool changes update brush properties
- Canvas resizes on window resize
- Preferences saved on changes

**Disposal:**
1. Remove event listeners
2. Mark canvas as disposed
3. Clear canvas state
4. Call `canvas.dispose()`
5. Clean up refs

---

## Error Handling

### Canvas Validation

**Checks Performed:**
- Canvas instance exists
- Canvas not disposed
- Lower canvas element exists
- 2D context available

**Error Recovery:**
- Skips operations if canvas invalid
- Logs warnings for debugging
- Gracefully handles disposal errors

### Network Error Handling

**Socket Disconnection:**
- Canvas remains functional locally
- Drawing events queued (if supported)
- Reconnection restores sync

**Event Processing Errors:**
- Try-catch blocks around critical operations
- Error logging for debugging
- User notifications via toast

---

## Dependencies

### External Libraries

- **fabric**: Canvas manipulation library
  - `Canvas`: Main canvas class
  - `PencilBrush`: Freehand drawing brush
  - `FabricObject`: Base class for canvas objects
- **socket.io-client**: Real-time communication
- **lucide-react**: Icons (Paintbrush, Eraser, Undo, Trash2, Check, etc.)

### Internal Dependencies

- `@/components/ui/*`: UI components (Button, Slider, Input, Badge)
- `@/games/paint-and-guess`: Game context and hooks
- `@/lib/utils`: Utility functions

---

## File Structure

```
src/games/paint-and-guess/
├── components/
│   ├── Canvas.tsx              # Main canvas component
│   ├── Toolbar.tsx             # Drawing tools toolbar
│   ├── ColorPalette.tsx        # Color selection component
│   ├── GameHeader.tsx          # Game state header
│   └── canvas/
│       ├── index.ts            # Barrel export
│       ├── useCanvasLifecycle.ts    # Lifecycle management
│       ├── useCanvasDrawing.ts     # Drawing functionality
│       └── useCanvasSync.ts         # Synchronization
│
├── pages/
│   └── Room.tsx                # Room layout coordinator
│
└── state/
    └── GameContext.tsx         # Game state & socket management

backend/src/
└── server.js                   # Socket.io event handlers
    ├── drawing-event handler
    └── clear-canvas handler
```

---

## Event System

### Custom DOM Events

**`drawing-event`**
- **Dispatched by**: GameContext when receiving socket event
- **Payload**: `{ detail: { type: "path", data: pathJSON } }`
- **Listeners**: Canvas component (guessers only)
- **Purpose**: Bridge socket events to canvas component

**`canvas-cleared`**
- **Dispatched by**: GameContext when receiving socket event
- **Payload**: None
- **Listeners**: Canvas component (guessers only)
- **Purpose**: Synchronize canvas clear across clients

### Usage Pattern

```typescript
// Dispatch (GameContext)
window.dispatchEvent(new CustomEvent("drawing-event", { detail: event }));

// Listen (Canvas)
window.addEventListener("drawing-event", handleDrawingEvent);
return () => window.removeEventListener("drawing-event", handleDrawingEvent);
```

---

## Tool System

### Drawing Tools

**Brush Tool:**
- Uses selected color
- Configurable size (1-50px, debounced)
- Creates `Path` objects in Fabric.js
- Smooth freehand drawing
- Keyboard shortcut: `B`

**Eraser Tool:**
- Uses white color (#ffffff)
- Double brush size for better erasing
- Same drawing mechanism as brush
- Appears as white strokes
- Keyboard shortcut: `E`

### Tool State Management

- Active tool stored in component state
- Brush properties updated on tool change
- Visual feedback via button variants
- Tool preference persisted to localStorage
- No toast notifications (visual feedback sufficient)

---

## Color System

### Color Selection

**Preset Colors:**
- 12 predefined colors in grid
- Quick selection with single click
- Visual checkmark for active color
- Accessible color names
- ARIA labels for screen readers

**Recent Colors:**
- Tracks last 6 used colors
- Persists across sessions (localStorage)
- Quick access to frequently used colors
- Always visible section (with empty state)
- Removes duplicates, maintains order

**Custom Colors:**
- HTML5 color picker
- Hex text input with validation
- Supports full color spectrum
- Real-time preview
- Validates hex format (#RRGGBB)

### Color Application

- Brush color updates immediately
- Eraser always uses white
- Color persists until changed
- Active color displayed prominently
- Color preference persisted to localStorage

### Color State Management

- `customColor` synced with `activeColor` prop via useEffect
- Recent colors loaded from localStorage on mount
- Recent colors persisted on changes
- No double `onColorChange` calls (fixed bug)

---

## Canvas Features

### Drawing Features

- **Freehand Drawing**: Smooth path creation
- **Brush Size Control**: 1-50px range (debounced)
- **Color Selection**: 12 presets + custom (persisted)
- **Eraser Tool**: White drawing for erasing
- **Undo**: Remove last drawn path (keyboard shortcut: Ctrl+U/Cmd+U)
- **Clear**: Reset entire canvas
- **Keyboard Shortcuts**: B (brush), E (eraser), Ctrl+U/Cmd+U (undo)

### Synchronization Features

- **Real-time Updates**: Instant drawing sync
- **Role-based Access**: Drawers draw, guessers watch
- **Round Management**: Auto-clear on round start
- **State Persistence**: Maintains drawing during round
- **Preference Persistence**: Saves color, size, tool across sessions

### UI Features

- **Responsive Design**: Adapts to screen size
- **Visual Feedback**: Active tool highlighting
- **Accessibility**: Full ARIA support, keyboard navigation
- **Preference Persistence**: Remembers user settings
- **Performance**: Debounced updates, optimized rendering

---

## Future Enhancements

### Potential Improvements

1. **Drawing History**: Full undo/redo stack
2. **Shape Tools**: Circles, rectangles, lines
3. **Layers**: Multiple drawing layers
4. **Export**: Save drawings as images
5. **Brush Styles**: Different brush types (spray, marker, etc.)
6. **Stickers/Stamps**: Pre-made graphics
7. **Text Tool**: Add text annotations
8. **Drawing Replay**: Animate drawing playback
9. **Offline Support**: Queue events when offline
10. **Performance**: Further optimize for high-frequency drawing
11. **Layout Measurement**: Measure actual toolbar/palette heights for better canvas sizing

---

## Testing

### Test Scenarios

- Canvas initialization and disposal
- Drawing event transmission
- Drawing event reception and rendering
- Canvas clear synchronization
- Role-based access control
- Responsive layout behavior
- Error handling and recovery
- Preference persistence
- Keyboard shortcuts
- Color selection and validation
- State synchronization

### Debug Features

- Console logging for canvas operations
- Event tracking for debugging
- Canvas state validation checks
- Network event monitoring

---

## Notes

- Canvas uses Fabric.js v6.9.0 format for JSON serialization
- Drawing events are path-based (not pixel-based) for efficiency
- Canvas automatically clears at round start
- Guessers see "Watch and guess the word!" overlay
- All canvas operations are validated before execution
- Canvas disposal is critical to prevent memory leaks
- Custom DOM events bridge socket.io and React components
- Preferences persisted to localStorage for better UX
- Brush size changes debounced to prevent performance issues
- Color selection fixed to prevent double calls and stroke deletion
- Full accessibility support added for keyboard and screen reader users

---

## Visual Reference

The canvas UI is displayed in the game room with the following layout:

**Desktop View (Drawer):**
- Large drawing canvas (container-adaptive, 4:3 aspect ratio) in center
- Toolbar above canvas with brush/eraser tools and size control (enabled, only during drawing phase)
- Color palette below canvas with preset colors and custom picker (visible, only during drawing phase)
- Player list on left showing all participants
- Chat on right for guesses and messages
- Game header at top with "You're Drawing!" badge, timer, round info, and current word

**Desktop View (Guesser):**
- Large viewing canvas (container-adaptive, 4:3 aspect ratio) in center
- "Watch and guess the word!" overlay on canvas
- No toolbar (hidden)
- No color palette (hidden)
- Player list on left showing all participants
- Chat on right for guesses and messages
- Game header at top with timer and round info (no badge, no word)

**Mobile View:**
- Responsive canvas sized to container (maintains aspect ratio)
- Stacked toolbar (enabled for drawer during drawing phase, hidden for guesser)
- Color palette only visible for drawer during drawing phase
- Collapsible sidebars for players and chat
- Optimized touch interactions

---

## Changelog

### Latest Update (Toolbar & ColorPalette Improvements)

**Fixed:**
- ✅ Color selection no longer deletes strokes (removed double `onColorChange` calls)
- ✅ ColorPalette state synchronization with parent
- ✅ Toolbar disabled state based on game phase

**Added:**
- ✅ Full accessibility support (ARIA labels, keyboard navigation)
- ✅ Keyboard shortcuts (B, E, Ctrl+U/Cmd+U)
- ✅ Preference persistence (color, brush size, tool)
- ✅ Recent colors persistence
- ✅ Brush size debouncing (100ms)

**Improved:**
- ✅ Color validation
- ✅ UI/UX (removed unnecessary toasts, better state management)
- ✅ Performance (debounced updates)

**Removed:**
- ✅ Toast notifications on tool changes (visual feedback sufficient)

---

## Conclusion

The Paint & Guess canvas system is a comprehensive, real-time collaborative drawing framework that has been refactored for maintainability and enhanced with accessibility, persistence, and performance improvements. The modular architecture makes it easy to understand, test, and extend, while the recent improvements ensure a smooth, accessible user experience.

