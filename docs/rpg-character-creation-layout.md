# RPG Character Creation - Visual Layout

## Visual Layout Overview

### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        [Background Effects Layer]                           │
│                    (Gradient overlay + 20 floating particles)               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │              ┌──────────────────────────────────────┐                │  │
│  │              │   CREATE YOUR CHARACTER              │                │  │
│  │              │  Begin Your Journey Into The Abyss  │                │  │
│  │              ├──────────────────────────────────────┤                │  │
│  │              │                                        │                │  │
│  │              │  Character Name                       │                │  │
│  │              │  ┌────────────────────────────────┐  │                │  │
│  │              │  │ Enter your character's name...  │  │                │  │
│  │              │  └────────────────────────────────┘  │                │  │
│  │              │  4/20 characters                      │                │  │
│  │              │                                        │                │  │
│  │              │  Choose Your Class                    │                │  │
│  │              │  ┌────────────┐  ┌────────────┐      │                │  │
│  │              │  │ ⚔️ Warrior │  │ 🎯 Rogue   │      │                │  │
│  │              │  │ 120 HP     │  │ 100 HP     │      │                │  │
│  │              │  │ 50 Mana    │  │ 70 Mana    │      │                │  │
│  │              │  │ Tank & Melee│ │ Stealth    │      │                │  │
│  │              │  └────────────┘  └────────────┘      │                │  │
│  │              │  ┌────────────┐  ┌────────────┐      │                │  │
│  │              │  │ ✨ Mage    │  │ 🛡️ Paladin │      │                │  │
│  │              │  │ 80 HP      │  │ 110 HP     │      │                │  │
│  │              │  │ 120 Mana   │  │ 80 Mana    │      │                │  │
│  │              │  │ Magic      │  │ Support    │      │                │  │
│  │              │  └────────────┘  └────────────┘      │                │  │
│  │              │                                        │                │  │
│  │              │        [Begin Your Journey]            │                │  │
│  │              └──────────────────────────────────────┘                │  │
│  │                                                                       │  │
│  │                    ┌─────────────────────────┐                      │  │
│  │                    │ 👤 Avatar Customization │                      │  │
│  │                    │                    [X]  │                      │  │
│  │                    ├─────────────────────────┤                      │  │
│  │                    │                         │                      │  │
│  │                    │      [Avatar Preview]   │                      │  │
│  │                    │                         │                      │  │
│  │                    │  Your character's        │                      │  │
│  │                    │  appearance             │                      │  │
│  │                    │                         │                      │  │
│  │                    │  Quick Actions          │                      │  │
│  │                    │  ┌───────────────────┐ │                      │  │
│  │                    │  │ 🎲 Randomize      │ │                      │  │
│  │                    │  └───────────────────┘ │                      │  │
│  │                    │  ┌───────────────────┐ │                      │  │
│  │                    │  │ 🔄 Reset to Default│ │                      │  │
│  │                    │  └───────────────────┘ │                      │  │
│  │                    │                         │                      │  │
│  │                    │  💡 Tip: Your avatar... │                      │  │
│  │                    └─────────────────────────┘                      │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (<1024px)

```
┌─────────────────────────────────────┐
│  [Background Effects Layer]         │
│                                      │
│  ┌───────────────────────────────┐  │
│  │  CREATE YOUR CHARACTER         │  │
│  │  Begin Your Journey...         │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │  Character Name                │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Enter name...           │  │  │
│  │  └─────────────────────────┘  │  │
│  │  4/20 characters              │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │  Choose Your Class            │  │
│  │  ┌─────────────┐              │  │
│  │  │ ⚔️ Warrior  │              │  │
│  │  └─────────────┘              │  │
│  │  ┌─────────────┐              │  │
│  │  │ 🎯 Rogue    │              │  │
│  │  └─────────────┘              │  │
│  │  ┌─────────────┐              │  │
│  │  │ ✨ Mage     │              │  │
│  │  └─────────────┘              │  │
│  │  ┌─────────────┐              │  │
│  │  │ 🛡️ Paladin  │              │  │
│  │  └─────────────┘              │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │  [Begin Your Journey]         │  │
│  └───────────────────────────────┘  │
│                                      │
│  [Avatar Popup appears when name ≥2] │
└─────────────────────────────────────┘
```

