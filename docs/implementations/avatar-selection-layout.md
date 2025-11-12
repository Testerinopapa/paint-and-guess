# Avatar Selection Visual Layout

## Overview
This document describes the visual layout and UI design for the avatar selection feature in the main menu (Lobby page).

## Main Menu Layout

### Current Layout Structure
```
┌─────────────────────────────────────────────────┐
│  Multiplayer Draw & Guess                        │
│  Create or join a room to start playing          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Your Name                                │   │
│  │ [________________________]               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Avatar                                   │   │
│  │ [🎨 Artist                    😊]       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ Create Room  │  │  Join Room   │          │
│  │              │  │              │          │
│  │ Room Name    │  │  Room ID     │          │
│  │ [________]   │  │  [______]    │          │
│  │              │  │              │          │
│  │ [Create]     │  │  [Join]      │          │
│  └──────────────┘  └──────────────┘          │
│                                                 │
│  👥 Up to 6 players per room                   │
└─────────────────────────────────────────────────┘
```

## Avatar Selector Component

### Closed State (Button)
```
┌─────────────────────────────────────────────┐
│  ┌──┐                                       │
│  │🎨│  Avatar                               │
│  └──┘  Artist                          😊  │
└─────────────────────────────────────────────┘
```

**Visual Details:**
- Left: Avatar preview (circular, 40x40px, showing selected emoji)
- Center: Label "Avatar" and current avatar name (e.g., "Artist")
- Right: Smile icon (lucide-react) indicating it's clickable
- Full width button with outline variant
- Hover effect: slight background change

### Open State (Popover)
```
┌─────────────────────────────────────────────┐
│  Choose Your Avatar                          │
│  Select an avatar to represent you in the   │
│  game                                       │
│                                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                       │
│  │🎨│ │🎭│ │🎪│ │🤖│                       │
│  └──┘ └──┘ └──┘ └──┘                       │
│                                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                       │
│  │👽│ │🥷│ │🧙│ │🦸│                       │
│  └──┘ └──┘ └──┘ └──┘                       │
│                                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                       │
│  │🏴│ │🕵️│ │👨│ │👨│                       │
│  └──┘ └──┘ └──┘ └──┘                       │
│                                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                       │
│  │👨│ │🎵│ │⚽│ │  │                       │
│  └──┘ └──┘ └──┘ └──┘                       │
└─────────────────────────────────────────────┘
```

**Visual Details:**
- Popover width: 320px (w-80)
- Grid layout: 4 columns
- Each avatar button:
  - Square aspect ratio
  - Large emoji (text-3xl, ~30px)
  - Border: 2px
  - Padding: 12px (p-3)
  - Hover: scale to 110%, border color changes to primary
  - Selected: primary border color, primary/10 background
  - Rounded corners (rounded-lg)
- Header text: "Choose Your Avatar" (font-medium, text-sm)
- Description: smaller muted text below header

## Player List Integration

### Player Item with Avatar
```
┌─────────────────────────────────────────────┐
│  ┌──┐ ✏️  Player Name          🏆 100       │
│  │🎨│                                        │
│  └──┘                                        │
└─────────────────────────────────────────────┘
```

**Visual Details:**
- Avatar: 32x32px (h-8 w-8), circular
- Emoji size: text-lg (~18px)
- Positioned before player name
- Drawer indicator (pencil icon) appears before avatar if player is drawing
- Score and trophy icon on the right

## Avatar Options

The following 16 emoji avatars are available:

1. 🎨 Artist
2. 🎭 Actor
3. 🎪 Clown
4. 🤖 Robot
5. 👽 Alien
6. 🥷 Ninja
7. 🧙 Wizard
8. 🦸 Superhero
9. 🏴‍☠️ Pirate
10. 🕵️ Detective
11. 👨‍🚀 Astronaut
12. 👨‍🍳 Chef
13. 👨‍⚕️ Doctor
14. 👨‍🚒 Firefighter
15. 🎵 Musician
16. ⚽ Athlete

