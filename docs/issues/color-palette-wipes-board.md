# Color Palette Wipes Board

**Status**: ✅ Fixed  
**Date Reported**: 2025-01-27  
**Date Fixed**: 2025-01-27  
**Priority**: High (User experience issue)  
**Branch**: `fix/color-palette-board-wipe`

## Description

Clicking on a different color in the color palette wipes the entire canvas board, causing all drawings to be lost. This happens every time a user selects a new color, making it impossible to change colors mid-drawing without losing work.

## Symptoms

- Clicking any color in the color palette clears the entire canvas
- All existing drawings disappear when selecting a new color
- This occurs regardless of whether the user is actively drawing or just changing colors
- The canvas is completely wiped, not just the current stroke

## Root Cause

The canvas initialization `useEffect` in `src/components/Canvas.tsx` includes `activeColor` and `brushSize` in its dependency array (line 107). When a user clicks a different color:

1. `setActiveColor` is called, updating the `activeColor` state
2. React detects the dependency change and re-runs the canvas initialization effect
3. The cleanup function (lines 96-106) disposes the old canvas instance
4. A new canvas is created, but all previous drawings are lost
5. The brush color is updated, but the canvas content is gone

The issue is that `activeColor` and `brushSize` should only update brush properties, not trigger a full canvas re-initialization. Brush updates are already handled by a separate effect (lines 172-182) that modifies `fabricCanvas.freeDrawingBrush` without recreating the canvas.

## Reproduction Steps

1. Start a game as the drawer
2. Draw something on the canvas
3. Click a different color in the color palette
4. Observe: The entire canvas is cleared, losing all drawings

## Solution

Remove `activeColor` and `brushSize` from the canvas initialization effect's dependency array. The canvas should only be re-initialized when game state changes (`isGameActive`, `isDrawer`), not when brush properties change.

### Changes Made

- **File**: `src/components/Canvas.tsx`
  - **Line 107**: Removed `activeColor` and `brushSize` from dependency array
  - Changed from: `}, [gameState.isGameActive, gameState.isDrawer, activeColor, brushSize]);`
  - Changed to: `}, [gameState.isGameActive, gameState.isDrawer]);`

## Testing

After the fix:
- ✅ Clicking different colors only changes the brush color, not clearing the canvas
- ✅ Changing brush size only updates the brush width, not clearing the canvas
- ✅ Canvas is only re-initialized when game state actually changes (game starts/stops, drawer changes)
- ✅ Drawings persist when switching colors mid-drawing

## Related Code

Key sections in `Canvas.tsx`:
- Lines 44-107: Canvas initialization effect (modified)
- Lines 172-182: Brush properties update effect (already handles color/size changes correctly)

