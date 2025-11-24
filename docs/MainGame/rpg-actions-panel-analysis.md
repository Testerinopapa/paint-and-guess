# RPG Actions Panel Analysis - Chronicles of the Abyss

## Overview

The **ActionPanel** component (`src/games/rpg/components/ActionPanel.tsx`) is the primary interaction hub for the RPG game. It provides two distinct interaction layers: **Main Actions** (exploration and utility) and **Available Commands** (context-specific gameplay actions). The component also includes draggable emoji shortcuts for quick access to other game panels.

**Component Location:** `src/games/rpg/components/ActionPanel.tsx`  
**Lines of Code:** ~400  
**Dependencies:** Framer Motion, react-draggable, Radix UI Tooltip, Lucide React icons

## Component Architecture

### Interface Definition

```typescript
interface ActionPanelProps {
  onAction: (action: string) => void;
  onCommand?: (command: string) => void;
  availableCommands: string[];
  onOpenPlayerPanel?: () => void;
  onOpenStoryWindow?: () => void;
  onOpenWorldMap?: () => void;
}
```

**Props Breakdown:**
- `onAction` - Required callback for main actions (Explore, Stats, Save, World Map)
- `onCommand` - Optional callback for available commands (Attack, Rest, etc.)
- `availableCommands` - Dynamic array of context-specific commands
- `onOpenPlayerPanel` - Optional callback to open player stats panel
- `onOpenStoryWindow` - Optional callback to open story window
- `onOpenWorldMap` - Optional callback to open world map

### Component Structure

```
ActionPanel
├── Draggable Emoji Buttons (4)
│   ├── 📦 Inventory (opens inventory panel)
│   ├── ⚔️ Player Panel (opens player stats)
│   ├── 📜 Story Window (opens story window)
│   └── 🗺️ World Map (opens world map)
└── Main Panel
    ├── Main Actions Section
    │   └── Grid (2x2) of action buttons
    └── Available Commands Section
        └── Scrollable list of command buttons
```

## Main Actions Section

### Purpose

The **Main Actions** section provides quick access to core game utilities and exploration mechanics. These actions are always available and provide narrative feedback without directly modifying character stats.

### Actions List

```typescript
const mainActions = [
  { label: "Explore", icon: Compass, action: "explore" },
  { label: "World Map", icon: Map, action: "worldmap" },
  { label: "Stats", icon: User, action: "stats" },
  { label: "Save", icon: Save, action: "save" },
];
```

### Action Behaviors

#### 1. **Explore** (`action: "explore"`)

**Routing:** `onAction("explore")` → `handleAction()` → `performAction()` → `resolveAction()`

**Effects:**
- ✅ Adds narrative text to story
- ✅ Unlocks new command: "Translate Glyphs"
- ❌ Does NOT modify character stats (HP, Mana, XP, Gold)

**Narrative Output:**
```
"You edge deeper into the maze of shattered corridors. A dormant obelisk hums faintly as you pass."
"Strange glyphs glow for a moment, revealing a hidden inscription."
```

**Implementation:** See `useRpgStore.tsx` lines 466-473

#### 2. **World Map** (`action: "worldmap"`)

**Routing:** `onAction("worldmap")` → `handleAction()` → UI state toggle (not routed to store)

**Effects:**
- ✅ Toggles world map panel visibility
- ❌ No narrative or stat changes
- ❌ Handled in parent component (`Index.tsx`), not in store

**Implementation:** See `Index.tsx` lines 130-133

#### 3. **Stats** (`action: "stats"`)

**Routing:** `onAction("stats")` → `handleAction()` → `performAction()` → `resolveAction()`

**Effects:**
- ✅ Adds narrative text showing current stats
- ❌ Does NOT modify character stats
- ❌ Informational only

**Narrative Output:**
```
"HP 75/100 · Mana 40/80 · XP 1250/2000"
```

**Implementation:** See `useRpgStore.tsx` lines 480-485