## Interaction Flow

1. **Initial Load:**
   - Check localStorage for previously selected avatar
   - If found, use it; otherwise, default to "artist" (🎨)

2. **Avatar Selection:**
   - User clicks avatar selector button
   - Popover opens showing grid of avatars
   - User clicks an avatar
   - Avatar is selected, stored in localStorage, popover closes
   - Button updates to show selected avatar

3. **Room Join/Create:**
   - Selected avatar is sent with player name to server
   - Avatar is stored in player object
   - Avatar appears in player list for all players

## Responsive Design

- **Desktop:** Full layout as shown above
- **Mobile:** 
  - Avatar selector button remains full width
  - Popover adjusts to screen width (max 320px)
  - Grid remains 4 columns but may wrap on very small screens
  - Player list avatars remain same size

## Color Scheme

- **Default border:** `border-border`
- **Selected border:** `border-primary`
- **Selected background:** `bg-primary/10`
- **Hover border:** `border-primary` (on hover)
- **Hover background:** `hover:bg-accent`

## Accessibility

- Avatar buttons have `title` attribute with avatar name for tooltips
- Keyboard navigation supported through Popover component
- Focus states visible for keyboard users
- Screen reader friendly labels

---

## Alternative Layout Proposal: Centered Modal Design

### Overview
This section proposes an alternative layout design inspired by modern drawing game interfaces (e.g., skribbl.io). The design features a centered modal/card layout with a more prominent avatar preview and streamlined user flow.

### Container Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  [Patterned Background: Doodle icons, primary overlay]  │
│                                                           │
│              ┌─────────────────────────┐                │
│              │                         │                │
│              │    CENTERED MODAL      │                │
│              │    (Fixed width: 480px) │                │
│              │                         │                │
│              │  ┌───────────────────┐ │                │
│              │  │   Draw & Guess    │ │                │
│              │  │  (Playful Logo)   │ │                │
│              │  └───────────────────┘ │                │
│              │                         │                │
│              │    ┌─────────────┐     │                │
│              │    │             │     │                │
│              │  ◀ │     🎨     │ ▶  │                │
│              │    │   (Avatar)  │     │                │
│              │    │             │     │                │
│              │    └─────────────┘     │                │
│              │         🎲              │                │
│              │                         │                │
│              │  ┌───────────────────┐ │                │
│              │  │ Enter your name...│ │                │
│              │  └───────────────────┘ │                │
│              │                         │                │
│              │  ┌───────────────────┐ │                │
│              │  │ Language: English ▼│ │                │
│              │  └───────────────────┘ │                │
│              │                         │                │
│              │  ┌───────────────────┐ │                │
│              │  │      PLAY!       │ │                │
│              │  └───────────────────┘ │                │
│              │                         │                │
│              │  Create Private Room   │                │
│              │                         │                │
│              │  About | News | How to Play             │
│              └─────────────────────────┘                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Detailed Component Breakdown

#### 1. Background Layer
```
┌─────────────────────────────────────────┐
│  Patterned Canvas Background            │
│  - Repeating doodle icons (pencil,       │
│    brush, palette, canvas patterns)    │
│  - Primary brand color overlay          │
│  - Subtle opacity (20-30%)             │
│  - Animated or static pattern           │
└─────────────────────────────────────────┘
```

**Visual Details:**
- Background pattern: SVG or CSS repeating pattern
- Overlay: `bg-primary/20` or similar
- Full viewport coverage
- Subtle animation optional (slow rotation or parallax)

#### 2. Header Section (Game Logo)

```
┌─────────────────────────────────────────┐
│                                         │
│         🎨 Draw & Guess 🎨             │
│                                         │
│    (Playful, hand-drawn font style)    │
│                                         │
└─────────────────────────────────────────┘
```

