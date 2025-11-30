# Canva Mode Lobby Visual Layouts

This document presents 3 different visual layout options for both the Entry Lobby and Pre-Game Lobby in canva mode.

---

## Entry Lobby Layouts

### Layout 1: Side-by-Side Cards (Current)

**Description**: Two equal-width cards displayed side by side on desktop, stacked on mobile.

```
┌─────────────────────────────────────────────────────────┐
│                    Canva                                │
│  Collaborative drawing canvas. Draw together with       │
│  friends in real-time!                                  │
│  💡 Tip: Customize your avatar from the sidebar...     │
│                                                          │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │  Create Room       │  │  Join Room         │        │
│  │                    │  │                    │        │
│  │  [Your name]       │  │  [Your name]       │        │
│  │                    │  │                    │        │
│  │  [Room name]       │  │  [Game PIN]        │        │
│  │                    │  │                    │        │
│  │  [Create Room]     │  │  [Join Room]       │        │
│  └────────────────────┘  └────────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: 2-column grid, equal width cards
- **Mobile**: Stacked vertically
- **Pros**: Clear separation, easy to understand
- **Cons**: Takes more vertical space, less compact

**CSS Grid**:
```css
.container {
  max-width: 2xl;
  padding: 1rem;
}

.cards-container {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Desktop */
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr; /* Mobile */
  }
}
```

---

### Layout 2: Tabbed Interface

**Description**: Single card with tabs to switch between Create and Join modes.

```
┌─────────────────────────────────────────────────────────┐
│                    Canva                                │
│  Collaborative drawing canvas. Draw together with       │
│  friends in real-time!                                  │
│  💡 Tip: Customize your avatar from the sidebar...     │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │  [Create Room]  [Join Room]  ← Tabs          │      │
│  ├──────────────────────────────────────────────┤      │
│  │                                               │      │
│  │  Your name:                                   │      │
│  │  [___________________________]               │      │
│  │                                               │      │
│  │  Room name:                                   │      │
│  │  [___________________________]               │      │
│  │                                               │      │
│  │  [Create Room]                                │      │
│  │                                               │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: Single card, tab navigation
- **Mobile**: Same, tabs become full-width buttons
- **Pros**: More compact, cleaner look, less scrolling
- **Cons**: Requires tab interaction, slightly more complex

**Implementation**:
```tsx
<Tabs defaultValue="create">
  <TabsList>
    <TabsTrigger value="create">Create Room</TabsTrigger>
    <TabsTrigger value="join">Join Room</TabsTrigger>
  </TabsList>
  <TabsContent value="create">
    {/* Create form */}
  </TabsContent>
  <TabsContent value="join">
    {/* Join form */}
  </TabsContent>
</Tabs>
```

---

### Layout 3: Split Screen with Visual Elements

**Description**: Full-width split with visual elements, larger buttons, more prominent.

```
┌─────────────────────────────────────────────────────────┐
│                    Canva                                │
│  Collaborative drawing canvas. Draw together with       │
│  friends in real-time!                                  │
│                                                          │
│  ┌──────────────────────────┬────────────────────────┐ │
│  │                          │                        │ │
│  │    🎨 CREATE ROOM        │    🔗 JOIN ROOM        │ │
│  │                          │                        │ │
│  │    Start a new game      │    Enter a room PIN    │ │
│  │    session               │    to join friends     │ │
│  │                          │                        │ │
│  │    [Your name]           │    [Your name]         │ │
│  │    [________________]    │    [________________]  │ │
│  │                          │                        │ │
│  │    [Room name]           │    [Game PIN]         │ │
│  │    [________________]    │    [________]         │ │
│  │                          │                        │ │
│  │    [  Create Room  ]     │    [  Join Room  ]     │ │
│  │                          │                        │ │
│  └──────────────────────────┴────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: 50/50 split, larger visual presence
- **Mobile**: Stacked, but maintains visual hierarchy
- **Pros**: More engaging, clear visual distinction, modern look
- **Cons**: More space, might be overwhelming on small screens

**CSS Grid**:
```css
.split-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  min-height: 400px;
}

