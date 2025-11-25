# RPG Game Visual Layout - Chronicles of the Abyss

## Visual Layout Overview

### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        [Background Effects Layer]                           │
│                    (Gradient overlay + 20 floating particles)               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CHRONICLES OF THE ABYSS                          │  │
│  │                  A Dark Fantasy Adventure                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         ACTION PANEL                                │  │
│  │  ┌──────────┐ ┌──────────┐                                         │  │
│  │  │ 🧭       │ │ 🗺️       │                                         │  │
│  │  │ Explore  │ │ World Map│                                         │  │
│  │  └──────────┘ └──────────┘                                         │  │
│  │  ┌──────────┐ ┌──────────┐                                        │  │
│  │  │ 👤       │ │ 💾       │                                        │  │
│  │  │ Stats    │ │ Save     │                                        │  │
│  │  └──────────┘ └──────────┘                                        │  │
│  │                                                                     │  │
│  │  AVAILABLE COMMANDS                                                │  │
│  │  ┌───────────────────────┐                                         │  │
│  │  │ ⚔️  Attack            │                                         │  │
│  │  └───────────────────────┘                                         │  │
│  │  ┌───────────────────────┐                                         │  │
│  │  │ 💤  Rest              │                                         │  │
│  │  └───────────────────────┘                                         │  │
│  │  ...                                                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────────────────────────────────────┐  ┌──────────────┐  │  │
│  │  │ Type your command...                        │  │     [Send]   │  │  │
│  │  └─────────────────────────────────────────────┘  └──────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [Draggable Emoji Buttons - Bottom of Screen, Side by Side]                │
│  🗺️ (Map)    📜 (Story)    ⚔️ (Player)    📦 (Inventory)                  │
│                                                                             │
│  [All Panels Open as Draggable Popups When Emoji is Clicked]               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │ Story Window    │  │ Player Panel    │  │ Inventory Panel │           │
│  │ (Draggable)     │  │ (Draggable)     │  │ (Draggable)     │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (<1024px)

```
┌─────────────────────────────────────┐
│  [Background Effects Layer]         │
│                                      │
│  ┌───────────────────────────────┐  │
│  │  CHRONICLES OF THE ABYSS      │  │
│  │  A Dark Fantasy Adventure     │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │      ACTION PANEL              │  │
│  │  ┌───────┐ ┌───────┐          │  │
│  │  │🧭Explore│🗺️Map │          │  │
│  │  └───────┘ └───────┘          │  │
│  │  ┌───────┐ ┌───────┐         │  │
│  │  │👤Stats│💾Save│         │  │
│  │  └───────┘ └───────┘         │  │
│  │  COMMANDS                     │  │
│  │  ┌───────┐                    │  │
│  │  │⚔️Attack│                   │  │
│  │  └───────┘                    │  │
│  │  ┌───────┐                    │  │
│  │  │💤Rest │                    │  │
│  │  └───────┘                    │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ Type your command... [Send]   │  │
│  └───────────────────────────────┘  │
│                                      │
│  [Draggable Emoji Buttons - Bottom]  │
│  🗺️  📜  ⚔️  📦                    │
│                                      │
│  [Panels Open as Popups When Clicked]│
└─────────────────────────────────────┘
```

## Overall Page Structure

### Container Layout
- **Background:** Full viewport (`min-h-screen`)
- **Background Color:** Deep purple-black (`270 20% 8%`)
- **Container:** Centered, max-width 7xl, padding x-4 y-6
- **Z-Index Layering:**
  - Background effects: `z-0` (fixed, behind all content)
  - Main content: `z-10` (relative, above background)

### Background Effects Layer
- **Position:** Fixed, full viewport (`fixed inset-0`)
- **Pointer Events:** None (non-interactive)
- **Gradient Overlay:** Animated pulse from secondary/10 to transparent
- **Particles:** 20 floating particles with random positions, sizes (1-4px), durations (8-18s), delays (0-5s)
- **Particle Color:** Primary color at 20% opacity
- **Animation:** Bounce effect with variable durations

## Header Section

### Layout
- **Position:** Top of container, centered
- **Padding:** Vertical 4 units
- **Flex:** Shrink-0 (fixed height)

### Title
- **Text:** "CHRONICLES OF THE ABYSS"
- **Font Size:** 
  - Mobile: `text-3xl` (30px)
  - Small: `text-4xl` (36px)
  - Medium+: `text-5xl` (48px)
- **Font Weight:** Bold
- **Color:** Primary (gold/amber `45 95% 55%`)
- **Letter Spacing:** Wide (`tracking-wider`)

### Subtitle
- **Text:** "A Dark Fantasy Adventure"
- **Font Size:** 
  - Mobile: `text-xs` (12px)
  - Small+: `text-sm` (14px)
- **Color:** Accent (neon cyan/blue `190 95% 55%`)
- **Font Family:** Monospace (`font-mono`)
- **Letter Spacing:** Extra wide (`tracking-widest`)
- **Margin Top:** 2 units

## Main Grid Layout

### Desktop Layout (≥1024px)
- **Grid System:** 12-column grid
- **Column Distribution:**
  - Action Panel: 12 columns (full width, `lg:col-span-12`)
- **Note:** Player Panel, Story Window, and Inventory Panel are now draggable emoji buttons that open popups

### Mobile Layout (<1024px)
- **Layout:** Single column stack
- **Order:** Action Panel → Command Input
- **Gap:** 4 units between sections
- **Note:** All panels accessible via draggable emoji buttons at bottom

## Draggable Emoji Buttons

### Visual Layout

```
[Bottom of Screen - Side by Side]

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│                    [Main Game Content]                       │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │                    📜    ⚔️    📦                    │  │
│  │                  (Story) (Player) (Inventory)        │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Position: Fixed at bottom, side by side                    │
│  - 📜 Story: x = window.innerWidth - 280                    │
│  - ⚔️ Player: x = window.innerWidth - 200                  │
│  - 📦 Inventory: x = window.innerWidth - 120                │
│  - All at: y = window.innerHeight - 120                     │
└─────────────────────────────────────────────────────────────┘
```