**Visual Details:**
- Font: Playful, hand-drawn style (e.g., "Comic Sans" or custom font)
- Size: `text-4xl` or `text-5xl` (48-60px)
- Colors: Vibrant gradient (primary to secondary)
- Position: Top-center of modal
- Shadow: Subtle drop shadow (`drop-shadow-lg`)
- Optional: Paintbrush icon on sides

#### 3. Avatar Preview & Navigation

```
┌─────────────────────────────────────────┐
│                                         │
│      ◀  ┌──────────────┐  ▶           │
│         │              │               │
│         │              │               │
│         │     🎨       │               │
│         │   (120x120)  │               │
│         │              │               │
│         │   Artist     │               │
│         └──────────────┘               │
│              🎲                        │
│         (Random button)                │
└─────────────────────────────────────────┘
```

**Visual Details:**
- **Avatar Canvas:**
  - Size: 120x120px (large, prominent)
  - Circular or rounded square
  - Large emoji display (text-6xl, ~60px)
  - Background: `bg-muted` or `bg-card`
  - Border: 3px solid primary color when selected
  - Shadow: Subtle elevation
  
- **Navigation Arrows:**
  - Left arrow (◀): Previous avatar
  - Right arrow (▶): Next avatar
  - Size: 40x40px buttons
  - Position: Flanking avatar on left/right
  - Hover: Scale to 110%, primary color
  - Icon: ChevronLeft/ChevronRight from lucide-react
  
- **Random Button (Dice Icon):**
  - Position: Below avatar, centered
  - Size: 32x32px
  - Icon: Dice6 or Shuffle from lucide-react
  - Tooltip: "Random Avatar"
  - Click: Selects random avatar from available options

**Interaction:**
- Click left/right arrows: Cycle through avatars
- Click dice: Random selection
- Keyboard: Arrow keys for navigation, Space for random

#### 4. Player Input Fields

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Enter your name...              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Language: English            ▼   │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Username Input:**
- Full width within modal
- Large font: `text-lg` or `text-xl` (18-20px)
- Padding: `py-3 px-4`
- Rounded: `rounded-lg`
- Border: 2px solid, bright contrast
- Placeholder: "Enter your name..." or existing value
- Max length: 20 characters
- Auto-focus on load

**Language Selector:**
- Dropdown/Select component
- Full width
- Options: English, Spanish, French, German, etc. (if multi-language support)
- Default: English
- Styled consistently with username input
- Optional: Can be hidden if language support not implemented

#### 5. Action Buttons

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │         PLAY!                  │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Create Private Room                    │
│                                         │
└─────────────────────────────────────────┘
```

**Primary Button (Play!):**
- Full width
- Large size: `h-14` or `h-16` (56-64px height)
- Font: `text-xl` or `text-2xl`, bold
- High contrast: Primary background, white text
- Hover: Scale to 102%, darker shade
- Active: Scale to 98%
- Disabled state: Grayed out if name not entered
- Triggers: `onJoinGame()` - joins public room or shows room list

**Secondary Button (Create Private Room):**
- Text link or outlined button style
- Smaller, visually distinct from primary
- Position: Below primary button
- Color: Muted or secondary
- Hover: Underline or background change
- Triggers: `onCreateRoom()` - creates private room

#### 6. Footer Section

```
┌─────────────────────────────────────────┐
│                                         │
│  About  |  News  |  How to Play         │
│                                         │
└─────────────────────────────────────────┘
```

**Visual Details:**
- Small typography: `text-xs` or `text-sm`
- Subdued colors: `text-muted-foreground`
- Links separated by `|` or spacing
- Hover: Primary color
- Position: Bottom of modal
- Optional: Can be hidden or moved to separate page

### Complete Modal Layout

```
┌─────────────────────────────────────────────────────┐
│  [Patterned Background with Primary Overlay]        │
│                                                      │
│              ┌──────────────────────┐              │
│              │                      │              │
│              │   🎨 Draw & Guess 🎨 │              │
│              │                      │              │
│              │    ◀  ┌──────┐  ▶   │              │
│              │       │  🎨  │       │              │
│              │       │      │       │              │
│              │       └──────┘       │              │
│              │          🎲           │              │
│              │                      │              │
│              │  ┌────────────────┐  │              │
│              │  │ Enter name...  │  │              │
│              │  └────────────────┘  │              │
│              │                      │              │
│              │  ┌────────────────┐  │              │
│              │  │ Language: EN ▼ │  │              │
│              │  └────────────────┘  │              │
│              │                      │              │
│              │  ┌────────────────┐  │              │
│              │  │     PLAY!      │  │              │
│              │  └────────────────┘  │              │
│              │                      │              │
│              │  Create Private Room │              │
│              │                      │              │
│              │ About | News | Help  │              │
│              └──────────────────────┘              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Responsive Design

