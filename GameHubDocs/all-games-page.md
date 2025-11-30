# All Games Page Implementation

## Overview

The "All Games" page is the main discovery interface for the Game Hub. It displays all available games in a responsive grid layout, allowing users to browse, discover, and launch games. Each game is presented as a card with metadata, status badges, player information, and a "Play now" button.

## Features

### 1. Game Grid Display
- **Responsive Layout**: 1 column on mobile, 2 columns on tablet, 3 columns on desktop
- **Game Cards**: Each game displayed as a card with thumbnail, metadata, and action button
- **Loading States**: Skeleton loaders while fetching game registry
- **Error Handling**: Graceful fallback to bundled registry if API fails

### 2. Game Card Components

Each game card displays:

#### Visual Elements
- **Thumbnail Image**: Game thumbnail (160px height, full width, object-cover)
- **Status Badge**: Visual indicator of game status (stable, beta, alpha, deprecated)
- **Category Badges**: Additional badges (hot, new, limited, etc.)
- **Game Title**: Display name of the game
- **Description**: Game description text

#### Metadata
- **Player Count**: Min-max players with optional recommended count
- **Monetization**: Business model (free, iap, premium, subscription)
- **Metrics** (optional):
  - Concurrent users (formatted as "X.Xk playing now")
  - Uptime percentage (formatted as "XX.X% uptime")

#### Interactive Elements
- **Play Now Button**: Enabled if game is available for user's cohort
- **Unavailable Button**: Disabled button with message if game not accessible
- **Custom Preview Component**: Optional game-specific preview content

### 3. Status Badges

Status badges use color-coded variants:

```typescript
const statusVariant: Record<string, string> = {
  stable: "bg-emerald-500/10 text-emerald-700",    // Green
  beta: "bg-amber-500/10 text-amber-700",          // Amber/Yellow
  alpha: "bg-sky-500/10 text-sky-700",             // Blue
  deprecated: "bg-rose-500/10 text-rose-700",      // Red
};
```

### 4. Registry Source Display

The page shows the registry source at the top:
- **Sources**: "cms", "git", "fallback", or "cache"
- **Error Messages**: Displays fallback message if API fails

## Implementation Details

### Component Structure

```tsx
const AllGames = () => {
  const { games, isLoading, error, source } = useGameRegistry();

  if (isLoading) {
    return <LoadingCards />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1>All Games</h1>
        <p>Browse live, prototype, and upcoming party experiences.</p>
        <p>Registry source: {source}</p>
      </div>

      {/* Game Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card key={game.id}>
            {/* Game content */}
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### Game Registry Integration

The component uses the `useGameRegistry()` hook:

```typescript
const { games, isLoading, error, source } = useGameRegistry();
```

**Returns:**
- `games: HubGame[]`: Array of enabled games
- `isLoading: boolean`: Loading state
- `error: Error | null`: Error if fetch failed
- `source: string`: Registry source identifier

### Loading State

Skeleton loaders displayed while fetching:

```tsx
const LoadingCards = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={index}>
        <Skeleton className="h-40 w-full" />  {/* Thumbnail */}
        <CardHeader>
          <Skeleton className="h-6 w-48" />   {/* Title */}
          <Skeleton className="h-4 w-full" />  {/* Description */}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" /> {/* Button */}
        </CardContent>
      </Card>
    ))}
  </div>
);
```

### Game Card Structure

```tsx
<Card key={game.id} data-game-id={game.id} className="flex flex-col overflow-hidden">
  {/* Thumbnail */}
  <img 
    src={game.assets.thumbnail} 
    alt={`${game.displayName} thumbnail`} 
    className="h-40 w-full object-cover" 
  />

  <CardHeader className="flex-1 space-y-3">
    {/* Status and Category Badges */}
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={statusVariant[game.status]}>
        {game.status}
      </Badge>
      {game.badges?.map((badge) => (
        <Badge key={badge} variant="secondary">
          {badge}
        </Badge>
      ))}
    </div>

    {/* Title and Description */}
    <div className="space-y-1">
      <CardTitle>{game.displayName}</CardTitle>
      <CardDescription>{game.displayDescription}</CardDescription>
    </div>

    {/* Metadata */}
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      <Badge variant="outline">
        {formatPlayers(min, max, recommended)}
      </Badge>
      <Badge variant="outline">
        {game.monetization}
      </Badge>
      <MetricPill label="playing now" value={concurrentUsers} />
      <MetricPill label="uptime" value={uptimePercentage} />
    </div>

    {/* Custom Preview Component */}
    {game.PreviewComponent && <game.PreviewComponent />}
  </CardHeader>

  {/* Action Button */}
  <CardContent className="pb-6">
    {game.isEnabled ? (
      <Button asChild className="w-full">
        <Link to={game.derivedRoute}>Play now</Link>
      </Button>
    ) : (
      <Button variant="outline" className="w-full" disabled>
        Unavailable for your cohort
      </Button>
    )}
  </CardContent>
