# RPG Card Animation System - Visual Layout

## Overview

This document provides a visual representation of the card dealing animation system that appears simultaneously with the MonsterPanel when a monster is encountered on the world map.

---

## Component Hierarchy

```
WorldMap
  └── Monster Encounter Detected
      ├── MonsterPanel (Left Side)
      └── CardDealAnimation (Right Side)
          └── PlayingCard × 5 (Staggered Animation)
```

---

## Visual Layout

### Screen Layout (Monster Encounter)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  ┌──────────────────────┐          ┌─────────────────────────────────┐ │
│  │   MonsterPanel        │          │   CardDealAnimation             │ │
│  │   (320px width)       │          │   (480px min-width)             │ │
│  │                       │          │                                  │ │
│  │  ┌──────────────────┐ │          │  ┌──────────────────────────┐  │ │
│  │  │  👻 Monster Icon │ │          │  │  ✨ Combat Cards          │  │ │
│  │  │  Level Badge      │ │          │  │  [X]                      │  │ │
│  │  └──────────────────┘ │          │  └──────────────────────────┘  │ │
│  │                       │          │                                  │ │
│  │  Shadow Wraith        │          │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│ │
│  │  [Shadow Type]         │          │  │ ⚔️ │ │🛡️ │ │✨ │ │💰 │ │🎲 ││ │
│  │                       │          │  │ A  │ │ 2  │ │ K  │ │ Q  │ │ J  ││ │
│  │  HP: 120/120          │          │  │    │ │    │ │    │ │    │ │    ││ │
│  │  [████████████]       │          │  │Attack│Defend│Special│Loot│Event││ │
│  │                       │          │  │ +15 │ +12 │ +20 │ +25 │ +10 ││ │
│  │  ⚡ Attack: 25         │          │  └────┘ └────┘ └────┘ └────┘ └────┘│ │
│  │  🛡️ Defense: 18        │          │    ↓      ↓      ↓      ↓      ↓   │ │
│  │  ⚡ Speed: 15          │          │  (0.0s) (0.1s) (0.2s) (0.3s) (0.4s)│ │
│  │                       │          │                                  │ │
│  │  Patrol Radius: 4     │          │  Select a card to take action    │ │
│  │                       │          │  against Shadow Wraith           │ │
│  └──────────────────────┘          └─────────────────────────────────┘ │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PlayingCard Component

### Card Dimensions

```
┌─────────────────┐
│                 │
│  A        ⚔️    │  ← Top Section (Rank + Suit Icon)
│                 │
│                 │
│                 │
│       ⚔️        │  ← Center (Large Suit Icon)
│                 │
│                 │
│                 │
│    Attack       │  ← Bottom Section
│      +15        │     (Suit Name + Value)
└─────────────────┘
   80px × 112px
```

### Card Structure

```
┌─────────────────────────────────────┐
│  PlayingCard Component              │
│  ┌───────────────────────────────┐  │
│  │  Border (2px, colored by suit)│  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Background (suit color) │  │  │
│  │  │                         │  │  │
│  │  │  Top: Rank + Icon       │  │  │
│  │  │  Center: Large Icon     │  │  │
│  │  │  Bottom: Name + Value   │  │  │
│  │  │                         │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│                                      │
│  Hover Effects:                      │
│  - Lift up (-10px)                  │
│  - Scale (1.05x)                    │
│  - Rotate (2deg)                    │
│  - Glow effect                      │
└─────────────────────────────────────┘
```

### Card Suit Types

#### 1. Attack Card (Red)
```
┌─────────┐
│ A    ⚔️ │
│         │
│    ⚔️   │
│         │
│ Attack  │
│  +15    │
└─────────┘
Color: #ef4444 (Red)
BG: #fee2e2 (Light Red)
Icon: ⚔️
```

#### 2. Defend Card (Blue)
```
┌─────────┐
│ 2    🛡️ │
│         │
│   🛡️    │
│         │
│ Defend  │
│  +12    │
└─────────┘
Color: #3b82f6 (Blue)
BG: #dbeafe (Light Blue)
Icon: 🛡️
```