## Overall Page Structure

### Container Layout
- **Background:** Full viewport (`min-h-screen`)
- **Background Color:** Deep purple-black (`270 20% 8%`)
- **Container:** Centered, max-width 7xl, padding 4 units
- **Layout:** Flex, items-center, justify-center
- **Z-Index Layering:**
  - Background effects: `z-0` (fixed, behind all content)
  - Main content: `z-10` (relative, above background)
  - Avatar popup: `z-50` (above main content)

### Background Effects Layer
- **Position:** Fixed, full viewport (`fixed inset-0`)
- **Pointer Events:** None (non-interactive)
- **Gradient Overlay:** Animated pulse from secondary/10 to transparent
- **Particles:** 20 floating particles with random positions, sizes (1-4px), durations (8-18s), delays (0-5s)
- **Particle Color:** Primary color at 20% opacity
- **Animation:** Bounce effect with variable durations

## Character Creation Form

### Visual Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│        CREATE YOUR CHARACTER                │ ← Title
│   Begin Your Journey Into The Abyss         │ ← Subtitle
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Character Name                             │ ← Label
│  ┌───────────────────────────────────────┐ │
│  │ Enter your character's name...        │ │ ← Input Field
│  └───────────────────────────────────────┘ │
│  4/20 characters                            │ ← Character Count
│                                             │
│  Choose Your Class                          │ ← Label
│  ┌──────────────┐  ┌──────────────┐        │
│  │ ⚔️           │  │ 🎯           │        │
│  │ Warrior      │  │ Rogue        │        │ ← Class Cards
│  │ 120 HP       │  │ 100 HP       │        │    (2x2 grid)
│  │ 50 Mana      │  │ 70 Mana      │        │
│  │ Tank & Melee │  │ Stealth      │        │
│  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ ✨           │  │ 🛡️           │        │
│  │ Mage         │  │ Paladin      │        │
│  │ 80 HP        │  │ 110 HP       │        │
│  │ 120 Mana     │  │ 80 Mana      │        │
│  │ Magic        │  │ Support      │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│        [Begin Your Journey]                 │ ← Submit Button
│                                             │
└─────────────────────────────────────────────┘
```

### Container
- **Type:** Card component
- **Width:** Max-width 4xl (896px), centered
- **Background:** Card color with 2px border
- **Border Color:** Primary at 30% opacity
- **Border Radius:** Large (`rounded-lg`)
- **Padding:** 8 units (p-8)
- **Shadow:** 2xl (large shadow)
- **Animation:** Fade-in and slide from left (opacity 0→1, scale 0.9→1, x: -50→0, 0.5s duration)

### Header Section
- **Layout:** Centered, margin-bottom 8 units
- **Animation:** Fade-in from top (opacity 0→1, y: -20→0, delay 0.2s)

### Title
- **Text:** "CREATE YOUR CHARACTER"
- **Font Size:** 
  - Mobile: `text-4xl` (36px)
  - Desktop: `text-5xl` (48px)
- **Font Family:** 'Cinzel Decorative', 'Cinzel', serif
- **Font Weight:** Bold
- **Color:** Primary (gold/amber)
- **Letter Spacing:** Wide (`tracking-wider`)
- **Margin Bottom:** 2 units

### Subtitle
- **Text:** "Begin Your Journey Into The Abyss"
- **Font Size:** Small (`text-sm`)
- **Color:** Accent (neon cyan/blue)
- **Font Family:** Monospace (`font-mono`)
- **Letter Spacing:** Extra wide (`tracking-widest`)

## Character Name Input

### Visual Layout

```
Character Name
┌─────────────────────────────────────────────┐
│ Enter your character's name...              │ ← Input Field
└─────────────────────────────────────────────┘
4/20 characters                                ← Character Count
```

### Container
- **Layout:** Vertical stack, spacing 2 units
- **Animation:** Fade-in from left (opacity 0→1, x: -20→0, delay 0.3s)

### Label
- **Text:** "Character Name"
- **Font Size:** Large (`text-lg`)
- **Font Weight:** Semibold
- **Color:** Primary
- **Display:** Block
- **Margin Bottom:** 2 units

### Input Field
- **Type:** Text input
- **Height:** 48px (h-12)
- **Font Size:** Large (`text-lg`)
- **Font Family:** Monospace (`font-mono`)
- **Background:** Background color
- **Border:** 2px, primary at 30% opacity
- **Focus Border:** Primary color
- **Placeholder:** "Enter your character's name..."
- **Max Length:** 20 characters
- **Auto Focus:** Enabled
- **Border Radius:** Default

### Character Count
- **Font Size:** Extra small (`text-xs`)
- **Color:** Muted foreground
- **Format:** "{current}/20 characters"
- **Margin Top:** 1 unit

## Class Selection

### Visual Layout

```
Choose Your Class