#### 4. **Save** (`action: "save"`)

**Routing:** `onAction("save")` → `handleAction()` → `performAction()` → `resolveAction()`

**Effects:**
- ✅ Adds narrative text (flavor only)
- ❌ Does NOT actually save game state (localStorage handled by Zustand persist middleware)
- ⚠️ Narrative-only action (save system is automatic via Zustand persist)

**Narrative Output:**
```
"You etch a protective rune into the stone, anchoring your presence should the abyss swallow you whole."
```

**Implementation:** See `useRpgStore.tsx` lines 486-490

### Visual Design

**Layout:**
- 2x2 grid layout (`grid grid-cols-2 gap-2`)
- Button height: `h-12` (48px)
- Full width buttons with icon + label
- Secondary variant styling

**Container Styling:**
- **Background:** Transparent (no background class) - matches gamehub background
  - Inherits background from parent container
  - Seamlessly blends with gamehub main content area
- **Border:** None (removed for seamless integration)
  - Previously had `border-2 border-accent/30` (2px accent border)
  - Border removed to match gamehub aesthetic
- **Border Radius:** `rounded-lg` (0.75rem / 12px) - soft rounded corners
- **Padding:** `p-6` (24px) - generous internal spacing
- **Gap:** `gap-4` (16px) - spacing between sections

**Section Headers:**
- **Typography:** `text-sm font-bold text-accent uppercase tracking-wider`
  - Font size: 14px (small)
  - Font weight: Bold (700)
  - Color: Accent color (`340 82% 52%` - magenta/pink)
  - Text transform: Uppercase
  - Letter spacing: Wide (`tracking-wider` - 0.05em)
- **Spacing:** `mb-3` (12px margin-bottom)

**Main Actions Buttons:**
- **Variant:** `secondary` (shadcn/ui button variant)
- **Background:** `bg-secondary` (dark theme: `270 40% 25%` - deep violet)
- **Text Color:** `text-secondary-foreground` (light text for contrast)
- **Hover State:** `hover:bg-secondary/80` (80% opacity on hover)
- **Border:** Inherited from secondary variant (subtle border)
- **Border Radius:** `rounded-md` (0.375rem / 6px) - medium rounded corners
- **Height:** `h-12` (48px) - tall buttons for easy clicking
- **Layout:** `flex items-center justify-center gap-2` - centered icon + text
- **Icon Size:** `w-4 h-4` (16px) - compact icons
- **Text Size:** `text-sm` (14px) - readable but compact

**Available Commands Buttons:**
- **Variant:** `outline` (shadcn/ui button variant)
- **Background:** `bg-muted/30` (30% opacity muted background)
  - Muted color: `240 6% 20%` (dark gray-purple) in dark theme
- **Hover Background:** `hover:bg-muted/50` (50% opacity on hover - brighter)
- **Border:** `border border-input` (1px solid input border color)
- **Text Color:** Inherited from foreground (light text)
- **Hover Text:** `hover:text-accent-foreground` (accent foreground on hover)
- **Border Radius:** `rounded-md` (0.375rem / 6px)
- **Height:** `h-10` (40px) - slightly smaller than main actions
- **Layout:** `justify-start gap-3` - left-aligned with icon spacing
- **Icon Size:** `w-4 h-4` (16px)
- **Text Size:** `text-sm` (14px)

**Color Palette (Dark Theme):**
- **Container Background:** Transparent (inherits from gamehub)
- **Accent Color:** `340 82% 52%` - Magenta/pink for section headers
- **Secondary Background:** `270 40% 25%` - Deep violet for main action buttons
- **Muted Background:** `240 6% 20%` - Dark gray-purple for command buttons
- **Primary Color:** `262 83% 58%` - Purple (used in scrollbar and other elements)
- **Foreground Text:** `240 20% 99%` - Near-white text for readability

**Borders & Contours:**
- **Container Border:** None (removed for seamless gamehub integration)
  - Previously had 2px accent border with glow effect
  - Now borderless to blend with gamehub background
