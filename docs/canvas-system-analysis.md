# Canvas System Analysis

## Overview

The canvas system in Paint & Guess is a real-time collaborative drawing framework that enables players to draw and share their artwork synchronously during gameplay. The system uses Fabric.js for canvas manipulation, Socket.io for real-time synchronization, and provides a comprehensive set of drawing tools including brushes, erasers, color selection, and canvas management features.

## Architecture

### Core Components

#### 1. Canvas Component (`src/games/paint-and-guess/components/Canvas.tsx`)

**Main Responsibilities:**
- Initializes and manages Fabric.js canvas instance
- Handles drawing mode activation/deactivation based on player role
- Sends drawing events to server (drawer only)
- Receives and renders drawing events from other players (guessers)
- Manages canvas lifecycle (initialization, disposal, resizing)
- Enforces role-based permissions (drawer vs guesser)

**Key Features:**
- **Fabric.js Integration**: Uses `Canvas` (FabricCanvas) and `PencilBrush` for freehand drawing
- **Role-Based Access**: 
  - Drawers: Full drawing capabilities, interactive canvas
  - Guessers: Read-only view, non-interactive canvas
- **Responsive Design**: Adapts canvas size based on viewport (800x600 desktop, responsive mobile)
- **Event Handling**: Listens for `path:created` events to capture drawings
- **State Management**: Tracks canvas validity, disposal state, and readiness

**Key Functions:**
- `isCanvasValid()`: Validates canvas instance before operations
- Drawing event handlers for sending/receiving paths
- Canvas clear handlers for synchronization
- Undo functionality (removes last object)
- Clear functionality (clears entire canvas)

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

**Note:** Canvas size is now dynamically calculated based on container dimensions, maintaining a 4:3 aspect ratio while fitting within available space. This ensures the canvas adapts to any screen size without going out of frame.

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
- **Disabled State**: Automatically disabled for guessers
- **Responsive Design**: Adapts layout for mobile/desktop

**UI Elements:**
- Brush button with paintbrush icon
- Eraser button with eraser icon
- Size slider with numeric display
- Undo button with curved arrow icon
- Clear button with trash icon (destructive variant)

#### 3. Color Palette Component (`src/games/paint-and-guess/components/ColorPalette.tsx`)

**Main Responsibilities:**
- Provides preset color selection (12 colors)
- Tracks and displays recent colors
- Offers custom color picker (hex input)
- Shows active color preview