┌──────────────────────┐  ┌──────────────────────┐
│ ⚔️                   │  │ 🎯                   │
│                      │  │                      │
│ Warrior              │  │ Rogue                │
│ A fierce fighter...  │  │ A stealthy...        │
│                      │  │                      │
│ 120 HP  50 Mana      │  │ 100 HP  70 Mana      │
│ Tank & Melee         │  │ Stealth & Agility    │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ ✨                   │  │ 🛡️                   │
│                      │  │                      │
│ Mage                 │  │ Paladin             │
│ A master of arcane...│  │ A holy warrior...    │
│                      │  │                      │
│ 80 HP   120 Mana     │  │ 110 HP  80 Mana      │
│ Magic & Ranged       │  │ Support & Defense    │
└──────────────────────┘  └──────────────────────┘
```

### Container
- **Layout:** Vertical stack, spacing 4 units
- **Animation:** Fade-in from left (opacity 0→1, x: -20→0, delay 0.4s)

### Label
- **Text:** "Choose Your Class"
- **Font Size:** Large (`text-lg`)
- **Font Weight:** Semibold
- **Color:** Primary
- **Display:** Block
- **Margin Bottom:** 4 units

### Class Grid
- **Layout:** Grid, 1 column (mobile) or 2 columns (desktop, `md:grid-cols-2`)
- **Gap:** 4 units between cards
- **Animation:** Staggered fade-in from bottom (opacity 0→1, y: 20→0, delay 0.5s + index * 0.1s)

### Class Cards

#### Unselected State
- **Padding:** 6 units (p-6)
- **Border:** 2px, primary at 30% opacity
- **Background:** Card color
- **Border Radius:** Large (`rounded-lg`)
- **Layout:** Flex, items-start, gap 4 units
- **Text Alignment:** Left
- **Hover Effect:** Border color changes to primary at 50% opacity
- **Animation:**
  - Hover: Scale to 1.02
  - Tap: Scale to 0.98

#### Selected State
- **Border:** 2px, primary color (full opacity)
- **Background:** Primary at 10% opacity
- **Shadow:** Large (`shadow-lg`)
- **Icon Background:** Primary at 20% opacity
- **Icon Color:** Primary color
- **Title Color:** Primary color

#### Class Card Structure
- **Icon Container:**
  - Padding: 3 units
  - Border Radius: Large (`rounded-lg`)
  - Background: Secondary at 30% (unselected) or Primary at 20% (selected)
  - Icon Size: 24px × 24px (w-6 h-6)
  - Icon Color: Foreground at 70% (unselected) or Primary (selected)

- **Content Area:**
  - Flex: 1 (takes remaining space)
  - **Class Name:**
    - Font Size: Large (`text-lg`)
    - Font Weight: Bold
    - Color: Foreground (unselected) or Primary (selected)
    - Margin Bottom: 1 unit
  
  - **Description:**
    - Font Size: Small (`text-sm`)
    - Color: Muted foreground
    - Margin Bottom: 2 units
  
  - **Stats Row:**
    - Layout: Flex, gap 4 units
    - Font Size: Extra small (`text-xs`)
    - **HP:** Red-500, monospace
    - **Mana:** Blue-500, monospace
    - **Playstyle:** Accent color

### Available Classes

| Class | Icon | HP | Mana | Playstyle | Description |
|-------|------|----|----|-----------|-------------|
| Warrior | ⚔️ | 120 | 50 | Tank & Melee | A fierce fighter with high health and physical strength |
| Mage | ✨ | 80 | 120 | Magic & Ranged | A master of arcane magic with powerful spells |
| Rogue | 🎯 | 100 | 70 | Stealth & Agility | A stealthy assassin with balanced abilities |
| Paladin | 🛡️ | 110 | 80 | Support & Defense | A holy warrior with healing and combat skills |

## Submit Button

### Visual Layout

```
        ┌─────────────────────────────┐
        │   Begin Your Journey        │
        └─────────────────────────────┘