</Card>
```

## Helper Functions

### Player Count Formatting

```typescript
const formatPlayers = (min: number, max: number, recommended?: number) => {
  if (recommended) {
    return `${min}-${max} players (best with ${recommended})`;
  }
  return `${min}-${max} players`;
};
```

**Examples:**
- `2-12 players` (no recommended)
- `2-12 players (best with 6)` (with recommended)

### Metric Display

```typescript
const MetricPill = ({ label, value }: { label: string; value?: string | number }) => {
  if (value === undefined || value === null) return null;
  return (
    <Badge variant="outline" className="text-xs font-normal">
      {`${value} ${label}`}
    </Badge>
  );
};
```

**Usage:**
- Concurrent users: `"1.2k playing now"`
- Uptime: `"99.5% uptime"`
- Only displays if value is provided

## Visual Layout

### Desktop View (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────┐
│ All Games                                                            │
│ Browse live, prototype, and upcoming party experiences.              │
│ Registry source: git                                                 │
├──────────────────────┬──────────────────────┬──────────────────────┤
│ ┌──────────────────┐ │ ┌──────────────────┐ │ ┌──────────────────┐ │
│ │ [Thumbnail]      │ │ │ [Thumbnail]      │ │ │ [Thumbnail]      │ │
│ ├──────────────────┤ │ ├──────────────────┤ │ ├──────────────────┤ │
│ │ [Stable] [Hot]   │ │ │ [Beta] [New]     │ │ │ [Alpha]          │ │
│ │ Paint & Guess    │ │ │ Mystery Mashup   │ │ │ Trivia Trails    │ │
│ │ Draw prompts...  │ │ │ A surprise...    │ │ │ Battle your...   │ │
│ │ 2-12 players     │ │ │ 3-8 players      │ │ │ 2-6 players      │ │
│ │ free             │ │ │ premium          │ │ │ iap              │ │
│ │ 1.2k playing now │ │ │                  │ │ │                  │ │
│ │                  │ │ │                  │ │ │                  │ │
│ │ [Play now]       │ │ │ [Play now]       │ │ │ [Unavailable...] │ │
│ └──────────────────┘ │ └──────────────────┘ │ └──────────────────┘ │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

### Tablet View (768px - 1023px)

```
┌─────────────────────────────────────────────────────┐
│ All Games                                            │
│ Browse live, prototype, and upcoming party...       │
│ Registry source: git                                 │
├──────────────────────┬──────────────────────┐
│ ┌──────────────────┐ │ ┌──────────────────┐ │
│ │ [Thumbnail]      │ │ │ [Thumbnail]      │ │
│ ├──────────────────┤ │ ├──────────────────┤ │
│ │ [Stable] [Hot]   │ │ │ [Beta] [New]     │ │
│ │ Paint & Guess    │ │ │ Mystery Mashup   │ │
│ │ ...              │ │ │ ...              │ │
│ │ [Play now]       │ │ │ [Play now]       │ │
│ └──────────────────┘ │ └──────────────────┘ │
└──────────────────────┴──────────────────────┘
```

### Mobile View (<768px)

```
┌─────────────────────────────┐
│ All Games                    │
│ Browse live, prototype...    │
│ Registry source: git         │
├─────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ [Thumbnail]              │ │
│ ├──────────────────────────┤ │
│ │ [Stable] [Hot]           │ │
│ │ Paint & Guess            │ │
│ │ Draw prompts, guess...  │ │
│ │ 2-12 players | free      │ │
│ │ 1.2k playing now         │ │
│ │                          │ │
│ │ [Play now]               │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ [Next game card]          │ │
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