**Features:**
- **Preset Colors**: 12 predefined colors (black, white, red, orange, yellow, green, cyan, blue, purple, pink, violet, amber)
- **Recent Colors**: Tracks last 6 used colors
- **Custom Color Picker**: HTML5 color input + hex text input
- **Active Color Display**: Visual preview with hex code
- **Color Validation**: Validates hex color format (#RRGGBB)

**Color Management:**
- Automatically adds selected colors to recent list
- Validates hex input format
- Updates brush color in real-time

#### 4. Integration Components

**GameHeader** (`src/games/paint-and-guess/components/GameHeader.tsx`)
- Displays room information and game state
- Shows "You're Drawing!" badge for active drawer
- Displays timer and round information
- Shows current word (drawer only)

**Room Page** (`src/games/paint-and-guess/pages/Room.tsx`)
- Layout coordinator for canvas, players, and chat
- Grid layout: Players (left) | Canvas (center) | Chat (right)
- Manages game state and player interactions

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
   - Reloads canvas with `loadFromJSON()`
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

**Round Transitions:**
- Canvas automatically cleared when new round starts
- Drawing mode updated based on new drawer
- All objects reset to clean state

**Role Changes:**
- When player becomes drawer: Canvas becomes interactive
- When player becomes guesser: Canvas becomes read-only
- All objects marked as non-interactive for guessers

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
│ - Diana  │  │    (800x600 desktop)   │  │                  │
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
│   ├── Toolbar
│   │   ├── Brush Button
│   │   ├── Eraser Button
│   │   ├── Size Slider
│   │   ├── Undo Button
│   │   └── Clear Button
│   │
│   ├── Fabric.js Canvas Element
│   │   └── Drawing Surface
│   │
│   └── ColorPalette (drawer only)
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

## Drawer vs Guesser Perspectives

The canvas system provides fundamentally different experiences for drawers and guessers. Understanding these differences is crucial for both users and developers.

### Drawer Perspective

#### Visual Interface

**GameHeader:**
- ✅ **"You're Drawing!" badge** - Purple badge indicating active role
- ✅ **Current Word Display** - Shows the word to draw (e.g., "Word: FOREST")
- ✅ Timer and round information

**Canvas Area:**
- ✅ **Interactive Canvas** - Full drawing capabilities
- ✅ **Toolbar** - Fully enabled with all tools:
  - Brush button (active)
  - Eraser button (active)
  - Size slider (1-50px, functional)
  - Undo button (removes last path)
  - Clear button (clears entire canvas)
- ✅ **Color Palette** - Visible and fully functional:
  - 12 preset colors (clickable)
  - Recent colors section
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
- ✅ Change brush size (1-50px)
- ✅ Change brush color (12 presets + custom)
- ✅ Undo last drawing action
- ✅ Clear entire canvas

**Event Transmission:**
- ✅ Sends `drawing-event` to server on each path creation
- ✅ Sends `clear-canvas` event when clearing
- ✅ Events broadcast to all guessers in room
- ❌ Does NOT receive own drawing events (echo prevention)

**Technical Details:**
```typescript
// Drawer Canvas Configuration
{
  isDrawingMode: true,
  skipTargetFind: false,
  selection: true,
  freeDrawingBrush: {
    color: activeColor,
    width: brushSize
  }
}
```

### Guesser Perspective

#### Visual Interface

**GameHeader:**
- ❌ **No "You're Drawing!" badge** - No special indicator
- ❌ **No Current Word Display** - Word is hidden (must guess)
- ✅ Timer and round information (same as drawer)

**Canvas Area:**
- ✅ **Read-Only Canvas** - View-only, no interaction
- ✅ **Toolbar** - Visible but **disabled**:
  - All buttons grayed out
  - Slider non-functional
  - Visual feedback shows disabled state
- ❌ **Color Palette** - **Hidden** (not rendered)
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

**Technical Details:**
```typescript
// Guesser Canvas Configuration
{
  isDrawingMode: false,
  skipTargetFind: true,
  selection: false,
  defaultCursor: 'default',
  hoverCursor: 'default',
  moveCursor: 'default',
  // All objects:
  // selectable: false,
  // evented: false
}
```

### Side-by-Side Comparison

| Feature | Drawer | Guesser |
|---------|--------|---------|
| **Canvas Interaction** | ✅ Full drawing | ❌ View only |
| **Toolbar** | ✅ Enabled | ⚠️ Visible but disabled |
| **Color Palette** | ✅ Visible & functional | ❌ Hidden |
| **Current Word** | ✅ Shown in header | ❌ Hidden |
| **Drawing Badge** | ✅ "You're Drawing!" | ❌ None |
| **Canvas Overlay** | ❌ None | ✅ "Watch and guess!" |
| **Send Events** | ✅ Yes | ❌ No |
| **Receive Events** | ❌ No (echo prevention) | ✅ Yes |
| **Undo/Clear** | ✅ Available | ❌ Disabled |
| **Brush Controls** | ✅ Functional | ❌ Disabled |
| **Cursor Type** | Drawing cursor | Default cursor |

### Event Flow Differences

#### Drawer Event Flow

```
User Draws
  ↓
Fabric.js path:created event
  ↓
Canvas captures path.toJSON()
  ↓
sendDrawingEvent() → GameContext
  ↓
Socket.io emit("drawing-event")
  ↓
Server validates & broadcasts
  ↓
[Drawer does NOT receive own event]
  ↓
Guessers receive & render
```

#### Guesser Event Flow

```
Server broadcasts drawing-event
  ↓
GameContext receives via socket
  ↓
Dispatches custom DOM event
  ↓
Canvas listens for "drawing-event"
  ↓
Extracts path data
  ↓
Adds to canvas via loadFromJSON()
  ↓
Renders with requestRenderAll()
```

### UI Layout Differences

#### Drawer Layout
```
┌─────────────────────────────────────┐
│ GameHeader: "You're Drawing!"       │
│ Word: FOREST                         │
├─────────────────────────────────────┤
│ Toolbar: [Brush][Eraser][Size][Undo][Clear] │
│ ┌─────────────────────────────────┐  │
│ │                                 │  │
│ │     Interactive Canvas          │  │
│ │     (Can Draw Here)             │  │
│ │                                 │  │
│ └─────────────────────────────────┘  │
│ Color Palette: [●][●][●][●]...      │
│ Custom: [■] #000000                 │
└─────────────────────────────────────┘
```

#### Guesser Layout
```
┌─────────────────────────────────────┐
│ GameHeader: (No badge, no word)      │
├─────────────────────────────────────┤
│ Toolbar: [Brush][Eraser][Size][Undo][Clear] │
│        (All Disabled/Grayed Out)    │
│ ┌─────────────────────────────────┐  │
│ │ "Watch and guess the word!"     │  │
│ │                                 │  │
│ │     Read-Only Canvas            │  │
│ │     (View Only)                  │  │
│ │                                 │  │
│ └─────────────────────────────────┘  │
│ (No Color Palette)                   │
└─────────────────────────────────────┘
```

### Code-Level Differences

#### Canvas Initialization

**Drawer:**
```typescript
canvas.isDrawingMode = true;
canvas.skipTargetFind = false;
canvas.selection = true;
// Toolbar and ColorPalette rendered
```

**Guesser:**
```typescript
canvas.isDrawingMode = false;
canvas.skipTargetFind = true;
canvas.selection = false;
canvas.defaultCursor = 'default';
// Only Toolbar rendered (disabled)
// ColorPalette NOT rendered
```

#### Event Handlers

**Drawer:**
```typescript
// Sends events
fabricCanvas.on("path:created", (e) => {
  sendDrawingEvent({ type: "path", data: e.path.toJSON() });
});

// Does NOT listen for incoming events
```

**Guesser:**
```typescript
// Does NOT send events

// Listens for incoming events
window.addEventListener("drawing-event", (e) => {
  const pathData = e.detail.data;
  fabricCanvas.loadFromJSON({ objects: [...existing, pathData] });
});
```

### Role Transition

When a player's role changes during the game:

**Becoming Drawer:**
1. `isDrawer` state changes to `true`
2. Canvas `isDrawingMode` enabled
3. Toolbar becomes enabled
4. Color Palette appears
5. "You're Drawing!" badge shows
6. Current word displayed
7. Canvas overlay removed
8. Event listeners switch to sending mode

**Becoming Guesser:**
1. `isDrawer` state changes to `false`
2. Canvas `isDrawingMode` disabled
3. Toolbar becomes disabled
4. Color Palette hidden
5. Badge removed
6. Current word hidden
7. "Watch and guess!" overlay appears
8. Event listeners switch to receiving mode
9. All canvas objects marked non-interactive

### Security & Validation

**Server-Side Protection:**
- Server validates sender is current drawer before accepting events
- Non-drawers cannot send drawing events (rejected at server)
- Prevents unauthorized drawing attempts

**Client-Side Protection:**
- UI elements disabled for guessers
- Canvas interactions disabled via Fabric.js settings
- Event handlers conditionally registered based on role
- Echo prevention ensures drawer doesn't process own events

## Integration Points

### GameContext Integration

**Functions Provided:**
- `sendDrawingEvent(event)`: Sends drawing path to server
- `clearCanvas()`: Sends clear request to server
- `gameState`: Provides role, game status, round info

**State Dependencies:**
- `gameState.isDrawer`: Controls drawing mode
- `gameState.isGameActive`: Enables/disables canvas
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
- Canvas occupies center 2 columns (lg:col-span-2)
- Responsive grid: 1 column mobile, 4 columns desktop
- Player list and chat flank canvas

**State Coordination:**
- Room page manages overall layout
- Canvas component handles drawing logic
- GameHeader displays game state

## Rendering & Performance

### Fabric.js Rendering

**Rendering Methods:**
- `renderAll()`: Standard render
- `requestRenderAll()`: Optimized render (preferred)
- `renderOnAddRemove`: Auto-render on object changes

**Performance Optimizations:**
- Object caching disabled for guessers (ensures visibility)
- Batch updates via `loadFromJSON()` for multiple objects
- `requestAnimationFrame` for smooth animations
- Canvas disposal on unmount to prevent memory leaks

### Canvas Lifecycle

**Initialization:**
1. Create FabricCanvas instance
2. Configure drawing brush (PencilBrush)
3. Set initial drawing mode
4. Set up event listeners
5. Mark canvas as ready

**Active State:**
- Drawing events captured and sent
- Receiving events processed and rendered
- Tool changes update brush properties
- Canvas resizes on window resize

**Disposal:**
1. Remove event listeners
2. Mark canvas as disposed
3. Clear canvas state
4. Call `canvas.dispose()`
5. Clean up refs

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

## Dependencies

### External Libraries

- **fabric**: Canvas manipulation library
  - `Canvas`: Main canvas class
  - `PencilBrush`: Freehand drawing brush
  - `FabricObject`: Base class for canvas objects
- **socket.io-client**: Real-time communication
- **sonner**: Toast notifications
- **lucide-react**: Icons (Paintbrush, Eraser, Undo, Trash2, etc.)

### Internal Dependencies

- `@/components/ui/*`: UI components (Button, Slider, Input, Badge)
- `@/games/paint-and-guess`: Game context and hooks
- `@/lib/utils`: Utility functions

## File Structure

```
src/games/paint-and-guess/
├── components/
│   ├── Canvas.tsx              # Main canvas component
│   ├── Toolbar.tsx              # Drawing tools toolbar
│   ├── ColorPalette.tsx         # Color selection component
│   ├── GameHeader.tsx           # Game state header
│   └── ...
│
├── pages/
│   └── Room.tsx                 # Room layout coordinator
│
└── state/
    └── GameContext.tsx          # Game state & socket management

backend/src/
└── server.js                    # Socket.io event handlers
    ├── drawing-event handler    # Line 724-734
    └── clear-canvas handler     # Line 736-742
```

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

## Tool System

### Drawing Tools

**Brush Tool:**
- Uses selected color
- Configurable size (1-50px)
- Creates `Path` objects in Fabric.js
- Smooth freehand drawing

**Eraser Tool:**
- Uses white color (#ffffff)
- Double brush size for better erasing
- Same drawing mechanism as brush
- Appears as white strokes

### Tool State Management

- Active tool stored in component state
- Brush properties updated on tool change
- Visual feedback via button variants
- Toast notifications on tool change

## Color System

### Color Selection

**Preset Colors:**
- 12 predefined colors in grid
- Quick selection with single click
- Visual checkmark for active color
- Accessible color names

**Recent Colors:**
- Tracks last 6 used colors
- Persists during session
- Quick access to frequently used colors

**Custom Colors:**
- HTML5 color picker
- Hex text input with validation
- Supports full color spectrum
- Real-time preview

### Color Application

- Brush color updates immediately
- Eraser always uses white
- Color persists until changed
- Active color displayed prominently

## Canvas Features

### Drawing Features

- **Freehand Drawing**: Smooth path creation
- **Brush Size Control**: 1-50px range
- **Color Selection**: 12 presets + custom
- **Eraser Tool**: White drawing for erasing
- **Undo**: Remove last drawn path
- **Clear**: Reset entire canvas

### Synchronization Features

- **Real-time Updates**: Instant drawing sync
- **Role-based Access**: Drawers draw, guessers watch
- **Round Management**: Auto-clear on round start
- **State Persistence**: Maintains drawing during round

### UI Features

- **Responsive Design**: Adapts to screen size
- **Visual Feedback**: Active tool highlighting
- **Toast Notifications**: User action confirmations
- **Accessibility**: Keyboard navigation support

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
10. **Performance**: Optimize for high-frequency drawing

## Testing

### Test Scenarios

- Canvas initialization and disposal
- Drawing event transmission
- Drawing event reception and rendering
- Canvas clear synchronization
- Role-based access control
- Responsive layout behavior
- Error handling and recovery

### Debug Features

- Console logging for canvas operations
- Event tracking for debugging
- Canvas state validation checks
- Network event monitoring

## Notes

- Canvas uses Fabric.js v6.9.0 format for JSON serialization
- Drawing events are path-based (not pixel-based) for efficiency
- Canvas automatically clears at round start
- Guessers see "Watch and guess the word!" overlay
- All canvas operations are validated before execution
- Canvas disposal is critical to prevent memory leaks
- Custom DOM events bridge socket.io and React components

## Visual Reference

The canvas UI is displayed in the game room with the following layout:

**Desktop View (Drawer):**
- Large drawing canvas (container-adaptive, 4:3 aspect ratio) in center
- Toolbar above canvas with brush/eraser tools and size control (enabled)
- Color palette below canvas with preset colors and custom picker (visible)
- Player list on left showing all participants
- Chat on right for guesses and messages
- Game header at top with "You're Drawing!" badge, timer, round info, and current word

**Desktop View (Guesser):**
- Large viewing canvas (container-adaptive, 4:3 aspect ratio) in center
- Toolbar above canvas (visible but all controls disabled/grayed out)
- "Watch and guess the word!" overlay on canvas
- No color palette (hidden)
- Player list on left showing all participants
- Chat on right for guesses and messages
- Game header at top with timer and round info (no badge, no word)

**Mobile View:**
- Responsive canvas sized to container (maintains aspect ratio)
- Stacked toolbar (enabled for drawer, disabled for guesser)
- Color palette only visible for drawer
- Collapsible sidebars for players and chat
- Optimized touch interactions

For a visual example, see: `test-screenshots-four-players/04-round-1-Diana-drawing.png`

