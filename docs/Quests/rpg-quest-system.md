# RPG Quest System - Quest Lines & Generation

## Overview

The RPG quest system generates dynamic quests with objectives tied to specific game commands. Quests are procedurally generated using templates with randomized context, and progress is tracked automatically as players execute relevant commands.

**Location:** `src/games/rpg/utils/contentGenerator.ts`  
**State Management:** `src/games/rpg/state/useRpgStore.tsx`

## Overall Narrative Arc

### Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NARRATIVE ARC FLOW                            │
└─────────────────────────────────────────────────────────────────┘

                        ┌─────────────────┐
                        │   PROLOGUE      │
                        │  "Eldrath"      │
                        └────────┬────────┘
                                 │
                    Initial Story Setting
              Ancient ruins, arcane symbols,
                   dormant power awaits
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼────────┐      ┌────────▼────────┐
            │  ACT I:        │      │  QUEST SYSTEM   │
            │  EXPLORATION   │      │  (Side Stories) │
            └───────┬────────┘      └────────┬────────┘
                    │                         │
        ┌───────────┼───────────┐            │
        │           │           │            │
    ┌───▼───┐  ┌───▼───┐  ┌───▼───┐        │
    │ Attack│  │Search │  │Invest.│        │
    │       │  │Treasure│  │Symbols│        │
    └───┬───┘  └───┬───┘  └───┬───┘        │
        │           │           │            │
        │    ┌──────┴──────┐   │            │
        │    │   Unlocks   │   │            │
        │    │  Commands   │   │            │
        │    └──────┬──────┘   │            │
        │           │           │            │
    ┌───▼───────────▼──────────▼──────┐    │
    │     "Translate Glyphs"          │    │
    │     "Descend to Chamber"        │    │
    │     "Follow the Light"          │    │
    │     "Follow the Whispers"       │    │
    └───────────────┬─────────────────┘    │
                    │                      v    │
            ┌───────▼────────┐              │
            │  ACT II:       │              │
            │  DEEPER RULES  │              │
            │  "Lower Sanctum"              │
            └───────┬────────┘              │
                    │                       │
            ┌───────▼────────┐              │
            │  CONFRONT      │              │
            │  THE ECHO      │              │
            │  (Boss Fight)  │              │
            └───────┬────────┘              │
                    │                       │
            ┌───────▼────────┐              │
            │  ACT III:      │              │
            │  RESOLUTION    │              │
            │  (Future)      │              │
            └────────────────┘              │
                    │                       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │   CHARACTER GROWTH    │
                    │  ┌─────────────────┐  │
                    │  │ • XP/Level Up   │  │
                    │  │ • Gold/Items    │  │
                    │  │ • New Commands  │  │
                    │  │ • Story Progress │  │
                    │  └─────────────────┘  │
                    └───────────────────────┘

═══════════════════════════════════════════════════════════════════

                    QUEST INTEGRATION POINTS
═══════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  QUEST SYSTEM flows alongside main narrative:                  │
│                                                                │
│  • Recovery Quests → "Search for Treasure"                     │
│  • Combat Quests → "Attack"                                    │
│  • Investigation Quests → "Investigate Symbols"                │
│  • Translation Quests → "Cast Light Spell"                     │
│  • Listening Quests → "Listen Carefully"                       │
│                                                                │
│  Quest objectives align with story progression,                │
│  providing side objectives that complement main narrative      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Narrative Structure

#### **ACT I: Exploration - "Ruins of Eldrath"**

**Initial State:**
- Location: Ruins of Eldrath
- Character: Level 5, HP 75/100, Mana 40/80, XP 1250/2000
- Available Actions: Explore, Inventory, Stats, Save

**Available Commands:**
```
┌─────────────────────────────────────────┐
│  Initial Command Set                    │
├─────────────────────────────────────────┤
│  • Attack                               │
│  • Investigate Symbols                  │
│  • Cast Light Spell                     │
│  • Search for Treasure                  │
│  • Listen Carefully                     │
│  • Rest                                 │
│  • Seek Quest                           │
│  • Review Quests                        │
└─────────────────────────────────────────┘
```

