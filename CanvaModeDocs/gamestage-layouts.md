# Canva Mode GameStage Visual Layouts

This document presents the current GameStage layout and alternative layout options for the active game view in canva mode.

---

## Current Layout: Three-Column Grid (Sidebar-Canvas-Chat)

### Layout Description

**Description**: Three-column layout with left sidebar for game info/players, center canvas area, and right sidebar for chat/guessing.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────────┐  ┌──────────────────────────────────┐  ┌────────┐│
│  │ Round Info   │  │                                  │  │ Chat/  ││
│  │              │  │                                  │  │ Guess  ││
│  │ Round 2      │  │                                  │  │        ││
│  │ 0:45         │  │                                  │  │ [Type  ││
│  │              │  │                                  │  │ guess] ││
│  │ Word: [word] │  │         CANVAS AREA              │  │ [Send] ││
│  │              │  │         (800x600px)              │  │        ││
│  ├──────────────┤  │                                  │  │        ││
│  │ Players      │  │                                  │  │        ││
│  │              │  │                                  │  │        ││
│  │ 👤 Player1   │  │                                  │  │        ││
│  │    15 pts    │  │                                  │  │        ││
│  │              │  │                                  │  │        ││
│  │ 👤 Player2 🎨│  │                                  │  │        ││
│  │    10 pts    │  │                                  │  │        ││
│  │              │  │                                  │  │        ││
│  │ 👤 Player3   │  │                                  │  │        ││
│  │     5 pts    │  │                                  │  │        ││
│  │              │  │                                  │  │        ││
│  │ [Leave]      │  │                                  │  │        ││
│  └──────────────┘  └──────────────────────────────────┘  └────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: 2/12 left sidebar, 8/12 center canvas, 2/12 right sidebar
- **Tablet**: Sidebars may stack or adjust
- **Mobile**: All columns stack vertically
- **Pros**: 
  - Clear separation of game info, canvas, and communication
  - Efficient use of horizontal space
  - Canvas gets maximum focus
- **Cons**: 
  - Sidebars can feel narrow on smaller screens
  - Canvas might be too small on mobile

**CSS Grid**:
```css
.game-container {
  display: grid;
  grid-template-columns: 2fr 8fr 2fr; /* Desktop: 2/12, 8/12, 2/12 */
  gap: 1rem;
  height: calc(100vh - 5rem);
}

@media (max-width: 1024px) {
  .game-container {
    grid-template-columns: 1fr; /* Mobile: stack all */
  }
}
```

---

## Component Breakdown

### Left Sidebar (2/12 columns)

**Components**:
1. **Round Info Card**:
   - Round number display
   - Timer (MM:SS format)
   - Word display (drawer sees word, guessers see "Guess the word!" or revealed word)
   - Status messages

2. **Players List Card**:
   - Scrollable list of players
   - Sorted by score (descending)
   - Player avatars
   - Player names with indicators:
     - "(You)" for current player
     - "🎨" for current drawer
   - Score display
   - Leave Room button

**Visibility**: Hidden on mobile (`hidden md:flex`)

---

### Center Canvas Area (8/12 columns)

**Components**:
1. **Drawing Controls** (above canvas):
   - Color picker
   - Brush size slider (1-20)
   - Size display
   - Permission message (if not drawer)

2. **Canvas Container**:
   - Fixed dimensions: 800x600px
   - White background
   - Border styling
   - Overlay for blocking non-drawer interactions
   - Cursor changes based on drawing permission

**Canvas Features**:
- Real-time collaborative drawing
- Fabric.js rendering
- Drawing permission enforcement
- Overlay blocking for guessers

---

### Right Sidebar (2/12 columns)

**Components**:
1. **Chat/Guess Card**:
   - Dynamic title ("Chat" or "Make a Guess")
   - Message history area (scrollable)
   - Input field (unified for chat/guess)
   - Submit button ("Send" or "Guess")

