# Stockfish Setup Guide

This project uses a local Stockfish binary located in the `stockfish/` folder at the project root.

## Current Setup

The engine pool automatically detects and uses the Stockfish binary in this order of priority:

1. **Local binary** (highest priority): `stockfish/stockfish-windows-x86-64-avx2.exe`
2. System PATH: `stockfish` command
3. Common system paths: `/usr/bin/stockfish`, `/usr/local/bin/stockfish`, etc.

## Binary Location

The Stockfish binary should be located at:
```
paint-and-guess/
  stockfish/
    stockfish-windows-x86-64-avx2.exe  ← Windows (current)
    stockfish                          ← Linux/macOS (if you add it)
```

## Supported Binary Names

The engine pool will automatically detect these binary names in the `stockfish/` folder:

- `stockfish-windows-x86-64-avx2.exe` (Windows AVX2 - current)
- `stockfish.exe` (Generic Windows)
- `stockfish` (Linux/macOS)
- `stockfish-windows-x86-64.exe` (Windows x86-64)
- `stockfish-windows-x86-64-modern.exe` (Windows modern)

## Testing

To verify the engine is working:

```bash
cd backend
npm run test:engine
```

This will:
1. Check engine status
2. Run a simple analysis (depth 5)
3. Test MultiPV analysis (3 principal variations)

## Troubleshooting

### Engine not found

If you get "Stockfish binary not found":
1. Verify the binary exists in `stockfish/stockfish-windows-x86-64-avx2.exe`
2. Check file permissions (on Linux/macOS, ensure it's executable: `chmod +x stockfish/stockfish`)
3. On Windows, ensure the `.exe` file is not corrupted

### Engine fails to start

If the engine spawns but doesn't respond:
1. Check the engine logs in the console
2. Try running the binary manually: `./stockfish/stockfish-windows-x86-64-avx2.exe`
3. Verify it responds to `uci` command

### Performance issues

- The AVX2 version is optimized for modern CPUs
- If you have an older CPU, you may need a different binary variant
- Check Stockfish downloads: https://stockfishchess.org/download/

## Platform-Specific Notes

### Windows
- Uses `stockfish-windows-x86-64-avx2.exe` (current setup)
- No special permissions needed for `.exe` files

### Linux
- Would use `stockfish` (no extension)
- Must be executable: `chmod +x stockfish/stockfish`
- May need to install dependencies if compiled from source

### macOS
- Would use `stockfish` (no extension)
- Must be executable: `chmod +x stockfish/stockfish`
- Can also use Homebrew: `brew install stockfish` (falls back to system PATH)