**Progression Paths:**

1. **Investigation Path:**
   ```
   "Investigate Symbols" 
   → Unlocks: "Descend to the Chamber"
   → Location: Lower Sanctum
   ```

2. **Illumination Path:**
   ```
   "Cast Light Spell" (-10 Mana)
   → Unlocks: "Follow the Light"
   → Location: Lower Sanctum
   ```

3. **Whisper Path:**
   ```
   "Listen Carefully"
   → Unlocks: "Follow the Whispers"
   → Location: Lower Sanctum
   ```

4. **Exploration Path:**
   ```
   "Explore" (Action)
   → Unlocks: "Translate Glyphs"
   → "Translate Glyphs"
   → Unlocks: "Scribe Protective Rune"
   ```

#### **ACT II: Deeper Ruins - "Lower Sanctum"**

**Location Change:**
- Unlocked by: "Descend to the Chamber" / "Follow the Light" / "Follow the Whispers"
- New location: Lower Sanctum
- New command: "Confront the Echo"

**Climactic Encounter:**
```
"Confront the Echo"
→ Grants: 300 XP, -20 Mana
→ Boss fight resolution
→ Story progression
```

#### **Quest System Integration**

```
Main Narrative              Quest Objectives
────────────────────────────────────────────────
"Attack"                → Combat Quests (1-3 times)
"Search for Treasure"   → Recovery Quests (1-2 times)
"Investigate Symbols"   → Investigation Quests (1 time)
"Cast Light Spell"      → Translation Quests (1 time)
"Listen Carefully"      → Listening Quests (1-2 times)
```

### Character Progression Arc

```
┌──────────────────────────────────────────────────────────┐
│              CHARACTER GROWTH TRAJECTORY                  │
└──────────────────────────────────────────────────────────┘

Level 5 (Start)
    │
    ├─→ XP Gains:
    │   • Attack: 50-200+ XP per combat
    │   • Search for Treasure: 50 XP
    │   • Scribe Protective Rune: 60 XP
    │   • Confront the Echo: 300 XP
    │   • Quest Completion: 175-300 XP
    │
    ├─→ Level Up Threshold: XP increases by 20% per level
    │
    ├─→ Stat Increases per Level:
    │   • Max HP: +5
    │   • Max Mana: +5
    │   • HP refill: +5
    │   • Mana refill: +5
    │
    └─→ Progression: Level 5 → Level 6 → Level 7 → ...

══════════════════════════════════════════════════════════

Resources & Rewards:
───────────────────────────────────────────────────────────
• Gold: 347 (start) + treasure finds + quest rewards
• Items: Generated loot from treasure + quest rewards
• Commands: Unlocked progressively based on actions
• Locations: Unlocked through story progression
```

### Narrative Flow Summary

```
START
  │
  ├─→ Exploration Phase (Ruins of Eldrath)
  │   ├─→ Combat encounters (monsters, XP gains)
  │   ├─→ Treasure hunting (gold, items)
  │   ├─→ Investigation (symbols, glyphs)
  │   ├─→ Quest acceptance (NPC encounters)
  │   └─→ Quest completion (rewards, progression)
  │
  ├─→ Discovery Phase
  │   ├─→ Unlock new commands
  │   ├─→ Progress quest objectives
  │   └─→ Gain character levels
  │
  ├─→ Transition Phase
  │   └─→ Location change (Lower Sanctum)
  │
  ├─→ Climax Phase
  │   └─→ Confront the Echo (boss encounter)
  │
  └─→ Resolution Phase (Future content)
      ├─→ Story continuation
      ├─→ New locations
      └─→ Extended quest lines
```

### Quest Lines Within Narrative Arc

```
Main Story Thread          Quest Lines (Parallel)
─────────────────────────────────────────────────────────
│                        │
├─ Ruins Exploration     ├─→ Recovery Quests
│                        ├─→ Combat Quests
│                        ├─→ Investigation Quests
│                        │
├─ Symbol Decoding       ├─→ Translation Quests
│                        │
├─ Listening Phase       ├─→ Listening Quests
│                        │
├─ Descent               ├─→ Quest progression continues
│                        │
├─ Confrontation         ├─→ Final quest completions
│                        │
└─ Resolution            └─→ Quest rewards accumulated
```

