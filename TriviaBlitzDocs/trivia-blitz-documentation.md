# Trivia Blitz Game Mode Documentation

## Overview

Trivia Blitz is a fast-paced multiplayer quiz game integrated into the Game Hub system. It follows a Kahoot-style architecture with real-time synchronization, where players compete to answer questions correctly and quickly to climb the leaderboard. The game supports 2-12 players and features a complete backend room management system.

## Game Flow

### Phase Sequence

The game follows a state machine with the following phases:

1. **Lobby** - Players join and wait for host to start
2. **Question Intro** - Brief "Get Ready!" transition (2 seconds)
3. **Question** - Active question with timer, players submit answers
4. **Answer Reveal** - Shows correct answer and answer distribution stats
5. **Scoring** - Calculates and displays points earned
6. **Leaderboard** - Shows top 5 players after each round
7. **Podium** - Final results showing 1st, 2nd, and 3rd place (end of game)
8. **Game Ended** - Game completion state

### Phase Transitions

```
Lobby → (Host starts) → Question Intro → Question → Answer Reveal → Scoring → Leaderboard
                                                                                    ↓
                                                                         (More questions?)
                                                                                    ↓
                                                                    Podium → Game Ended
```

## Architecture

### Backend Structure

#### Core Files

**`backend/src/triviaRoom.js`**
- `TriviaRoom` class managing game state and logic
- Handles player management (add, remove, connect, disconnect)
- Manages game phases and transitions
- Calculates scoring based on correctness, speed, and streaks
- Tracks answer statistics for each question
- Serializes room state for network transmission

**Key Methods:**
- `startGame()` - Initializes game, resets scores
- `nextQuestion()` - Advances to next question
- `submitAnswer(playerId, optionId, timeElapsed)` - Processes answer submission
- `calculatePoints(isCorrect, timeLeft, totalTime, streak)` - Scoring formula
- `getLeaderboard()` - Returns sorted player list
- `getPodium()` - Returns top 3 players
- `toJSON()` - Serializes room state

**`backend/src/triviaRoomRepository.js`**
- `TriviaRoomRepository` class managing collection of trivia rooms
- In-memory storage using `Map`
- Methods: `createRoom()`, `getRoom()`, `getRoomByPin()`, `deleteRoom()`, `listPublicRooms()`

**`backend/src/triviaQuestions.js`**
- Hardcoded quiz questions for MVP
- Currently contains sample questions
- Structure supports multiple quiz sets (planned feature)

#### Server Integration (`backend/src/server.js`)

**Socket.IO Event Handlers:**

**Client → Server:**
- `trivia:create-room` - Host creates a quiz room
  - Parameters: `{ roomName, playerName, avatar, quizId }`
  - Creates room with selected quiz questions
  - Returns: `trivia:room-created` with roomId and gamePin
  
- `trivia:join-room` - Player joins with PIN
  - Parameters: `{ gamePin, playerName, avatar }`
  - Returns: `trivia:joined` and `trivia:room-state`
  
- `trivia:start-game` - Host starts the quiz
  - Validates host permissions
  - Transitions room to "question-intro" phase
  - Automatically progresses through question flow
  
- `trivia:submit-answer` - Player submits answer
  - Parameters: `{ optionId }`
  - Calculates points based on speed and correctness
  - Returns: `trivia:answer-result` with points and correctness

**Server → Client:**
- `trivia:room-created` - Room creation confirmation
- `trivia:joined` - Join confirmation
- `trivia:player-joined` - New player notification
- `trivia:player-left` - Player disconnect notification
- `trivia:room-state` - Full room state sync
- `trivia:phase-changed` - Phase transition notification
- `trivia:question` - Question data broadcast
- `trivia:answer-reveal` - Answer reveal with stats
- `trivia:scoring` - Scoring phase data
- `trivia:leaderboard` - Leaderboard update
- `trivia:podium` - Final podium results
- `trivia:answer-result` - Individual answer feedback

### Frontend Structure

#### Directory Layout

```
src/games/trivia-blitz/
├── index.ts                    # Exports
├── hubEntry.tsx                # Hub integration (preview card, metadata)
├── state/
│   ├── TriviaContext.tsx       # Game state management (phases, players, scores)
│   └── types.ts                # TypeScript interfaces
├── hooks/
│   └── useSocket.ts            # Socket.IO connection hook
├── pages/
│   ├── TriviaBlitzApp.tsx      # Provider wrapper component
│   ├── Lobby.tsx               # Room creation/joining UI
│   └── Room.tsx                # Main game room with phase-based rendering
└── components/
    ├── LobbyView.tsx           # Lobby phase UI
    ├── HostView.tsx            # Host's question view (shows stats)
    ├── PlayerView.tsx          # Player's question view (answer buttons)
    ├── AnswerButton.tsx        # Reusable answer option button
    ├── QuestionTimer.tsx        # Countdown timer component
    ├── Leaderboard.tsx          # Top 5 rankings display
    └── Podium.tsx              # Final 1st/2nd/3rd display
```