## Game Card Data Structure

Each game card displays data from the `HubGame` type:

```typescript
interface HubGame {
  id: string;
  displayName: string;
  displayDescription: string;
  status: "stable" | "beta" | "alpha" | "deprecated";
  badges?: string[];
  supportedPlayers: {
    min: number;
    max: number;
    recommended?: number;
  };
  monetization: "free" | "iap" | "premium" | "subscription";
  assets: {
    thumbnail: string;
  };
  metrics?: {
    concurrentUsers?: number;
    uptimePercentage?: number;
  };
  derivedRoute: string;
  isEnabled: boolean;
  PreviewComponent?: React.ComponentType;
}
```

## Custom Preview Components

Games can provide custom preview components that render within the card:

```tsx
{game.PreviewComponent && <game.PreviewComponent />}
```

**Example**: Paint & Guess includes a custom preview card showing:
- Quick stats
- Featured content
- Special promotions

Preview components are registered in the game registry system and attached during plugin processing.

## Responsive Grid

### Breakpoints

```css
/* Mobile: 1 column */
.grid {
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Gap Spacing

- Consistent `gap-4` (1rem / 16px) between cards
- Cards maintain aspect ratio with flex layout
- Content area scrolls if needed

## Error Handling

### API Failure

If the game registry API fails:

1. **Error Message Displayed**: Shows fallback message
2. **Fallback Registry Used**: Loads bundled registry
3. **Source Indicator**: Shows "fallback" as source
4. **Games Still Displayed**: User can still browse available games

```tsx
{errorMessage ? (
  <p className="text-sm text-red-600">
    Fell back to bundled registry: {errorMessage}
  </p>
) : null}
```

### Missing Data

- **Missing Thumbnail**: Image fails gracefully (broken image icon)
- **Missing Description**: Card still renders without description
- **Missing Metrics**: Metric pills simply don't render
- **Missing Badges**: Badge section adapts to available badges

## Accessibility

### Semantic HTML

- Proper heading hierarchy (`<h1>` for page title)
- Descriptive alt text for images
- Button labels clearly indicate action
- Disabled state clearly communicated

### Keyboard Navigation

- All cards keyboard accessible
- "Play now" buttons focusable
- Tab order follows visual layout
- Enter/Space activates buttons

### Screen Readers

- Game cards have `data-game-id` attributes
- Status badges use semantic colors
- Button states announced
- Loading states announced

## Performance Optimizations

### Image Loading

- Thumbnails use native `<img>` tags (no lazy loading currently)
- Images sized appropriately (160px height)
- Object-cover ensures consistent aspect ratio

### Rendering

- Only enabled games rendered
- Conditional rendering for optional components
- Memoization handled by React Query (registry caching)

### Debug Mode

Debug logging available in development:

```typescript
const DEBUG = import.meta.env.DEV || import.meta.env.VITE_GAME_HUB_DEBUG === "true";

