# Setting Up LichessDB for Puzzle Mode

The puzzle mode uses puzzles from the LichessDB database. To use it:

## Option 1: Use LichessDB as the main database (Recommended for puzzle-only setup)

Set the `DATABASE_URL` environment variable to point to the LichessDB:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="file:../../ChessModeDocs/LichessDB&Schema/dev.db"
```

**Linux/Mac:**
```bash
export DATABASE_URL="file:../../ChessModeDocs/LichessDB&Schema/dev.db"
```

**Or create `backend/.env`:**
```
DATABASE_URL="file:../../ChessModeDocs/LichessDB&Schema/dev.db"
```

Then start the server:
```bash
npm start
```

## Option 2: Import puzzles into your existing database

If you want to keep using your existing database for rooms and other data:

1. Run the import script:
```bash
cd backend/scripts
node import-lichess-db.js
```

This will import all puzzles from LichessDB into your current database.

## Verify Setup

To verify puzzles are available:

1. Start the backend server
2. Visit: `http://localhost:3001/api/puzzles/random`
3. You should receive a JSON puzzle object

## Notes

- The LichessDB contains 7,630 validated puzzles
- All puzzles have been validated and are ready to use
- The database schema matches the backend schema for Puzzle and PuzzleAttempt models