### Emoji Button Properties
- **Size:** 3rem (48px) font size
- **Position:** Fixed positioning
- **Z-Index:** 40 (above main content, below popups)
- **Cursor:** Grab/grabbing on hover/drag
- **Behavior:** 
  - Click: Opens respective popup panel
  - Drag: Moves emoji button position
  - Drag Detection: Only counts as drag if moved >5px

### World Map Emoji (🗺️)
- **Emoji:** 🗺️ (world map)
- **Position:** Far left (x: window.innerWidth - 360)
- **Action:** Opens World Map popup

### Story Window Emoji (📜)
- **Emoji:** 📜 (scroll)
- **Position:** Left (x: window.innerWidth - 280)
- **Action:** Opens Story Window popup
- **Default State:** Open on page load

### Player Panel Emoji (⚔️)
- **Emoji:** ⚔️ (sword)
- **Position:** Middle (x: window.innerWidth - 200)
- **Action:** Opens Player Panel popup

### Inventory Emoji (📦)
- **Emoji:** 📦 (package)
- **Position:** Rightmost (x: window.innerWidth - 120)
- **Action:** Opens Inventory Panel popup

## Player Panel

### Visual Layout (Popup Window)

```
                    ┌─────────────────────────┐
                    │ 👤 Player Stats    [X]  │ ← Header (Drag Handle)
                    ├─────────────────────────┤
                    │  ┌───────────────────┐  │
                    │  │       [5]         │  │ ← Level Badge (pulsing)
                    │  │                   │  │
                    │  │    [Avatar]       │  │ ← Character Portrait
                    │  │    (1:1 ratio)    │  │    (hover: scale 1.05)
                    │  │                   │  │
                    │  └───────────────────┘  │
                    │                         │
                    │      Wanderer           │ ← Character Name
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │ ❤️ HP   75/100    │  │
                    │  │ ████████░░        │  │ ← Linear Progress Bar
                    │  └───────────────────┘  │    (hover: tooltip)
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │ 💧 Mana  40/80    │  │
                    │  │    ╭─────╮         │  │
                    │  │    │ 50% │         │  │ ← Circular Progress
                    │  │    ╰─────╯         │  │    (hover: tooltip)
                    │  └───────────────────┘  │
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │ ⭐ XP  1250/2000  │  │
                    │  │    ╭─────╮         │  │
                    │  │    │ 62% │         │  │ ← Circular Progress
                    │  │    ╰─────╯         │  │    (hover: tooltip)
                    │  └───────────────────┘  │
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │ 🪙 Gold     347    │  │ ← Gold Display
                    │  └───────────────────┘  │    (animates on change)
                    └─────────────────────────┘
```

### Container (Popup)
- **Type:** Draggable popup window
- **Width:** 320px (w-80)
- **Position:** Fixed, draggable via header
- **Background:** Card color with 2px border
- **Border Color:** Primary at 30% opacity
- **Border Radius:** Large (`rounded-lg`)
- **Shadow:** 2xl (large shadow)
- **Z-Index:** 50 (above emoji buttons)
- **Animation:** Fade-in and scale (opacity 0→1, scale 0.9→1)
- **Trigger:** Click on ⚔️ emoji button

### Header (Drag Handle)
- **Class:** `.player-handle`
- **Background:** Secondary at 30% opacity
- **Border:** 2px bottom, primary at 30% opacity
- **Padding:** 4 units
- **Layout:** Flex, space-between, items-center
- **Cursor:** Move (on hover)
- **Content:**
  - Icon: User, 20px, primary color
  - Title: "Player Stats", large text, bold, primary color
  - Close Button: X icon, ghost variant, 24px × 24px

### Character Portrait Section
- **Container:** Full width, aspect-square (1:1 ratio)
- **Background:** Secondary at 30% opacity
- **Border:** 2px, primary color at 50% opacity
- **Border Radius:** Large (`rounded-lg`)
- **Overflow:** Hidden
- **Content:** Centered character avatar
- **Hover Effect:** Scale to 1.05 (spring animation, stiffness 300)

### Level Badge
- **Position:** Absolute, top-right (-top-2, -right-2)
- **Size:** 48px × 48px (w-12 h-12)
- **Shape:** Circular (`rounded-full`)
- **Background:** Primary color
- **Text Color:** Primary foreground
- **Font:** Bold, large (text-lg)
- **Border:** 2px, background color
- **Animation:** Pulsing scale (1 → 1.1 → 1, 2s duration, infinite)

### Character Name
- **Font Size:** 2xl (24px)
- **Font Weight:** Bold
- **Color:** Primary
- **Alignment:** Center
- **Animation:** Fade-in with 0.2s delay

### HP Bar Section
- **Layout:** Vertical stack, spacing 1 unit
- **Hover Effect:** Scale to 1.02 (spring, stiffness 400)
- **Label Row:**
  - Icon: Heart, 16px, red-500
  - Text: "HP", foreground at 80% opacity
  - Value: Monospace, red-500, format: "current/max"
- **Progress Bar:**
  - Type: Linear
  - Height: 2 units (h-2)
  - Color: Red
  - Animation: Width animates from 0 to 100% (0.5s duration)

### Mana Bar Section
- **Layout:** Flex, centered, gap 4 units
- **Hover Effect:** Scale to 1.05 (spring, stiffness 400)
- **Label Row:**
  - Icon: Droplet, 16px, blue-500
  - Text: "Mana", foreground at 80% opacity
  - Value: Monospace, blue-500, small text, format: "current/max"
