# Canva Mode Mobile GameStage Layout

This document presents a mobile-optimized layout for the Canva game stage, designed specifically for touch-based drawing on mobile devices.

---

## Mobile Layout Overview

### Design Principles
- **Canvas First**: Maximum screen space dedicated to drawing
- **Touch Optimized**: Large touch targets, gesture-friendly
- **Bottom-Up UI**: Controls and panels slide up from bottom
- **Minimal Overlay**: Essential info only, non-intrusive
- **Quick Access**: Drawing tools always accessible
- **Swipe Gestures**: Natural mobile interactions

---

## Mobile Layout: Full-Screen Canvas with Bottom Sheets

### Layout Description

**Mobile-first design with full-screen canvas and collapsible bottom sheets for controls, chat, and game info.**

```
┌─────────────────────────────────────────┐
│ CANVA    [DRAWING]         [⚙️] [×]    │ ← Top Bar (Fixed)
├─────────────────────────────────────────┤
│                                         │
│                                         │
│                                         │
│                                         │
│         CANVAS AREA                     │
│         (Full Screen)                  │
│         [Touch Drawing Enabled]        │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ [Color] [Size: ▬━━━━━━━━━━ 5] [Undo]   │ ← Drawing Tools Bar (Fixed)
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Round 2 | 0:45 | Word: GOOGLE       │ │ ← Game Info (Collapsible)
│ │ [Progress: ████████████░░░░░░░░]     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ANSWERS (3)              [↑]        │ │ ← Answers Sheet (Collapsible)
│ │ ✓ google (Player1)                  │ │
│ │ ✓ google (Player2)                  │ │
│ │ ✓ google (Player3)                  │ │
│ │ [Type guess...] [Guess]             │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ CHAT (5)                 [↑]        │ │ ← Chat Sheet (Collapsible)
│ │ Player1: Nice!                       │ │
│ │ Player2: I see it!                  │ │
│ │ [Type message...] [Send]            │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ PLAYERS (6)              [↑]        │ │ ← Players Sheet (Collapsible)
│ │ 👤 Player1 - 99 pts                 │ │
│ │ 👤 Player2 🎨 - 57 pts               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Characteristics**:
- **Full-Screen Canvas**: Takes entire viewport minus top bar and tools
- **Fixed Top Bar**: Status, title, actions
- **Fixed Tools Bar**: Always visible drawing controls
- **Collapsible Sheets**: Game info, answers, chat, players stack at bottom
- **Swipe Gestures**: Swipe up/down to expand/collapse sheets
- **Touch Optimized**: Large buttons, easy-to-hit targets

---

## Component Breakdown

### 1. Top Bar (Fixed, Always Visible)

**Height**: 56px (h-14)
**Position**: Top of screen
**Background**: `bg-card` with bottom border

**Components**:
- **Left**: "CANVA" title (text-lg font-bold)
- **Center**: Status badge (DRAWING/GUESSING/WAIT)
- **Right**: Settings icon, Leave button (X)

**Mobile Optimizations**:
- Compact spacing (px-3 py-2)
- Touch-friendly buttons (min 44px touch target)
- Status badge shows current state clearly

```tsx
<header className="fixed top-0 left-0 right-0 h-14 bg-card border-b z-50 flex items-center justify-between px-3">
  <h1 className="text-lg font-bold">CANVA</h1>
  <div className="flex items-center gap-2">
    <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold">
      {status}
    </span>
    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
      <Settings className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={onLeave}>
      <X className="w-4 h-4" />
    </Button>
  </div>
