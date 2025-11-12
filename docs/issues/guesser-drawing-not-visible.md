# Guesser Drawing Not Visible

**Status**: 🔴 Open  
**Date Reported**: 2025-11-12  
**Priority**: High (Core functionality broken)  
**Branch**: `fix/guesser-drawing-visibility`

## Description

Drawings created by the drawer are not visible to guessers. The guesser's canvas appears blank, and the "Watch and guess the word!" overlay is blocking the view. Additionally, when the overlay is clicked, the drawings become visible but guessers can interact with and move the drawings, which should not be allowed.

## Symptoms

1. **Drawing Not Visible**: Guessers cannot see the drawer's drawings in real-time
2. **Overlay Blocking View**: The "Watch and guess the word!" overlay appears in front of the canvas, obscuring any drawings
3. **Clicking Reveals Drawings**: Clicking on the overlay makes drawings visible, suggesting a z-index or pointer-events issue
4. **Unauthorized Interaction**: Once visible, guessers can move and manipulate the drawings, which should be read-only

## Expected Behavior

- Guessers should see drawings appear in real-time as the drawer draws
- The overlay should not block the canvas view
- Drawings should be visible but completely non-interactive for guessers
- Guessers should not be able to move, select, or modify any drawing elements

## Current Implementation

### Canvas Component (`src/components/Canvas.tsx`)

**Overlay Implementation (Lines 303-309):**
```tsx
{!gameState.isDrawer && (
  <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px] pointer-events-none z-10">
    <div className="bg-background/90 px-4 py-2 rounded-lg border">
      <p className="text-lg font-semibold">Watch and guess the word!</p>
    </div>
  </div>
)}
```

**Drawing Event Handler for Guessers (Lines 167-237):**
- Listens for `drawing-event` custom events
- Uses `loadFromJSON` to add paths to canvas
- Sets objects to `selectable: false` and `evented: false` after loading

## Root Cause Analysis

### Issue 1: Overlay Z-Index
- The overlay has `z-10` which places it above the canvas
- Even with `pointer-events-none`, it may be visually blocking the canvas
- The backdrop blur (`backdrop-blur-[2px]`) might be obscuring the drawings

### Issue 2: Canvas Initialization for Guessers
- The canvas might not be properly initialized for guessers
- Objects might not be set to non-interactive immediately upon creation
- The `loadFromJSON` callback might be executing before objects are fully loaded

### Issue 3: Object Interaction Settings
- Objects are set to non-interactive in the `loadFromJSON` callback
- However, Fabric.js might be allowing interaction before the callback executes
- The canvas itself might need to be set to non-interactive mode

### Issue 4: Drawing Event Reception
- Drawing events might not be properly received or processed
- The `isReceivingRef` flag might be preventing events from being processed
- The canvas validation check might be too strict, preventing event handling

## Reproduction Steps

1. Start a multiplayer game with at least 2 players
2. Have one player be the drawer, others as guessers
3. Draw something on the canvas as the drawer
4. Observe the guesser's view:
   - Canvas appears blank
   - "Watch and guess the word!" overlay is visible
5. Click on the overlay
6. Observe:
   - Drawings become visible
   - Drawings can be moved/selected (should not be possible)

## Technical Details

### Canvas Structure
- Fabric.js Canvas is used for drawing
- Drawer sends drawing events via socket
- Guessers receive events via `window.dispatchEvent` custom events
- Events are processed in `handleDrawingEvent` function

### Event Flow
1. Drawer draws → `path:created` event fires
2. `handlePathCreated` sends event via socket
3. Server broadcasts to other players
4. `GameContext` receives event and dispatches `drawing-event` custom event
5. Canvas component's `handleDrawingEvent` processes the event
6. Uses `loadFromJSON` to add path to canvas
7. Sets objects to non-interactive in callback

## Potential Solutions

1. **Fix Overlay Positioning**
   - Remove or adjust z-index to ensure it doesn't block canvas
   - Consider making overlay semi-transparent or repositioning it
   - Ensure `pointer-events-none` is working correctly

2. **Ensure Canvas is Interactive for Rendering**
   - Verify canvas is properly rendering for guessers
   - Check that drawing events are being received and processed
   - Add debug logging to trace event flow

3. **Fix Object Interaction Settings**
   - Set canvas to `selection: false` for guessers
   - Ensure objects are non-interactive immediately upon creation
   - Consider using `fabricCanvas.selection = false` and `fabricCanvas.defaultCursor = 'default'`

4. **Improve Drawing Event Handling**
   - Verify `isReceivingRef` is not blocking legitimate events
   - Ensure canvas validation is not too strict
   - Add error handling and logging for event processing

5. **Canvas Configuration for Guessers**
   - Disable all interaction modes for guessers
   - Set `isDrawingMode: false` (already done)
   - Add `selection: false` to prevent object selection
   - Disable hover effects and cursors

## Related Files

- `src/components/Canvas.tsx` - Main canvas component
- `src/contexts/GameContext.tsx` - Game state and socket event handling
- `backend/src/server.js` - Socket server broadcasting drawing events

## Testing Checklist

After fix:
- [ ] Drawings appear in real-time for guessers
- [ ] Overlay does not block canvas view
- [ ] Drawings are visible but non-interactive
- [ ] Guessers cannot move, select, or modify drawings
- [ ] Canvas remains responsive and performant
- [ ] No console errors related to drawing events