.split-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
  border-radius: 0.5rem;
  background: var(--card);
}
```

---

## Pre-Game Lobby Layouts

### Layout 1: Three-Column Dashboard (Gartic Phone Style)

**Description**: Three-column layout with header and footer bars, inspired by Gartic Phone's lobby design.

```
┌─────────────────────────────────────────────────────────────────────┐
│  [← BACK]              GARTIC PHONE              [🔊]              │
├──────────────┬──────────────────────────┬──────────────────────────┤
│              │                          │                          │
│  PLAYERS     │      PRESETS             │   CUSTOM SETTINGS        │
│  1/14        │                          │                          │
│              │  ┌────┐ ┌────┐ ┌────┐   │                          │
│  [14 PLAYERS]│  │NORM│ │KNOC│ │SECR│   │                          │
│  ▼           │  │AL  │ │K-OF│ │ET  │   │                          │
│              │  └────┘ └────┘ └────┘   │                          │
│  👤 JUSTLEAFY│                          │                          │
│     👑       │  ┌────┐ ┌────┐ ┌────┐   │                          │
│              │  │ANIM│ │ICEB│ │COMP│   │                          │
│  👤 EMPTY    │  │ATIO│ │REAK│ │LEME│   │                          │
│              │  └────┘ └────┘ └────┘   │                          │
│  👤 EMPTY    │                          │                          │
│              │  ┌────┐ ┌────┐ ┌────┐   │                          │
│  👤 EMPTY    │  │MAST│ │STOR│ │MISS│   │                          │
│              │  │ERPI│ │Y   │ │ING │   │                          │
│  👤 EMPTY    │  └────┘ └────┘ └────┘   │                          │
│              │                          │                          │
│  👤 EMPTY    │                          │                          │
│              │                          │                          │
│              │                          │                          │
│              │                          │                          │
│              │                          │                          │
├──────────────┴──────────────────────────┴──────────────────────────┤
│              [🔗 INVITE]              [▶ START]                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: Three equal columns (1/3 each), fixed header and footer
- **Tablet**: Columns stack or adjust proportionally
- **Mobile**: All columns stack vertically
- **Pros**: 
  - Clear separation of concerns (players, presets, settings)
  - Modern dashboard feel
  - Efficient use of horizontal space
  - Familiar pattern for game lobbies
- **Cons**: 
  - Requires more horizontal space
  - Can feel cramped on smaller screens
  - More complex responsive behavior

**Column Breakdown**:
1. **Left Column - Players**:
   - Player count indicator (e.g., "1/14")
   - Player limit dropdown
   - Scrollable player list with avatars
   - Host/ready indicators
   - Empty slots shown

2. **Center Column - Presets**:
   - Grid of game mode presets (3x3)
   - Visual icons for each preset
   - Selected preset highlighted
   - "NEW!" tags for new modes
   - Click to select preset

3. **Right Column - Custom Settings**:
   - Settings panel for selected preset
   - Game configuration options
   - Word pack selection
   - Round time/max rounds
   - Other customizable parameters

**CSS Grid**:
```css
.lobby-container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  gap: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--header-bg);
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

.footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: var(--footer-bg);
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}
```

**Implementation Details**:
```tsx
<div className="lobby-container">
  {/* Header */}
  <header className="header">
    <Button variant="ghost" onClick={onBack}>
      ← BACK
    </Button>
    <h1 className="logo">CANVA</h1>
    <Button variant="ghost" onClick={toggleSound}>
      🔊
    </Button>
  </header>

  {/* Main Content */}
  <div className="main-content">
    {/* Left: Players */}
    <Card className="players-panel">
      <CardHeader>
        <CardTitle>PLAYERS {playerCount}/{maxPlayers}</CardTitle>
        <Select value={maxPlayers} onValueChange={setMaxPlayers}>
          <SelectTrigger>{maxPlayers} PLAYERS</SelectTrigger>
          <SelectContent>
            {[2, 4, 6, 8, 10, 12, 14].map(n => (
              <SelectItem key={n} value={n.toString()}>{n} PLAYERS</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="player-list">
          {players.map(player => (
            <PlayerRow key={player.id} player={player} />
          ))}
          {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
            <EmptySlot key={i} />
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Center: Presets */}
    <Card className="presets-panel">
      <CardHeader>
        <CardTitle>PRESETS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="presets-grid">
          {presets.map(preset => (
            <PresetCard
              key={preset.id}
              preset={preset}
              selected={selectedPreset === preset.id}
              onClick={() => setSelectedPreset(preset.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Right: Custom Settings */}
    <Card className="settings-panel">
      <CardHeader>
        <CardTitle>CUSTOM SETTINGS</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedPreset && <PresetSettings preset={selectedPreset} />}
      </CardContent>
    </Card>
  </div>

  {/* Footer */}
  <footer className="footer">
    <Button variant="outline" onClick={onInvite}>
      🔗 INVITE
    </Button>
    <Button 
      onClick={onStart} 
      disabled={!canStart}
      size="lg"
    >
      ▶ START
    </Button>
  </footer>
</div>
```