#### 3. Special Card (Purple)
```
┌─────────┐
│ K    ✨ │
│         │
│   ✨    │
│         │
│ Special │
│  +20    │
└─────────┘
Color: #8b5cf6 (Purple)
BG: #ede9fe (Light Purple)
Icon: ✨
```

#### 4. Loot Card (Gold)
```
┌─────────┐
│ Q    💰 │
│         │
│   💰    │
│         │
│  Loot   │
│  +25    │
└─────────┘
Color: #f59e0b (Gold)
BG: #fef3c7 (Light Gold)
Icon: 💰
```

#### 5. Event Card (Green)
```
┌─────────┐
│ J    🎲 │
│         │
│   🎲    │
│         │
│  Event  │
│  +10    │
└─────────┘
Color: #10b981 (Green)
BG: #d1fae5 (Light Green)
Icon: 🎲
```

---

## CardDealAnimation Component

### Panel Structure

```
┌─────────────────────────────────────────────────────┐
│  CardDealAnimation Panel                            │
│  ┌───────────────────────────────────────────────┐  │
│  │ Header (Draggable)                            │  │
│  │ ┌──────────┐                    ┌──┐          │  │
│  │ │ ✨ Cards │  Combat Cards      │X │          │  │
│  │ └──────────┘                    └──┘          │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │ Cards Container (Flex, gap-3, justify-center) │  │
│  │                                               │  │
│  │  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐     │  │
│  │  │Card│  │Card│  │Card│  │Card│  │Card│     │  │
│  │  │ 1  │  │ 2  │  │ 3  │  │ 4  │  │ 5  │     │  │
│  │  └────┘  └────┘  └────┘  └────┘  └────┘     │  │
│  │    ↓       ↓       ↓       ↓       ↓         │  │
│  │  0.0s    0.1s    0.2s    0.3s    0.4s        │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │ Info Text (Centered, muted)                    │  │
│  │ "Select a card to take action against [Monster]"│  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Animation Timeline

```
Time:  0.0s    0.1s    0.2s    0.3s    0.4s    0.5s
       │       │       │       │       │       │
Card1: ────────┐
       (hidden)│
               └─► (visible, animated)
       
Card2: ────────────────┐
       (hidden)        │
                       └─► (visible, animated)
       
Card3: ────────────────────────┐
       (hidden)                 │
                               └─► (visible, animated)
       
Card4: ────────────────────────────────┐
       (hidden)                        │
                                       └─► (visible, animated)
       
Card5: ────────────────────────────────────────┐
       (hidden)                                │
                                               └─► (visible, animated)
```

### Card Entry Animation

Each card animates with:
- **Initial State:**
  - `y: 100` (below viewport)
  - `opacity: 0` (invisible)
  - `rotate: -10` (tilted left)
  - `scale: 0.8` (smaller)

- **Final State:**
  - `y: 0` (final position)
  - `opacity: 1` (fully visible)
  - `rotate: 0` (straight)
  - `scale: 1` (full size)

- **Animation:**
  - Type: Spring
  - Stiffness: 300
  - Damping: 20
  - Delay: `index * 0.1s` (staggered)

---

## Positioning

### Default Positions

```
┌─────────────────────────────────────────────────────────────┐
│  Screen (1920×1080 example)                                  │
│                                                               │
│  ┌──────────────┐                    ┌─────────────────────┐ │
│  │ MonsterPanel │                    │ CardDealAnimation   │ │
│  │              │                    │                     │ │
│  │  x: 1520px   │                    │  x: 1420px          │ │
│  │  y: 80px     │                    │  y: 80px            │ │
│  │              │                    │                     │ │
│  │  (320px w)   │                    │  (480px min-w)      │ │
│  └──────────────┘                    └─────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Behavior

**Desktop (>1024px):**
- Both panels side-by-side
- MonsterPanel: Right side
- CardDealAnimation: Right side (offset left)

**Tablet (768px - 1024px):**
- Panels stack vertically
- Both centered or offset