- **Button Borders:**
  - Main Actions: Inherited from secondary variant (subtle)
  - Commands: 1px solid input border (`border border-input`)
- **Border Radius:**
  - Container: `rounded-lg` (12px) - soft, rounded corners
  - Buttons: `rounded-md` (6px) - medium rounded corners
- **No sharp edges** - all elements use rounded corners for modern, polished look

**Shadows & Glows:**
- **Border Glow:** None (border removed)
- **Hover Effects:** Background opacity changes on buttons create depth
- **No explicit box-shadows** - relies on button styling and animations for depth
- **Framer Motion animations** add visual feedback without shadows
- **Transparent background** allows gamehub background to show through

**Typography:**
- **Section Headers:**
  - Font: System font stack (likely sans-serif)
  - Size: 14px (`text-sm`)
  - Weight: Bold (700)
  - Color: Accent (`340 82% 52%`)
  - Transform: Uppercase
  - Tracking: Wide (0.05em)
- **Button Labels:**
  - Font: System font stack
  - Size: 14px (`text-sm`)
  - Weight: Medium (500) - from button variant
  - Color: Secondary foreground / Accent foreground (on hover)

**Spacing & Padding:**
- **Container Padding:** 24px (`p-6`) - generous spacing
- **Section Gap:** 16px (`gap-4`) - clear separation between sections
- **Header Margin:** 12px bottom (`mb-3`)
- **Main Actions Grid Gap:** 8px (`gap-2`) - tight grid spacing
- **Command List Gap:** 8px (`space-y-2`) - vertical spacing between commands
- **Button Internal Spacing:**
  - Main Actions: 8px (`gap-2`) - icon to text spacing
  - Commands: 12px (`gap-3`) - slightly more spacing for readability

**Scrollbar Styling (`.custom-scrollbar`):**
- **Width:** 8px - thin, unobtrusive scrollbar
- **Track Background:** `hsl(var(--background) / 0.1)` - 10% opacity background
  - Very subtle track that blends with container
- **Track Border Radius:** 4px - rounded track
- **Thumb Background:** `hsl(var(--primary) / 0.3)` - 30% opacity primary color
  - Primary: `262 83% 58%` (purple)
  - Creates visible but subtle scrollbar thumb
- **Thumb Border:** 1px solid with 20% background opacity
- **Thumb Border Radius:** 4px - rounded thumb
- **Thumb Hover:** `hsl(var(--primary) / 0.5)` - 50% opacity on hover
  - Becomes more visible when hovering over scrollable area
- **Themed to match** dark fantasy aesthetic with purple accents

**Animations:**
- **Container Entrance:**
  - Initial: `opacity: 0, x: 20` (invisible, 20px to the right)
  - Animate: `opacity: 1, x: 0` (fade in and slide from right)
  - Duration: 500ms
- **Main Actions Stagger:**
  - Delay: 0.1s per button (100ms increments)
  - Initial: `opacity: 0, y: 10` (invisible, 10px below)
  - Animate: `opacity: 1, y: 0` (fade in and slide up)
  - Hover: `scale: 1.05` (5% larger on hover)
  - Tap: `scale: 0.95` (5% smaller on press)
- **Commands Stagger:**
  - Delay: 0.05s per command (50ms increments - faster than actions)
  - Initial: `opacity: 0, x: 10` (invisible, 10px to the right)
  - Animate: `opacity: 1, x: 0` (fade in and slide from right)
  - Hover: `scale: 1.02, x: 5` (2% larger, 5px right shift)
  - Tap: `scale: 0.98` (2% smaller on press)

**Icons:**
- **Library:** Lucide React icons
- **Main Actions Icons:**
  - Compass (Explore)
  - Map (World Map)
  - User (Stats)
  - Save (Save)
- **Command Icons:**
  - Sword (Attack)
  - Eye (Investigate)
  - MessageCircle (Talk)
  - Sparkles (Cast, fallback)
