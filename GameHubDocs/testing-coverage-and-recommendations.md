# Testing Coverage and Recommendations

## Current Test Status

### Test Count Summary

**Total Unit Tests: 67**

1. **`src/lib/__tests__/avatarConfig.test.ts`** - 19 tests
   - Avatar ID generation (2 tests)
   - Default config creation (3 tests)
   - Config cloning (2 tests)
   - Encoding/decoding (3 tests)
   - Save/load functionality (6 tests)
   - LocalStorage quota handling (1 test)
   - Default config validation (2 tests)

2. **`src/components/__tests__/HubLayout.test.ts`** - 3 tests
   - Navigation ordering
   - Fallback behavior
   - Hidden/disabled game filtering

3. **`api/tests/http.test.js`** - 45 tests
   - 5 API versions × 9 request scenarios each

### Test Scripts

Available in `package.json`:

```json
"test": "vitest run",           // Run all tests once
"test:watch": "vitest",         // Watch mode (runs on file changes)
"test:ui": "vitest --ui",       // Visual test UI
"test:coverage": "vitest --coverage"  // Run with coverage report
```

**Usage:**
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode (auto-runs on file changes)
npm run test:ui       # Open visual test UI
npm run test:coverage # Generate coverage report
```

## Testing Frameworks

### Vitest (Unit/Integration Testing)
- **Status:** ✅ Installed and configured
- **Version:** `^2.1.4`
- **Purpose:** Unit tests for React components, utilities, hooks
- **Location:** Frontend tests in `src/**/__tests__/`

### Playwright (End-to-End Testing)
- **Status:** ✅ Installed
- **Version:** `@playwright/test: ^1.56.1`
- **Purpose:** Browser automation and E2E testing
- **Note:** Not yet configured (needs `playwright.config.ts`)

### Node.js Test Runner
- **Status:** ✅ In use
- **Purpose:** Backend API tests
- **Location:** `api/tests/http.test.js`

## Coverage Analysis

### Current Coverage Estimate: ~5%

**Well Tested:**
- ✅ Avatar configuration system (comprehensive)
- ✅ HubLayout navigation logic
- ✅ API endpoint responses

**Not Tested:**
- ❌ Core game logic (0%)
- ❌ Security utilities (0%)
- ❌ Room management (0%)
- ❌ State management (0%)
- ❌ Game scoring (0%)

## Critical Areas Missing Tests

### 🔴 Priority 1: Core Game Logic

#### Trivia Blitz (`backend/src/triviaRoom.js`)

**Critical Functions to Test:**

1. **`calculatePoints(isCorrect, timeLeft, totalTime, streak)`**
   - Scoring formula validation
   - Edge cases (0 time left, max streak, incorrect answers)
   - Point range validation (500-2500 for correct answers)

2. **`submitAnswer(playerId, optionId, timeElapsed)`**
   - Answer validation
   - Duplicate answer prevention
   - Phase validation (only in "question" phase)
   - Score calculation integration
   - Streak tracking

3. **`nextQuestion()`**
   - Phase transitions
   - Question index advancement
   - End of game detection

4. **`allPlayersAnswered()`**
   - Player state checking
   - Host exclusion logic
   - Edge cases (no players, all disconnected)

5. **`getLeaderboard()`**
   - Sorting by score
   - Tie-breaking logic
   - Top 5 limit

6. **`startGame()`**
   - Minimum player validation
   - Question availability check
   - State initialization

**Recommended Test File:** `backend/src/__tests__/triviaRoom.test.js`

#### Paint & Guess (`backend/src/gameRoom.js`)

**Critical Functions to Test:**
- Round management
- Scoring logic
- Player rotation
- Word selection
- Guess validation

**Recommended Test File:** `backend/src/__tests__/gameRoom.test.js`

#### Canva Room (`backend/src/canvaRoom.js`)

**Critical Functions to Test:**
- State synchronization
- Player management
- Canvas state management

**Recommended Test File:** `backend/src/__tests__/canvaRoom.test.js`

### 🔴 Priority 2: Security & Sanitization

#### Sanitization Functions (`backend/src/server.js`)

**Critical Functions to Test:**

1. **`sanitizeName(name, fallback)`**
   - Invalid input types
   - Length limits (MAX_NAME_LENGTH = 24)
   - Special character removal
   - Empty string handling
   - Fallback usage

2. **`sanitizeMessage(message)`**
   - Invalid input types
   - Length limits (MAX_MESSAGE_LENGTH = 200)
   - Trimming behavior
   - Empty string handling

3. **`sanitizeAvatar(avatar)`**
   - Invalid input types
   - Length limits (MAX_AVATAR_LENGTH = 2048)
   - Null handling
   - String validation

4. **`generateRoomId()`**
   - Format validation
   - Uniqueness (statistical)
   - Length consistency

**Recommended Test File:** `backend/src/__tests__/sanitization.test.js`

### 🔴 Priority 3: Authentication

#### Auth Utilities (`backend/src/auth/utils.js`)

**Critical Functions to Test:**

1. **`generateToken(userId, email)`**
   - Token structure
   - Expiration handling
   - Payload validation

2. **`verifyToken(token)`**
   - Valid token verification
   - Invalid token rejection
   - Expired token handling
   - Malformed token handling

3. **`extractTokenFromHeader(req)`**
   - Bearer token extraction
   - Missing header handling
   - Invalid format handling

4. **`hashPassword(password)` / `comparePassword(password, hashedPassword)`**
   - Password hashing
   - Hash comparison
   - Security validation

**Recommended Test File:** `backend/src/auth/__tests__/utils.test.js`

### 🟡 Priority 4: Game Registry

#### Registry Functions (`backend/src/gameRegistry.js`)

**Functions to Test:**
- `getRegistry()` - Registry loading
- `getGameEntryById()` - Entry lookup
- `loadGameRegistry()` - Force refresh
- Fallback registry logic
- Cache behavior

**Recommended Test File:** `backend/src/__tests__/gameRegistry.test.js`

### 🟡 Priority 5: Room Repositories

#### TriviaRoomRepository (`backend/src/triviaRoomRepository.js`)

**Functions to Test:**
- `createRoom()` - Room creation
- `getRoom(id)` - Room retrieval
- `getRoomByPin(pin)` - PIN lookup
- `deleteRoom(id)` - Room deletion
- `listPublicRooms()` - Public room listing

**Recommended Test File:** `backend/src/__tests__/triviaRoomRepository.test.js`

#### RoomRepository (`backend/src/roomRepository.js`)

**Functions to Test:**
- Room CRUD operations
- Room persistence
- Room cleanup

**Recommended Test File:** `backend/src/__tests__/roomRepository.test.js`

### 🟡 Priority 6: Frontend Utilities

#### Avatar Validation (`src/lib/avatar/validation.ts`)

**Functions to Test:**
- `validateAvatarConfig()` - Config validation
- `sanitizeAvatarConfig()` - Config sanitization
- `safeLoadAvatarConfig()` - Safe loading

**Recommended Test File:** `src/lib/avatar/__tests__/validation.test.ts`

#### Utility Functions (`src/lib/utils.ts`, `src/lib/gutenberg.ts`)

**Functions to Test:**
- `getCoverColor()` - Color mapping
- Other utility functions

**Recommended Test File:** `src/lib/__tests__/utils.test.ts`

## Recommended Test Structure

### Backend Tests

```
backend/src/__tests__/
├── triviaRoom.test.js              # Priority 1
├── gameRoom.test.js                 # Priority 1
├── canvaRoom.test.js                # Priority 1
├── sanitization.test.js             # Priority 2
├── gameRegistry.test.js             # Priority 4
├── triviaRoomRepository.test.js     # Priority 5
└── roomRepository.test.js           # Priority 5