**Desktop (≥1024px):**
- Modal width: 480px
- Centered horizontally and vertically
- Full layout as shown

**Tablet (768px - 1023px):**
- Modal width: 420px
- Slightly reduced padding
- Avatar size: 100x100px

**Mobile (<768px):**
- Modal width: 90% of viewport (max 400px)
- Avatar size: 80x80px
- Navigation arrows: 32x32px
- Stacked layout for better touch targets
- Footer links: Vertical stack or horizontal with smaller text

### Color Scheme

- **Background Pattern:** Subtle, low opacity (20-30%)
- **Modal Background:** `bg-card` or `bg-background` with high opacity (95-98%)
- **Primary Button:** `bg-primary`, `text-primary-foreground`
- **Secondary Button:** `text-muted-foreground` or `text-secondary`
- **Avatar Border (Selected):** `border-primary`, 3px
- **Input Borders:** `border-border`, 2px
- **Hover States:** Primary color variants

### Interaction Flow (Alternative Design)

1. **Page Load:**
   - Patterned background renders
   - Modal appears with fade-in animation
   - Avatar preview shows default or stored avatar
   - Username input auto-focuses

2. **Avatar Selection:**
   - Click left/right arrows: Cycles through avatars
   - Click dice icon: Random avatar selection
   - Keyboard arrows: Navigate avatars
   - Avatar preview updates in real-time
   - Selected avatar stored in localStorage

3. **Form Completion:**
   - User enters name
   - (Optional) User selects language
   - "Play!" button enables when name entered

4. **Action:**
   - Click "Play!": Joins public game or shows room list
   - Click "Create Private Room": Opens room creation flow
   - Avatar and name sent to server

### Implementation Considerations

**Components Needed:**
- `AvatarCarousel` - Avatar preview with navigation
- `PatternedBackground` - Background pattern component
- `GameLogo` - Styled logo component
- `LanguageSelector` - Dropdown for language (optional)

**State Management:**
- Current avatar index (0-15)
- Username input value
- Selected language (if implemented)
- Loading states for actions

**Animations:**
- Modal fade-in on mount
- Avatar transition on change (fade or slide)
- Button hover/active states
- Background pattern animation (optional)

### Advantages of This Layout

1. **Focused Experience:** Single centered modal draws attention
2. **Prominent Avatar:** Large preview makes selection more engaging
3. **Intuitive Navigation:** Arrow buttons are familiar pattern
4. **Streamlined Flow:** Vertical layout guides user through steps
5. **Visual Appeal:** Patterned background adds personality
6. **Mobile Friendly:** Centered modal works well on all screen sizes

### Migration Path

To implement this alternative:
1. Create new `LobbyModal` component
2. Add `PatternedBackground` component
3. Create `AvatarCarousel` with navigation arrows
4. Update `Lobby.tsx` to use modal layout
5. Add language selector (if multi-language support needed)
6. Update button actions to match new flow
7. Add animations and transitions

