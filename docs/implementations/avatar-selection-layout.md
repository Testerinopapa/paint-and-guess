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