</header>
```

---

### 2. Drawing Tools Bar (Fixed, Always Visible)

**Height**: 64px (h-16)
**Position**: Just below top bar, fixed
**Background**: `bg-card` with subtle shadow

**Components**:
- **Color Picker**: Large touch-friendly color input (w-12 h-12)
- **Brush Size**: Horizontal slider with value display
- **Undo Button**: Quick undo action
- **Clear Button**: (Optional, drawer only)

**Mobile Optimizations**:
- Large touch targets (min 44px)
- Visual feedback on touch
- Haptic feedback (optional, if available)

```tsx
<div className="fixed top-14 left-0 right-0 h-16 bg-card border-b z-40 flex items-center gap-3 px-4">
  <div className="flex items-center gap-2">
    <label className="text-xs text-muted-foreground">Color:</label>
    <input
      type="color"
      value={color}
      onChange={handleColorChange}
      className="w-12 h-12 rounded border-2 border-border cursor-pointer"
      disabled={!canDraw}
    />
  </div>
  <div className="flex-1 flex items-center gap-2">
    <label className="text-xs text-muted-foreground">Size:</label>
    <input
      type="range"
      min="1"
      max="20"
      value={brushSize}
      onChange={handleBrushSizeChange}
      className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
      disabled={!canDraw}
    />
    <span className="text-sm font-semibold w-8 text-center">{brushSize}</span>
  </div>
  {canDraw && (
    <Button variant="outline" size="sm" onClick={handleUndo}>
      Undo
    </Button>
  )}
</div>
```

---

### 3. Canvas Area (Full Screen, Scrollable)

**Position**: Below tools bar, fills remaining space
**Dimensions**: 800x600px (scaled to fit)
**Behavior**: 
- Touch drawing enabled
- Pinch-to-zoom (optional enhancement)
- Pan when zoomed (optional enhancement)
- Scrollable if content exceeds viewport

**Mobile Optimizations**:
- Prevents default touch behaviors that interfere with drawing
- Touch event handling optimized for drawing
- Responsive scaling maintains aspect ratio
- Word hint overlay (for guessers) - faint, non-intrusive

```tsx
<div className="fixed top-28 left-0 right-0 bottom-0 overflow-auto bg-muted/20">
  {/* Word Hint Overlay (Guessers) */}
  {!isDrawer && gameState.isRoundActive && !gameState.currentWord && (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
      <span className="text-6xl font-bold text-muted/10 select-none">
        ???
      </span>
    </div>
  )}
  
  {/* Canvas Container */}
  <div className="flex items-center justify-center min-h-full p-4 relative z-10">
    <div className="relative">
      <CanvaCanvas />
    </div>
  </div>
</div>
```

---

### 4. Bottom Sheets (Collapsible)

**Position**: Bottom of screen, stackable
**Behavior**: 
- Swipe up to expand
- Swipe down to collapse
- Tap header to toggle
- Multiple sheets can be expanded simultaneously
- Auto-collapse when drawing (optional)

**Sheet Types**:

#### A. Game Info Sheet (Always Visible, Minimized by Default)

**Height**: 
- Collapsed: 48px (shows round, timer, word)
- Expanded: 120px (shows progress bar, full details)

**Content**:
- Round number
- Timer (MM:SS)
- Word (for drawer) or "Guess the word!" (for guessers)
- Progress bar (when expanded)

```tsx
<BottomSheet
  defaultHeight={48}
  maxHeight={120}
  className="bg-card border-t"
>
  <SheetHeader className="flex items-center justify-between px-4 py-2">
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold">Round {roundNumber}</span>
      <span className="text-sm">{formatTime(timeRemaining)}</span>
      {isDrawer && currentWord && (
        <span className="text-sm font-bold text-primary">{currentWord}</span>
      )}
    </div>
    <ChevronUp className="w-4 h-4" />
  </SheetHeader>
  <SheetContent className="px-4 pb-2">
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${progressPercentage}%` }}
      />
    </div>
  </SheetContent>
</BottomSheet>
```

#### B. Answers Sheet (Collapsible)

**Height**:
- Collapsed: 56px (header only)
- Expanded: 200px (shows history + input)

**Content**:
- Guess history (scrollable)
- Guess input field
- Submit button

**Behavior**:
- Auto-expands when correct guess received
- Shows count badge in header
- Disabled for drawer