### Interactive Narrative Elements

**Player Agency:**
- Multiple paths to reach Lower Sanctum (3 different commands)
- Quests provide side objectives that enhance main story
- Command unlocking creates branching narrative options
- Quest system adds replayability with randomized objectives

**Narrative Mechanics:**
- Story text accumulates as narrative log
- Commands trigger story progression
- Quest completion adds to story text
- Location changes mark narrative milestones

**Progression Integration:**
- Quest rewards feed into character growth
- Story unlocks enable new quest types
- Character progression unlocks harder content
- Completed quests create sense of achievement

## Quest Structure

```typescript
interface Quest {
  id: string;                    // Unique quest identifier (GUID)
  title: string;                 // Quest title (e.g., "Recover the Ancient Scroll")
  description: string;           // Full quest description
  giver?: string;                // NPC name (e.g., "Ancient Scholar John Doe")
  status: QuestStatus;           // "available" | "active" | "completed"
  objective: QuestObjective;     // Objective details
  reward: QuestReward;           // XP, gold, and optional items
}

interface QuestObjective {
  type: QuestObjectiveType;      // Objective category
  summary: string;               // Short objective description
  requiredCommand: string;       // Command needed to progress
  targetCount: number;           // How many times to execute command
  progress: number;              // Current progress (0 to targetCount)
}
```

## Quest Types

### 1. Recovery Quests
**Type:** `recovery`  
**Required Command:** `Search for Treasure`  
**Count Range:** 1-2 times

**Templates:**
- "Retrieve the {item} from the {location}"
- Generates: "Recover the Ancient Scroll", "Recover the Mystic Gem", etc.

**Examples:**
- "Recover the Ancient Scroll"
  - *Description:* "Rumors speak of an Ancient Scroll hidden within the Ruins. It hums with dormant energy and must be retrieved."
  - *Objective:* "Search the ruins 1 time(s) to locate the Ancient Scroll."
  - *Reward:* 175-300 XP, 50-120 gold, 30% chance of reward item

### 2. Combat Quests
**Type:** `combat`  
**Required Command:** `Attack`  
**Count Range:** 1-3 times

**Templates:**
- "Defeat the {enemy} that haunts the {location}"
- Generates: "Silence the Shadow Wraith", "Silence the Echo Guardian", etc.

**Examples:**
- "Silence the Shadow Wraith"
  - *Description:* "A Shadow Wraith prowls the Temple, leaving echoes of terror. It must be defeated."
  - *Objective:* "Defeat enemies in combat 2 time(s)."
  - *Reward:* 175-300 XP, 50-120 gold, 30% chance of reward item

### 3. Investigation Quests
**Type:** `investigation`  
**Required Command:** `Investigate Symbols`  
**Count Range:** 1 time (always)

**Templates:**
- "Study the {artifact} in the {location}"
- Generates: "Study the rune", "Study the glyph", etc.

**Examples:**
- "Study the rune"
  - *Description:* "Ancient markings referencing a rune appear near the Cavern. They may reveal a hidden chamber."
  - *Objective:* "Investigate the symbols to decode the rune."
  - *Reward:* 175-300 XP, 50-120 gold, 30% chance of reward item

### 4. Translation Quests
**Type:** `translation`  
**Required Command:** `Cast Light Spell`  
**Count Range:** 1 time (always)

**Templates:**
- "Illuminate the {location} using light magic"
- Generates: "Illuminate the Crypt", "Illuminate the Sanctum", etc.

**Examples:**
- "Illuminate the Crypt"
  - *Description:* "An Ancient Scholar believes light magic will reveal the secrets guarded within the Crypt."
  - *Objective:* "Cast a light spell to expose hidden glyphs."
  - *Reward:* 175-300 XP, 50-120 gold, 30% chance of reward item

### 5. Listening Quests
**Type:** `listening`  
**Required Command:** `Listen Carefully`  
**Count Range:** 1-2 times