```

### Container
- **Layout:** Centered, padding-top 4 units
- **Animation:** Fade-in from bottom (opacity 0→1, y: 20→0, delay 0.8s)

### Button
- **Type:** Submit button
- **Size:** Large (`size="lg"`)
- **Padding:** Horizontal 8 units, vertical 6 units (px-8 py-6)
- **Font Size:** Large (`text-lg`)
- **Font Weight:** Bold
- **Background:** Primary color
- **Hover Background:** Primary at 90% opacity
- **Disabled State:**
  - Opacity: 50%
  - Cursor: Not-allowed
- **Enabled Condition:** Character name ≥ 2 characters AND class selected

## Avatar Customization Popup

### Visual Layout (When Name ≥ 2 Characters)

```
                    ┌─────────────────────────┐
                    │ 👤 Avatar Customization │ ← Header (Drag Handle)
                    │                    [X]  │
                    ├─────────────────────────┤
                    │                         │
                    │    ┌───────────────┐    │
                    │    │               │    │
                    │    │  [Avatar]     │    │ ← Avatar Preview
                    │    │   (192px)     │    │    (192×192px)
                    │    │               │    │
                    │    └───────────────┘    │
                    │                         │
                    │  Your character's        │
                    │  appearance             │
                    │                         │
                    │  Quick Actions          │
                    │  ┌───────────────────┐  │
                    │  │ 🎲 Randomize Avatar│  │ ← Randomize Button
                    │  └───────────────────┘  │
                    │  ┌───────────────────┐  │
                    │  │ 🔄 Reset to Default│  │ ← Reset Button
                    │  └───────────────────┘  │
                    │                         │
                    │  ┌───────────────────┐  │
                    │  │ 💡 Tip: Your avatar│  │ ← Info Box
                    │  │ is generated...   │  │
                    │  └───────────────────┘  │
                    │                         │
                    └─────────────────────────┘
