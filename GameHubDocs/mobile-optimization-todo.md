# Game Hub Mobile Optimization TODO

This document lists all parts of the game hub that still need mobile-specific optimizations for a better mobile user experience.

---

## ✅ Completed Mobile Optimizations

### 1. HubLayout
- ✅ Mobile menu with Sheet component
- ✅ Responsive padding (`p-4 md:p-8`)
- ✅ Sidebar hidden on mobile, shown in drawer

### 2. TopBar
- ✅ Hamburger menu button (mobile only)
- ✅ Responsive search bar (`w-32 sm:w-48 md:w-64`)
- ✅ Mobile-friendly user profile (avatar-only on small screens)
- ✅ Navigation sections hidden on mobile

### 3. AllGames Page
- ✅ Mobile path view (`MobileGamePath` component)
- ✅ Responsive grid breakpoints
- ✅ Responsive text sizes and spacing

### 4. Canva GameStage
- ✅ Full mobile layout with bottom sheets
- ✅ Touch-optimized drawing tools
- ✅ Mobile-specific canvas layout

---

## ❌ Pending Mobile Optimizations

### 1. Library Page (`src/pages/Library.tsx`)

**Current Issues**:
- **Top Bar**: Fixed width elements, no responsive wrapping
  - Title and tabs don't adapt to small screens
  - "Order a New Book" button may overflow
  - User avatar/name may be cut off
- **Search & Filter**: Horizontal layout may be cramped
  - Search input and category dropdown side-by-side
  - No mobile-specific layout
- **Recommended Books**: Horizontal scroll works but could be improved
  - Cards are fixed width (`min-w-[200px]`)
  - Promotional card is wider (`min-w-[300px]`)
  - Could use vertical stacking on mobile
- **Books Table**: Not mobile-friendly at all
  - Table with 6 columns (Title, Author, Category, Availability, Status, Action)
  - Tables don't work well on small screens
  - Needs card-based layout for mobile

**Recommended Changes**:
- Stack top bar elements vertically on mobile
- Make search full-width, filter below on mobile
- Convert table to card layout on mobile
- Adjust book card sizes for mobile viewport
- Consider bottom sheet for filters on mobile

---

### 2. GameDetail Page (`src/pages/GameDetail.tsx`)

**Current Issues**:
- **Hero Section**: Fixed height (`min-h-[600px]`) may be too tall on mobile
  - Large text (`text-5xl`) may overflow
  - Buttons may wrap awkwardly
  - Bottom actions may be cramped
- **Grid Layout**: 2-column grid for main content + sidebar
  - Sidebar info card may be too narrow on mobile
  - Content may feel cramped
- **GameImageGallery**: Navigation buttons may be too small for touch
  - Thumbnail grid (`grid-cols-4`) may be too small on mobile
  - Previous/Next buttons need larger touch targets
- **Related Games**: Grid layout (`md:grid-cols-3`) may need adjustment
  - Cards may be too small on mobile
  - Could use horizontal scroll or single column

**Recommended Changes**:
- Reduce hero height on mobile (`min-h-[400px]` or responsive)
- Stack content vertically on mobile (single column)
- Make image gallery touch-friendly (swipe gestures, larger buttons)
- Increase thumbnail size on mobile
- Optimize related games layout for mobile

---

### 3. GameCard Component (`src/components/GameCard.tsx`)

**Current Issues**:
- **Hover Effects**: Don't work on mobile
  - `hover:scale-105` and `hover:shadow-xl` are desktop-only
  - Play button only appears on hover
  - No touch feedback
- **Touch Targets**: Play button may be too small
  - Button is `p-3` (12px padding)
  - Should be minimum 44x44px for touch
- **Image Aspect Ratio**: 3:4 may be fine, but could be optimized
- **Text Overlay**: Only shows on hover, not visible on mobile

**Recommended Changes**:
- Add active/touch states for mobile
- Make play button always visible on mobile (or show on tap)
- Increase touch target sizes
- Consider showing game name below card on mobile instead of overlay
- Add haptic feedback (if available)

---

### 4. GameHero Component (`src/components/GameHero.tsx`)

**Current Issues**:
- **Fixed Height**: `min-h-[600px]` is too tall for mobile
  - Takes up most of viewport
  - May cause scrolling issues
- **Text Sizes**: `text-5xl` for title may be too large
  - Could overflow on small screens
  - Description text may be hard to read
- **Button Layout**: `flex-wrap` helps but could be better
  - Buttons may stack awkwardly
  - Large padding (`px-8 py-6`) may be excessive on mobile
- **Bottom Actions**: Border and spacing may be cramped

**Recommended Changes**:
- Responsive height (`min-h-[400px] md:min-h-[600px]`)
- Responsive text sizes (`text-3xl md:text-5xl`)
- Stack buttons vertically on mobile
- Reduce button padding on mobile
- Optimize bottom actions layout

---

### 5. GameImageGallery Component (`src/components/GameImageGallery.tsx`)

**Current Issues**:
- **Navigation Buttons**: May be too small for touch
  - Icon buttons (`size="icon"`) may not meet 44px minimum
  - Positioned absolutely, may be hard to tap
- **Thumbnail Grid**: `grid-cols-4` may be too small on mobile
  - Thumbnails may be hard to tap accurately
  - Could use fewer columns on mobile
