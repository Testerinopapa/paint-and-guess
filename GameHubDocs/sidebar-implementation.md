# Game Hub Sidebar Implementation

## Overview

The Game Hub sidebar is a collapsible navigation panel that provides access to all registered games and user account management. It features a toggle mechanism that allows users to collapse the sidebar to save screen space while maintaining full functionality.

## Features

### 1. Collapsible Design
- **Expanded State**: Full-width sidebar (256px / `w-64`) showing complete navigation labels and user information
- **Collapsed State**: Narrow sidebar (64px / `w-16`) showing only icons/initials with tooltips
- **Smooth Transitions**: CSS transitions (300ms) for width and content changes
- **State Persistence**: Sidebar state saved to localStorage and restored on page reload

### 2. Navigation
- **Game Links**: Dynamic list of all enabled games from the game registry
- **Icons**: Each navigation item has an associated icon (Home for "All Games", PaintBucket for drawing games, Brain for trivia games, etc.)
- **Active State Highlighting**: Current route highlighted with accent background
- **Tooltips**: When collapsed, navigation items show tooltips on hover
- **Sub-Menu Support**: Items with sub-items show dropdown menus (expanded state) or hover dropdowns (collapsed state)
- **Responsive**: Hidden on mobile devices (`hidden md:flex`), replaced with header menu

### 3. User Profile Section
- **Authenticated Users**: 
  - Expanded: Shows avatar, username, and email
  - Collapsed: Shows only avatar with tooltip
  - Dropdown menu for account actions (Customize Avatar, Logout)
- **Unauthenticated Users**:
  - Sign In button
  - Avatar customization button (for anonymous users)

### 4. Toggle Button
- **Position**: Absolutely positioned on the right edge of the sidebar (`-right-3`)
- **Icon**: ChevronLeft (when expanded) / ChevronRight (when collapsed)
- **Styling**: Circular button with border, shadow, and hover effects
- **Accessibility**: Proper ARIA labels for screen readers

## Implementation Details

### State Management

```typescript
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
  // Load sidebar state from localStorage
  const saved = localStorage.getItem("hub-sidebar-collapsed");
  return saved === "true";
});

// Persist sidebar state to localStorage
useEffect(() => {
  localStorage.setItem("hub-sidebar-collapsed", String(isSidebarCollapsed));
}, [isSidebarCollapsed]);
```

### Sidebar Structure

```tsx
<aside
  className={`hidden md:flex border-r bg-muted/30 flex-col gap-6 transition-all duration-300 ease-in-out relative ${
    isSidebarCollapsed ? "w-16 p-4" : "w-64 p-6"
  }`}
>
  {/* Toggle Button */}
  <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
    {/* Chevron icon */}
  </button>

  {/* Game Hub Title */}
  <div>
    <Sparkles icon />
    {!isSidebarCollapsed && <span>Game Hub</span>}
  </div>

  {/* Navigation */}
  <nav>
    {/* Dynamic game links */}
  </nav>

  {/* User Profile Section */}
  <div className="mt-auto">
    {/* User dropdown or sign in button */}
  </div>
</aside>
```

### Toggle Button

```tsx
<button
  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
  className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md flex items-center justify-center hover:bg-accent transition-colors"
  aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
>
  {isSidebarCollapsed ? (
    <ChevronRight className="h-4 w-4" />
  ) : (
    <ChevronLeft className="h-4 w-4" />
  )}
</button>
```

### Navigation with Icons and Tooltips

```tsx
<nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
  <TooltipProvider delayDuration={0}>
    {navigation.map((item) => {
      const Icon = item.icon || Gamepad2;
      const hasSubItems = item.subItems && item.subItems.length > 0;
      const isActive = location.pathname === item.to || 
        (item.to !== "/hub" && location.pathname.startsWith(item.to));

      // Expanded state - full navigation with icons
      if (!isSidebarCollapsed) {
        if (hasSubItems) {
          return (
            <DropdownMenu key={item.to}>
              <DropdownMenuTrigger asChild>
                <button className="...">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right">
                {/* Sub-items */}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <NavLink to={item.to} className="...">
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      }

      // Collapsed state - icon with tooltip or dropdown
      if (hasSubItems) {
        return (
          <DropdownMenu key={item.to}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="...">
                    <Icon className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right">
              {/* Sub-items */}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }

      return (
        <Tooltip key={item.to}>
          <TooltipTrigger asChild>
            <NavLink to={item.to} className="...">
              <Icon className="h-4 w-4" />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    })}
  </TooltipProvider>
</nav>
```

### Icon Mapping

Icons are automatically assigned based on game ID and label:

```typescript
const getGameIcon = (gameId: string, label: string): React.ComponentType => {
  const id = gameId.toLowerCase();
  const lowerLabel = label.toLowerCase();
  
  if (id.includes("paint") || id.includes("draw") || lowerLabel.includes("paint")) {
    return PaintBucket;
  }
  if (id.includes("trivia") || lowerLabel.includes("trivia")) {
    return Brain;
  }
  if (id.includes("puzzle") || lowerLabel.includes("puzzle")) {
    return Puzzle;
  }
  return Gamepad2; // Default
};
```

## Visual States

### Expanded State (256px width)

```
┌──────────────────────────────┐
│ [<] Game Hub                 │
├──────────────────────────────┤
│ All Games                    │
│ Paint & Guess                │
│ Trivia Blitz                 │
│ ...                          │
├──────────────────────────────┤
│ [Avatar]                     │
│ Username                      │
│ user@email.com               │
│ [Customize Avatar] [Logout]  │
└──────────────────────────────┘
```

### Collapsed State (64px width)