**Preset Grid Styling**:
```css
.presets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.preset-card {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-card.selected {
  border-color: var(--primary);
  background: var(--primary/10);
}

.preset-card:hover {
  transform: scale(1.05);
}
```

---

### Layout 2: Sidebar + Main (Current)

**Description**: Left sidebar with players and controls, main area with instructions.

```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │ Players (3)  │  │  Canva - Collaborative Drawing  │ │
│  │              │  │  Draw and guess words...        │ │
│  │ 👤 Player1   │  │                                 │ │
│  │    ✓ Ready   │  │  How to Play:                  │ │
│  │              │  │  1. Wait for all players...     │ │
│  │ 👤 Player2   │  │  2. The host will start...      │ │
│  │              │  │  3. One player draws...          │ │
│  │ 👤 Player3   │  │  ...                            │ │
│  │              │  │                                 │ │
│  ├──────────────┤  │  ┌──────────────────────────┐  │ │
│  │ Ready Up     │  │  │ Room PIN:                │  │ │
│  │              │  │  │ 123456                    │  │ │
│  │ [Not Ready]  │  │  │ Share this PIN...        │  │ │
│  │              │  │  └──────────────────────────┘  │ │
│  │ [Start Game] │  │                                 │ │
│  │   (Host)     │  │                                 │ │
│  │              │  │                                 │ │
│  │ [Leave Room] │  │                                 │ │
│  └──────────────┘  └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: 1/3 sidebar, 2/3 main area
- **Mobile**: Stacked, sidebar on top
- **Pros**: Clear separation, easy navigation
- **Cons**: Sidebar can feel cramped on mobile

**CSS Grid**:
```css
.lobby-container {
  display: grid;
  grid-template-columns: 1fr 2fr; /* Desktop */
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .lobby-container {
    grid-template-columns: 1fr; /* Mobile */
  }
}
```

---

### Layout 2: Centered Card with Surrounding Info

**Description**: Main content centered, players and controls around it in a more balanced layout.

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Players (3)              Room PIN: 123456       │  │
│  │  ┌────┐ ┌────┐ ┌────┐    Share with friends     │  │
│  │  │P1 ✓│ │P2  │ │P3 ✓│                           │  │
│  │  └────┘ └────┘ └────┘                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │        Canva - Collaborative Drawing Game       │  │
│  │                                                  │  │
│  │        How to Play:                             │  │
│  │        1. Wait for all players to ready up      │  │
│  │        2. The host will start the game          │  │
│  │        3. One player will be chosen to draw    │  │
│  │        4. Other players try to guess the word   │  │
│  │        5. Points are awarded for correct guesses│  │
│  │        6. The drawer rotates each round         │  │
│  │                                                  │  │
│  │        Status: 2/3 Ready                         │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Not Ready]  [Start Game] (Host)  [Leave Room] │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: Centered main content, info bars above/below
- **Mobile**: All stacked, but maintains visual hierarchy
- **Pros**: More balanced, focuses attention on main content
- **Cons**: Less efficient use of horizontal space

**CSS Grid**:
```css
.lobby-container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  max-width: 4xl;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bottom-bar {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
```

---

### Layout 3: Dashboard Style with Cards

**Description**: Multiple cards in a dashboard-style layout, more modular and flexible.

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Players (3)  │  │ Room Info    │  │ Game Status  │  │
│  │              │  │              │  │              │  │
│  │ 👤 Player1 ✓ │  │ PIN: 123456  │  │ 2/3 Ready    │  │
│  │ 👤 Player2   │  │              │  │              │  │
│  │ 👤 Player3 ✓ │  │ Share PIN    │  │ Waiting...   │  │
│  │              │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │              How to Play                         │  │
│  │                                                  │  │
│  │  1. Wait for all players to ready up            │  │
│  │  2. The host will start the game                │  │
│  │  3. One player will be chosen to draw            │  │
│  │  4. Other players try to guess the word          │  │
│  │  5. Points are awarded for correct guesses      │  │
│  │  6. The drawer rotates each round               │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [Not Ready]  [Start Game] (Host)  [Leave Room] │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Characteristics**:
- **Desktop**: 3-column top row, full-width bottom
- **Mobile**: All cards stack vertically
- **Pros**: Modular, easy to add/remove sections, modern dashboard feel
- **Cons**: Can feel busy, requires more vertical space

**CSS Grid**:
```css
.lobby-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Top row */
  gap: 1rem;
  margin-bottom: 1rem;
}

