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
                                    ↓                    ↑                          ↓
                              (Timer or all              │                   (More questions?)
                               players answer)            │                          ↓
                                                          │                  Podium → Game Ended
                                                          │
                                    (Early termination when all non-host players answer)
```

**Note:** Question phase automatically transitions to Answer Reveal when:
- All non-host players have submitted answers (early termination), OR
- Timer expires (normal termination)

## Architecture

### Backend Structure

#### Core Files

**`backend/src/triviaRoom.js`**
- `TriviaRoom` class managing game state and logic
- Handles player management (add, remove, connect, disconnect)
- Manages game phases and transitions
- Calculates scoring based on correctness, speed, and streaks
- Tracks answer statistics for each question
- Manages question timer with early termination support
- Excludes host from leaderboard and podium rankings
- Serializes room state for network transmission

**Key Methods:**
- `startGame()` - Initializes game, resets scores
- `nextQuestion()` - Advances to next question
- `submitAnswer(playerId, optionId, timeElapsed)` - Processes answer submission
- `calculatePoints(isCorrect, timeLeft, totalTime, streak)` - Scoring formula
- `allPlayersAnswered()` - Checks if all non-host players have answered (excludes host)
- `getLeaderboard()` - Returns sorted player list (excludes host)
- `getPodium()` - Returns top 3 players (excludes host)
- `clearQuestionTimer()` - Clears question timer for early termination
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
- `trivia:scoring` - Scoring phase data (updated player scores)
- `trivia:leaderboard` - Leaderboard update (excludes host)
- `trivia:podium` - Final podium results (excludes host)
- `trivia:answer-result` - Individual answer feedback
- `trivia:all-answered` - Notification when all players have answered (triggers early termination)

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

1. **LobbyView** - Pre-game lobby with 3-column layout (Players/PIN/Controls | Rules | Room Info)
2. **HostView** - Displays question, answer stats, timer (host during question phase)
3. **PlayerView** - Shows answer buttons, timer (players during question phase)
4. **Leaderboard** - Displays top 5 players with scores and avatars (excludes host)
5. **Podium** - Shows 1st, 2nd, 3rd place winners with avatars (excludes host)
6. **QuestionTimer** - Countdown timer component for questions
7. **AnswerButton** - Reusable answer option button with color coding

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
- `avatar`: Player avatar configuration (string or AvatarConfig object)

**Host Role:**
- First player to create room becomes host
- Host can start the game
- Host sees answer statistics during question phase
- Host does NOT participate in answering questions
- Host is excluded from leaderboard and podium rankings
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

## Avatar System Integration

### Avatar Support

Trivia Blitz is fully integrated with the Game Hub avatar system, allowing players to customize and display their avatars throughout the game.

**Avatar Integration Points:**

1. **Lobby Page (`Lobby.tsx`)**
   - Loads avatar config from localStorage
   - Listens for `avatar-config-updated` events from HubLayout
   - Encodes avatar as JSON string for transmission
   - Sends avatar when creating or joining rooms

2. **Pre-Game Lobby (`LobbyView.tsx`)**
   - Displays player avatars using `AvatarPreview` component
   - Handles both string (JSON-encoded) and object avatar formats
   - Shows avatar customization reminder message
   - Falls back to name initial if avatar unavailable

3. **Leaderboard (`Leaderboard.tsx`)**
   - Displays avatars for top 5 players
   - Shows avatar with rank badge overlay
   - Excludes host from display

4. **Podium (`Podium.tsx`)**
   - Shows avatars for 1st, 2nd, and 3rd place winners
   - Larger avatar sizes (80px for 1st, 64px for 2nd/3rd)
   - Excludes host from podium

**Avatar Data Flow:**
```
HubLayout (Avatar Customizer)
  ↓ (avatar-config-updated event)
Lobby (listens, updates state)
  ↓ (fetches latest config)
TriviaContext.createRoom/joinRoom(avatar)
  ↓ (encodes as JSON string)
Socket.IO → Backend
  ↓ (stores in player object)
LobbyView/Leaderboard/Podium (renders with AvatarPreview)
```

**Avatar Rendering:**
- Uses `AvatarPreview` component from Paint & Guess
- Supports DiceBear API for avatar generation
- Handles both old string format and new `AvatarConfig` object format
- Automatic fallback to name initial if avatar missing

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
- `/hub/games/trivia-blitz` - Lobby (create/join room)
- `/hub/games/trivia-blitz/room/:roomId` - Game room

**Router Configuration:**
```typescript
<Route path="hub" element={<HubLayout />}>
  <Route path="games">
    <Route path="trivia-blitz" element={<TriviaBlitzApp />}>
      <Route index element={<TriviaBlitzLobby />} />
      <Route path="room/:roomId" element={<TriviaBlitzRoom />} />
    </Route>
  </Route>
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

## Timer System

### Automatic Early Termination

The question timer automatically ends when all non-host players have submitted answers, even if time remains. This prevents unnecessary waiting and keeps the game pace fast.

**Implementation:**
- Timer stored in `TriviaRoom.questionTimer` property
- `allPlayersAnswered()` method checks if all non-host players have answered
- When all players answer, `transitionToAnswerReveal()` is called immediately
- Timer is cleared and phase transitions to answer-reveal
- Falls back to time limit expiration if not all players answer

**Timer Flow:**
```
Question starts → Timer set for timeLimit seconds
  ↓
Player submits answer → Check allPlayersAnswered()
  ↓
All non-host players answered? → Clear timer → Transition to answer-reveal
  OR
Timer expires → Transition to answer-reveal
```

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
Server: Checks allPlayersAnswered()
  ↓