```

### Container (Popup)
- **Type:** Draggable popup window
- **Width:** 320px (w-80)
- **Position:** Fixed, draggable via header
- **Default Position:** 
  - X: `window.innerWidth / 2 + 250` (to the right of form)
  - Y: `window.innerHeight / 2 - 200` (centered vertically)
- **Background:** Card color with 2px border
- **Border Color:** Primary at 30% opacity
- **Border Radius:** Large (`rounded-lg`)
- **Shadow:** 2xl (large shadow)
- **Z-Index:** 50 (above main content)
- **Animation:** Fade-in and scale (opacity 0→1, scale 0.9→1)
- **Visibility:** Only appears when character name has ≥ 2 characters

### Header (Drag Handle)
- **Class:** `.avatar-handle`
- **Background:** Secondary at 30% opacity
- **Border:** 2px bottom, primary at 30% opacity
- **Border Radius:** Top large (`rounded-t-lg`)
- **Padding:** 4 units
- **Layout:** Flex, space-between, items-center
- **Cursor:** Move (on hover)

### Header Content
- **Icon:** User, 20px, primary color
- **Title:** "Avatar Customization", large text, bold, primary color
- **Close Button:**
  - Position: Right side
  - Size: 24px × 24px (h-6 w-6)
  - Variant: Ghost
  - Icon: X, 16px
  - Note: Currently non-functional (doesn't close popup)

### Content Area
- **Padding:** 6 units (p-6)
- **Spacing:** 6 units between sections (space-y-6)

### Avatar Preview Section
- **Layout:** Flex column, items-center, gap 4 units
- **Preview Container:**
  - Size: 192px × 192px (w-48 h-48)
  - Border: 2px, primary at 50% opacity
  - Border Radius: Large (`rounded-lg`)
  - Background: Secondary at 30% opacity
  - Overflow: Hidden
  - Display: Flex, items-center, justify-center
- **Avatar Component:**
  - Uses `CharacterAvatar` component
  - Size: 192px
  - Displays SVG avatar based on character name or config
- **Description Text:**
  - Font Size: Small (`text-sm`)
  - Color: Muted foreground
  - Text: "Your character's appearance"
  - Alignment: Center

### Quick Actions Section
- **Title:**
  - Font Size: Small (`text-sm`)
  - Font Weight: Semibold
  - Color: Foreground
  - Margin Bottom: 2 units
- **Buttons Container:**
  - Layout: Flex column, gap 2 units
  - **Randomize Button:**
    - Variant: Outline
    - Width: Full width
    - Text: "🎲 Randomize Avatar"
    - Action: Generates new random avatar config
  - **Reset Button:**
    - Variant: Outline
    - Width: Full width
    - Text: "🔄 Reset to Default"
    - Action: Resets to name-based default avatar

### Info Box
- **Container:**
  - Padding: 3 units
  - Background: Muted at 30% opacity
  - Border: 1px, primary at 20% opacity
  - Border Radius: Medium (`rounded-md`)
- **Content:**
  - Font Size: Extra small (`text-xs`)
  - Color: Muted foreground
  - Text: "💡 **Tip:** Your avatar is generated based on your character name. Use "Randomize" to try different looks!"

## Animations

### Entrance Animations
- **Form Container:** Fade-in and slide from left (opacity 0→1, scale 0.9→1, x: -50→0, 0.5s duration)
- **Header:** Fade-in from top (opacity 0→1, y: -20→0, delay 0.2s)
- **Name Input:** Fade-in from left (opacity 0→1, x: -20→0, delay 0.3s)
- **Class Selection:** Fade-in from left (opacity 0→1, x: -20→0, delay 0.4s)
- **Class Cards:** Staggered fade-in from bottom (opacity 0→1, y: 20→0, delay 0.5s + index * 0.1s)
- **Submit Button:** Fade-in from bottom (opacity 0→1, y: 20→0, delay 0.8s)
- **Avatar Popup:** Fade-in and scale (opacity 0→1, scale 0.9→1) when name ≥ 2 characters

### Interactive Animations
- **Class Cards:**
  - Hover: Scale to 1.02
  - Tap: Scale to 0.98
- **Buttons:**
  - Hover: Background opacity changes
  - Tap: Scale to 0.95

## Component Hierarchy

### Visual Component Tree

```
CharacterCreation (Main Component)
│
├── BackgroundEffects (z-0, fixed)
│   ├── Gradient Overlay (animated pulse)
│   └── Particles (20 × floating elements)
│
├── Container (z-10, relative)
│   │
│   ├── Motion Div (Form Wrapper)
│   │   │
│   │   └── Card (Character Creation Form)
│   │       │
│   │       ├── Header Section
│   │       │   ├── Title: "CREATE YOUR CHARACTER"
│   │       │   └── Subtitle: "Begin Your Journey Into The Abyss"
│   │       │
│   │       └── Form
│   │           │
│   │           ├── Name Input Section
│   │           │   ├── Label: "Character Name"
│   │           │   ├── Input Field
│   │           │   └── Character Count
│   │           │
│   │           ├── Class Selection Section
│   │           │   ├── Label: "Choose Your Class"
│   │           │   └── Class Grid (2×2)
│   │           │       ├── Warrior Card
│   │           │       ├── Mage Card
│   │           │       ├── Rogue Card
│   │           │       └── Paladin Card
│   │           │
│   │           └── Submit Button Section
│   │               └── "Begin Your Journey" Button
│   │
│   └── AvatarCustomization (z-50, fixed, draggable, conditional)
│       ├── Draggable Wrapper
│       │   └── Motion Div (Popup Container)
│       │       │
│       │       ├── Header (drag handle: .avatar-handle)
│       │       │   ├── User Icon + "Avatar Customization"
│       │       │   └── Close Button (X)
│       │       │
│       │       └── Content Area
│       │           ├── Avatar Preview Section
│       │           │   ├── Preview Container (192×192px)
│       │           │   │   └── CharacterAvatar Component
│       │           │   └── Description Text
│       │           │
│       │           └── Quick Actions Section
│       │               ├── Title: "Quick Actions"
│       │               ├── Randomize Button
│       │               ├── Reset Button
│       │               └── Info Box
```

## Styling Details

### Color Palette
- **Background:** Deep purple-black (`270 20% 8%`)
- **Card Background:** Card color (from theme)
- **Primary:** Gold/amber (`45 95% 55%`)
- **Accent:** Neon cyan/blue (`190 95% 55%`)
- **Muted:** Derived from secondary
- **Stat Colors:**
  - HP: Red-500
  - Mana: Blue-500
  - Playstyle: Accent color

### Typography
- **Title Font:** 'Cinzel Decorative', 'Cinzel', serif
- **Subtitle Font:** Monospace
- **Input Font:** Monospace
- **Stat Font:** Monospace

### Spacing
- **Form Padding:** 8 units
- **Section Spacing:** 8 units (space-y-8)
- **Class Grid Gap:** 4 units
- **Avatar Popup Padding:** 6 units
- **Button Padding:** Horizontal 8, vertical 6 units

## Form Validation

### Requirements
- **Character Name:**
  - Minimum: 2 characters
  - Maximum: 20 characters
  - Trimmed (whitespace removed)
- **Class Selection:**
  - Must select one class
  - Cannot be null

### Submit Button State
- **Enabled:** When name ≥ 2 characters AND class is selected
- **Disabled:** When name < 2 characters OR no class selected
- **Visual Feedback:**
  - Enabled: Full opacity, primary background
  - Disabled: 50% opacity, not-allowed cursor

## Integration Points

### RPG Store
- **`initializeCharacter(name, class)`:** Creates new character with custom stats
- **`setCharacterAvatar(config)`:** Saves avatar configuration
- **Character Stats:** Based on selected class:
  - Warrior: 120 HP, 50 Mana
  - Mage: 80 HP, 120 Mana
  - Rogue: 100 HP, 70 Mana
  - Paladin: 110 HP, 80 Mana

### Character Creation Flow
1. User enters character name (≥ 2 characters)
2. Avatar popup appears (conditional rendering)
3. User selects class
4. User optionally customizes avatar
5. User clicks "Begin Your Journey"
6. Character is initialized with:
   - Custom name
   - Class-based stats
   - Avatar configuration (if set)
   - Starting level: 1
   - Starting XP: 0
   - Starting Gold: 50
7. `isCharacterCreated` flag set to `true`
8. Game transitions to main game layout

## Responsive Behavior

### Desktop (≥1024px)
- **Form Width:** Max-width 4xl (896px), centered
- **Class Grid:** 2 columns
- **Avatar Popup:** Positioned to the right of form

### Mobile (<1024px)
- **Form Width:** Full width with padding
- **Class Grid:** 1 column (stacked)
- **Avatar Popup:** May overlap form (draggable to reposition)

## Notes

- Character creation screen only appears for first-time players (`isCharacterCreated: false`)
- Avatar popup automatically appears when name has ≥ 2 characters
- Avatar popup is draggable and can be repositioned
- All animations use framer-motion for smooth transitions
- Form validation prevents submission until all requirements are met
- Character stats are automatically set based on selected class
- Avatar configuration is optional but saved if provided