.instructions-card {
  grid-column: 1 / -1; /* Full width */
}

.actions-bar {
  grid-column: 1 / -1; /* Full width */
  display: flex;
  justify-content: center;
  gap: 1rem;
}

@media (max-width: 1024px) {
  .lobby-container {
    grid-template-columns: 1fr; /* Stack on mobile */
  }
}
```

---

## Responsive Behavior Comparison

### Layout 1 (Three-Column Dashboard)
- **Desktop**: Optimal three-column layout, all panels visible
- **Tablet**: Columns may stack or adjust to 2+1 layout
- **Mobile**: All columns stack vertically, header/footer remain fixed

### Layout 2 (Side-by-Side / Sidebar)
- **Desktop**: Optimal use of space, clear separation
- **Tablet**: Sidebar might feel narrow, cards stack
- **Mobile**: All stacked, good vertical flow

### Layout 3 (Tabbed / Centered)
- **Desktop**: Clean, focused, modern
- **Tablet**: Tabs work well, centered content readable
- **Mobile**: Tabs become full-width buttons, good UX

### Layout 4 (Split / Dashboard)
- **Desktop**: Engaging, visual, modern
- **Tablet**: Cards rearrange, still readable
- **Mobile**: All stacked, maintains hierarchy

---

## Implementation Recommendations

### Entry Lobby
- **Current**: Layout 1 (Side-by-Side) - Simple, works well
- **Recommended**: Layout 2 (Tabbed) - More compact, modern
- **Alternative**: Layout 3 (Split) - More engaging, visual

### Pre-Game Lobby
- **Current**: Layout 2 (Sidebar) - Functional, clear
- **Recommended**: Layout 1 (Three-Column Dashboard) - Modern, efficient, game-like
- **Alternative**: Layout 3 (Centered) - Better balance, focused
- **Alternative**: Layout 4 (Dashboard) - Modular, extensible

---

## Visual Design Considerations

### Color Scheme
- **Layout 1**: Standard card backgrounds, subtle borders
- **Layout 2**: More prominent primary colors, clear CTAs
- **Layout 3**: Card-based with varied backgrounds, visual hierarchy

### Typography
- **Layout 1**: Standard sizes, clear hierarchy
- **Layout 2**: Larger headings, more spacing
- **Layout 3**: Varied sizes, card-specific typography

### Spacing
- **Layout 1**: Standard padding, comfortable gaps
- **Layout 2**: More generous padding, centered spacing
- **Layout 3**: Card-based padding, consistent gaps

### Interactive Elements
- **Layout 1**: Standard buttons, clear states
- **Layout 2**: Larger buttons, prominent CTAs
- **Layout 3**: Card-based interactions, hover states

---

## Accessibility Considerations

All layouts should maintain:
- **Keyboard Navigation**: Tab order logical, focus visible
- **Screen Readers**: Proper ARIA labels, semantic HTML
- **Color Contrast**: WCAG AA compliance
- **Touch Targets**: Minimum 44x44px on mobile
- **Responsive Text**: Scales appropriately

---

## Migration Path

If switching layouts:

1. **Create new component variants** alongside existing
2. **Add feature flag** to toggle between layouts
3. **Test thoroughly** on all screen sizes
4. **Gather user feedback** before full migration
5. **Remove old layout** once validated

---

## Code Examples

### Layout 1 Implementation (Current)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <Card>Create Room</Card>
  <Card>Join Room</Card>
</div>
```

### Layout 2 Implementation (Tabbed)
```tsx
<Tabs defaultValue="create" className="w-full">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="create">Create Room</TabsTrigger>
    <TabsTrigger value="join">Join Room</TabsTrigger>
  </TabsList>
  <TabsContent value="create">
    {/* Create form */}
  </TabsContent>
  <TabsContent value="join">
    {/* Join form */}
  </TabsContent>
</Tabs>
```

### Layout 3 Implementation (Dashboard)
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>Players</Card>
  <Card>Room Info</Card>
  <Card>Game Status</Card>
</div>
<div className="mt-4">
  <Card className="col-span-full">Instructions</Card>
</div>
```

---

## Conclusion

Each layout has its strengths:
- **Layout 1**: Simple, proven, easy to maintain
- **Layout 2**: Modern, compact, better UX
- **Layout 3**: Engaging, modular, extensible

Choose based on:
- **User base**: Mobile-first vs desktop-first
- **Design goals**: Simplicity vs engagement
- **Maintenance**: Current team preferences
- **Future plans**: Extensibility needs