- **No Swipe Gestures**: Desktop-only click navigation
  - Mobile users expect swipe to navigate images
- **Aspect Ratio**: `aspect-video` may not be optimal for mobile

**Recommended Changes**:
- Add swipe gesture support for mobile
- Increase button sizes for touch (`h-12 w-12` minimum)
- Reduce thumbnail grid to 2-3 columns on mobile
- Add touch-friendly navigation indicators
- Consider full-screen image viewer on mobile

---

### 6. Sidebar Component (`src/components/Sidebar.tsx`)

**Current Status**: Hidden on mobile, shown in Sheet drawer

**Potential Improvements**:
- **Sheet Width**: Currently `w-16` (same as desktop sidebar)
  - Could be wider on mobile for better usability
  - Could show labels alongside icons
- **Navigation Items**: Icon-only may be less clear
  - Could show labels on mobile sheet
  - Could use bottom navigation bar instead
- **Settings Button**: At bottom, may be hard to reach
  - Could move to top bar on mobile

**Recommended Changes**:
- Wider sheet on mobile (`w-64` or full-width)
- Show icon + label in mobile sheet
- Consider bottom navigation bar alternative
- Move settings to top bar on mobile

---

### 7. Missing Hub Pages

**Routes Defined in Sidebar** (but no pages implemented):
- `/hub/recent` - Recent games page
- `/hub/favorites` - Favorites page  
- `/hub/trending` - Trending games page
- `/hub/friends` - Friends page

**Status**: These routes don't have corresponding page components yet

**Recommended Implementation**:
- Create mobile-first page components
- Use similar patterns to AllGames (path view on mobile, grid on desktop)
- Implement proper mobile layouts from the start

---

### 8. Other Game Pages

**Games with Lobby/Room Pages**:
- **Trivia Blitz**: `Lobby.tsx`, `Room.tsx`
- **Paint & Guess**: `Lobby.tsx`, `Room.tsx`
- **RPG**: `Index.tsx`
- **Ping Pong**: `Index.tsx`

**Status**: Unknown if these have mobile optimizations

**Recommended Actions**:
- Audit each game's lobby/room pages for mobile responsiveness
- Apply similar mobile patterns (bottom sheets, touch optimization)
- Ensure consistent mobile experience across all games

---

## Priority Ranking

### High Priority (Core User Experience)
1. **Library Page** - Table layout is unusable on mobile
2. **GameDetail Page** - Hero section and layout need mobile optimization
3. **GameCard Component** - Touch interactions and visibility issues

### Medium Priority (User Experience Improvements)
4. **GameHero Component** - Layout and sizing optimizations
5. **GameImageGallery** - Touch navigation and swipe gestures
6. **Missing Hub Pages** - Need to be created with mobile-first design

### Low Priority (Polish & Enhancements)
7. **Sidebar Improvements** - Current implementation works, but could be better
8. **Other Game Pages** - Need audit to determine requirements

---

## Implementation Patterns to Follow

### Mobile-First Approach
- Use `useIsMobile()` hook to detect viewport
- Create separate mobile components when needed
- Use responsive Tailwind classes (`md:`, `lg:`, etc.)
- Test on actual mobile devices

### Common Mobile Patterns
- **Bottom Sheets**: For collapsible content (like Canva GameStage)
- **Full-Width Layouts**: Maximize screen space
- **Touch Targets**: Minimum 44x44px
- **Swipe Gestures**: For navigation (images, lists)
- **Stacked Layouts**: Vertical stacking on mobile
- **Card-Based**: Replace tables with cards on mobile

### Responsive Breakpoints
- **Mobile**: `< 768px` (default, no prefix)
- **Tablet**: `768px - 1023px` (`md:`)
- **Desktop**: `≥ 1024px` (`lg:`)

---

## Specific Component Recommendations

### Library Page Mobile Layout
```
Mobile:
- Stacked header (title, tabs, actions)
- Full-width search
- Filter below search
- Card-based book list (instead of table)
- Horizontal scroll for recommended books (keep)
```

### GameDetail Mobile Layout
```
Mobile:
- Reduced hero height (400px)
- Single column layout
- Stacked game info
- Touch-friendly image gallery
- Swipe gestures for screenshots
- Single column related games
```

### GameCard Mobile Enhancements
```
Mobile:
- Always show play button (or on tap)
- Show game name below card
- Larger touch targets
- Active state feedback
- Remove hover-only features
```

---

## Testing Checklist

When implementing mobile optimizations, test:
- [ ] Touch target sizes (minimum 44x44px)
- [ ] Text readability (not too small)
- [ ] Layout doesn't overflow viewport
- [ ] Horizontal scrolling works (where intended)
- [ ] Buttons are easily tappable
- [ ] Forms are usable on mobile keyboards
- [ ] Images load and display correctly
- [ ] Navigation is intuitive
- [ ] Performance on mobile devices
- [ ] Different screen sizes (small, medium, large phones)

---

## Notes

- All mobile optimizations should maintain desktop functionality
- Use feature detection rather than user agent sniffing
- Consider tablet as separate breakpoint if needed
- Test on real devices, not just browser dev tools
- Consider landscape orientation as well as portrait