- **Icon Size:** `w-4 h-4` (16px) - consistent across all buttons
- **Icon Color:** Inherited from button text color
- **Icon Position:**
  - Main Actions: Centered with text
  - Commands: Left-aligned with text

**Visual Hierarchy:**
- **Container** - Transparent background, no border (seamlessly integrated with gamehub)
- **Section Headers** - Accent colored, bold, uppercase (clear separation)
- **Main Actions** - Secondary background, larger buttons (primary actions)
- **Commands** - Outline variant, muted background, smaller buttons (secondary actions)
- **Scrollbar** - Subtle purple accent (tertiary element)

**Dark Fantasy Aesthetic:**
- Transparent container blends with gamehub background
- Accent magenta/pink headers provide magical highlights
- Purple/violet secondary colors reinforce fantasy theme
- Muted backgrounds for commands create depth and hierarchy
- Rounded corners soften the interface
- Opacity-based effects (button backgrounds) create layered depth
- Custom scrollbar with purple accents maintains theme consistency
- Borderless design for seamless gamehub integration

## Available Commands Section

### Purpose

The **Available Commands** section displays context-specific gameplay actions that modify character stats, unlock new commands, change locations, or trigger quest progression. Unlike Main Actions, commands directly affect game state.

### Command Routing

**Critical Distinction:**
- **Main Actions** → `onAction()` → `performAction()` → Narrative only, command unlocks
- **Available Commands** → `onCommand()` → `submitCommand()` → Stat changes, XP, items, progression

**Fallback Behavior:**
```typescript
onClick={() => onCommand ? onCommand(command) : onAction(command)}
```
If `onCommand` is not provided, commands fall back to `onAction()` (should not happen in normal usage).

### Initial Commands

```typescript
const INITIAL_COMMANDS = [
  "Attack",
  "Investigate Symbols",
  "Cast Light Spell",
  "Search for Treasure",
  "Listen Carefully",
  "Rest",
  "Seek Quest",
  "Review Quests",
];
```

### Command Icons

```typescript
const commandIcons: Record<string, any> = {
  attack: Sword,
  investigate: Eye,
  talk: MessageCircle,
  cast: Sparkles,
};
```

**Icon Selection Logic:**
- Extracts first word from command (lowercase)
- Maps to icon dictionary
- Falls back to `Sparkles` icon if no match

**Example:**
- "Attack" → `Sword`
- "Investigate Symbols" → `Eye`
- "Cast Light Spell" → `Sparkles` (matches "cast")
- "Rest" → `Sparkles` (no match, fallback)

### Command Behaviors

#### Combat Commands

**1. Attack** (`command: "attack"`)

**Effects:**
- ✅ Generates random monster (level-scaled)
- ✅ Grants XP: `50 + monster.level * 15` (typically 50-200+)
- ✅ Costs Mana: `5-10` (random)
- ✅ Adds combat narrative to story

**Example Output:**
```
"A Shadow Wraith appears from the shadows!"
"[Combat description]"
"+125 XP, -7 Mana"
```

**Implementation:** See `useRpgStore.tsx` lines 507-519

#### Exploration Commands

**2. Investigate Symbols** (`command: "investigate symbols"`)

**Effects:**
- ✅ Unlocks command: "Descend to the Chamber"
- ✅ Adds narrative text
- ❌ No stat changes

**3. Cast Light Spell** (`command: "cast light spell"`)

**Effects:**
- ✅ Costs Mana: `-10`
- ✅ Unlocks command: "Follow the Light"
- ✅ Adds narrative text

**4. Search for Treasure** (`command: "search for treasure"`)

**Effects:**
- ✅ Generates loot items (via `generateLootTable()`)
- ✅ Grants Gold: `sum(item.values) + random(0-20)`
- ✅ Grants XP: `+50`
- ✅ Adds items to inventory
- ✅ Adds narrative text

**5. Listen Carefully** (`command: "listen carefully"`)

