# Issues

This directory tracks bugs and issues encountered during development.

## Current Issues

### Guesser Drawing Not Visible
- **Status**: ✅ Fixed
- **File**: [guesser-drawing-not-visible.md](./guesser-drawing-not-visible.md)
- **Branch**: `fix/guesser-drawing-visibility` (merged to main)
- **Description**: Drawings are not visible to guessers, overlay blocks view, and guessers can interact with drawings
- **Solution**: Fixed overlay positioning, canvas rendering with requestRenderAll, forced browser repaint, disabled object caching, and prevented all interactions for guessers

### Canvas Crash on Correct Guess
- **Status**: ✅ Fixed
- **File**: [canvas-crash-on-correct-guess.md](./canvas-crash-on-correct-guess.md)
- **Branch**: `debug/gameflow-crash`
- **Description**: Game crashes when a player guesses correctly, causing "can't access property 'clearRect', t2 is undefined" error
- **Root Cause**: Canvas disposal race condition when game state changes after correct guess
- **Solution**: Added canvas validation checks and disposal tracking

### Color Palette Wipes Board
- **Status**: ✅ Fixed
- **File**: [color-palette-wipes-board.md](./color-palette-wipes-board.md)
- **Branch**: `fix/color-palette-board-wipe`
- **Description**: Clicking on a different color in the color palette wipes the entire canvas board, losing all drawings
- **Root Cause**: Canvas initialization effect included `activeColor` and `brushSize` in dependency array, causing canvas recreation on color change
- **Solution**: Removed `activeColor` and `brushSize` from canvas initialization dependencies; brush updates handled by separate effect