```tsx
<BottomSheet
  defaultHeight={56}
  maxHeight={200}
  className="bg-card border-t"
  disabled={isDrawer}
>
  <SheetHeader className="flex items-center justify-between px-4 py-2">
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">ANSWERS</span>
      {guessHistory.length > 0 && (
        <Badge variant="secondary" className="text-xs">
          {guessHistory.length}
        </Badge>
      )}
    </div>
    <ChevronUp className="w-4 h-4" />
  </SheetHeader>
  <SheetContent className="flex flex-col h-full px-4 pb-2">
    <div className="flex-1 overflow-y-auto space-y-1 mb-2">
      {guessHistory.map((entry, i) => (
        <div
          key={i}
          className={`text-sm ${
            entry.correct ? "text-green-600 font-semibold" : "text-muted-foreground"
          }`}
        >
          {entry.correct && "✓ "}
          {entry.guess}
          {entry.correct && entry.player && ` (${entry.player.name})`}
        </div>
      ))}
    </div>
    <form onSubmit={handleGuessSubmit} className="flex gap-2">
      <Input
        placeholder="Type your guess..."
        value={guessInput}
        onChange={(e) => setGuessInput(e.target.value)}
        disabled={isDrawer || !gameState.isRoundActive}
        className="flex-1 h-10"
      />
      <Button
        type="submit"
        disabled={!guessInput.trim() || isDrawer || !gameState.isRoundActive}
        className="h-10 px-4"
      >
        Guess
      </Button>
    </form>
  </SheetContent>
</BottomSheet>
```

#### C. Chat Sheet (Collapsible)

**Height**:
- Collapsed: 56px (header only)
- Expanded: 200px (shows messages + input)

**Content**:
- Chat message history (scrollable)
- Chat input field
- Send button

**Behavior**:
- Auto-scrolls to bottom on new message
- Shows unread count badge (optional)

```tsx
<BottomSheet
  defaultHeight={56}
  maxHeight={200}
  className="bg-card border-t"
>
  <SheetHeader className="flex items-center justify-between px-4 py-2">
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">CHAT</span>
      {chatMessages.length > 0 && (
        <Badge variant="secondary" className="text-xs">
          {chatMessages.length}
        </Badge>
      )}
    </div>
    <ChevronUp className="w-4 h-4" />
  </SheetHeader>
  <SheetContent className="flex flex-col h-full px-4 pb-2">
    <div className="flex-1 overflow-y-auto space-y-1 mb-2">
      {chatMessages.map((msg, i) => (
        <div key={i} className="text-sm">
          <span className="font-semibold">{msg.player.name}:</span> {msg.message}
        </div>
      ))}
    </div>
    <form onSubmit={handleChatSubmit} className="flex gap-2">
      <Input
        placeholder="Type a message..."
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        className="flex-1 h-10"
      />
      <Button type="submit" disabled={!chatInput.trim()} className="h-10 px-4">
        Send
      </Button>
    </form>
  </SheetContent>
</BottomSheet>
```

#### D. Players Sheet (Collapsible, Optional)

**Height**:
- Collapsed: 56px (header only)
- Expanded: 300px (shows full player list)

**Content**:
- Sorted player list (by score)
- Player avatars
- Player names with indicators
- Scores

**Behavior**:
- Can be hidden if space is tight
- Shows drawer indicator (🎨)
- Highlights current player

```tsx
<BottomSheet
  defaultHeight={56}
  maxHeight={300}
  className="bg-card border-t"
>
  <SheetHeader className="flex items-center justify-between px-4 py-2">
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">PLAYERS</span>
      <Badge variant="secondary" className="text-xs">
        {gameState.players.length}
      </Badge>
    </div>
    <ChevronUp className="w-4 h-4" />
  </SheetHeader>
  <SheetContent className="px-4 pb-2 overflow-y-auto">
    <div className="space-y-2">
      {gameState.players
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-2 rounded border bg-muted/50"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <PlayerAvatar avatar={player.avatar} name={player.name} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-sm truncate ${
                      player.id === gameState.selfId ? "font-bold" : ""
                    }`}
                  >
                    {player.name}
                  </span>
                  {player.id === gameState.currentDrawer?.id && (
                    <span className="text-xs">🎨</span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold whitespace-nowrap ml-2">
              {player.score || 0} pts
            </span>
          </div>
        ))}
    </div>
  </SheetContent>