backend/src/auth/__tests__/
└── utils.test.js                    # Priority 3
```

### Frontend Tests

```
src/lib/avatar/__tests__/
└── validation.test.ts               # Priority 6

src/lib/__tests__/
└── utils.test.ts                    # Priority 6

src/games/trivia-blitz/__tests__/
└── TriviaContext.test.tsx           # Integration tests

src/games/paint-and-guess/__tests__/
└── GameContext.test.tsx              # Integration tests
```

## Test Implementation Guidelines

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { functionToTest } from '../path/to/module';

describe('functionToTest', () => {
  beforeEach(() => {
    // Setup if needed
  });

  it('should handle normal case', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });

  it('should handle edge case', () => {
    const result = functionToTest(edgeCaseInput);
    expect(result).toBe(expected);
  });

  it('should handle error case', () => {
    expect(() => functionToTest(invalidInput)).toThrow();
  });
});
```

### Backend Test Template (Node.js)

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { functionToTest } from '../path/to/module.js';

describe('functionToTest', () => {
  it('should handle normal case', () => {
    const result = functionToTest(input);
    assert.strictEqual(result, expected);
  });
});
```

## Testing Best Practices

### 1. Test Coverage Goals

- **Critical Functions:** 100% coverage
- **Game Logic:** 80%+ coverage
- **Utilities:** 90%+ coverage
- **Overall:** 70%+ coverage

### 2. Test Categories

- **Unit Tests:** Test individual functions in isolation
- **Integration Tests:** Test component interactions
- **E2E Tests:** Test full user flows (Playwright)

### 3. Test Naming

- Use descriptive names: `should calculate points correctly for fast correct answer`
- Group related tests with `describe` blocks
- Test one thing per test case

### 4. Test Organization

- One test file per source file
- Mirror directory structure
- Use `__tests__` directories

### 5. Mocking

- Mock external dependencies (localStorage, fetch, Socket.IO)
- Use Vitest's `vi.mock()` for module mocking
- Mock time-dependent functions

## Implementation Roadmap

### Phase 1: Critical Game Logic (Week 1)
- [ ] `TriviaRoom.calculatePoints()` tests
- [ ] `TriviaRoom.submitAnswer()` tests
- [ ] `TriviaRoom` state management tests
- [ ] Sanitization function tests

### Phase 2: Security (Week 2)
- [ ] Authentication utility tests
- [ ] Token generation/verification tests
- [ ] Password hashing tests

### Phase 3: Room Management (Week 3)
- [ ] Repository tests
- [ ] Room CRUD operation tests
- [ ] Registry tests

### Phase 4: Frontend (Week 4)
- [ ] Validation utility tests
- [ ] Context integration tests
- [ ] Component unit tests

### Phase 5: E2E (Week 5)
- [ ] Playwright configuration
- [ ] Critical user flow tests
- [ ] Multiplayer scenario tests

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npx vitest run path/to/test/file.test.ts
```

### Run Tests Matching Pattern
```bash
npx vitest run -t "calculatePoints"
```

## Continuous Integration

### Recommended CI Configuration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Metrics to Track

### Coverage Metrics
- Line coverage
- Function coverage
- Branch coverage
- Statement coverage

### Test Metrics
- Total test count
- Test execution time
- Test pass rate
- Flaky test count

## Next Steps

1. **Start with Priority 1:** Implement tests for `TriviaRoom.calculatePoints()`
2. **Add sanitization tests:** Critical for security
3. **Set up coverage reporting:** Track progress
4. **Configure Playwright:** For E2E testing
5. **Add CI integration:** Automated testing on PRs

## Resources

- **Vitest Docs:** https://vitest.dev/
- **Playwright Docs:** https://playwright.dev/
- **Testing Best Practices:** https://testingjavascript.com/

## Notes

- Current test count: **67 tests**
- Estimated coverage: **~5%**
- Target coverage: **70%+**
- Critical areas untested: **Core game logic, security utilities**

