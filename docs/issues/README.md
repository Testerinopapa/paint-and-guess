# Issues

This directory tracks bugs and issues encountered during development.

## Current Issues

### Canvas Crash on Correct Guess
- **Status**: ✅ Fixed
- **File**: [canvas-crash-on-correct-guess.md](./canvas-crash-on-correct-guess.md)
- **Branch**: `debug/gameflow-crash`
- **Description**: Game crashes when a player guesses correctly, causing "can't access property 'clearRect', t2 is undefined" error
- **Root Cause**: Canvas disposal race condition when game state changes after correct guess
- **Solution**: Added canvas validation checks and disposal tracking