#### State Management

**`TriviaContext.tsx`**
- React Context providing game state and socket interactions
- Manages connection lifecycle
- Handles all socket event listeners
- Provides hooks: `useTrivia()` returns `{ gameState, createRoom, joinRoom, submitAnswer, leaveRoom, isHost, isConnected }`

**State Structure (`types.ts`):**
```typescript
interface TriviaRoomState {
  roomId: string | null;
  gamePin: string | null;
  playerName: string;
  ownerId: string | null;
  selfId: string | null;
  players: Player[];
  phase: TriviaPhase;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: Question | null;
  answerStats: Record<string, number>;
  leaderboard: Player[];
  podium: { first: Player | null; second: Player | null; third: Player | null };
  quizId: string | null;
  quizName: string | null;
}
```

#### Component Architecture

**Phase-Based Rendering:**
- `Room.tsx` renders different components based on `gameState.phase`
- Host and players see different views during "question" phase
- All players see same view during other phases

**Key Components:**

1. **LobbyView** - Shows player list, start button (host only)
2. **HostView** - Displays question, answer stats, timer (host during question phase)
3. **PlayerView** - Shows answer buttons, timer (players during question phase)
4. **Leaderboard** - Displays top 5 players with scores
5. **Podium** - Shows 1st, 2nd, 3rd place winners

## Game Mechanics

### Scoring System

**Formula:**
```typescript
const BASE_POINTS = 1000;
const speedFactor = timeLeft / totalTime; // 0-1
const streakBonus = Math.min(streak * 100, 500); // Max 500 bonus
const points = BASE_POINTS * (0.5 + 0.5 * speedFactor) + streakBonus;
```

**Scoring Factors:**
- **Correctness**: Must answer correctly to earn points
- **Speed**: Faster answers earn more points (up to 2x base)
- **Streak**: Consecutive correct answers add bonus (max 500 points)

**Point Calculation:**
- Base: 1000 points for correct answer
- Speed multiplier: 0.5x to 1.0x based on time remaining
- Streak bonus: 0-500 points based on consecutive correct answers
- Total range: 500-2500 points per correct answer

### Question Structure

```typescript
interface Question {
  id: string;
  text: string;
  options: { id: string; text: string; color: string }[];
  correctOptionId: string;
  timeLimit: number; // seconds
  media?: { type: "image" | "video"; url: string };
}
```

**Answer Options:**
- Each option has a unique ID, text, and color
- Colors: red, blue, yellow, green (matching Kahoot style)
- Players select by clicking colored buttons

### Player Management

**Player Properties:**
- `id`: Unique player identifier
- `name`: Display name
- `score`: Total points accumulated
- `streak`: Consecutive correct answers
- `hasAnswered`: Whether player answered current question
- `answerTime`: Time taken to answer (ms)
- `connected`: WebSocket connection status
- `avatar`: Player avatar configuration

**Host Role:**
- First player to create room becomes host
- Host can start the game
- Host sees answer statistics during question phase
- Host ownership transfers if host disconnects

## Quiz System

### Current Implementation

**Hardcoded Quizzes:**
- Currently uses sample questions from `triviaQuestions.js`
- Structure supports multiple quiz sets
- Each quiz has: `id`, `name`, `description`, `questions[]`

**Quiz Selection:**
- Host selects quiz when creating room
- Quiz ID and name stored in room state
- Questions loaded from selected quiz

### Quiz Structure (Planned)

```typescript
interface Quiz {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}
```

**Available Quizzes:**
1. **General Knowledge** - Mixed topics
2. **Science & Technology** - STEM-focused
3. **Pop Culture** - Entertainment and trends

## Integration with Game Hub

### Registry Entry

**Location:** `backend/data/game-registry.json`

```json
{
  "id": "trivia-blitz",
  "version": "1.0.0",
  "name": { "default": "Trivia Blitz" },
  "description": { "default": "Fast-paced quiz game where speed and accuracy win. Answer questions faster than your friends!" },
  "status": "stable",
  "supportedPlayers": { "min": 2, "max": 12, "recommended": 6 },
  "monetization": "free",
  "category": ["trivia", "party"],
  "badges": ["new"],
  "assets": { "thumbnail": "/placeholder.svg" },
  "featureFlags": [],
  "visibleIf": ["public"],
  "route": { "slug": "trivia-blitz" },
  "plugin": {
    "previewComponent": "triviaBlitzPreview",
    "moduleId": "@/games/trivia-blitz"
  },
  "navigation": {
    "category": "trivia",
    "priority": 90
  }
}
```

### Routes

**Route Structure:**
- `/games/trivia-blitz` - Lobby (create/join room)
- `/games/trivia-blitz/room/:roomId` - Game room

