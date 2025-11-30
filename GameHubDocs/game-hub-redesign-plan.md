# Game Hub Redesign Plan - Hero/Featured Game View

## Overview

Moving from a grid-based game discovery to an immersive, hero-focused game launcher interface inspired by modern game launchers (MISTY, Steam, Epic Games). The new design emphasizes individual game presentation with blurred backgrounds, dark theme, and enhanced action buttons.

## Design Reference Analysis

### Key Features from Reference

1. **Hero Game View**
   - Large, prominent game title
   - Full-width blurred background image
   - Game description prominently displayed
   - Multiple action buttons (PLAY, CONFIGURE)
   - Bottom action bar (MOD LIST, OUR SITE)

2. **Dark Theme**
   - Dark background with purple accents
   - High contrast for readability
   - Semi-transparent overlays

3. **Top Bar Enhancements**
   - User profile with avatar
   - Cloud/loading status indicators
   - Play statistics (games played today)
   - Window controls

4. **Left Sidebar**
   - Icon-based navigation (already implemented)
   - Expanded/collapsed states (already implemented)

## Implementation Plan

### Phase 1: Game Detail/Hero View Component

Create a new component for individual game presentation:

**File**: `src/pages/GameDetail.tsx` or `src/components/GameHero.tsx`

**Features**:
- Blurred background image from game assets
- Large game title display
- Game description
- Primary action button (PLAY)
- Secondary action button (CONFIGURE/SETTINGS)
- Bottom action buttons (optional: MOD LIST, WEBSITE, etc.)
- Dark theme styling

### Phase 2: Enhanced Top Bar

Add to `HubLayout.tsx`:

**Features**:
- User profile section (already exists, needs enhancement)
- Cloud/loading status indicator
- Play statistics display
- Window controls (for desktop app version)

### Phase 3: Update All Games Page

Modify `AllGames.tsx`:

**Options**:
1. **Option A**: Keep grid, add hero section at top for featured game
2. **Option B**: Replace grid with hero view, show other games in sidebar/carousel
3. **Option C**: Hybrid - hero view for selected game, grid below for others

**Recommended**: Option A (hybrid approach)

### Phase 4: Dark Theme Implementation

**Changes Needed**:
- Update color scheme to dark theme
- Add purple accent colors
- Ensure proper contrast ratios
- Update all components for dark theme

### Phase 5: Background Image System

**Requirements**:
- Games need background images (not just thumbnails)
- Blur effect on background
- Overlay for text readability
- Responsive image loading

## Component Structure

### GameHero Component

```tsx
interface GameHeroProps {
  game: HubGame;
  onPlay: () => void;
  onConfigure?: () => void;
}

const GameHero = ({ game, onPlay, onConfigure }: GameHeroProps) => {
  return (
    <div className="relative min-h-[600px] overflow-hidden rounded-lg">
      {/* Blurred Background */}
      <div className="absolute inset-0">
        <img 
          src={game.assets.background || game.assets.thumbnail} 
          alt={game.displayName}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full min-h-[600px] flex-col justify-between p-8 text-white">
        {/* Game Info */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold">{game.displayName}</h1>
          <p className="max-w-2xl text-lg">{game.displayDescription}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button size="lg" onClick={onPlay}>
            PLAY
          </Button>
          {onConfigure && (
            <Button size="lg" variant="outline" onClick={onConfigure}>
              <Settings className="mr-2 h-4 w-4" />
              CONFIGURE
            </Button>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between">
          <Button variant="ghost">
            <List className="mr-2 h-4 w-4" />
            MOD LIST
          </Button>
          {game.assets.websiteUrl && (
            <Button variant="ghost" asChild>
              <a href={game.assets.websiteUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                OUR SITE
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Enhanced Top Bar

```tsx
const TopBar = () => {
  const { user } = useAuth();
  const [playStats, setPlayStats] = useState({ today: 0 });
  const [cloudStatus, setCloudStatus] = useState("loaded");

  return (
    <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-3">
      {/* Left: Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">Played today: {playStats.today}</span>
        </div>
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          <span className="text-sm capitalize">{cloudStatus}</span>
        </div>
      </div>

      {/* Right: User & Controls */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <AvatarPreview config={avatarConfig} size={24} />
            <span className="text-sm">{user.username}</span>
          </div>
        )}
        {/* Window controls for desktop app */}
      </div>
    </header>
  );
};
```

## Data Structure Updates

### Game Registry Schema Additions

```typescript
interface GameAssets {
  thumbnail: string;
  background?: string;        // NEW: Full background image
  websiteUrl?: string;        // NEW: Game website URL
  modListUrl?: string;        // NEW: Mod list URL (if applicable)
  trailerUrl?: string;        // Existing
  patchNotesUrl?: string;     // Existing
}