```
┌────┐
│ [>]│
│ ✨ │
├────┤
│ 🏠 │ ← "All Games" (tooltip)
│ 🎨 │ ← "Paint & Guess" (tooltip)
│ 🧠 │ ← "Trivia Blitz" (tooltip)
│ ...│
├────┤
│ [👤]│ ← Avatar (tooltip: "Username (email)")
└────┘
```

**Note**: Icons are shown instead of first letters. Items with sub-menus show dropdowns on hover/click.

## Responsive Behavior

### Desktop (≥768px)
- Sidebar visible on the left
- Toggle button functional
- Full collapse/expand functionality

### Mobile (<768px)
- Sidebar hidden (`hidden md:flex`)
- Navigation moved to header menu
- No collapse functionality needed

## Styling Details

### Width Transitions
- **Expanded**: `w-64` (256px) with `p-6` padding
- **Collapsed**: `w-16` (64px) with `p-4` padding
- **Transition**: `transition-all duration-300 ease-in-out`

### Content Visibility
- **Text**: Hidden when collapsed using conditional rendering
- **Icons**: Always visible, centered when collapsed, left-aligned when expanded
- **Navigation**: Icon shown when collapsed, icon + label when expanded
- **Sub-Menus**: Dropdown appears on hover/click when collapsed, inline when expanded

### Toggle Button
- **Size**: `h-6 w-6` (24px)
- **Position**: `absolute -right-3 top-6`
- **Z-index**: `z-10` (above sidebar content)
- **Styling**: Rounded, bordered, shadowed, hover effects

## User Experience

### Collapsed State Benefits
- **More Screen Space**: Frees up ~192px of horizontal space
- **Quick Access**: Icons provide clear visual cues
- **Tooltips**: Full labels available on hover
- **Dropdown Menus**: Sub-items accessible via hover/click dropdowns
- **Familiar Pattern**: Common UI pattern users recognize

### Expanded State Benefits
- **Full Context**: Complete labels and information visible
- **Better Discoverability**: New users can see all available games
- **User Information**: Full username and email visible

### State Persistence
- User preference saved to localStorage
- State restored on page reload
- Consistent experience across sessions

## Accessibility

### Keyboard Navigation
- Toggle button is keyboard accessible
- Navigation links support keyboard navigation
- Focus states visible for all interactive elements

### Screen Readers
- Toggle button has descriptive ARIA labels
- Navigation links properly labeled
- Tooltips provide additional context when collapsed

### Visual Indicators
- Active route clearly highlighted
- Hover states for all interactive elements
- Clear visual distinction between states

## Integration Points

### Game Registry
- Sidebar navigation built from `useGameRegistry()` hook
- Filters enabled, non-hidden games
- Sorted by category, priority, and label

### Routing
- Uses React Router `NavLink` for navigation
- Active state based on current route
- Supports nested routes

### User Authentication
- Integrates with `useAuth()` context
- Shows different UI for authenticated vs. anonymous users
- Avatar customization integrated

## Future Enhancements

### Potential Improvements
1. **Keyboard Shortcut**: Add keyboard shortcut (e.g., `Ctrl+B`) to toggle sidebar
2. **Animation Options**: Allow users to choose animation speed
3. **Custom Widths**: Allow users to set custom collapsed/expanded widths
4. **Sidebar Position**: Option to move sidebar to right side
5. **Favorites**: Pin favorite games to top of navigation
6. **Search**: Add search functionality for games when expanded
7. **Categories**: Group games by category with collapsible sections (with sub-menus)
8. **Recent Games**: Show recently played games at top
9. **Custom Icons**: Allow games to specify custom icons in registry
10. **Badge Support**: Show notification badges on navigation items

### Technical Improvements
1. **Performance**: Virtualize navigation list for many games
2. **Animations**: Add more sophisticated animations
3. **Theming**: Support for different sidebar themes
4. **Accessibility**: Enhanced screen reader support
5. **Mobile**: Consider drawer-style sidebar for mobile

## Code Location

- **Component**: `src/components/HubLayout.tsx`
- **Dependencies**: 
  - `@/components/ui/tooltip` - Tooltip component
  - `@/components/ui/button` - Button component
  - `lucide-react` - Icons (ChevronLeft, ChevronRight, Sparkles)
  - `react-router-dom` - Navigation (NavLink)

## Usage Example

The sidebar is automatically rendered as part of the `HubLayout` component, which wraps all game routes:

```tsx
<Route path="/" element={<HubLayout />}>
  <Route index element={<AllGames />} />
  <Route path="games">
    {/* Game routes */}
  </Route>
</Route>
```

No additional configuration needed - the sidebar automatically:
- Loads games from the registry
- Handles user authentication state
- Manages collapse/expand state
- Persists user preferences

## Configuration

### localStorage Key
- **Key**: `"hub-sidebar-collapsed"`
- **Value**: `"true"` or `"false"` (string)
- **Scope**: Per-browser, persists across sessions

### Default State
- **Initial**: Expanded (unless user previously collapsed it)
- **After Reload**: Restores from localStorage

## Testing Considerations

### Manual Testing
1. Toggle sidebar and verify smooth animation
2. Check tooltips appear when collapsed
3. Verify state persists after page reload
4. Test navigation works in both states
5. Verify responsive behavior on mobile

### Edge Cases
- Very long game names (truncation)
- Many games (scrolling behavior)
- No games registered (empty state)
- User with very long username/email
- Rapid toggling (animation performance)

## Related Documentation

- [Game Hub Analysis](./game-hub-analysis.md) - Overall hub architecture
- [Game Registry System](./game-hub-analysis.md#game-registry-system) - How games are registered
- [Navigation Building](./game-hub-analysis.md#navigation-building) - How navigation links are built