**Mobile (<768px):**
- Cards wrap to multiple rows
- Panels may overlap
- Cards scale down

---

## Card Spacing

```
Card Layout (5 cards, gap-3 = 12px):

┌────┐ 12px ┌────┐ 12px ┌────┐ 12px ┌────┐ 12px ┌────┐
│Card│      │Card│      │Card│      │Card│      │Card│
│ 1  │      │ 2  │      │ 3  │      │ 4  │      │ 5  │
└────┘      └────┘      └────┘      └────┘      └────┘
 80px        80px        80px        80px        80px

Total Width: (80px × 5) + (12px × 4) = 448px
Container Width: 480px (min-width)
```

---

## Color Scheme

### Card Colors by Suit

| Suit | Primary Color | Background Color | Border Color |
|------|--------------|------------------|--------------|
| **Attack** | `#ef4444` (Red) | `#fee2e2` (Light Red) | `#ef4444` |
| **Defend** | `#3b82f6` (Blue) | `#dbeafe` (Light Blue) | `#3b82f6` |
| **Special** | `#8b5cf6` (Purple) | `#ede9fe` (Light Purple) | `#8b5cf6` |
| **Loot** | `#f59e0b` (Gold) | `#fef3c7` (Light Gold) | `#f59e0b` |
| **Event** | `#10b981` (Green) | `#d1fae5` (Light Green) | `#10b981` |

### Panel Colors

- **Background:** `bg-card` (theme-based)
- **Border:** `border-primary/50` (2px)
- **Shadow:** `shadow-2xl`
- **Header Background:** `bg-primary/20` (on hover)

---

## Interaction States

### Card States

#### 1. Default State
```
┌────┐
│Card│  Normal size, flat, no glow
└────┘
```

#### 2. Hover State
```
┌────┐
│Card│  ↑ Lifted 10px
└────┘  ↑ Scaled 1.05x
        ↑ Rotated 2deg
        ↑ Glow effect visible
```

#### 3. Active/Tap State
```
┌────┐
│Card│  ↓ Scaled 0.95x (pressed)
└────┘
```

#### 4. Selected State (Future)
```
┌────┐
│Card│  Highlighted border
│ ⭐ │  Selected indicator
└────┘
```

---

## Animation Details

### Staggered Animation Sequence

```
Container Animation:
  - Initial: opacity: 0
  - Animate: opacity: 1
  - Stagger Children: 0.1s
  - Delay Children: 0.2s

Card Animations (per card):
  - Delay: index × 0.1s
  - Duration: ~0.5s (spring)
  - Easing: Spring (stiffness: 300, damping: 20)
```

### Hover Animation

```
Card Hover:
  - y: 0 → -10px (lift up)
  - scale: 1 → 1.05 (grow)
  - rotate: 0 → 2deg (tilt)
  - Duration: 0.2s
  - Easing: Default
```

### Panel Entry Animation

```
CardDealAnimation Panel:
  - Initial: opacity: 0, scale: 0.9, y: 20
  - Animate: opacity: 1, scale: 1, y: 0
  - Duration: 0.3s
  - Easing: Default
```

---

## Card Generation Logic

### Deterministic Generation

```
Monster ID: "monster-42"
  ↓
Seed Calculation: Sum of char codes = 1234
  ↓
Seeded Random Generator
  ↓
Generate 5 Cards:
  - Suit: Fixed order [attack, defend, special, loot, event]
  - Rank: Random (A, 2-10, J, Q, K)
  - Value: Base (level × 5) + Random modifier
```

### Value Calculation

```
Base Value = Monster Level × 5

Attack:   Base + random(0-10)
Defend:   Base + random(0-8)
Special:  Base + random(0-15)
Loot:     Base + random(0-20)
Event:    Base + random(0-5)
```

**Example (Level 5 Monster):**
- Base: 25
- Attack: 25 + 7 = 32
- Defend: 25 + 4 = 29
- Special: 25 + 12 = 37
- Loot: 25 + 18 = 43
- Event: 25 + 3 = 28

---

## Integration Flow