if (DEBUG) {
  console.debug("[hub] AllGames state updated", {
    loading: isLoading,
    error,
    source,
    gameCount: games.length,
  });
}
```

## Integration Points

### Game Registry

- Uses `useGameRegistry()` hook
- Filters enabled games automatically
- Processes game metadata
- Attaches preview components

### Routing

- "Play now" buttons link to `game.derivedRoute`
- Routes typically: `/hub/games/{game-slug}`
- React Router handles navigation

### Hub Layout

- Renders within `HubLayout` component
- Uses sidebar navigation
- Shares header with other pages
- Responsive to sidebar collapse state

## Styling Details

### Card Styling

```tsx
<Card className="flex flex-col overflow-hidden">
```

- **Flex Column**: Stacks content vertically
- **Overflow Hidden**: Prevents content from breaking card boundaries
- **Shadow**: Subtle shadow from Card component
- **Border**: Light border from Card component

### Badge Styling

- **Status Badges**: Color-coded with semi-transparent backgrounds
- **Category Badges**: Secondary variant (outlined)
- **Metadata Badges**: Outline variant, smaller text
- **Capitalization**: All badges use `capitalize` class

### Button States

- **Enabled**: Primary button style, full width
- **Disabled**: Outline variant, grayed out, not clickable
- **Hover**: Standard button hover effects
- **Focus**: Visible focus ring for accessibility

## Future Enhancements

### Potential Improvements

1. **Search & Filter**
   - Search bar to filter games by name
   - Filter by status, category, player count
   - Sort options (alphabetical, popularity, etc.)

2. **Enhanced Cards**
   - Hover effects with more information
   - Screenshot gallery
   - Video previews
   - Ratings/reviews

3. **Pagination/Infinite Scroll**
   - Paginate large game lists
   - Infinite scroll for better UX
   - Virtual scrolling for performance

4. **Favorites**
   - Star/favorite games
   - Filter to show only favorites
   - Quick access from sidebar

5. **Categories**
   - Group games by category
   - Category tabs or sections
   - Category-specific filtering

6. **Recent Games**
   - Show recently played games
   - Quick access section
   - Play history

7. **Lazy Loading**
   - Lazy load images
   - Intersection Observer for cards
   - Progressive image loading

8. **Analytics**
   - Track card views
   - Track "Play now" clicks
   - Track unavailable game views

## Code Location

- **Component**: `src/pages/AllGames.tsx`
- **Dependencies**:
  - `@/games/registry` - Game registry hook
  - `@/components/ui/card` - Card components
  - `@/components/ui/badge` - Badge components
  - `@/components/ui/button` - Button component
  - `@/components/ui/skeleton` - Loading skeletons
  - `react-router-dom` - Navigation (Link)

## Usage Example

The AllGames component is automatically rendered at the hub root route:

```tsx
<Route path="/" element={<HubLayout />}>
  <Route index element={<AllGames />} />
  <Route path="games">
    {/* Game routes */}
  </Route>
</Route>
```

No additional configuration needed - the component:
- Automatically loads games from registry
- Handles loading and error states
- Renders all enabled games
- Provides navigation to individual games

## Testing Considerations

### Manual Testing

1. **Loading State**: Verify skeleton loaders appear
2. **Game Display**: Check all enabled games show
3. **Card Layout**: Verify responsive grid works
4. **Navigation**: Test "Play now" buttons
5. **Error Handling**: Test with API failure
6. **Metrics**: Verify metric display when available
7. **Badges**: Check status and category badges
8. **Preview Components**: Verify custom previews render

### Edge Cases

- No games registered (empty state)
- All games disabled (all show unavailable)
- Very long game names (text truncation)
- Missing thumbnails (broken images)
- Very many games (scrolling, performance)
- Network errors (fallback behavior)

## Related Documentation

- [Game Hub Analysis](./game-hub-analysis.md) - Overall hub architecture
- [Game Registry System](./game-hub-analysis.md#game-registry-system) - How games are registered
- [Sidebar Implementation](./sidebar-implementation.md) - Navigation sidebar
- [Hub Layout](./game-hub-analysis.md#hub-layout-component) - Layout wrapper