**Input Behavior**:
- **Guessing Mode**: When `!isDrawer && isGameActive && isRoundActive && !currentWord`
  - Placeholder: "Type your guess..."
  - Button: "Guess"
  - Submits as guess
  
- **Chat Mode**: Otherwise
  - Placeholder: "Type a message..."
  - Button: "Send"
  - Submits as chat message

**Visibility**: Always visible, but may stack on mobile

---

## Gartic.io-Inspired Layout (Recommended)

### Layout 1: Gartic.io Style - Guesser View

**Description**: Clean, modern layout with canvas as main focus, answers and chat panels at bottom, player list on left.

```
┌─────────────────────────────────────────────────────────────────────┐
│  GARTIC.IO                    [WAIT]              [⚙️] [×] [□]     │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│  PLAYERS     │                                                      │
│              │                                                      │
│  👤 Player1  │                                                      │
│     99 pts   │                                                      │
│              │                                                      │
│  👤 Player2  │                                                      │
│     99 pts   │                                                      │
│              │                                                      │
│  👤 Player3  │                                                      │
│     91 pts   │                                                      │
│              │                                                      │
│  👤 Player4 🎨│                                                      │
│     57 pts   │                                                      │
│              │                                                      │
│  👤 Player5  │                                                      │
│     54 pts   │                                                      │
│              │                                                      │
│  👤 Player6  │                                                      │
│      2 pts   │                                                      │
│              │                                                      │
├──────────────┴──────────────────────────────────────────────────────┤
│                                                                      │
│                         CANVAS AREA                                  │
│                         (Full Width)                                │
│                         [Drawing visible]                           │
│                         [Word hint: faint gray]                     │
│                                                                      │
│                                                                      │
│  [Progress Bar: ████████████░░░░░░░░]                              │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐  ┌─────────────────────────────┐ │
│  │ ANSWERS                       │  │ CHAT                        │ │
│  │                               │  │                             │ │
│  │ ✓ google                      │  │ Player1: Nice drawing!      │ │
│  │ ✓ google                      │  │ Player2: I see it!          │ │
│  │ ✓ google                      │  │ Player3: Good job!          │ │
│  │                               │  │                             │ │
│  │ [Type your guess here...]     │  │ [Type your message here...] │ │
│  │ [Guess]                       │  │ [Send]                      │ │
│  └──────────────────────────────┘  └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: Left sidebar (players), full-width canvas, bottom panels (answers/chat)
- **Mobile**: All stack vertically
- **Pros**: 
  - Maximum canvas visibility
  - Clear separation of answers and chat
  - Word hint visible (faint) for guessers
  - Progress bar shows round progress
  - Clean, modern aesthetic
- **Cons**: 
  - Bottom panels take vertical space
  - Less horizontal space for sidebars

**Key Features**:
- **Top Bar**: Word status ("WAIT", "DRAWING", etc.), settings icons
- **Canvas**: Full-width, word hint shown faintly in background
- **Progress Bar**: Visual indicator of round progress
- **Answers Panel**: List of previous guesses with checkmarks, guess input
- **Chat Panel**: Chat messages and input
- **Player List**: Left sidebar with scores, drawer indicator

**CSS Grid**:
```css
.game-container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--header-bg);
}