**Effects:**
- ✅ Unlocks command: "Follow the Whispers"
- ✅ Adds narrative text
- ❌ No stat changes

#### Utility Commands

**6. Rest** (`command: "rest"`)

**Effects:**
- ✅ Restores HP: `+15`
- ✅ Restores Mana: `+10`
- ✅ Adds narrative text

**7. Seek Quest** (`command: "seek quest"`)

**Effects:**
- ✅ Generates NPC with quest (via `generateNPC()`)
- ✅ Adds quest to active quests list (max 3 active)
- ✅ Adds NPC dialogue and quest details to story
- ⚠️ Blocks if 3+ active quests already

**8. Review Quests** (`command: "review quests"`)

**Effects:**
- ✅ Displays active quests with progress
- ✅ Displays completed quests (last 3)
- ✅ Adds formatted quest summary to story
- ❌ No stat changes

#### Progression Commands

**9. Translate Glyphs** (`command: "translate glyphs"`)

**Unlocked by:** "Explore" action

**Effects:**
- ✅ Unlocks command: "Scribe Protective Rune"
- ✅ Adds narrative text

**10. Scribe Protective Rune** (`command: "scribe protective rune"`)

**Unlocked by:** "Translate Glyphs" command

**Effects:**
- ✅ Costs Mana: `-8`
- ✅ Grants XP: `+60`
- ✅ Adds narrative text

**11. Follow the Light / Follow the Whispers / Descend to the Chamber**

**Unlocked by:** Various exploration commands

**Effects:**
- ✅ Changes location: `"Lower Sanctum"`
- ✅ Unlocks command: "Confront the Echo"
- ✅ Adds narrative text

**12. Confront the Echo** (`command: "confront the echo"`)

**Unlocked by:** Location change commands

**Effects:**
- ✅ Grants XP: `+300`
- ✅ Costs Mana: `-20`
- ✅ Adds narrative text

### Visual Design

**Layout:**
- Scrollable list (`max-h-[500px] overflow-y-auto`)
- Vertical spacing: `space-y-2`
- Button height: `h-10` (40px)
- Full width buttons with left-aligned content

**Animations:**
- Staggered fade-in (0.05s delay per command)
- Hover: `scale: 1.02, x: 5` (slight scale + horizontal shift)
- Tap: `scale: 0.98`
- Entrance: `opacity: 0, x: 10` → `opacity: 1, x: 0`

**Styling:**
- Outline variant buttons
- Muted background: `bg-muted/30`
- Hover background: `hover:bg-muted/50`
- Icon + text layout with gap

**Scrollbar:**
- Custom styled scrollbar (`.custom-scrollbar` class)
- Themed to match dark fantasy aesthetic

## Draggable Emoji Shortcuts

### Purpose

Four draggable emoji buttons provide quick access to other game panels without cluttering the main UI. These buttons are positioned at the bottom-right of the screen and can be dragged to any position.

### Emoji Buttons

#### 1. **Inventory** (📦)

**Position:** Rightmost (default: `window.innerWidth - 120, window.innerHeight - 120`)

**Behavior:**
- Click: Opens inventory panel (`onAction("inventory")`)
- Drag: Repositionable (5px threshold to prevent accidental drags)
- Cursor: `grab` → `grabbing` on mousedown

**Implementation:** Lines 159-200

#### 2. **Player Panel** (⚔️)

**Position:** Second from right (default: `window.innerWidth - 200, window.innerHeight - 120`)

**Behavior:**
- Click: Opens player stats panel (`onOpenPlayerPanel()`)
- Drag: Repositionable
- Cursor: `grab` → `grabbing` on mousedown

**Implementation:** Lines 202-244

#### 3. **Story Window** (📜)

**Position:** Third from right (default: `window.innerWidth - 280, window.innerHeight - 120`)

**Behavior:**
- Click: Opens story window (`onOpenStoryWindow()`)
- Drag: Repositionable
- Cursor: `grab` → `grabbing` on mousedown