interface GameConfig {
  hasConfiguration?: boolean; // NEW: Whether game has config options
  hasMods?: boolean;          // NEW: Whether game supports mods
  configureRoute?: string;    // NEW: Route to configuration page
}
```

## Styling Updates

### Dark Theme Colors

```css
:root {
  --background: 0 0% 10%;           /* Very dark */
  --foreground: 0 0% 98%;           /* Near white */
  --primary: 270 70% 50%;          /* Purple */
  --primary-foreground: 0 0% 98%;
  --accent: 270 60% 40%;           /* Darker purple */
  --muted: 0 0% 15%;               /* Dark gray */
  --muted-foreground: 0 0% 65%;
  --border: 0 0% 20%;
}
```

### Blur Effects

```css
.backdrop-blur-game {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.bg-overlay {
  background: rgba(0, 0, 0, 0.6);
}
```

## Routing Updates

### New Routes

```tsx
<Route path="/hub" element={<HubLayout />}>
  <Route index element={<AllGames />} />
  <Route path="games/:gameId" element={<GameDetail />} />
  <Route path="games/:gameId/configure" element={<GameConfigure />} />
  <Route path="games">
    {/* Existing game routes */}
  </Route>
</Route>
```

## Migration Strategy

### Step 1: Create GameHero Component
- Build component with blurred background
- Add action buttons
- Test with existing games

### Step 2: Update AllGames Page
- Add featured game hero section at top
- Keep grid below for other games
- Add navigation to game detail page

### Step 3: Create GameDetail Page
- Full hero view for individual game
- Navigation back to all games
- Related games section

### Step 4: Enhance Top Bar
- Add statistics
- Add cloud status
- Improve user profile display

### Step 5: Dark Theme
- Update color scheme
- Test all components
- Ensure accessibility

### Step 6: Background Images
- Add background image support to registry
- Update existing games with backgrounds
- Fallback to thumbnails

## Component Files

### New Files to Create

1. `src/components/GameHero.tsx` - Hero game view component
2. `src/pages/GameDetail.tsx` - Individual game detail page
3. `src/components/TopBar.tsx` - Enhanced top bar component
4. `src/hooks/useGameStats.ts` - Hook for play statistics
5. `src/lib/theme.ts` - Dark theme configuration

### Files to Modify

1. `src/pages/AllGames.tsx` - Add hero section
2. `src/components/HubLayout.tsx` - Add enhanced top bar
3. `src/games/registry/schema.ts` - Add background image fields
4. `backend/data/game-registry.json` - Add background images to games

## Visual Layout

### All Games Page (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│ [Top Bar: Stats | User Profile]                             │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Hero Game View - Blurred Background]                   │ │
│ │                                                         │ │
│ │ CLASSIC                                                 │ │
│ │ Endless survival in the very first version...          │ │
│ │                                                         │ │
│ │ [PLAY] [CONFIGURE]                                      │ │
│ │ [MOD LIST]                    [OUR SITE]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ All Games                                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│ │ Game 2   │ │ Game 3   │ │ Game 4   │                   │
│ └──────────┘ └──────────┘ └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Game Detail Page

```
┌─────────────────────────────────────────────────────────────┐
│ [Top Bar]                                                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Full Hero View - Blurred Background]                  │ │
│ │                                                         │ │
│ │                                                         │ │
│ │ CLASSIC                                                 │ │
│ │                                                         │ │
│ │ Endless survival in the very first version of          │ │
│ │ Minecraft. Explore, customize Minecraft worlds...     │ │
│ │                                                         │ │
│ │                                                         │ │
│ │ [PLAY] [CONFIGURE]                                      │ │
│ │                                                         │ │
│ │ [MOD LIST]                    [OUR SITE]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Related Games                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│ │ Game 2   │ │ Game 3   │ │ Game 4   │                   │
│ └──────────┘ └──────────┘ └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Future Enhancements

1. **Game Carousel**: Swipe through games in hero view
2. **Video Previews**: Add video background option
3. **Achievements**: Show game achievements/stats
4. **Social Features**: Share games, see friends playing
5. **Game Updates**: Show patch notes, updates
6. **Favorites**: Star/favorite games
7. **Recently Played**: Quick access to recent games
8. **Search**: Search games from top bar

## Accessibility Considerations

1. **Contrast**: Ensure text is readable on blurred backgrounds
2. **Focus States**: Clear focus indicators for all interactive elements
3. **Keyboard Navigation**: Full keyboard support
4. **Screen Readers**: Proper ARIA labels for all actions
5. **Image Alt Text**: Descriptive alt text for backgrounds

## Performance Considerations

1. **Image Loading**: Lazy load background images
2. **Blur Performance**: Use CSS backdrop-filter (GPU accelerated)
3. **Caching**: Cache game assets
4. **Progressive Enhancement**: Fallback for older browsers

## Testing Checklist

- [ ] Hero view displays correctly
- [ ] Background images load and blur properly
- [ ] Action buttons work
- [ ] Dark theme applied consistently
- [ ] Top bar statistics update
- [ ] Navigation between views works
- [ ] Responsive on mobile/tablet
- [ ] Accessibility tested
- [ ] Performance tested with many games
- [ ] Error states handled

## Related Documentation

- [All Games Page](./all-games-page.md) - Current implementation
- [Sidebar Implementation](./sidebar-implementation.md) - Navigation sidebar
- [Game Hub Analysis](./game-hub-analysis.md) - Overall architecture