.main-area {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.canvas-section {
  display: flex;
  flex-direction: column;
}

.bottom-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: var(--panel-bg);
}
```

---

### Layout 2: Gartic.io Style - Drawer View

**Description**: Similar layout but optimized for drawer with visible word and drawing tools.

```
┌─────────────────────────────────────────────────────────────────────┐
│  GARTIC.IO                    [DRAWING]            [⚙️] [×] [□]     │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│  PLAYERS     │                                                      │
│              │                                                      │
│  👤 Player1  │                                                      │
│     99 pts   │                                                      │
│              │                                                      │
│  👤 Player2  │                                                      │
│     99 pts   │                                                      │
│              │                                                      │
│  👤 Player3  │                                                      │
│     91 pts   │                                                      │
│              │                                                      │
│  👤 You 🎨   │                                                      │
│     57 pts   │                                                      │
│              │                                                      │
│  👤 Player5  │                                                      │
│     54 pts   │                                                      │
│              │                                                      │
│  👤 Player6  │                                                      │
│      2 pts   │                                                      │
│              │                                                      │
├──────────────┴──────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Your word: GOOGLE                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [Color: █] [Size: ▬━━━━━━━━━━━━━━━━━━ 5]                          │
│                                                                      │
│                         CANVAS AREA                                  │
│                         (Full Width)                                │
│                         [Drawing tools active]                      │
│                                                                      │
│                                                                      │
│  [Progress Bar: ████████████░░░░░░░░]                              │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐  ┌─────────────────────────────┐ │
│  │ ANSWERS                       │  │ CHAT                        │ │
│  │                               │  │                             │ │
│  │ ✓ google (Player1)           │  │ Player1: Nice drawing!      │ │
│  │ ✓ google (Player2)           │  │ Player2: I see it!          │ │
│  │ ✓ google (Player3)           │  │ Player3: Good job!           │ │
│  │                               │  │                             │ │
│  │ [Input disabled - you're      │  │ [Type your message here...] │ │
│  │  drawing]                     │  │ [Send]                      │ │
│  └──────────────────────────────┘  └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: Same structure as guesser view
- **Differences from Guesser**:
  - Word clearly visible (not faint) in top box
  - Drawing controls visible above canvas
  - Guess input disabled (drawer can't guess)
  - Chat still available
  - Progress bar shows time remaining

**Key Features**:
- **Word Display**: Prominent box showing word to draw
- **Drawing Tools**: Color picker and brush size above canvas
- **Canvas**: Full drawing capabilities enabled
- **Answers Panel**: Shows correct guesses as they come in
- **Chat Panel**: Drawer can chat while drawing
- **Progress Bar**: Visual timer for round

**CSS Grid** (same as guesser):
```css
.game-container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
}

.drawer-word-box {
  background: var(--primary);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
  text-align: center;
}

.drawing-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
}
```

---

## Alternative Layout Options

### Layout 3: Full-Width Canvas with Overlay Panels

**Description**: Canvas takes full width, with collapsible overlay panels for info and chat.

```
┌─────────────────────────────────────────────────────────────────────┐
│  [≡] Round 2 | 0:45 | Word: [word]              [×] Chat [≡]      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                                                                      │
│                                                                      │
│                         CANVAS AREA                                  │
│                         (Full Width)                                │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  Players: 👤 Player1 (15) 👤 Player2 🎨 (10) 👤 Player3 (5)        │
│  [Color] [Size] [Leave]                    [Type guess...] [Send]   │
└─────────────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: Full-width canvas, overlay panels
- **Mobile**: Panels become bottom/top bars
- **Pros**: Maximum canvas space, modern overlay approach
- **Cons**: Panels may obscure canvas, requires toggle interactions

---

### Layout 2: Bottom Panel with Side Info

**Description**: Canvas centered, info panel at bottom, side panels for players/chat.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────────────────────────┐  ┌────────┐│
│  │ Players      │  │                                  │  │ Chat/  ││
│  │              │  │                                  │  │ Guess  ││
│  │ 👤 Player1   │  │                                  │  │        ││
│  │    15 pts    │  │                                  │  │ [Type  ││
│  │              │  │         CANVAS AREA              │  │ guess] ││
│  │ 👤 Player2 🎨│  │         (Centered)                 │  │ [Send] ││
│  │    10 pts    │  │                                  │  │        ││
│  │              │  │                                  │  │        ││
│  │ 👤 Player3   │  │                                  │  │        ││
│  │     5 pts    │  │                                  │  │        ││
│  └──────────────┘  └──────────────────────────────────┘  └────────┘│
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Round 2 | 0:45 | Word: [word] | [Color] [Size] [Leave]       │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: Side panels, centered canvas, bottom info bar
- **Mobile**: All stack, bottom bar becomes collapsible
- **Pros**: Canvas centered, info always visible
- **Cons**: Bottom bar takes vertical space

---

### Layout 3: Dashboard Style with Floating Panels

**Description**: Canvas full-width, floating draggable panels for info and chat.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────┐                                                        │
│  │ Round 2  │                                                        │
│  │ 0:45     │                                                        │
│  │ [word]   │                                                        │
│  └──────────┘                                                        │
│                                                                      │
│                         CANVAS AREA                                  │
│                         (Full Width)                                │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                      ┌──────────────┐│
│                                                      │ Chat/Guess   ││
│                                                      │              ││
│                                                      │ [Type...]    ││
│                                                      │ [Send]       ││
│                                                      └──────────────┘│
│                                                                      │
│  ┌──────────┐                                                        │
│  │ Players  │                                                        │
│  │ 👤 P1 15 │                                                        │
│  │ 👤 P2 10 │                                                        │
│  └──────────┘                                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: Floating, draggable panels
- **Mobile**: Panels become fixed bottom/top
- **Pros**: Maximum canvas space, customizable panel positions
- **Cons**: Complex implementation, may be confusing for users

---

## Current Implementation Details

### Grid Structure

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4">
  {/* Left Sidebar - 2 columns */}
  <div className="lg:col-span-2 hidden md:flex">
    {/* Round Info + Players */}
  </div>
  
  {/* Canvas - 8 columns */}
  <div className="col-span-1 lg:col-span-8">
    <CanvaCanvas />
  </div>
  
  {/* Right Sidebar - 2 columns */}
  <div className="col-span-1 lg:col-span-2">
    {/* Chat/Guess */}
  </div>
</div>
```

### Canvas Component Structure

```tsx
<div className="space-y-4">
  {/* Drawing Controls */}
  <div className="flex gap-4 items-center">
    <ColorPicker />
    <BrushSizeSlider />
    <PermissionMessage />
  </div>
  
  {/* Canvas Container */}
  <div className="border-2 rounded-lg relative">
    <canvas ref={canvasRef} />
    <OverlayBlocking />
  </div>
</div>
```

### Responsive Behavior

**Desktop (≥1024px)**:
- Three columns: 2/12, 8/12, 2/12
- All panels visible
- Canvas at 800x600px

**Tablet (768px - 1023px)**:
- Left sidebar hidden
- Canvas and chat stack or adjust
- Canvas may scale down

**Mobile (<768px)**:
- All columns stack vertically
- Canvas maintains 800x600px (may scroll)
- Controls above canvas
- Chat below canvas

---

## State-Dependent UI Changes

### Drawer View
- **Word Display**: Shows current word to draw
- **Drawing Controls**: Enabled and visible
- **Canvas**: Drawing enabled, crosshair cursor
- **Chat Input**: Disabled during active round
- **Permission Message**: "Wait for round to start" (if round not active)

### Guesser View
- **Word Display**: "Guess the word!" (during round) or revealed word (after)
- **Drawing Controls**: Disabled, greyed out
- **Canvas**: View-only, overlay blocks interactions
- **Chat Input**: Becomes guess input during active round
- **Permission Message**: "Only the drawer can draw"

### Round States

**Round Active (Drawer)**:
- Word visible to drawer
- Drawing enabled
- Timer counting down

**Round Active (Guesser)**:
- Word hidden
- Guessing enabled
- Timer visible

**Round Ended**:
- Word revealed to all
- Drawing disabled
- Chat enabled
- Waiting for next round

**Game Not Active**:
- Free draw mode
- All can draw
- No word/round info

---

## Canvas Drawing Controls

### Color Picker
- **Type**: HTML5 color input
- **Size**: 12x8 (w-12 h-8)
- **State**: Disabled when `!canDraw`
- **Default**: Black (#000000)

### Brush Size Slider
- **Type**: Range input
- **Range**: 1-20
- **Display**: Shows current value
- **State**: Disabled when `!canDraw`
- **Default**: 5

### Permission Messages
- **Drawer (round not active)**: "Wait for round to start"
- **Guesser**: "Only the drawer can draw"
- **Free draw**: No message

---

## Chat/Guess Input System

### Unified Input Field
- **Single Input**: Handles both chat and guesses
- **Dynamic Placeholder**: Changes based on mode
- **Dynamic Button**: "Send" or "Guess"
- **Validation**: Disabled when empty

### Mode Detection
```typescript
const isGuessingMode = 
  !isDrawer && 
  gameState.isGameActive && 
  gameState.isRoundActive && 
  !gameState.currentWord;
```

### Submission Logic
```typescript
if (isGuessingMode) {
  makeGuess(message); // Submit as guess
} else {
  sendChatMessage(message); // Submit as chat
}
```

---

## Player List Features

### Sorting
- **Order**: By score (descending)
- **Display**: Avatar, name, score
- **Indicators**:
  - "(You)" for current player
  - "🎨" for current drawer

### Score Display
- **Format**: Number (defaults to 0)
- **Position**: Right-aligned
- **Style**: Small, semibold

### Scrollable
- **Container**: `overflow-y-auto`
- **Height**: Flexible, fills available space
- **Spacing**: Consistent gap between items

---

## Round Info Display

### Timer
- **Format**: MM:SS (e.g., "1:23")
- **Size**: Large, bold, centered
- **Updates**: Real-time via `canva:round-timer` events

### Word Display
- **Drawer**: Shows word in highlighted box
- **Guesser (active)**: "Guess the word!" message
- **Guesser (ended)**: Revealed word
- **Styling**: Muted background, bold text

### Round Number
- **Format**: "Round {number}"
- **Position**: Card header
- **Updates**: On `canva:round-started`

---

## Responsive Breakpoints

### Desktop (≥1024px)
- **Layout**: Three columns (2-8-2)
- **Sidebars**: Always visible
- **Canvas**: Full 800x600px
- **Spacing**: Generous gaps

### Tablet (768px - 1023px)
- **Layout**: Two columns or stacked
- **Left Sidebar**: Hidden (`hidden md:flex`)
- **Canvas**: May scale or scroll
- **Chat**: Remains visible

### Mobile (<768px)
- **Layout**: Single column, stacked
- **All Panels**: Stack vertically
- **Canvas**: Maintains size, may scroll
- **Controls**: Above canvas
- **Chat**: Below canvas

---

## Accessibility Considerations

### Keyboard Navigation
- **Tab Order**: Logical flow through controls
- **Focus States**: Visible focus indicators
- **Canvas**: Not keyboard accessible (drawing only)
- **Input Fields**: Full keyboard support

### Screen Readers
- **Canvas**: Descriptive labels for drawing area
- **Player List**: Proper list semantics
- **Timer**: Live region for updates
- **Word Display**: Announced when revealed

### Touch Support
- **Canvas**: Touch events for drawing
- **Controls**: Adequate touch targets (≥44px)
- **Buttons**: Full touch support

---

## Performance Optimizations

### Canvas Rendering
- **Fabric.js**: Efficient path rendering
- **Batching**: Drawing events batched for performance
- **Updates**: Only on state changes

### List Rendering
- **Virtualization**: Not currently implemented (could be added for large player lists)
- **Sorting**: Efficient array sort
- **Updates**: Only when player state changes

### Chat Rendering
- **Message History**: Scrollable container
- **Updates**: Real-time via Socket.IO
- **Input**: Debounced validation

---

## Future Enhancement Ideas

### Layout Improvements
1. **Collapsible Sidebars**: Toggle visibility for more canvas space
2. **Floating Panels**: Draggable, resizable panels
3. **Full-Screen Canvas**: Toggle to maximize canvas
4. **Picture-in-Picture**: Mini canvas while viewing other content

### Feature Additions
1. **Chat History**: Persistent message history
2. **Guess History**: Show previous guesses
3. **Player Actions**: Kick, mute, promote
4. **Spectator Mode**: Watch without playing
5. **Canvas Zoom**: Zoom in/out for detailed drawing
6. **Undo/Redo**: Drawing history management
7. **Canvas Export**: Save drawings as images

### Mobile Optimizations
1. **Touch Gestures**: Pinch to zoom, pan canvas
2. **Bottom Sheet**: Chat/controls in bottom sheet
3. **Swipe Navigation**: Swipe between panels
4. **Adaptive Layout**: Auto-adjust based on screen size

---

## Code Examples

### Current Layout Implementation
```tsx
<div className="container mx-auto p-1 sm:p-2 md:p-4 h-[calc(100vh-5rem)]">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4">
    {/* Left Sidebar */}
    <div className="lg:col-span-2 hidden md:flex flex-col gap-2">
      <Card>Round Info</Card>
      <Card className="flex-1">Players</Card>
      <Button>Leave</Button>
    </div>
    
    {/* Canvas */}
    <div className="col-span-1 lg:col-span-8">
      <CanvaCanvas />
    </div>
    
    {/* Right Sidebar */}
    <div className="col-span-1 lg:col-span-2">
      <Card className="flex-1">
        <CardHeader>Chat/Guess</CardHeader>
        <CardContent>
          <MessageArea />
          <InputForm />
        </CardContent>
      </Card>
    </div>
  </div>
</div>
```

### Alternative: Full-Width Canvas
```tsx
<div className="flex flex-col h-screen">
  <HeaderBar />
  <div className="flex-1 relative">
    <Canvas fullWidth />
    <FloatingPanels />
  </div>
  <BottomBar />
</div>
```

---

## Implementation Guide

### Gartic.io-Style Layout Implementation

#### Guesser View Structure
```tsx
<div className="flex flex-col h-screen bg-background">
  {/* Top Bar */}
  <header className="flex items-center justify-between px-4 py-2 bg-card border-b">
    <h1 className="text-xl font-bold">CANVA</h1>
    <div className="flex items-center gap-2">
      <span className="px-3 py-1 bg-primary text-primary-foreground rounded">
        {gameState.isRoundActive ? "DRAWING" : "WAIT"}
      </span>
      <Button variant="ghost" size="sm">⚙️</Button>
      <Button variant="ghost" size="sm">×</Button>
    </div>
  </header>

  {/* Main Area */}
  <div className="flex-1 flex overflow-hidden">
    {/* Left Sidebar - Players */}
    <aside className="w-48 bg-muted/50 p-4 overflow-y-auto">
      <h2 className="font-semibold mb-2">PLAYERS</h2>
      <div className="space-y-2">
        {gameState.players
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))}
      </div>
    </aside>

    {/* Canvas Section */}
    <div className="flex-1 flex flex-col p-4">
      {/* Word Hint (faint, for guessers) */}
      {!isDrawer && gameState.isRoundActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-6xl font-bold text-muted/20 select-none">
            {gameState.currentWord || "???"}
          </span>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center">
        <CanvaCanvas />
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${(gameState.timeRemaining / gameState.roundTime) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  </div>

  {/* Bottom Panels */}
  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border-t">
    {/* Answers Panel */}
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">ANSWERS</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-48">
        <div className="flex-1 overflow-y-auto space-y-1 mb-2">
          {guessHistory.map((guess, i) => (
            <div key={i} className="text-sm">
              {guess.correct && "✓ "}
              {guess.guess} {guess.player && `(${guess.player})`}
            </div>
          ))}
        </div>
        <form onSubmit={handleGuess} className="flex gap-2">
          <Input
            placeholder="Type your guess here..."
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            disabled={isDrawer || !gameState.isRoundActive}
          />
          <Button type="submit" disabled={!guessInput.trim() || isDrawer}>
            Guess
          </Button>
        </form>
      </CardContent>
    </Card>

    {/* Chat Panel */}
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">CHAT</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-48">
        <div className="flex-1 overflow-y-auto space-y-1 mb-2">
          {chatMessages.map((msg, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold">{msg.player}:</span> {msg.message}
            </div>
          ))}
        </div>
        <form onSubmit={handleChat} className="flex gap-2">
          <Input
            placeholder="Type your message here..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <Button type="submit" disabled={!chatInput.trim()}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</div>
```

#### Drawer View Structure
```tsx
<div className="flex flex-col h-screen bg-background">
  {/* Top Bar - Same as guesser */}
  <header>...</header>

  {/* Main Area */}
  <div className="flex-1 flex overflow-hidden">
    {/* Left Sidebar - Same as guesser */}
    <aside>...</aside>

    {/* Canvas Section */}
    <div className="flex-1 flex flex-col p-4">
      {/* Word Display (prominent, for drawer) */}
      {isDrawer && gameState.currentWord && (
        <div className="mb-4 p-3 bg-primary text-primary-foreground rounded-lg text-center">
          <p className="text-sm opacity-90">Your word:</p>
          <p className="text-2xl font-bold">{gameState.currentWord}</p>
        </div>
      )}

      {/* Drawing Controls */}
      {isDrawer && (
        <div className="flex gap-4 items-center mb-4">
          <div className="flex items-center gap-2">
            <label>Color:</label>
            <input type="color" value={color} onChange={handleColorChange} />
          </div>
          <div className="flex items-center gap-2">
            <label>Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={handleBrushSizeChange}
            />
            <span>{brushSize}</span>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center">
        <CanvaCanvas />
      </div>

      {/* Progress Bar - Same as guesser */}
      <div className="mt-4">...</div>
    </div>
  </div>

  {/* Bottom Panels - Same structure, but guess input disabled for drawer */}
  <div className="grid grid-cols-2 gap-4 p-4">
    <Card>
      <CardHeader>ANSWERS</CardHeader>
      <CardContent>
        {/* Show correct guesses as they come in */}
        <div className="space-y-1">
          {correctGuesses.map((guess, i) => (
            <div key={i} className="text-sm">
              ✓ {guess.word} ({guess.player})
            </div>
          ))}
        </div>
        <Input
          placeholder="You're drawing..."
          disabled
        />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>CHAT</CardHeader>
      <CardContent>
        {/* Chat works normally for drawer */}
        <ChatMessages />
        <ChatInput />
      </CardContent>
    </Card>
  </div>
</div>
```

---

## Summary

### Current Layout (Three-Column Grid)
- **Left (2/12)**: Game info and players
- **Center (8/12)**: Main canvas area
- **Right (2/12)**: Chat and guessing

### Recommended Layout (Gartic.io Style)

**Guesser View**:
- **Left Sidebar**: Player list with scores
- **Main Area**: Full-width canvas with faint word hint, progress bar
- **Bottom Panels**: Answers (left) and Chat (right) side-by-side
- **Top Bar**: Status indicator, settings icons

**Drawer View**:
- **Same structure** as guesser
- **Word Display**: Prominent box showing word to draw
- **Drawing Controls**: Visible above canvas
- **Guess Input**: Disabled (drawer can't guess)
- **Chat**: Available for communication

**Benefits**:
- ✅ Maximum canvas visibility
- ✅ Clear separation of answers and chat
- ✅ Modern, clean aesthetic
- ✅ Word hint system for guessers
- ✅ Progress visualization
- ✅ Intuitive user flow
- ✅ Better use of vertical space

The Gartic.io-inspired layout provides a more modern, game-focused experience while maintaining all core functionality.