**Implementation:** Lines 246-288

#### 4. **World Map** (🗺️)

**Position:** Leftmost (default: `window.innerWidth - 360, window.innerHeight - 120`)

**Behavior:**
- Click: Opens world map (`onOpenWorldMap()`)
- Drag: Repositionable
- Cursor: `grab` → `grabbing` on mousedown

**Implementation:** Lines 290-332

### Drag Detection Logic

**Problem:** Distinguishing between drag and click interactions

**Solution:**
```typescript
const wasDragging = useRef(false);

onDrag={(e, data) => {
  // Only consider it dragging if moved more than 5px
  if (Math.abs(data.deltaX) > 5 || Math.abs(data.deltaY) > 5) {
    wasDragging.current = true;
  }
}}

onClick={(e) => {
  // Only open panel if we didn't just drag
  if (!wasDragging.current) {
    onAction("inventory");
  }
  wasDragging.current = false;
}}
```

**Threshold:** 5px movement required to register as drag (prevents accidental drags on clicks)

### Position Management

**Initial Positioning:**
- Calculated on mount based on window dimensions
- Side-by-side layout at bottom-right
- 80px horizontal spacing between buttons

**Responsive Updates:**
- `useEffect` hook listens to window resize events
- Recalculates positions on resize
- Maintains relative spacing

**Implementation:** Lines 72-103

## Animations & Visual Effects

### Framer Motion Integration

**Component-Level Animation:**
```typescript
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.5 }}
  onAnimationStart={() => animationDebug.start("ActionPanel", "mount")}
  onAnimationComplete={() => animationDebug.complete("ActionPanel", "mount", 500)}
>
```

**Features:**
- Fade-in from right (20px offset)
- 500ms duration
- Debug tracking for performance monitoring

### Button Animations

**Main Actions:**
- Staggered entrance (0.1s delay per button)
- Hover scale: `1.05`
- Tap scale: `0.95`

**Available Commands:**
- Staggered entrance (0.05s delay per command)
- Hover: `scale: 1.02, x: 5` (subtle scale + horizontal shift)
- Tap: `scale: 0.98`

### Debug Integration

**Animation Debug:**
```typescript
import { animationDebug } from "../utils/debug";

onAnimationStart={() => animationDebug.start("ActionPanel", "mount")}
onAnimationComplete={() => animationDebug.complete("ActionPanel", "mount", 500)}
```

**Purpose:** Track animation performance in development mode

## State Management Integration

### Parent Component Integration

**Location:** `src/games/rpg/pages/Index.tsx`

**Usage:**
```typescript
<ActionPanel 
  onAction={handleAction} 
  onCommand={handleCommand}
  availableCommands={availableCommands}
  onOpenPlayerPanel={() => setPlayerPanelOpen(true)}
  onOpenStoryWindow={() => setStoryWindowOpen(true)}
  onOpenWorldMap={() => setWorldMapOpen(true)}
/>
```

**Callbacks:**
- `handleAction()` - Routes to `performAction()` or UI state toggles
- `handleCommand()` - Routes to `submitCommand()` with error handling
- `availableCommands` - Retrieved from Zustand store selector

### Store Integration

**Actions Flow:**
```
ActionPanel.onAction()
  → Index.handleAction()
    → useRpgStore.performAction()
      → resolveAction()
        → applyResolution()
          → State update (narrative, command unlocks)
```

**Commands Flow:**
```
ActionPanel.onCommand()
  → Index.handleCommand()
    → useRpgStore.submitCommand()
      → resolveCommand()
        → applyResolution()
          → applyQuestProgress()
            → State update (stats, narrative, items, quests)
```

### Available Commands Source

**Store Selector:**
```typescript
const availableCommands = useRpgStore((state) => state.availableCommands);
```

**Dynamic Updates:**
- Commands array updates when new commands are unlocked
- Component re-renders automatically via Zustand reactivity
- No manual state synchronization required

