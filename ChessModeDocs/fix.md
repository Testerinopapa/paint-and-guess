npm run test:puzzle-validation              

> paint-and-guess-backend@1.0.0 test:puzzle-validation
> node scripts/test-puzzle-validation.js

🧪 Puzzle Validation Logic Tests

============================================================
✅ FEN Validation - Valid Starting Position
✅ FEN Validation - Valid Mid-Game Position
❌ FEN Validation - Invalid FEN Format - Test failed
❌ FEN Validation - Missing Fields - Test failed
✅ PV Parsing - Valid JSON String
✅ PV Parsing - Already Array
✅ PV Parsing - Invalid JSON
✅ PV Parsing - Empty Array
✅ PV Parsing - Non-Array Value
✅ Mate Puzzle Detection - Array with 'mate'
✅ Mate Puzzle Detection - JSON String with 'mate'
❌ Mate Puzzle Detection - 'smotheredMate' - Test failed
❌ Mate Puzzle Detection - 'arabianMate' - Test failed
✅ Mate Puzzle Detection - Excludes 'mateIn1'
✅ Mate Puzzle Detection - Excludes 'mateIn2'
✅ Mate Puzzle Detection - No Mate Motif
✅ Mate Puzzle Detection - Invalid JSON String
❌ Last Mover - Odd PV Length (White Starts) - Test failed
❌ Last Mover - Even PV Length (White Starts) - Test failed
❌ Last Mover - Odd PV Length (Black Starts) - Test failed
✅ Last Mover - Even PV Length (Black Starts)
❌ Last Mover - Single Move (Odd) - Test failed
❌ Last Mover - Invalid FEN - Test failed
✅ Last Mover - Empty PV
❌ Last Mover - PV as JSON String - Test failed
❌ Mate Validation - Valid Mate Puzzle (White Mates) - Test failed
✅ Mate Validation - Invalid Mate Puzzle (Wrong Side)
✅ Mate Validation - Non-Mate Puzzle (No Validation)
✅ Move Normalization - Standard Move
✅ Move Normalization - Move with Promotion
✅ Move Normalization - Move with Knight Promotion
✅ Move Normalization - Short Move
✅ Move Comparison - Exact Match
✅ Move Comparison - Match with Promotion
✅ Move Comparison - No Match
✅ Edge Case - Empty Database Handling
✅ Edge Case - Large Database Sampling
✅ Edge Case - Medium Database Sampling
✅ Edge Case - Motif Filter Doubles Attempts
✅ Edge Case - Motif Filter Caps at 50
Error calculating last mover: TypeError: Cannot read properties of null (reading 'split')
    at parseFen (file:///C:/Users/null/paint-and-guess/backend/node_modules/chessops/dist/esm/fen.js:133:23)      
    at calculateLastMover (file:///C:/Users/null/paint-and-guess/backend/scripts/test-puzzle-validation.js:29:22) 
    at file:///C:/Users/null/paint-and-guess/backend/scripts/test-puzzle-validation.js:401:21
    at ValidationTestRunner.run (file:///C:/Users/null/paint-and-guess/backend/scripts/test-puzzle-validation.js:70:30)
    at async main (file:///C:/Users/null/paint-and-guess/backend/scripts/test-puzzle-validation.js:514:19)        
✅ Edge Case - Null FEN in Last Mover
✅ Edge Case - Null PV in Last Mover
✅ Integration - Complete Valid Puzzle
❌ Integration - Invalid Puzzle (Empty PV) - Test failed
✅ Integration - Invalid Mate Puzzle (Wrong Side)

============================================================
📊 Results: 33 passed, 12 failed
============================================================