</BottomSheet>
```

---

## Drawer-Specific Mobile Layout

### Word Display (Prominent for Drawer)

**Position**: Fixed below tools bar, always visible when drawer
**Height**: 72px
**Background**: Primary color with high contrast

```tsx
{isDrawer && gameState.currentWord && (
  <div className="fixed top-28 left-0 right-0 h-18 bg-primary text-primary-foreground z-30 px-4 py-3">
    <p className="text-xs opacity-90 mb-1 text-center">Your word:</p>
    <p className="text-2xl font-bold text-center">{gameState.currentWord}</p>
  </div>
)}
```

**Canvas Position Adjustment**:
- When word display is visible, canvas starts at `top-44` (28 + 18)
- Otherwise, canvas starts at `top-28`

---

## Guesser-Specific Mobile Layout

### Word Hint Overlay

**Position**: Centered on canvas, behind drawing
**Style**: Very faint, large text
**Behavior**: Only visible during active round, before word is revealed

```tsx
{!isDrawer && gameState.isRoundActive && !gameState.currentWord && (
  <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
    <span className="text-6xl font-bold text-muted/10 select-none">
      ???
    </span>
  </div>
)}
```

---

## Touch Interactions & Gestures

### Drawing Gestures
- **Single Touch**: Draw on canvas
- **Multi-Touch**: Disabled (prevents accidental zoom/pan)
- **Long Press**: (Optional) Color picker from canvas
- **Double Tap**: (Optional) Undo last action

### Sheet Gestures
- **Swipe Up**: Expand sheet
- **Swipe Down**: Collapse sheet
- **Tap Header**: Toggle expand/collapse
- **Pull to Refresh**: (Optional) Not applicable here

### Canvas Gestures (Optional Enhancements)
- **Pinch to Zoom**: Zoom in/out on canvas
- **Two-Finger Pan**: Pan when zoomed
- **Double Tap**: Reset zoom

---

## Responsive Breakpoints

### Mobile (< 768px)
- **Layout**: Full-screen canvas with bottom sheets
- **Top Bar**: Fixed, 56px height
- **Tools Bar**: Fixed, 64px height
- **Canvas**: Fills remaining space
- **Sheets**: Stack at bottom, collapsible

### Tablet (768px - 1023px)
- **Layout**: Hybrid - can use mobile or desktop layout
- **Option 1**: Mobile layout (better for touch)
- **Option 2**: Desktop layout with adjustments

### Desktop (≥ 1024px)
- **Layout**: Use existing desktop layout
- **Three-column grid**: Sidebar-Canvas-Chat

---

## Implementation Structure

### Component Hierarchy

```tsx
<div className="flex flex-col h-screen bg-background overflow-hidden">
  {/* Fixed Top Bar */}
  <MobileTopBar />
  
  {/* Fixed Drawing Tools */}
  <MobileDrawingTools />
  
  {/* Word Display (Drawer Only) */}
  {isDrawer && <MobileWordDisplay />}
  
  {/* Canvas Area */}
  <div className="flex-1 overflow-hidden relative" style={{ marginTop: '...' }}>
    <CanvaCanvas />
  </div>
  
  {/* Bottom Sheets Stack */}
  <div className="fixed bottom-0 left-0 right-0 z-30">
    <MobileGameInfoSheet />
    <MobileAnswersSheet />
    <MobileChatSheet />
    <MobilePlayersSheet /> {/* Optional */}
  </div>
</div>
```

---

## CSS Classes & Styling

### Fixed Positioning
```css
.mobile-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px; /* h-14 */
  z-index: 50;
}

.mobile-tools-bar {
  position: fixed;
  top: 56px; /* below top bar */
  left: 0;
  right: 0;
  height: 64px; /* h-16 */
  z-index: 40;
}

.mobile-canvas-area {
  position: fixed;
  top: 120px; /* below top bar + tools bar */
  left: 0;
  right: 0;
  bottom: 0; /* above bottom sheets */
  overflow: auto;
  z-index: 10;
}

.mobile-bottom-sheets {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
}
```

### Bottom Sheet Animation
```css
.bottom-sheet {
  transition: height 0.3s ease-in-out;
  overflow: hidden;
}

.bottom-sheet-collapsed {
  height: 48px; /* or 56px for header */
}