## Command Unlocking System

### Unlock Mechanism

**Function:** `ensureUnlockedCommands()` in `useRpgStore.tsx`

```typescript
function ensureUnlockedCommands(commands: string[], unlockCommand?: string) {
  if (!unlockCommand) return commands;
  if (commands.includes(unlockCommand)) return commands;
  return [...commands, unlockCommand];
}
```

**Behavior:**
- Checks if command already exists (prevents duplicates)
- Appends new command if not present
- Returns updated array

### Unlock Triggers

**Actions that Unlock Commands:**
- `explore` → Unlocks "Translate Glyphs"

**Commands that Unlock Commands:**
- `investigate symbols` → Unlocks "Descend to the Chamber"
- `cast light spell` → Unlocks "Follow the Light"
- `listen carefully` → Unlocks "Follow the Whispers"
- `translate glyphs` → Unlocks "Scribe Protective Rune"
- `follow the light/whispers/descend to the chamber` → Unlocks "Confront the Echo"

### Visual Feedback

**Narrative Indicators:**
```
"> *New command unlocked: [Command Name]*"
```

**UI Updates:**
- New command appears in "Available Commands" list
- Staggered animation on new command entry
- Scrollable list accommodates growing command set

## Error Handling

### Command Fallback

**Unknown Commands:**
```typescript
default:
  debugLog("warn", `Unknown command: "${command}"`);
  return {
    narrative: [`${command} is swallowed by the void. Perhaps try phrasing it differently.`],
  };
```

**User Feedback:**
- Narrative message indicates command not recognized
- No state changes occur
- Debug logging in development mode

### Missing Callbacks

**Optional Callbacks:**
- `onCommand` - Falls back to `onAction()` if not provided
- `onOpenPlayerPanel` - Logs warning if not provided
- `onOpenStoryWindow` - Logs warning if not provided
- `onOpenWorldMap` - Logs warning if not provided

**Implementation:**
```typescript
if (onOpenPlayerPanel) {
  onOpenPlayerPanel();
} else {
  console.warn("[RPG] onOpenPlayerPanel callback not provided");
}
```

## Performance Considerations

### Rendering Optimization

**Zustand Selectors:**
- Component only subscribes to `availableCommands` array
- Re-renders only when commands change
- Character stats, location, story text changes don't trigger re-render

**Animation Performance:**
- Framer Motion uses GPU acceleration
- Staggered animations prevent layout thrashing
- Debug tracking helps identify performance issues

### Scroll Performance

**Command List:**
- Max height: 500px with scroll
- Virtual scrolling not implemented (could be added for 100+ commands)
- Custom scrollbar styling (minimal performance impact)

### Drag Performance

**Draggable Elements:**
- 4 separate Draggable instances
- Fixed positioning (no layout impact)
- 5px threshold reduces unnecessary drag calculations

## Accessibility

### Current State

**Keyboard Navigation:**
- ⚠️ Buttons are keyboard accessible (native button elements)
- ⚠️ No keyboard shortcuts for commands
- ⚠️ No focus management for draggable elements

**Screen Readers:**
- ⚠️ Button labels are readable
- ⚠️ No ARIA labels for icon-only buttons
- ⚠️ No announcements for command unlocks

**Visual Indicators:**
- ✅ Hover states provide visual feedback
- ✅ Focus states (browser default)
- ⚠️ No high contrast mode support

### Recommendations

1. **Add ARIA Labels:**
   ```typescript
   <Button aria-label={`${label} action`}>
   ```

2. **Keyboard Shortcuts:**
   ```typescript
   useEffect(() => {
     const handleKeyPress = (e: KeyboardEvent) => {
       if (e.key === 'e' && e.ctrlKey) {
         onAction('explore');
       }
     };
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, []);
   ```

3. **Focus Management:**
   - Focus trap in command list
   - Focus return after command execution

4. **Screen Reader Announcements:**
   - Live region for command unlocks
   - Announce stat changes