**Templates:**
- "Trace the {event} in the {location}"
- Generates: "Trace the disturbance", "Trace the phenomenon", etc.

**Examples:**
- "Trace the disturbance"
  - *Description:* "Whispers of a disturbance echo across the Sanctum. The abyss itself seems unsettled."
  - *Objective:* "Listen carefully 2 time(s) to pinpoint the disturbance."
  - *Reward:* 175-300 XP, 50-120 gold, 30% chance of reward item

## Quest Generation Process

### 1. Context Generation

When a quest is generated, random context is selected:

```typescript
const ctx: QuestTemplateContext = {
  item: chance.pickone(["Ancient Scroll", "Mystic Gem", "Shadow Essence", "Echo Fragment"]),
  location: chance.pickone(["Ruins", "Temple", "Cavern", "Crypt", "Sanctum"]),
  enemy: chance.pickone(["Shadow Wraith", "Echo Guardian", "Cursed Spirit", "Abyssal Horror"]),
  npc: chance.pickone(["Ancient Scholar", "Mysterious Wanderer", "Forgotten Sage"]),
  event: chance.pickone(["disturbance", "phenomenon", "anomaly", "occurrence"]),
  artifact: chance.pickone(["rune", "glyph", "inscription", "tablet"]),
};
```

### 2. Template Selection

One of the 5 quest templates is randomly selected:
- Recovery (20% chance)
- Combat (20% chance)
- Investigation (20% chance)
- Translation (20% chance)
- Listening (20% chance)

### 3. Quest Assembly

The template is populated with context:
- Template text is filled with context values
- Target count is randomly chosen from template's min/max range
- Rewards are generated (XP: 150-300, Gold: 40-120, 30% item chance)

### 4. Quest Activation

When a player uses "Seek Quest":
1. NPC is generated (with 100% quest guarantee)
2. Quest is extracted from NPC or generated standalone
3. Quest status is set to "active"
4. Quest is added to player's active quest list (max 3 active)

## Quest Progression

### Automatic Progress Tracking

Quest progress updates automatically when players execute commands:

```typescript
function applyQuestProgress(state: BaseRpgState, command: string): BaseRpgState {
  // For each active quest:
  // 1. Check if command matches quest's requiredCommand
  // 2. Increment progress if match
  // 3. Mark as completed if progress >= targetCount
  // 4. Grant rewards on completion
}
```

**Progress Flow:**
1. Player executes command (e.g., "Attack")
2. `submitCommand()` processes the command
3. `applyQuestProgress()` checks active quests
4. If command matches a quest's `requiredCommand`, progress increments
5. When `progress >= targetCount`, quest completes
6. Rewards are granted automatically (XP, gold, items)
7. Quest moves from `quests` to `completedQuests`

### Quest Completion

**Completion Trigger:**
- Objective progress reaches target count
- Status changes from "active" to "completed"
- Rewards are granted immediately

**Completion Rewards:**
- XP: 150-300 (randomized per quest)
- Gold: 40-120 (randomized per quest)
- Items: 30% chance of 1 reward item (weapon/armor/consumable/misc)

**Completion Narrative:**
```
Quest Complete: [Quest Title]! Rewarded +[XP] XP and +[Gold] gold.
Quest Rewards: [Item Names] (if items granted)
```

## Quest Commands

### Seek Quest
**Command:** `Seek Quest`  
**Action:** Generates NPC with quest and adds to active quests

**Behavior:**
- Checks if player has < 3 active quests
- Generates NPC with guaranteed quest
- Adds quest to active list
- Displays NPC encounter and quest details

**Narrative Output:**
```
You encounter [NPC Title] [NPC Name].
[NPC Dialogue]
Quest Accepted: **[Quest Title]**
[Quest Description]
Objective: [Objective Summary]
Rewards: [XP] XP, [Gold] gold[, Items]
```

### Review Quests
**Command:** `Review Quests`  
**Action:** Displays active and completed quest summary

**Output Format:**
```
Active Quests:
- [Quest Title] ([Progress]/[TargetCount])
  Objective: [Objective Summary]

Completed Quests:
- [Quest Title] (completed)
- [Quest Title] (completed)
```