.bottom-sheet-expanded {
  height: 200px; /* or max-height */
}
```

---

## Touch Event Handling

### Prevent Default Behaviors
```tsx
useEffect(() => {
  const preventDefaults = (e: TouchEvent) => {
    // Prevent scrolling while drawing
    if (isDrawing) {
      e.preventDefault();
    }
  };

  document.addEventListener('touchmove', preventDefaults, { passive: false });
  
  return () => {
    document.removeEventListener('touchmove', preventDefaults);
  };
}, [isDrawing]);
```

### Canvas Touch Events
```tsx
// In Canvas component
const handleTouchStart = (e: React.TouchEvent) => {
  if (!canDraw) return;
  
  const touch = e.touches[0];
  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  // Start drawing
  startDrawing(x, y);
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!canDraw || !isDrawing) return;
  e.preventDefault(); // Prevent scrolling
  
  const touch = e.touches[0];
  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return;
  
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  // Continue drawing
  continueDrawing(x, y);
};

const handleTouchEnd = () => {
  if (isDrawing) {
    endDrawing();
  }
};
```

---

## Performance Optimizations

### Canvas Rendering
- **Touch Event Throttling**: Limit touch event processing
- **Batch Drawing**: Group touch points before rendering
- **Request Animation Frame**: Use RAF for smooth drawing
- **Debounce Sheet Animations**: Prevent rapid expand/collapse

### Sheet Rendering
- **Virtual Scrolling**: For long chat/guess histories
- **Lazy Loading**: Load sheet content when expanded
- **Memoization**: Cache sheet states

### Memory Management
- **Cleanup**: Remove event listeners on unmount
- **Canvas Clearing**: Clear unused drawing paths
- **Image Optimization**: Compress canvas exports if needed

---

## Accessibility

### Screen Readers
- **Canvas**: Descriptive label "Drawing canvas"
- **Buttons**: Clear labels and ARIA attributes
- **Sheets**: Announce expand/collapse state
- **Status**: Live region for game status updates

### Keyboard Navigation
- **Tab Order**: Logical flow through controls
- **Focus Indicators**: Visible focus states
- **Shortcuts**: (Optional) Keyboard shortcuts for common actions

### Touch Targets
- **Minimum Size**: 44x44px for all interactive elements
- **Spacing**: Adequate spacing between touch targets
- **Visual Feedback**: Clear pressed/active states

---

## State Management

### Sheet States
```typescript
interface MobileSheetState {
  gameInfo: {
    expanded: boolean;
    height: number;
  };
  answers: {
    expanded: boolean;
    height: number;
  };
  chat: {
    expanded: boolean;
    height: number;
  };
  players: {
    expanded: boolean;
    height: number;
  };
}
```

### Auto-Collapse Logic
```typescript
// Auto-collapse sheets when drawing starts
useEffect(() => {
  if (isDrawing && isDrawer) {
    setSheetState(prev => ({
      ...prev,
      answers: { ...prev.answers, expanded: false },
      chat: { ...prev.chat, expanded: false },
      players: { ...prev.players, expanded: false },
    }));
  }
}, [isDrawing, isDrawer]);
```

---

## Implementation Checklist

### Phase 1: Core Layout
- [ ] Create mobile detection hook
- [ ] Implement fixed top bar
- [ ] Implement fixed tools bar
- [ ] Adjust canvas positioning
- [ ] Create bottom sheet component

### Phase 2: Bottom Sheets
- [ ] Game info sheet
- [ ] Answers sheet
- [ ] Chat sheet
- [ ] Players sheet (optional)
- [ ] Swipe gesture handling
- [ ] Expand/collapse animations

### Phase 3: Touch Optimization
- [ ] Touch event handling for canvas
- [ ] Prevent default scroll behaviors
- [ ] Optimize touch drawing performance
- [ ] Add haptic feedback (if available)

### Phase 4: Drawer/Guesser Views
- [ ] Word display for drawer
- [ ] Word hint overlay for guessers
- [ ] Conditional UI rendering
- [ ] State-dependent behaviors

### Phase 5: Polish
- [ ] Smooth animations
- [ ] Loading states
- [ ] Error handling
- [ ] Accessibility improvements
- [ ] Performance optimization

---

## Code Example: Mobile GameStage Component

```tsx
import { useState, useEffect } from "react";
import { useCanva } from "../state/CanvaContext";
import { CanvaCanvas } from "./Canvas";
import { MobileTopBar } from "./MobileTopBar";
import { MobileDrawingTools } from "./MobileDrawingTools";
import { MobileWordDisplay } from "./MobileWordDisplay";
import { MobileGameInfoSheet } from "./MobileGameInfoSheet";
import { MobileAnswersSheet } from "./MobileAnswersSheet";
import { MobileChatSheet } from "./MobileChatSheet";
import { MobilePlayersSheet } from "./MobilePlayersSheet";