## Testing Considerations

### Unit Testing

**Test Cases:**
1. Main actions trigger correct callbacks
2. Commands route to `onCommand` when provided
3. Commands fall back to `onAction` when `onCommand` missing
4. Icon mapping works correctly
5. Drag detection threshold (5px) works
6. Position calculations on window resize

### Integration Testing

**Test Cases:**
1. Action → Store → Narrative update
2. Command → Store → Stat changes
3. Command unlock → UI update
4. Draggable emoji → Panel open
5. Scroll behavior with many commands

### E2E Testing

**Test Scenarios:**
1. Complete action flow: Explore → Unlock → Use command
2. Command progression: Attack → Level up → New commands
3. Quest system: Seek Quest → Complete → Rewards
4. Drag and click interactions

## Known Issues & Limitations

### Current Limitations

1. **No Command Search/Filter**
   - Commands list can grow long
   - No way to search or filter commands
   - Recommendation: Add search input for 10+ commands

2. **Icon Mapping Incomplete**
   - Only 4 command types have icons
   - Most commands use fallback `Sparkles` icon
   - Recommendation: Expand icon mapping

3. **No Command Categories**
   - All commands in single list
   - No grouping (Combat, Exploration, Utility)
   - Recommendation: Add category tabs or sections

4. **Drag Position Not Persisted**
   - Emoji button positions reset on refresh
   - No localStorage for positions
   - Recommendation: Persist positions to localStorage

5. **No Command Descriptions**
   - Commands show only name and icon
   - No tooltip or description
   - Recommendation: Add tooltips with command descriptions

### Potential Improvements

1. **Command Favorites**
   - Pin frequently used commands
   - Quick access section

2. **Command History**
   - Show recently used commands
   - Quick repeat functionality

3. **Command Cooldowns**
   - Visual indicators for commands on cooldown
   - Disabled state with timer

4. **Command Requirements**
   - Show requirements (e.g., "Requires 20 Mana")
   - Disable if requirements not met

5. **Command Shortcuts**
   - Keyboard shortcuts for commands
   - Customizable key bindings

## Comparison with Other Game Modes

### Paint & Guess

| Feature | Paint & Guess | RPG Actions Panel |
|---------|--------------|-------------------|
| **Interaction Type** | Real-time multiplayer | Single-player turn-based |
| **State Management** | Socket.io + Context | Zustand store |
| **Action Feedback** | Real-time sync | Immediate local update |
| **Command System** | Drawing tools | Text commands |
| **UI Complexity** | Canvas + tools | Buttons + lists |

### Key Differences

1. **Real-time vs Turn-based**
   - Paint & Guess: Actions broadcast to all players
   - RPG: Actions affect local state only

2. **Command Input**
   - Paint & Guess: Mouse/touch drawing
   - RPG: Button clicks + text input

3. **State Persistence**
   - Paint & Guess: Server-side (database)
   - RPG: Client-side (localStorage via Zustand)

## Conclusion

The **ActionPanel** component is a well-designed interaction hub that effectively separates **Main Actions** (utility/narrative) from **Available Commands** (gameplay/stat changes). The component leverages Framer Motion for polished animations, react-draggable for flexible UI positioning, and Zustand for efficient state management.

**Strengths:**
- ✅ Clear separation of actions vs commands
- ✅ Dynamic command unlocking system
- ✅ Polished animations and visual feedback
- ✅ Flexible draggable shortcuts
- ✅ Efficient state management integration

**Areas for Improvement:**
- ⚠️ Accessibility features (ARIA labels, keyboard shortcuts)
- ⚠️ Command search/filter for long lists
- ⚠️ Icon mapping expansion
- ⚠️ Command descriptions/tooltips
- ⚠️ Drag position persistence

The component successfully serves as the primary interaction point for the RPG game, providing intuitive access to both utility actions and gameplay commands while maintaining a clean, thematic dark fantasy aesthetic.