**Router Configuration:**
```typescript
<Route path="trivia-blitz" element={<TriviaBlitzApp />}>
  <Route index element={<TriviaLobby />} />
  <Route path="room/:roomId" element={<TriviaRoom />} />
</Route>
```

### Hub Entry

**File:** `src/games/trivia-blitz/hubEntry.tsx`

- Exports `getTriviaBlitzPreviewEntry()` - Registry entry metadata
- Exports `TriviaBlitzPreviewCard` - Custom preview component
- Exports `getTriviaBlitzPreviewComponent()` - Factory function

**Preview Component Registration:**
- Registered in `src/games/registry.ts`
- Maps `"triviaBlitzPreview"` to component

## Socket.IO Communication

### Connection Flow

1. **Client connects** to Socket.IO server
2. **Create/Join room** - Client emits `trivia:create-room` or `trivia:join-room`
3. **Server responds** with room state and session info
4. **Client joins socket room** - Server adds socket to room namespace
5. **Game events** - Bidirectional communication during gameplay

### Event Flow Example

**Room Creation:**
```
Client: trivia:create-room { roomName, playerName, avatar, quizId }
  ↓
Server: Creates TriviaRoom, adds player as host
  ↓
Server: trivia:room-created { roomId, gamePin, room }
Server: trivia:room-state { full room state }
  ↓
Client: Updates state, navigates to room
```

**Answer Submission:**
```
Client: trivia:submit-answer { optionId }
  ↓
Server: Calculates points, updates player state
  ↓
Server: trivia:answer-result { isCorrect, points, newScore }
  ↓
Client: Updates UI with result
```

## State Synchronization

### Server as Source of Truth

- All game state managed on server (`TriviaRoom` class)
- Client receives state updates via socket events
- Client state mirrors server state
- Server validates all actions (host permissions, phase checks)

### State Updates

**Automatic Updates:**
- Phase changes broadcast to all players
- Player joins/leaves broadcast to room
- Answer submissions update server state immediately
- Leaderboard recalculated after each question

**Manual Sync:**
- `trivia:room-state` event provides full state snapshot
- Sent on join, reconnect, or explicit request

## Error Handling

### Client-Side

- Connection errors handled gracefully
- Room not found → redirect to lobby
- Invalid PIN → error toast
- Room full → error message

### Server-Side

- Validates host permissions before actions
- Checks phase before allowing actions
- Validates player exists before operations
- Returns error events for invalid operations

## Performance Considerations

### Backend

- In-memory room storage (no database persistence)
- Rooms cleaned up when empty
- Efficient state serialization
- Minimal state updates (only on changes)

### Frontend

- React Context for state management
- Memoized components where appropriate
- Efficient re-renders (only affected components)
- Socket connection pooling

## Future Enhancements

### Planned Features

1. **Database Persistence**
   - Store room state in database
   - Support room recovery after server restart
   - Player statistics tracking

2. **Enhanced Quiz System**
   - Dynamic quiz loading from API
   - User-generated quizzes
   - Quiz categories and filtering
   - Difficulty levels

3. **Advanced Features**
   - Power-ups and special abilities
   - Team mode
   - Custom time limits per question
   - Media support (images, videos)

4. **Analytics**
   - Player performance tracking
   - Question difficulty analysis
   - Popular quiz tracking

## Development Notes

### Key Design Decisions

1. **Separate Room Classes**: `TriviaRoom` separate from `GameRoom` (Paint & Guess) for game-specific logic
2. **Phase-Based State Machine**: Clear phase transitions for predictable game flow
3. **Host/Player Differentiation**: Different views and permissions for better UX
4. **Speed-Based Scoring**: Rewards quick thinking, not just correctness
5. **Real-Time Synchronization**: Socket.IO for instant updates across all clients

### Testing Considerations

- Test phase transitions
- Test scoring calculations
- Test host permissions
- Test player disconnect/reconnect
- Test room capacity limits
- Test answer submission timing

## File Reference

### Backend Files

- `backend/src/triviaRoom.js` - Core game logic
- `backend/src/triviaRoomRepository.js` - Room collection management
- `backend/src/triviaQuestions.js` - Quiz questions
- `backend/src/server.js` - Socket.IO handlers (lines ~1082-1400+)

### Frontend Files

- `src/games/trivia-blitz/state/TriviaContext.tsx` - State management
- `src/games/trivia-blitz/state/types.ts` - TypeScript types
- `src/games/trivia-blitz/pages/Lobby.tsx` - Lobby page
- `src/games/trivia-blitz/pages/Room.tsx` - Game room page
- `src/games/trivia-blitz/components/*` - Phase-specific components
- `src/games/trivia-blitz/hubEntry.tsx` - Hub integration

### Configuration Files

- `backend/data/game-registry.json` - Registry entry
- `src/games/registry/fallback.ts` - Fallback registry entry
- `src/router/index.tsx` - Route configuration