export function MobileGameStage({ onLeaveRoom }: GameStageProps) {
  const { gameState, isDrawer } = useCanva();
  const [sheetStates, setSheetStates] = useState({
    gameInfo: { expanded: false, height: 48 },
    answers: { expanded: false, height: 56 },
    chat: { expanded: false, height: 56 },
    players: { expanded: false, height: 56 },
  });

  // Calculate canvas top position
  const canvasTop = isDrawer && gameState.currentWord ? 172 : 120; // 56 + 64 + 52 or 56 + 64

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Fixed Top Bar */}
      <MobileTopBar onLeave={onLeaveRoom} />
      
      {/* Fixed Drawing Tools */}
      <MobileDrawingTools />
      
      {/* Word Display (Drawer Only) */}
      {isDrawer && gameState.currentWord && (
        <MobileWordDisplay word={gameState.currentWord} />
      )}
      
      {/* Canvas Area */}
      <div
        className="fixed left-0 right-0 overflow-auto bg-muted/20"
        style={{
          top: `${canvasTop}px`,
          bottom: '0px', // Will be adjusted by bottom sheets
        }}
      >
        {/* Word Hint Overlay (Guessers) */}
        {!isDrawer && gameState.isRoundActive && !gameState.currentWord && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
            <span className="text-6xl font-bold text-muted/10 select-none">
              ???
            </span>
          </div>
        )}
        
        {/* Canvas Container */}
        <div className="flex items-center justify-center min-h-full p-4 relative z-10">
          <div className="relative">
            <CanvaCanvas />
          </div>
        </div>
      </div>
      
      {/* Bottom Sheets Stack */}
      <div className="fixed bottom-0 left-0 right-0 z-30 space-y-0">
        <MobileGameInfoSheet
          state={sheetStates.gameInfo}
          onToggle={(expanded) => setSheetStates(prev => ({
            ...prev,
            gameInfo: { ...prev.gameInfo, expanded }
          }))}
        />
        <MobileAnswersSheet
          state={sheetStates.answers}
          onToggle={(expanded) => setSheetStates(prev => ({
            ...prev,
            answers: { ...prev.answers, expanded }
          }))}
          disabled={isDrawer}
        />
        <MobileChatSheet
          state={sheetStates.chat}
          onToggle={(expanded) => setSheetStates(prev => ({
            ...prev,
            chat: { ...prev.chat, expanded }
          }))}
        />
        <MobilePlayersSheet
          state={sheetStates.players}
          onToggle={(expanded) => setSheetStates(prev => ({
            ...prev,
            players: { ...prev.players, expanded }
          }))}
        />
      </div>
    </div>
  );
}
```

---

## Summary

### Mobile Layout Features
- ✅ **Full-Screen Canvas**: Maximum drawing space
- ✅ **Fixed Tools Bar**: Always accessible drawing controls
- ✅ **Collapsible Sheets**: Game info, answers, chat, players
- ✅ **Touch Optimized**: Large targets, gesture support
- ✅ **Drawer Support**: Prominent word display
- ✅ **Guesser Support**: Faint word hint overlay
- ✅ **Swipe Gestures**: Natural mobile interactions
- ✅ **Performance**: Optimized touch event handling

### Benefits
- **Better Drawing Experience**: More canvas space, easier touch drawing
- **Cleaner UI**: Non-intrusive panels, collapsible when not needed
- **Mobile-First**: Designed specifically for touch devices
- **Flexible**: Sheets can be expanded/collapsed as needed
- **Accessible**: Proper touch targets and screen reader support

This mobile layout provides an optimal drawing experience on mobile devices while maintaining all game functionality.