If all answered: Clear timer → transitionToAnswerReveal()
  OR
Continue waiting for timer/other players
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

## Recent Improvements

### Avatar System Integration (Latest)
- Full avatar support across all game components
- Avatar display in LobbyView, Leaderboard, and Podium
- Integration with HubLayout avatar customizer
- Event listener for real-time avatar updates
- DiceBear rendering with fallback support

### Timer System Enhancement (Latest)
- Automatic early termination when all non-host players finish
- Timer stored in room object for proper cleanup
- `allPlayersAnswered()` method excludes host from check
- Immediate phase transition when all players answer
- Prevents unnecessary waiting periods

### Host Exclusion (Latest)
- Host excluded from leaderboard rankings
- Host excluded from podium (1st, 2nd, 3rd place)
- Host doesn't participate in answering questions
- Fair gameplay for all participating players

### UI/UX Improvements (Latest)
- Lobby structure matches Paint & Guess for consistency
- 3-column pre-game lobby layout
- Quiz selection UI (similar to word pack selection)
- Improved scoring phase with actual score display
- Leave Room button accessible in all phases
- Header banner with room info for all game phases
- Avatar customization reminders

### Phase Management (Latest)
- Improved scoring phase display with player rankings
- Better phase transition feedback
- All players can leave room from any phase
- Consistent header banner across all phases

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

## UI/UX Features

### Lobby Structure

**Pre-Game Lobby (`LobbyView.tsx`):**
- 3-column responsive layout matching Paint & Guess structure
- **Left Column**: Player list, Game PIN (with copy button), Start Game controls, Leave Room button
- **Middle Column**: Game Rules card with Trivia Blitz-specific instructions
- **Right Column**: Room Info card with room details, player count, quiz info
- Header banner with Room ID, PIN, and Leave Room button (all phases)
- Avatar display for all players
- Host badge indication

**Lobby Page (`Lobby.tsx`):**
- Matches Paint & Guess lobby structure
- Quiz selection UI (similar to word pack selection)
- Avatar customization reminder message
- Player count information (2-12 players)
- Side-by-side cards for Host Game and Join Game

### Phase Displays

**Scoring Phase:**
- Shows actual player scores with rankings
- Highlights 1st place player
- Excludes host from score display
- Displays "Moving to leaderboard..." message
- Automatically transitions after 2 seconds

**Answer Reveal Phase:**
- Shows question text
- Displays all answer options with selection counts
- Highlights correct answer in green
- Shows distribution statistics

**All Phases:**
- Header banner with Leave Room button (accessible to all players)
- Consistent styling and layout
- Responsive design for mobile and desktop

## Development Notes

### Key Design Decisions

1. **Separate Room Classes**: `TriviaRoom` separate from `GameRoom` (Paint & Guess) for game-specific logic
2. **Phase-Based State Machine**: Clear phase transitions for predictable game flow
3. **Host/Player Differentiation**: Different views and permissions for better UX
4. **Speed-Based Scoring**: Rewards quick thinking, not just correctness
5. **Real-Time Synchronization**: Socket.IO for instant updates across all clients
6. **Timer Early Termination**: Automatically ends question when all players finish for better pacing
7. **Host Exclusion**: Host doesn't play, excluded from rankings for fairness
8. **Avatar Integration**: Full avatar system support for player personalization
9. **Consistent UI**: Lobby structure matches Paint & Guess for familiar user experience

### Testing Considerations

- Test phase transitions (especially scoring → leaderboard)
- Test scoring calculations
- Test host permissions
- Test player disconnect/reconnect
- Test room capacity limits
- Test answer submission timing
- Test timer early termination when all players answer
- Test host exclusion from leaderboard/podium
- Test avatar display in all components
- Test leave room functionality from all phases
- Test quiz selection in lobby

## File Reference

### Backend Files

- `backend/src/triviaRoom.js` - Core game logic
- `backend/src/triviaRoomRepository.js` - Room collection management
- `backend/src/triviaQuestions.js` - Quiz questions
- `backend/src/server.js` - Socket.IO handlers for Trivia Blitz
  - `transitionToAnswerReveal()` - Helper function for phase transitions
  - `startQuestion()` - Starts question with timer management
  - Automatic phase progression and timer handling

### Frontend Files

- `src/games/trivia-blitz/state/TriviaContext.tsx` - State management
- `src/games/trivia-blitz/state/types.ts` - TypeScript types
- `src/games/trivia-blitz/pages/Lobby.tsx` - Lobby page
- `src/games/trivia-blitz/pages/Room.tsx` - Game room page
- `src/games/trivia-blitz/components/LobbyView.tsx` - Pre-game lobby (3-column layout)
- `src/games/trivia-blitz/components/HostView.tsx` - Host question view
- `src/games/trivia-blitz/components/PlayerView.tsx` - Player question view
- `src/games/trivia-blitz/components/Leaderboard.tsx` - Leaderboard display with avatars
- `src/games/trivia-blitz/components/Podium.tsx` - Final podium with avatars
- `src/games/trivia-blitz/components/QuestionTimer.tsx` - Timer component
- `src/games/trivia-blitz/components/AnswerButton.tsx` - Answer option button
- `src/games/trivia-blitz/hubEntry.tsx` - Hub integration

### Configuration Files

- `backend/data/game-registry.json` - Registry entry
- `src/games/registry/fallback.ts` - Fallback registry entry
- `src/router/index.tsx` - Route configuration