- **Circular Progress:**
  - Size: 80px × 80px (w-20 h-20)
  - Path Color: Blue (#3b82f6)
  - Text Color: Blue (#3b82f6)
  - Trail Color: Dark blue (#1e3a5f)
  - Text Size: 16px
  - Center Text: Percentage rounded
  - Transition: 0.5s duration

### XP Bar Section
- **Layout:** Flex, centered, gap 4 units
- **Hover Effect:** Scale to 1.05 (spring, stiffness 400)
- **Label Row:**
  - Icon: Star, 16px, yellow-500
  - Text: "XP", foreground at 80% opacity
  - Value: Monospace, yellow-500, small text, format: "current/max"
- **Circular Progress:**
  - Size: 80px × 80px (w-20 h-20)
  - Path Color: Gold (#eab308)
  - Text Color: Gold (#eab308)
  - Trail Color: Dark yellow (#3f3f1f)
  - Text Size: 16px
  - Center Text: Percentage rounded
  - Transition: 0.5s duration

### Gold Display Section
- **Container:** Flex, space-between, padding 3 units
- **Background:** Muted color
- **Border:** 1px, primary at 20% opacity
- **Border Radius:** Medium (`rounded-md`)
- **Hover Effect:** Scale to 1.02, box shadow glow
- **Icon:** Coins, 20px, primary color
- **Label:** "Gold", foreground at 80% opacity
- **Value:**
  - Font: Monospace, bold, large (text-lg)
  - Color: Primary
  - Animation: Scale 1.2→1, color yellow→primary (0.3s) on change

### Tooltips
- **Provider:** Radix UI Tooltip
- **Trigger:** Cursor help on stat sections
- **Content:** 
  - HP: Current/max HP, percentage remaining
  - Mana: Current/max Mana, percentage remaining
  - XP: Current/max XP, XP until next level

### Stat Bar Tooltip Visualizations

```
HP Bar (Hover):
┌─────────────────────────────┐
│ ❤️ HP       75/100         │
│ ████████░░                  │
└─────────────────────────────┘
         ↓ (hover)
┌─────────────────────────────┐
│ Health Points: 75 / 100     │
│ 75.0% remaining             │
└─────────────────────────────┘

Mana Bar (Hover):
┌─────────────────────────────┐
│ 💧 Mana     40/80          │
│    ╭─────╮                  │
│    │ 50% │                  │
│    ╰─────╯                  │
└─────────────────────────────┘
         ↓ (hover)
┌─────────────────────────────┐
│ Mana: 40 / 80               │
│ 50.0% remaining             │
└─────────────────────────────┘

XP Bar (Hover):
┌─────────────────────────────┐
│ ⭐ XP     1250/2000        │
│    ╭─────╮                  │
│    │ 62% │                  │
│    ╰─────╯                  │
└─────────────────────────────┘
         ↓ (hover)
┌─────────────────────────────┐
│ Experience: 1250 / 2000     │
│ 750 XP until level 6        │
└─────────────────────────────┘
```

## Story Window

### Visual Layout (Popup Window)

```
                    ┌─────────────────────────────────────┐
                    │ 📍 RUINS OF ELDRATH  TERMINAL  [X]  │ ← Header (Drag Handle)
                    ├─────────────────────────────────────┤
                    │                                     │
                    │  The ancient ruins of **Eldrath**  │ ← Narrative Text
                    │  loom before you, their crumbling  │    (Markdown formatted)
                    │  stones weathered by countless     │
                    │  ages.                             │
                    │                                     │
                    │                                     │ ← Empty line (spacing)
                    │                                     │
                    │  > Attack                          │ ← Command Entry
                    │                                     │    (">" prefix, accent color)
                    │                                     │
                    │  What will you do?                  │ ← Narrative Text
                    │                                     │
                    │  Your torch flickers in the         │
                    │  darkness, casting dancing          │
                    │  shadows against walls inscribed    │
                    │  with *arcane symbols*.            │
                    │                                     │
                    │  The air itself seems to hum with   │
                    │  `dormant power`.                   │ ← Code formatting
                    │                                     │
                    │  ▋                                  │ ← Typing cursor
                    │                                     │    (when new text appears)
                    │                                     │
                    │  [Scrollable area - custom scrollbar]│
                    │                                     │
                    └─────────────────────────────────────┘
```

### Container (Popup)
- **Type:** Draggable popup window
- **Width:** 600px
- **Min Height:** 400px
- **Max Height:** 600px
- **Position:** Fixed, draggable via header
- **Layout:** Flex column
- **Background:** Card color with 2px border
- **Border Color:** Primary at 30% opacity
- **Border Radius:** Large (`rounded-lg`)
- **Shadow:** 2xl (large shadow)
- **Z-Index:** 50 (above emoji buttons)
- **Animation:** Fade-in and scale (opacity 0→1, scale 0.9→1)
- **Trigger:** Click on 📜 emoji button
- **Default State:** Open on page load

### Header Bar (Drag Handle)
- **Class:** `.story-handle`
- **Background:** Secondary at 30% opacity
- **Border:** 2px bottom, primary at 30% opacity
- **Border Radius:** Top large (`rounded-t-lg`)
- **Padding:** 4 units
- **Layout:** Flex, space-between, items-center
- **Shrink:** 0 (fixed height)
- **Cursor:** Move (on hover)
- **Content:**
  - Location Display: MapPin icon + location name
  - Terminal Badge: Terminal icon + "TERMINAL" text
  - Close Button: X icon, ghost variant, 24px × 24px

### Location Display
- **Icon:** MapPin, 20px, primary color
- **Text:** Location name, uppercase
- **Font Size:** xl (20px)
- **Font Weight:** Bold
- **Color:** Primary
- **Letter Spacing:** Wide (`tracking-wider`)

### Terminal Badge
- **Icon:** Terminal, 16px, accent at 70% opacity
- **Text:** "TERMINAL", monospace, accent at 70% opacity
- **Font Size:** Extra small (text-xs)

### Story Content Area
- **Background:** Gradient from amber-50/10 to stone-50/10
- **Border:** 2px, primary at 30% opacity
- **Border Radius:** Bottom large (`rounded-b-lg`)
- **Padding:** 6 units
- **Overflow:** Vertical scroll, custom scrollbar
- **Min Height:** 0 (flex-1)
- **Font:** Monospace (`font-mono`)
- **Text Color:** Foreground at 90% opacity
- **Line Height:** Relaxed (`leading-relaxed`)

### Story Entries
- **Spacing:** 3 units between entries
- **Animation:** Fade-in from bottom (opacity 0→1, y: 10→0, 0.3s duration)
- **Exit Animation:** Fade-out to left (opacity 1→0, x: 0→-20)

### Command Entries
- **Prefix:** ">" symbol, accent color at 70% opacity, bold
- **Prefix Animation:** Opacity pulse (0.7 → 1 → 0.7, 1.5s duration, infinite)
- **Text Style:** Accent color, different from narrative

### Typing Effect
- **Speed:** 30ms per character
- **Cursor:** Visible during typing (▋)
- **Text Color:** Foreground at 95% opacity

### Markdown Styling
- **Bold:** Primary color, bold weight
- **Italic:** Accent color, italic style
- **Code:** Secondary background at 30%, accent color, monospace, small text
- **Lists:** Disc/decimal, inside positioning, spacing 1 unit

## Action Panel

### Visual Layout

```
┌─────────────────────────────┐
│                             │
│  ACTIONS                     │ ← Section Title
│  ┌──────────┐ ┌──────────┐ │
│  │ 🧭       │ │ 🗺️       │ │ ← Action Buttons
│  │ Explore  │ │ World Map│ │    (2 columns)
│  └──────────┘ └──────────┘ │    (hover: scale 1.05)
│  ┌──────────┐ ┌──────────┐ │
│  │ 👤       │ │ 💾       │ │
│  │ Stats    │ │ Save     │ │
│  └──────────┘ └──────────┘ │
│                             │
│  ─────────────────────────  │
│                             │
│  AVAILABLE COMMANDS          │ ← Section Title
│  ┌───────────────────────┐ │
│  │ ⚔️  Attack            │ │ ← Command Buttons
│  └───────────────────────┘ │    (scrollable list)
│  ┌───────────────────────┐ │    (hover: scale + translate)
│  │ 💤  Rest              │ │
│  └───────────────────────┘ │
│  ┌───────────────────────┐ │
│  │ 🔍  Search for        │ │
│  │     Treasure          │ │
│  └───────────────────────┘ │
│  ...                        │
│                             │
│  [Scrollable - max 500px]   │
│                             │
└─────────────────────────────┘
```

### Note: Draggable Emoji Buttons
The Action Panel also renders four draggable emoji buttons that appear at the bottom of the screen:
- **🗺️ World Map** - Opens world map popup
- **📜 Story Window** - Opens story/narrative popup
- **⚔️ Player Panel** - Opens player stats popup  
- **📦 Inventory** - Opens inventory popup

These buttons are positioned side by side and can be dragged independently.

### Container
- **Background:** Card color with 2px border
- **Border Color:** Accent at 30% opacity
- **Border Radius:** Large (`rounded-lg`)
- **Padding:** 6 units
- **Layout:** Flex column, gap 4 units
- **Animation:** Fade-in from right (opacity 0→1, x: 20→0, 0.5s duration)

### Actions Section
- **Title:** "ACTIONS", uppercase, accent color, bold, small text, wide letter spacing
- **Margin Bottom:** 3 units
- **Grid:** 2 columns, gap 2 units
- **Button Height:** 48px (h-12)
- **Button Width:** Full width
- **Button Style:** Secondary variant
- **Button Content:** Icon (16px) + label, centered
- **Button Animation:**
  - Entrance: Fade-in from bottom (opacity 0→1, y: 10→0, staggered 0.1s delay)
  - Hover: Scale to 1.05
  - Tap: Scale to 0.95

### Available Commands Section
- **Title:** "AVAILABLE COMMANDS", uppercase, accent color, bold, small text, wide letter spacing
- **Margin Bottom:** 3 units
- **Container:** Vertical stack, max-height 500px, scrollable
- **Scrollbar:** Custom styled
- **Spacing:** 2 units between commands

### Command Buttons
- **Height:** 40px (h-10)
- **Width:** Full width
- **Variant:** Outline
- **Background:** Muted at 30% opacity
- **Hover Background:** Muted at 50% opacity
- **Layout:** Flex, justify-start, gap 3 units
- **Content:** Icon (16px) + command text
- **Font Size:** Small (text-sm)
- **Animation:**
  - Entrance: Fade-in from right (opacity 0→1, x: 10→0, staggered 0.05s delay)
  - Hover: Scale to 1.02, translate right 5px
  - Tap: Scale to 0.98

### Command Icons
- **Attack:** Sword icon
- **Investigate:** Eye icon
- **Talk:** MessageCircle icon
- **Cast:** Sparkles icon
- **Default:** Sparkles icon

## Command Input

### Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────┐  │
│  │ Type your command...                           │  │ ← Input Field
│  └───────────────────────────────────────────────┘  │    (monospace font)
│  ┌──────────┐                                       │
│  │   📤     │                                       │ ← Submit Button
│  └──────────┘                                       │    (accent color)
└─────────────────────────────────────────────────────┘
```

### Container
- **Width:** Full width
- **Position:** Bottom of main grid, full width
- **Padding Bottom:** 4 units
- **Shrink:** 0 (fixed height)

### Form Container
- **Layout:** Flex, gap 2 units
- **Padding:** 4 units
- **Background:** Card color
- **Border:** 2px, accent at 30% opacity
- **Border Radius:** Large (`rounded-lg`)

### Input Field
- **Flex:** 1 (takes remaining space)
- **Height:** 48px (h-12)
- **Font:** Monospace (`font-mono`)
- **Background:** Input color
- **Border:** Accent at 20% opacity
- **Focus Border:** Accent at 50% opacity
- **Placeholder:** "Type your command..."

### Submit Button
- **Height:** 48px (h-12)
- **Padding:** Horizontal 6 units
- **Background:** Accent color
- **Hover Background:** Accent at 80% opacity
- **Text Color:** Accent foreground
- **Icon:** Send, 16px

## Inventory Panel

### Visual Layout (When Open)

```
                    ┌─────────────────────────┐
                    │ 📦 Inventory  (3 items) │ ← Header (Drag Handle)
                    │                    [X]  │    (draggable)
                    ├─────────────────────────┤
                    │                         │
                    │  ┌──────┐  ┌──────┐     │
                    │  │ ⚔️   │  │ 🛡️   │     │ ← Item Grid
                    │  │Shadow│  │Iron  │     │    (2 columns)
                    │  │Blade │  │Shield│     │
                    │  │Rare  │  │Common│     │
                    │  │ 250G │  │ 50G  │     │
                    │  └──────┘  └──────┘     │
                    │                         │
                    │  ┌──────┐               │
                    │  │ 🧪   │               │
                    │  │Health│               │
                    │  │Potion│               │
                    │  │Uncom.│               │
                    │  │ 100G │               │
                    │  └──────┘               │
                    │                         │
                    │  [Scrollable area]      │
                    │                         │
                    ├─────────────────────────┤
                    │ 📦 Generate Random Item │ ← Footer Button
                    └─────────────────────────┘
```

### Empty State Layout

```
┌─────────────────────────┐
│ 📦 Inventory  (0 items) │
│                    [X]  │
├─────────────────────────┤
│                         │
│         📦              │ ← Empty Icon
│                         │
│  Your inventory is      │
│      empty              │
│                         │
│  ┌───────────────────┐ │
│  │ Generate Test Item│ │ ← Generate Button
│  └───────────────────┘ │
│                         │
└─────────────────────────┘
```

### Item Card Detail

```
┌─────────────────────┐
│                     │
│        ⚔️           │ ← Item Icon (emoji)
│                     │
│   Shadow Blade      │ ← Item Name (bold)
│      rare           │ ← Rarity (capitalized)
│      250G           │ ← Value (monospace)
│                     │
└─────────────────────┘
     ↑
  Hover Tooltip:
  ┌─────────────────────┐
  │ Shadow Blade        │
  │ weapon · rare       │
  │ A blade forged in   │
  │ shadow...           │
  │ Value: 250 Gold     │
  └─────────────────────┘
```

### Container (When Open)
- **Type:** Draggable popup window
- **Position:** Fixed, draggable via header
- **Width:** 320px (w-80)
- **Background:** Card color
- **Border:** 2px, primary at 30% opacity
- **Border Radius:** Large (`rounded-lg`)
- **Shadow:** 2xl (large shadow)
- **Z-Index:** 50 (above emoji buttons)
- **Draggable:** Yes (via react-draggable, handle on header)
- **Animation:**
  - Entrance: Fade-in and scale (opacity 0→1, scale 0.9→1)
  - Exit: Fade-out and scale (opacity 1→0, scale 1→0.9)
- **Trigger:** Click on 📦 emoji button

### Header (Drag Handle)
- **Background:** Secondary at 30% opacity
- **Border:** 2px bottom, primary at 30% opacity
- **Border Radius:** Top large (`rounded-t-lg`)
- **Padding:** 4 units
- **Layout:** Flex, space-between, items-center
- **Cursor:** Move (on hover)

### Header Content
- **Icon:** Package, 20px, primary color
- **Title:** "Inventory", large text, bold, primary color
- **Item Count:** Extra small text, muted foreground, format: "(X items)"
- **Close Button:**
  - Position: Right side
  - Size: 24px × 24px (h-6 w-6)
  - Variant: Ghost
  - Icon: X, 16px

### Content Area
- **Padding:** 4 units
- **Max Height:** 500px
- **Overflow:** Vertical scroll, custom scrollbar

### Empty State
- **Layout:** Centered, padding vertical 8 units
- **Icon:** Package, 48px, centered, 50% opacity
- **Text:** Muted foreground, "Your inventory is empty"
- **Button:** Outline variant, small size, "Generate Test Item"

### Item Grid
- **Layout:** 2 columns, gap 3 units
- **Item Animation:**
  - Entrance: Fade-in and scale (opacity 0→1, scale 0.8→1, staggered 0.05s delay)
  - Hover: Scale to 1.05
  - Tap: Scale to 0.95
  - Exit: Fade-out and scale (opacity 1→0, scale 1→0.8)

### Item Cards
- **Padding:** 3 units
- **Border Radius:** Large (`rounded-lg`)
- **Border:** 2px, rarity-based color
- **Background:** Rarity-based color at 20% opacity
- **Layout:** Flex column, centered, gap 2 units
- **Hover Effect:** Shadow large (`hover:shadow-lg`)
- **Draggable:** Yes (native HTML5 drag)

### Item Rarity Colors
- **Common:** Gray-500 border, gray-500/20 background
- **Uncommon:** Green-500 border, green-500/20 background
- **Rare:** Blue-500 border, blue-500/20 background
- **Epic:** Purple-500 border, purple-500/20 background
- **Legendary:** Yellow-500 border, yellow-500/20 background

### Item Display
- **Icon:** Emoji, 2xl size
  - Weapon: ⚔️
  - Armor: 🛡️
  - Consumable: 🧪
  - Misc: 📦
- **Name:** Small text, bold, foreground, truncated
- **Rarity:** Extra small text, muted foreground, capitalized
- **Value:** Extra small text, primary color, monospace, format: "XG"

### Item Tooltip
- **Max Width:** Extra small (max-w-xs)
- **Content:**
  - Name: Bold
  - Type & Rarity: Extra small, muted, capitalized
  - Description: Small text
  - Value: Extra small, primary, monospace

### Footer
- **Border:** 2px top, primary at 30% opacity
- **Padding:** 4 units
- **Button:** Outline variant, full width
- **Button Content:** Package icon (16px) + "Generate Random Item"

## World Map

### Visual Layout (When Open)

```
                    ┌─────────────────────────────────────────┐
                    │ [⤡] 🗺️ World Map                  [X]  │ ← Header (Drag/Resize)
                    ├─────────────────────────────────────────┤
                    │                                         │
                    │  [Debug: FPS, Position, Keys]          │ ← Debug Overlay (Top Left)
                    │                                         │
                    │  ┌───────────────────────────────────┐ │
                    │  │                                   │ │
                    │  │  [Canvas: Resizable]              │ │ ← Canvas Area
                    │  │                                   │ │
                    │  │  ┌─────────────────────────┐    │ │
                    │  │  │ Ocean (Blue, Animated)  │    │ │
                    │  │  │ Grass (Green, Shaded)    │    │ │
                    │  │  │ Forest (Dark, Shaded)   │    │ │
                    │  │  │ Mountain (Gray, Shaded) │    │ │
                    │  │  │ Desert (Amber, Shaded)  │    │ │
                    │  │  │ ─ Rivers (Blue)         │    │ │
                    │  │  │                          │    │ │
                    │  │  │  ● Location (Gold)       │    │ │
                    │  │  │  💰 Resources            │    │ │
                    │  │  │  🕳️ Features            │    │ │
                    │  │  │  👻 Monsters (Lv5)       │    │ │
                    │  │  │  💰 NPCs (Name)          │    │ │
                    │  │  │  ■ Character (Red)       │    │ │
                    │  │  └─────────────────────────┘    │ │
                    │  │                                   │ │
                    │  └───────────────────────────────────┘ │
                    │                                         │
                    │  Use Arrow Keys or WASD to move •      │ ← Controls Info
                    │  Current: Ruins of Eldrath             │
                    └─────────────────────────────────────────┘
```

### Container (When Open)
- **Type:** Draggable and resizable popup window
- **Position:** Fixed, centered initially, draggable via header
- **Default Width:** 640px (resizable 400-1200px)
- **Default Height:** 480px (resizable 300-800px)
- **Background:** Secondary at 95% opacity with backdrop blur
- **Border:** 2px, primary at 50% opacity
- **Border Radius:** Large (`rounded-lg`)
- **Shadow:** 2xl (large shadow)
- **Z-Index:** 50 (above other panels)
- **Draggable:** Yes (via react-draggable, handle on header)
- **Resizable:** Yes (via top-left corner handle)
- **Animation:**
  - Entrance: Fade-in and scale (opacity 0→1, scale 0.9→1, 0.2s duration)
  - Exit: Fade-out and scale (opacity 1→0, scale 1→0.9)
- **Trigger:** Click on "World Map" action button or 🗺️ emoji button

### Header (Drag Handle)
- **Background:** Transparent with bottom border
- **Border:** 2px bottom, primary at 30% opacity
- **Border Radius:** Top large (`rounded-t-lg`)
- **Padding:** 2 units (p-2), left padding 8 units (pl-8) for resize handle
- **Layout:** Flex, space-between, items-center
- **Cursor:** Move (on hover, `.world-map-header` class)

### Resize Handle
- **Position:** Top-left corner (absolute)
- **Size:** 24px × 24px (w-6 h-6)
- **Cursor:** `nwse-resize` (diagonal resize)
- **Visual:** 4-dot pattern, opacity 60%, 100% on hover
- **Background:** Primary color at 20% opacity, 40% on hover
- **Border:** Right and bottom borders, primary at 50% opacity
- **Z-Index:** 10 (above other elements)

### Header Content
- **Icon:** MapPin, 20px (w-5 h-5), primary color
- **Title:** "World Map", large text (text-lg), bold, primary color
- **Close Button:**
  - Position: Right side
  - Size: 24px × 24px (h-6 w-6)
  - Variant: Ghost
  - Icon: X, 16px (h-4 w-4)

### Canvas Container
- **Padding:** 4 units (p-4)
- **Canvas Dimensions:** Dynamic (panel width - 32px × panel height - 100px)
- **Default:** 640px × 400px
- **Border:** 1px, primary at 30% opacity
- **Border Radius:** Rounded (`rounded`)
- **Image Rendering:** Pixelated (`imageRendering: 'pixelated'`)
- **Background:** Deep black (`#0a0a0a`)

### Debug Overlay
- **Position:** Absolute, top-left (top-6 left-6)
- **Background:** Black at 80% opacity
- **Border:** Primary at 50% opacity
- **Padding:** 2 units
- **Font:** Monospace, extra small
- **Color:** Primary
- **Content:**
  - FPS (color-coded: green ≥55, yellow ≥30, red <30)
  - Delta Time (ms)
  - Movement Speed (tiles/s)
  - Character Position (x, y)
  - Tile Position (x, y)
  - Camera Position (x, y)
  - Pressed Keys (green when active)

### Canvas Rendering
- **Tile Size:** 16×16 pixels (Final Fantasy style)
- **Viewport:** ~40 tiles wide × ~25 tiles tall
- **Rendering Mode:** Pixel-perfect (no anti-aliasing)
- **Context:** 2D canvas context
- **Smoothing:** Disabled (`imageSmoothingEnabled: false`)

### Terrain Rendering
- **Ocean:** Deep blue (`#1a237e`) - Non-walkable
- **Grass:** Green (`#4caf50`) - Walkable
- **Forest:** Dark green (`#2e7d32`) - Walkable
- **Mountain:** Gray (`#757575`) - Non-walkable
- **Desert:** Amber/yellow (`#ffc107`) - Walkable

### Character Rendering
- **Visual:** Red square (6×6 pixels)
- **Color:** `#ff0000`
- **Position:** Centered on current tile
- **Movement:** Smooth animation with camera following
- **Direction:** Tracks movement direction (up/down/left/right)

### Location Markers
- **Shape:** Gold circle (4px radius)
- **Color:** `#ffd700`
- **Position:** Centered on location tile
- **Label:** White text (8px monospace) for current location

### Resource Rendering
- **Icons:** 💰 (treasure), ⛏️ (ore), 🌿 (herb), 💎 (crystal)
- **Size:** 10px Arial font
- **Position:** Centered on tile
- **Visibility:** Only uncollected resources

### Feature Rendering
- **Icons:** 🕳️ (cave), 🏛️ (ruins), ⛩️ (shrine), 🗿 (monolith)
- **Size:** 10px Arial font
- **Position:** Centered on tile
- **Visibility:** Discovered features or features within 5 tiles

### Monster Rendering
- **Icons:** 👻 (shadow), 🐺 (beast), 💀 (undead), 🔥 (elemental), 😈 (demon)
- **Size:** 12px Arial font
- **Position:** Centered on tile
- **Level Indicator:** White text above (`Lv{level}`)
- **HP Bar:** Green/red bar below when damaged
- **Visibility:** Only undefeated monsters

### NPC Rendering
- **Icons:** 💰 (merchant), 📜 (quest giver), 🛡️ (guardian), 🚶 (wanderer), 📚 (scholar)
- **Size:** 12px Arial font
- **Position:** Centered on tile
- **Name Label:** White text above when discovered
- **Visibility:** Discovered NPCs or NPCs within 5 tiles

### River Rendering
- **Color:** River blue (`#1565c0`)
- **Position:** Overlays terrain tiles
- **Generation:** Procedurally generated paths from high elevation to ocean
- **Visibility:** Only shows discovered locations or current location

### Controls Information
- **Position:** Below canvas
- **Text Size:** Extra small (text-xs)
- **Text Color:** Muted foreground
- **Font:** Monospace
- **Content:** "Use Arrow Keys or WASD to move • Current: [Location Name]"

### Camera System
- **Follow Mode:** Camera tracks character position
- **Viewport Culling:** Only renders visible tiles
- **Centering:** Viewport centered on character
- **Smooth Movement:** Camera updates with character movement

### Map Generation
- **Map Size:** 100×100 tiles (default)
- **Generation:** Procedural algorithm using Simplex Noise
- **Noise Layers:**
  - Continent shape (seed + 0)
  - Terrain variation (seed + 1000)
  - Island distribution (seed + 2000)
  - Elevation (seed + 3000)
  - Resources (seed + 4000)
  - Features (seed + 5000)
  - Locations (seed + 6000)
  - Rivers (seed + 7000)
  - Monsters (seed + 8000)
  - NPCs (seed + 9000)
- **Terrain Distribution:**
  - Center: Mountains and forests (high elevation)
  - Mid: Mix of grass and forest
  - Outer: Mostly grass, some desert
- **Elevation:** Height map (0-1) affects terrain shading
- **Locations:** Pre-placed at specific coordinates
- **Resources:** Procedurally placed based on terrain type
- **Features:** Procedurally placed in feature-rich areas
- **Monsters:** Spawn in dangerous areas (forests, mountains, deserts)
- **NPCs:** Spawn near safe areas (locations)
- **Rivers:** Flow from high elevation to ocean

### Integration Points
- **Action Panel:** "World Map" button in main actions
- **Draggable Emoji:** 🗺️ emoji button at bottom of screen
- **RPG Store:** Reads/writes location state, adds story text for NPCs
- **Location Sync:** Updates character position when location changes
- **Discovery:** Auto-discovers locations, features, and NPCs when character reaches them
- **Monster Panel:** Opens automatically on monster encounter
- **NPC Panel:** Opens automatically on NPC encounter
- **Story Window:** Opens automatically with NPC dialogue on encounter

## Hub Preview Card

### Visual Layout

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │ [New]  Chronicles of the Abyss         │ │ ← Header
│ │        Dark fantasy text adventure.    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│  Explore ancient ruins, battle monsters,    │ ← Content
│  and uncover secrets in this immersive      │    (muted text)
│  text-based RPG adventure.                  │
│                                             │
└─────────────────────────────────────────────┘
  ↑
  Dashed border, muted background
```

### Container
- **Card Style:** Dashed border
- **Background:** Muted at 40% opacity
- **Layout:** Standard Card component

### Header
- **Layout:** Flex, items-center, gap 2 units
- **Badge:** "New", default variant
- **Title:** "Chronicles of the Abyss"
- **Description:** "Dark fantasy text adventure."

### Content
- **Text Size:** Small (text-sm)
- **Text Color:** Muted foreground
- **Content:** "Explore ancient ruins, battle monsters, and uncover secrets in this immersive text-based RPG adventure."

## Color Palette

### Theme Colors
- **Background:** Deep purple-black (`270 20% 8%`)
- **Foreground:** Warm amber-gold (`45 90% 85%`)
- **Primary:** Gold/amber (`45 95% 55%`)
- **Secondary:** Deep violet (`270 40% 25%`)
- **Accent:** Neon cyan/blue (`190 95% 55%`)
- **Muted:** Derived from secondary

### Stat Colors
- **HP:** Red (`0 80% 50%`)
- **Mana:** Blue (`210 90% 60%`)
- **XP:** Gold (`45 95% 55%`)

## Typography

### Font Families
- **Fantasy Font:** 'Cinzel' (serif) - Headers and UI text
- **Terminal Font:** 'Fira Code' (monospace) - Stats, commands, story text

### Font Sizes
- **Header Title:** 3xl (30px) → 4xl (36px) → 5xl (48px) responsive
- **Subtitle:** xs (12px) → sm (14px) responsive
- **Panel Titles:** sm (14px), uppercase, bold
- **Character Name:** 2xl (24px), bold
- **Stat Labels:** sm (14px)
- **Stat Values:** Monospace, varies by context
- **Story Text:** Base size, monospace
- **Command Text:** sm (14px)
- **Input Placeholder:** Base size, monospace

## Spacing & Dimensions

### Standard Spacing Units
- **Gap Between Sections:** 4 units
- **Panel Padding:** 6 units
- **Section Padding:** 4 units
- **Item Spacing:** 2-3 units

### Key Dimensions
- **Character Portrait:** Aspect-square (1:1 ratio)
- **Level Badge:** 48px × 48px
- **Circular Progress Bars:** 80px × 80px
- **Action Buttons:** 48px height
- **Command Buttons:** 40px height
- **Input Field:** 48px height
- **Emoji Buttons:** 3rem (48px) font size
- **Story Window Popup:** 600px width, min 400px, max 600px height
- **Player Panel Popup:** 320px width
- **Inventory Panel Popup:** 320px width, max 500px height
- **Command List:** Max 500px height

## Animations

### Entrance Animations
- **Action Panel:** Fade-in from right (0.5s)
- **Emoji Buttons:** Always visible, no entrance animation
- **Popup Panels:** Fade-in and scale (opacity 0→1, scale 0.9→1) when opened
- **Story Entries:** Fade-in from bottom (0.3s)
- **Buttons:** Staggered fade-in (0.1s delay for actions, 0.05s for commands)
- **Items:** Staggered fade-in and scale (0.05s delay)

### Hover Animations
- **Character Portrait:** Scale 1.05 (spring, stiffness 300)
- **Stat Sections:** Scale 1.02-1.05 (spring, stiffness 400)
- **Buttons:** Scale 1.05 (actions) or 1.02 + translate (commands)
- **Items:** Scale 1.05
- **Gold Display:** Scale 1.02 + glow shadow

### Interactive Animations
- **Button Tap:** Scale 0.95-0.98
- **Item Tap:** Scale 0.95
- **Level Badge:** Pulsing scale (2s, infinite)
- **Command Prefix:** Opacity pulse (1.5s, infinite)
- **Gold Value:** Scale + color change on update (0.3s)

### Background Animations
- **Gradient Overlay:** Pulse animation
- **Particles:** Bounce animation (8-18s duration, 0-5s delay)

## Responsive Breakpoints

### Desktop (≥1024px)
- **Layout:** Single column (Action Panel full width)
- **Header:** Large title (5xl)
- **Subtitle:** Small text
- **Panels:** All accessible via draggable emoji buttons
- **Emoji Buttons:** Spawn side by side at bottom (📜 ⚔️ 📦)

### Mobile (<1024px)
- **Layout:** Single column stack
- **Header:** Medium title (3xl-4xl)
- **Subtitle:** Extra small text
- **Action Panel:** Full width
- **Emoji Buttons:** Spawn side by side at bottom
- **Touch-friendly:** Larger tap targets
- **Panels:** All open as draggable popups

## Component Hierarchy

### Visual Component Tree

```
RpgIndex (Main Page)
│
├── BackgroundEffects (z-0, fixed)
│   ├── Gradient Overlay (animated pulse)
│   └── Particles (20 × floating elements)
│
├── Container (z-10, relative)
│   │
│   ├── Header
│   │   ├── Title: "CHRONICLES OF THE ABYSS"
│   │   └── Subtitle: "A Dark Fantasy Adventure"
│   │
│   ├── Grid Layout (12 columns)
│   │   │
│   │   └── ActionPanel (12 cols, full width)
│   │       ├── Actions Section
│   │       │   └── Action Buttons (2 columns)
│   │       └── Commands Section
│   │           └── Command Buttons (scrollable list)
│   │
│   └── CommandInput (full width)
│       ├── Input Field
│       └── Submit Button
│
├── Draggable Emoji Buttons (z-40, fixed, bottom)
│   ├── 📜 Story Window Button (leftmost)
│   ├── ⚔️ Player Panel Button (middle)
│   └── 📦 Inventory Button (rightmost)
│
└── Popup Panels (z-50, fixed, draggable)
    ├── StoryWindow (when open)
    │   ├── Header (drag handle: .story-handle)
    │   │   ├── Location Display
    │   │   ├── Terminal Badge
    │   │   └── Close Button
    │   └── Content Area (scrollable)
    │       └── Story Entries
    │           ├── Narrative Text (Markdown)
    │           └── Command Text (with ">" prefix)
    │
    ├── PlayerPanel (when open)
    │   ├── Header (drag handle: .player-handle)
    │   │   ├── User Icon + "Player Stats"
    │   │   └── Close Button
    │   └── Content
    │       ├── Character Portrait
    │       │   ├── Avatar Image
    │       │   └── Level Badge (overlay)
    │       ├── Character Name
    │       ├── HP Bar (with Tooltip)
    │       ├── Mana Bar (with Tooltip)
    │       ├── XP Bar (with Tooltip)
    │       └── Gold Display
    │
    ├── InventoryPanel (when open)
    │   ├── Header (drag handle: .inventory-handle)
    │   │   ├── Package Icon + "Inventory"
    │   │   └── Close Button
    │   ├── Content Area (scrollable)
    │   │   └── Item Grid (2 columns)
    │   │       └── Item Cards (with Tooltips)
    │   └── Footer Button
    │
    ├── MonsterPanel (when monster encountered)
    │   ├── Header (drag handle: .monster-handle)
    │   │   ├── Skull Icon + "Monster Encounter"
    │   │   └── Close Button
    │   └── Content
    │       ├── Monster Icon (type-specific emoji)
    │       ├── Monster Name
    │       ├── Level Badge
    │       ├── HP Bar
    │       ├── Estimated Stats (Attack, Defense, Speed)
    │       └── Patrol Radius
    │
    ├── NPCPanel (when NPC encountered)
    │   ├── Header (drag handle: .npc-handle)
    │   │   ├── User Icon + "NPC Encounter"
    │   │   └── Close Button
    │   └── Content
    │       ├── NPC Icon (type-specific emoji)
    │       ├── NPC Name
    │       ├── Title Badge
    │       ├── Description
    │       ├── Dialogue
    │       ├── Type & Status Info
    │       └── Quest Indicator (if available)
    │
    └── WorldMap (when open)
        ├── Resize Handle (top-left corner)
        ├── Header (drag handle: .world-map-header)
        │   ├── MapPin Icon + "World Map"
        │   └── Close Button
        └── Content Area
            ├── Debug Overlay (top-left)
            ├── Canvas (resizable, dynamic size)
            │   ├── Terrain Tiles (16×16px, elevation shaded)
            │   ├── Rivers (blue overlays)
            │   ├── Location Markers (gold circles)
            │   ├── Resources (emoji icons)
            │   ├── Features (emoji icons)
            │   ├── Monsters (emoji icons + level + HP bar)
            │   ├── NPCs (emoji icons + name)
            │   └── Character Sprite (red square)
            └── Controls Info (text)
```

## Visual Element Details

### Progress Bar Types

```
Linear Progress (HP):
┌─────────────────────────────┐
│ ❤️ HP       75/100         │
│ ████████░░                  │ ← Red bar, 75% filled
└─────────────────────────────┘

Circular Progress (Mana):
┌─────────────────────────────┐
│ 💧 Mana     40/80          │
│                             │
│      ╭─────────╮            │
│      │         │            │
│      │   50%   │            │ ← Blue ring, 50% filled
│      │         │            │
│      ╰─────────╯            │
│                             │
└─────────────────────────────┘

Circular Progress (XP):
┌─────────────────────────────┐
│ ⭐ XP     1250/2000        │
│                             │
│      ╭─────────╮            │
│      │         │            │
│      │   62%   │            │ ← Gold ring, 62% filled
│      │         │            │
│      ╰─────────╯            │
│                             │
└─────────────────────────────┘
```

### Button States

```
Normal State:
┌──────────────┐
│ ⚔️  Attack  │
└──────────────┘

Hover State (scale 1.02, translate right):
┌──────────────┐
│ ⚔️  Attack  │ → (moved 5px right, slightly larger)
└──────────────┘

Tap/Press State (scale 0.98):
┌──────────────┐
│ ⚔️  Attack  │ (slightly smaller)
└──────────────┘
```

### Animation Flow

```
Page Load:
1. Background effects fade in (immediate)
2. Player Panel: fade-in from left (0.5s)
3. Story Window: fade-in (0.3s)
4. Action Panel: fade-in from right (0.5s)
5. Buttons: staggered fade-in (0.1s delay each)

New Story Entry:
1. Entry fades in from bottom (0.3s)
2. Typing effect starts (30ms per character)
3. Cursor blinks during typing
4. Auto-scroll to bottom

Command Execution:
1. Button tap animation (scale 0.98)
2. Toast notification appears
3. Story entry added with typing effect
4. Stat bars animate to new values (0.5s)
5. Gold value animates (scale + color, 0.3s)
```

