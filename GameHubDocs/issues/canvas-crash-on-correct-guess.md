# Canvas Crash on Correct Guess

**Status**: ✅ Fixed  
**Date Reported**: 2025-11-12  
**Date Fixed**: 2025-11-12  
**Branch**: `debug/gameflow-crash`  
**Priority**: High (Game-breaking bug)

## Description

The game crashes with a blank screen when a player successfully guesses the correct word. The browser console shows an error indicating that the canvas context is undefined when trying to clear the canvas.

## Symptoms

- Screen goes completely blank when a correct guess occurs
- Browser console error: `Uncaught TypeError: can't access property "clearRect", t2 is undefined`
- Error stack trace points to:
  - `StaticCanvas.ts:464` - `clearContext`
  - `SelectableCanvas.ts:1309` - `clear`
  - `Canvas.ts:1563` - `clear`
  - `Canvas.tsx:63` - React component render

## Error Details

```
Uncaught TypeError: can't access property "clearRect", t2 is undefined
    clearContext StaticCanvas.ts:464
    clear SelectableCanvas.ts:1309
    clear Canvas.ts:1563
    Canvas Canvas.tsx:63
```

## Root Cause

The crash occurs due to a race condition in the canvas lifecycle management:

1. When a player guesses correctly, the game state updates (scores, players array, etc.)
2. The `correct-guess` socket event triggers state updates in `GameContext.tsx`
3. These state changes cause React to re-render the `Canvas` component
4. The canvas initialization `useEffect` (line 44) has dependencies on `gameState.isGameActive` and `gameState.isDrawer`
5. When these dependencies change, React disposes the old canvas instance
6. However, another `useEffect` (line 99) that clears the canvas also runs due to state changes
7. This second effect tries to call `fabricCanvas.clear()` on a canvas that has already been disposed
8. The disposed canvas no longer has a valid 2D context, causing the crash

## Reproduction Steps

1. Start a multiplayer game with at least 2 players
2. Have one player draw while others guess
3. Have a player submit a correct guess
4. Observe the screen going blank and console error

## Solution

Implemented comprehensive canvas lifecycle management:

### Changes Made

1. **Added Disposal Tracking**
   - Introduced `isDisposedRef` to track when canvas is disposed
   - Set flag to `true` during cleanup, `false` when creating new canvas

2. **Created Canvas Validation Helper**
   - Added `isCanvasValid()` function that checks:
     - Canvas instance exists
     - Canvas is not disposed
     - Canvas has valid 2D rendering context
   - Uses try-catch to safely check context availability

3. **Added Guards to All Canvas Operations**
   - All `fabricCanvas` method calls now check validity first
   - Operations skip gracefully if canvas is invalid
   - Prevents crashes from operating on disposed canvases

4. **Enhanced Error Handling**
   - Wrapped critical operations in try-catch blocks
   - Added error logging for debugging
   - Operations fail gracefully without crashing the app

5. **Added Debug Logging**
   - Console debug logs for canvas initialization
   - Logs for disposal events
   - Logs for validation failures
   - Helps trace canvas lifecycle issues

### Files Modified

- `src/components/Canvas.tsx`
  - Added `isDisposedRef` ref
  - Added `isCanvasValid()` helper function
  - Updated all canvas operations with validation checks
  - Added error handling and logging

## Testing

After the fix:
- ✅ Correct guesses no longer crash the game
- ✅ Canvas remains stable during state transitions
- ✅ Game continues normally after correct guesses
- ✅ No console errors related to canvas operations

## Related Code

Key sections modified in `Canvas.tsx`:
- Lines 16: Added `isDisposedRef`
- Lines 18-41: Added `isCanvasValid()` helper
- Lines 44-96: Enhanced initialization with disposal tracking
- Lines 99-126: Added validation before clearing canvas
- Lines 129-139: Added validation for brush updates
- Lines 142-165: Added validation for drawing events
- Lines 168-237: Added validation for receiving events
- Lines 245-270: Added validation for undo/clear handlers

## Prevention

To prevent similar issues in the future:
- Always validate canvas state before operations
- Use refs to track disposal state
- Wrap canvas operations in try-catch blocks
- Consider using a canvas manager/hook to centralize lifecycle management