### Encounter Sequence

```
1. Player moves to monster tile
   ↓
2. getMonsterAt() detects monster
   ↓
3. setEncounteredMonster(monster)
   ↓
4. Both panels render simultaneously:
   ├── MonsterPanel (monster data)
   └── CardDealAnimation (generates cards)
       ↓
5. Cards animate in (staggered)
   ↓
6. Player can:
   - View monster stats
   - Select a card
   - Close panels
```

### State Management

```typescript
// WorldMap.tsx state
const [encounteredMonster, setEncounteredMonster] = useState<MapMonster | null>(null);

// When monster encountered:
if (nearbyMonster && !nearbyMonster.defeated) {
  setEncounteredMonster(nearbyMonster);
  // Both panels render when encounteredMonster is set
}

// When closed:
onClose={() => {
  setEncounteredMonster(null);
  // Both panels unmount
}
```

---

## Component Props

### PlayingCard Props

```typescript
interface PlayingCardProps {
  card: Card;              // Card data (suit, rank, value)
  index: number;           // Position in hand (0-4)
  isFlipped?: boolean;     // Show back of card
  onClick?: () => void;     // Click handler
  className?: string;      // Additional styles
}
```

### CardDealAnimation Props

```typescript
interface CardDealAnimationProps {
  monster: MapMonster;     // Monster data
  isOpen: boolean;         // Visibility
  onClose: () => void;     // Close handler
  onCardSelect?: (card: Card) => void;  // Card selection handler
}
```

### Card Interface

```typescript
interface Card {
  id: string;              // Unique ID
  suit: 'attack' | 'defend' | 'special' | 'loot' | 'event';
  rank: string;            // A, 2-10, J, Q, K
  value: number;           // Card value
  description?: string;     // Optional description
  icon?: string;            // Optional custom icon
}
```

---

## Styling Details

### Card Styling

```css
.card {
  width: 80px;
  height: 112px;
  border-radius: 8px;
  border: 2px solid [suit-color];
  background: [suit-bg-color];
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
}
```

### Panel Styling

```css
.card-panel {
  min-width: 480px;
  background: var(--card-bg);
  border: 2px solid var(--primary-50);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

---

## Responsive Breakpoints

### Desktop (≥1024px)
- Cards: Horizontal row, 5 cards
- Panels: Side-by-side
- Card size: 80px × 112px

### Tablet (768px - 1024px)
- Cards: Horizontal row, may wrap
- Panels: Stacked or side-by-side
- Card size: 70px × 98px

### Mobile (<768px)
- Cards: Wrap to 2-3 rows
- Panels: Full width, stacked
- Card size: 60px × 84px

---

## Accessibility

### Keyboard Navigation
- Tab through cards
- Enter/Space to select
- Escape to close panel

### Screen Reader Support
- Card suit and rank announced
- Value announced
- Action description provided

---

## Future Enhancements

### Planned Features
1. **Card Flip Animation** - Cards flip from back to front
2. **Card Selection Highlight** - Visual feedback on selection
3. **Card Effects** - Visual effects when card is used
4. **Card Combos** - Multiple card combinations
5. **Card Sound Effects** - Audio feedback
6. **Card Animations** - More elaborate entry animations

---

## Code Structure

```
src/games/rpg/components/
├── PlayingCard.tsx          (Individual card component)
├── CardDealAnimation.tsx    (5-card container with animation)
└── WorldMap.tsx             (Integration point)
```

---

## Summary

The card animation system provides:
- ✅ **5 unique cards** per monster encounter
- ✅ **Staggered animation** (0.1s delay between cards)
- ✅ **Color-coded suits** (Attack, Defend, Special, Loot, Event)
- ✅ **Deterministic generation** (same monster = same cards)
- ✅ **Level scaling** (card values scale with monster level)
- ✅ **Interactive cards** (hover effects, clickable)
- ✅ **Simultaneous display** with MonsterPanel
- ✅ **Draggable panel** (independent positioning)

The system creates an engaging encounter experience where players can see both the monster information and their available action cards at the same time.

