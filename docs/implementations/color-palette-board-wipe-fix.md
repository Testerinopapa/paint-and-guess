# Color Palette Board Wipe Fix

**Date**: 2025-01-27  
**Branch**: `fix/color-palette-board-wipe`  
**Issue**: Color palette wipes board on color change

## Problem

Clicking a different color in the color palette was clearing the entire canvas, causing users to lose all their drawings when changing colors.

## Root Cause

The canvas initialization `useEffect` included `activeColor` and `brushSize` in its dependency array, causing the canvas to be recreated (and thus cleared) whenever these values changed. The canvas should only be re-initialized when game state changes, not when brush properties change.

## Solution

Removed `activeColor` and `brushSize` from the canvas initialization effect's dependency array. Brush property updates are already handled by a separate effect that modifies the brush without recreating the canvas.

## Implementation

### File Modified: `src/components/Canvas.tsx`

**Change on line 107:**
```typescript
// Before
}, [gameState.isGameActive, gameState.isDrawer, activeColor, brushSize]);

// After
}, [gameState.isGameActive, gameState.isDrawer]);
```

## How It Works

1. **Canvas Initialization Effect** (lines 44-107): Now only runs when game state changes (`isGameActive`, `isDrawer`). This ensures the canvas is only recreated when necessary (game start/stop, role changes).

2. **Brush Properties Update Effect** (lines 172-182): Handles color and brush size changes by directly updating `fabricCanvas.freeDrawingBrush` without recreating the canvas. This preserves all existing drawings.

## Benefits

- Users can change colors without losing their drawings
- Canvas is only recreated when necessary (game state changes)
- Better performance (fewer unnecessary canvas recreations)
- Improved user experience

## Testing

- ✅ Changing colors preserves canvas content
- ✅ Changing brush size preserves canvas content
- ✅ Canvas still re-initializes correctly when game state changes
- ✅ Brush color and size update correctly via the separate effect