## Quest Examples

### Example Quest Line 1: Recovery Chain
1. **Quest 1:** "Recover the Ancient Scroll"
   - Type: Recovery
   - Command: Search for Treasure (2 times)
   - Reward: 200 XP, 75 gold
   - Status: Active → Completed

### Example Quest Line 2: Combat Chain
1. **Quest 1:** "Silence the Shadow Wraith"
   - Type: Combat
   - Command: Attack (3 times)
   - Reward: 275 XP, 100 gold, Shadow Blade (item)
   - Status: Active → Completed

### Example Quest Line 3: Investigation Chain
1. **Quest 1:** "Study the rune"
   - Type: Investigation
   - Command: Investigate Symbols (1 time)
   - Reward: 180 XP, 55 gold
   - Status: Active → Completed

## Quest State Management

### Store State

```typescript
interface BaseRpgState {
  quests: Quest[];              // Active quests (max 3)
  completedQuests: Quest[];     // Completed quests (for history)
}
```

### Quest Limits

- **Max Active Quests:** 3
- **Quest Lifetime:** Active until completed (no expiration)
- **Quest Storage:** Completed quests stored indefinitely

### Quest Interaction

**Quest Acceptance:**
- Player uses "Seek Quest" command
- System checks active quest count
- If < 3 active, generates and adds new quest
- If ≥ 3 active, displays message: "Your journal is crowded with unfinished vows. Complete an active quest before seeking another."

**Quest Progress:**
- Automatic tracking via command execution
- Progress updates displayed in story text
- Completion rewards granted immediately

**Quest Review:**
- Player uses "Review Quests" command
- Displays all active quests with progress
- Shows last 3 completed quests

## Quest Generation Details

### Reward Generation

**XP Reward:**
```typescript
xp: 150 + chance.integer({ min: 25, max: 150 })  // 175-300 XP
```

**Gold Reward:**
```typescript
gold: 40 + chance.integer({ min: 10, max: 80 })  // 50-120 gold
```

**Item Reward:**
```typescript
items: chance.bool({ likelihood: 30 }) ? [generateItem()] : undefined
```
- 30% chance of 1 reward item
- Item type: weapon, armor, consumable, or misc
- Item rarity: weighted (common 40%, uncommon 30%, rare 20%, epic 8%, legendary 2%)

### Quest Context Options

**Items:** Ancient Scroll, Mystic Gem, Shadow Essence, Echo Fragment

**Locations:** Ruins, Temple, Cavern, Crypt, Sanctum

**Enemies:** Shadow Wraith, Echo Guardian, Cursed Spirit, Abyssal Horror

**NPCs:** Ancient Scholar, Mysterious Wanderer, Forgotten Sage

**Events:** disturbance, phenomenon, anomaly, occurrence

**Artifacts:** rune, glyph, inscription, tablet

## Integration Points

### NPC Generation

NPCs are generated with a 40% chance of having a quest (default) or 100% when `ensureQuest: true` is passed:

```typescript
generateNPC({ ensureQuest: true })  // Used for "Seek Quest" command
```

### Command Integration

Quest objectives are tied to existing game commands:
- `Attack` → Combat quests
- `Search for Treasure` → Recovery quests
- `Investigate Symbols` → Investigation quests
- `Cast Light Spell` → Translation quests
- `Listen Carefully` → Listening quests

### Progress Integration

Quest progress is checked on every command execution:

```typescript
submitCommand: (command: string) => {
  let newState = applyResolution(state, command, resolveCommand(command, state));
  newState = applyQuestProgress(newState, command);  // Check quest progress
  // ...
}
```

## Quest System Summary

**Quest Types:** 5 (Recovery, Combat, Investigation, Translation, Listening)

**Quest Commands:** 2 (Seek Quest, Review Quests)

**Progress Tracking:** Automatic via command matching

**Reward System:** XP (175-300), Gold (50-120), Items (30% chance)

**Quest Limits:** Max 3 active quests

**Quest Completion:** Automatic when objective met, rewards granted immediately

**Quest Storage:** Active quests tracked, completed quests stored in history

