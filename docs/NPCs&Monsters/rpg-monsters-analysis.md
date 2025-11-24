# RPG Game Mode - Monster System Analysis

## Overview

The RPG game mode implements **two separate monster systems** that serve different purposes:

1. **World Map Monsters** (`MapMonster`) - Procedurally generated monsters that patrol the world map, visible on the canvas, and can be encountered during exploration
2. **Text-Based RPG Monsters** (`Monster`) - Dynamically generated monsters for the text-based combat system used in the main RPG interface

Both systems are fully functional but operate independently. This document provides a comprehensive analysis of how each system works.

---

## System 1: World Map Monsters (`MapMonster`)

### Architecture

**Location:** `src/games/rpg/utils/mapGenerator.ts`  
**Component:** `src/games/rpg/components/WorldMap.tsx`  
**UI Panel:** `src/games/rpg/components/MonsterPanel.tsx`

### Data Structure

```typescript
export interface MapMonster {
  id: string;                    // Unique identifier (e.g., "monster-0")
  x: number;                     // Current tile X position (integer)
  y: number;                     // Current tile Y position (integer)
  name: string;                  // Monster name (e.g., "Shadow Wraith")
  level: number;                 // Monster level (1-8+)
  hp: number;                    // Current hit points
  maxHp: number;                 // Maximum hit points
  type: 'shadow' | 'beast' | 'undead' | 'elemental' | 'demon';
  patrolRadius: number;          // How far monster can patrol from spawn (3-6 tiles)
  spawnX: number;                // Original spawn position X
  spawnY: number;                // Original spawn position Y
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  lastMoveTime: number;          // Timestamp for movement timing
  defeated: boolean;             // Whether monster has been defeated
}
```

### Generation System

#### Noise-Based Spawning

Monsters are generated using **Simplex Noise** with a unique seed offset:

```typescript
const monsterNoise2D = createNoise2D(() => mapSeed + 8000);
```

This ensures deterministic monster placement based on the map seed.

#### Spawn Conditions

Monsters spawn when **all** of the following conditions are met:

1. **Noise Threshold**: `monsterNoise > 0.4 + terrainDanger`
   - Forests: `+0.1` danger modifier
   - Mountains: `+0.15` danger modifier
   - Deserts: `+0.1` danger modifier
   - Other terrain: `+0.05` danger modifier

2. **Valid Terrain**: Not on:
   - Ocean tiles
   - Location tiles (towns, sanctums, ruins, dungeons)
   - Resource tiles (treasures, ores, herbs, crystals)
   - River tiles

3. **Distance from Locations**: At least `20% of map radius` from towns/sanctums (monsters avoid safe areas)

4. **Spacing**: At least `8 tiles` apart from other monsters (prevents clustering)

#### Terrain-Based Type Assignment

Monster types are determined by terrain and elevation:

```typescript
const getMonsterTypeForTerrain = (tile: TileType, elevation: number): MapMonster['type'] => {
  if (tile === 'forest') return 'beast';
  if (tile === 'mountain' || elevation > 0.7) return 'elemental';
  if (tile === 'desert') return 'demon';
  // Default: randomly pick from shadow, undead, or beast
  const types: MapMonster['type'][] = ['shadow', 'undead', 'beast'];
  return types[Math.floor(random() * types.length)];
};
```

**Type Distribution:**
- **Forest** → Always `beast`
- **Mountain** (or elevation > 0.7) → Always `elemental`
- **Desert** → Always `demon`
- **Grass/Other** → Random: `shadow`, `undead`, or `beast`

#### Level and HP Calculation

**Level Formula:**
```typescript
level = Math.floor(1 + elevation * 5 + noise * 3)
```
- Minimum: 1
- Scales with terrain height (elevation) and noise value
- Typical range: 1-8+ depending on terrain

**Max HP Formula:**
```typescript
maxHp = 50 + level * 15 + Math.floor(noise * 30)
```
- Base: 50 HP
- Level scaling: +15 HP per level
- Noise variation: +0-30 HP
- Example: Level 5 monster = 50 + 75 + 15 = 140 HP (typical)

**Patrol Radius:**
```typescript
patrolRadius = 3 + Math.floor(noise * 3)  // 3-6 tiles
```

#### Monster Names

Each type has a pool of 3 names:

| Type | Names |
|------|-------|
| **Shadow** | Shadow Wraith, Dark Apparition, Phantom Stalker |
| **Beast** | Wild Beast, Feral Predator, Ancient Guardian |
| **Undead** | Cursed Spirit, Wandering Skeleton, Restless Dead |
| **Elemental** | Stone Golem, Wind Elemental, Fire Sprite |
| **Demon** | Desert Fiend, Sand Demon, Scorched Horror |

### Behavior System

#### Patrol Movement

Monsters patrol within their `patrolRadius` from their spawn point:

**Movement Frequency:** Every `2 seconds` (2000ms interval)

**Movement Logic:**
1. **Within Patrol Radius**: Move randomly in one of 4 directions (up, down, left, right)
2. **Outside Patrol Radius**: Move back toward spawn point (pathfinding toward `spawnX`, `spawnY`)
3. **Collision Check**: Only moves to walkable tiles (not ocean or mountains)
4. **Boundary Check**: Movement rejected if it would exceed patrol radius

**Implementation:**
```typescript
// Check distance from spawn
const distFromSpawn = Math.sqrt(
  (monster.x - monster.spawnX) ** 2 + (monster.y - monster.spawnY) ** 2
);

if (distFromSpawn < monster.patrolRadius) {
  // Move randomly within patrol radius
  const directions = [
    { dx: 0, dy: -1, dir: 'up' },
    { dx: 0, dy: 1, dir: 'down' },
    { dx: -1, dy: 0, dir: 'left' },
    { dx: 1, dy: 0, dir: 'right' },
  ];
  const move = directions[Math.floor(Math.random() * directions.length)];
  // Validate move and update position...
} else {
  // Return to spawn point
  // Move toward spawnX, spawnY
}
```

### Rendering System

#### Visual Representation

Monsters are rendered on the canvas with type-specific icons and colors:

| Type | Icon | Color | Hex Code |
|------|------|-------|----------|
| Shadow | 👻 | Purple | `#4a148c` |
| Beast | 🐺 | Brown | `#6d4c41` |
| Undead | 💀 | Gray | `#424242` |
| Elemental | 🔥 | Orange | `#ff6f00` |
| Demon | 😈 | Dark Red | `#b71c1c` |

#### Rendering Details

1. **Monster Icon**: 12px Arial font, centered on tile
2. **Level Indicator**: Small white text above monster (`Lv{level}`)
3. **HP Bar**: Green/red bar below monster when damaged
   - Green bar shows current HP percentage
   - Red background shows missing HP
   - Only visible when `hp < maxHp`

#### Rendering Order

Monsters are rendered **before** the player character, so they appear behind the player sprite.

**Render Loop Order:**
1. Terrain tiles
2. Rivers
3. Resources
4. Features
5. NPCs
6. **Monsters** ← Rendered here
7. Player character ← Rendered last (on top)

### Encounter System

#### Detection

When the player moves to a tile, the system checks for nearby monsters:

```typescript
const nearbyMonster = getMonsterAt(mapData, tileX, tileY);
```

**Detection Range:** Within `1 tile` (Manhattan distance: `dx <= 1 && dy <= 1`)

**Conditions:**
- Monster must not be defeated (`!monster.defeated`)
- Player must be within 1 tile of monster position

#### Encounter Trigger

When a monster is encountered:

1. **MonsterPanel** opens automatically (draggable UI panel)
2. Console log: `"Encountered {name} (Level {level})!"`
3. Panel displays:
   - Monster icon (type-specific emoji)
   - Monster name and type
   - HP bar with current/max HP
   - Estimated stats (Attack, Defense, Speed)
   - Patrol radius
   - Level badge

**Spam Prevention:**
- Tracks last encountered monster ID
- Only shows panel if different monster
- Updates panel if same monster (for HP changes)

#### Current Limitations

**⚠️ No Combat Integration:**
- Encounters are **visual only**
- No combat system triggered
- No XP/gold rewards on defeat
- No damage dealing
- Monsters can only be marked as defeated via `defeatMonster()`

**Future Integration Points:**
```typescript
if (nearbyMonster && !nearbyMonster.defeated) {
  // TODO: Trigger combat system
  // TODO: Show monster details UI
  // TODO: Initiate battle sequence
  // TODO: Award XP/gold on defeat
}
```

### Utility Functions

#### `getMonsterAt(mapData, x, y)`

Finds a monster at the given coordinates (within 1 tile):

```typescript
export function getMonsterAt(mapData: MapData, x: number, y: number): MapMonster | undefined {
  return mapData.monsters.find(mon => {
    if (mon.defeated) return false;
    const dx = Math.abs(mon.x - x);
    const dy = Math.abs(mon.y - y);
    return dx <= 1 && dy <= 1;
  });
}
```

#### `defeatMonster(mapData, monsterId)`

Marks a monster as defeated:

```typescript
export function defeatMonster(mapData: MapData, monsterId: string): MapMonster | undefined {
  const monster = mapData.monsters.find(m => m.id === monsterId);
  if (monster) {
    monster.defeated = true;
    monster.hp = 0;
  }
  return monster;
}
```

**Effects:**
- Monster is no longer rendered
- Monster no longer moves
- Monster is excluded from encounter detection
- Monster remains in array (for potential respawn system)

### MonsterPanel Component

**Location:** `src/games/rpg/components/MonsterPanel.tsx`

**Features:**
- Draggable window (react-draggable)
- Type-specific icon and color display
- HP progress bar with tooltip
- Estimated stats (Attack, Defense, Speed) based on level
- Level badge with pulsing animation
- Framer Motion animations
- Tooltips for detailed information

**Estimated Stats Calculation:**
```typescript
const estimatedAttack = Math.floor(10 + monster.level * 3);
const estimatedDefense = Math.floor(5 + monster.level * 2);
const estimatedSpeed = Math.floor(8 + monster.level * 1.5);
```

---

## System 2: Text-Based RPG Monsters (`Monster`)

### Architecture

**Location:** `src/games/rpg/utils/contentGenerator.ts`  
**Usage:** `src/games/rpg/state/useRpgStore.tsx` (in "Attack" command)

### Data Structure

```typescript
export interface Monster {
  name: string;           // Monster name (e.g., "Shadow Wraith")
  level: number;         // Monster level (scaled to character level)
  hp: number;            // Current hit points
  description: string;   // Generated description (Faker.js)
  loot: Item[];          // Loot items (0-2 items)
}
```

**Key Differences from MapMonster:**
- ❌ No position (not on map)
- ❌ No type system (all use same name pool)
- ❌ No patrol behavior
- ✅ Has loot table
- ✅ Has description
- ✅ Generated on-demand (not pre-placed)

### Generation System

#### Function: `generateMonster(characterLevel)`

**Location:** `src/games/rpg/utils/contentGenerator.ts`

**Parameters:**
- `characterLevel: number = 5` - Character's current level

**Generation Process:**

1. **Monster Type Selection:**
   ```typescript
   const monsterTypes = [
     "Shadow Wraith",
     "Echo Guardian",
     "Cursed Spirit",
     "Abyssal Horror",
     "Ancient Golem",
     "Forgotten Specter",
     "Dark Apparition",
   ];
   const name = chance.pickone(monsterTypes);
   ```

2. **Level Calculation:**
   ```typescript
   const level = characterLevel + chance.integer({ min: -2, max: 3 });
   ```
   - Scaled to character level
   - Range: `characterLevel - 2` to `characterLevel + 3`
   - Minimum: 1 (clamped)

3. **HP Calculation:**
   ```typescript
   const hp = 50 + level * 15 + chance.integer({ min: 0, max: 30 });
   ```
   - Base: 50 HP
   - Level scaling: +15 HP per level
   - Random variation: +0-30 HP

4. **Description Generation:**
   ```typescript
   const description = faker.lorem.sentence();
   ```
   - Uses Faker.js for random sentence

5. **Loot Generation:**
   ```typescript
   const loot = chance.pickset(
     Array.from({ length: 3 }, () => generateItem()),
     chance.integer({ min: 0, max: 2 })
   );
   ```
   - Generates 3 items, picks 0-2 randomly
   - Items use full item generation system (rarity, value, etc.)

### Usage in Game

#### Integration with "Attack" Command

**Location:** `src/games/rpg/state/useRpgStore.tsx`

When player uses "Attack" command:

```typescript
case 'attack': {
  const monster = generateMonster(state.character.level);
  const combatDesc = generateCombatDescription(monster, "victory");
  const xpReward = 50 + monster.level * 15;
  
  // Add to story
  state.storyText.push(
    `A ${monster.name} appears from the shadows!`,
    combatDesc,
    `You gain ${xpReward} XP!`
  );
  
  // Grant XP
  state.character.xp += xpReward;
  
  // Cost mana
  state.character.mana = Math.max(0, state.character.mana - (5 + Math.floor(Math.random() * 6)));
  
  // Unlock commands (if needed)
  // ...
}
```

**Current Behavior:**
- ✅ Generates random monster
- ✅ Grants XP (50 + level * 15)
- ✅ Costs Mana (5-10)
- ✅ Adds combat description to story
- ❌ **No actual combat** (always victory)
- ❌ **No HP damage** to character
- ❌ **No loot collection** (loot generated but not added to inventory)

### Combat Description Generation

**Function:** `generateCombatDescription(monster, outcome)`

**Location:** `src/games/rpg/utils/contentGenerator.ts`

**Victory Descriptions:**
- "You strike down the {monster.name} with a decisive blow!"
- "The {monster.name} crumbles before your might!"
- "Victory! The {monster.name} falls to the ground, defeated."
- "With a final strike, you vanquish the {monster.name}!"

**Defeat Descriptions:**
- "The {monster.name} overwhelms you with its dark power..."
- "You fall before the might of the {monster.name}!"
- "Defeated! The {monster.name} stands triumphant."

---

## Comparison: World Map vs Text-Based Monsters

| Aspect | World Map Monsters | Text-Based Monsters |
|--------|-------------------|---------------------|
| **System** | `MapMonster` | `Monster` |
| **Generation** | Procedural (noise-based, pre-placed) | On-demand (when "Attack" used) |
| **Location** | Fixed positions on world map | No position (abstract) |
| **Visibility** | Rendered on canvas | Not visible (text only) |
| **Types** | 5 types (shadow, beast, undead, elemental, demon) | 7 name variants (no type system) |
| **Behavior** | Patrol movement (every 2s) | No behavior (instant generation) |
| **Encounter** | Player proximity (1 tile) | Command-based ("Attack") |
| **Combat** | ❌ Not implemented | ⚠️ Partial (always victory, no HP damage) |
| **Loot** | ❌ Not implemented | ✅ Generated (but not collected) |
| **XP Rewards** | ❌ Not implemented | ✅ Granted (50 + level * 15) |
| **Persistence** | ✅ Saved in map data | ❌ Not saved (regenerated each time) |
| **UI** | MonsterPanel (draggable) | Story text only |

---

## Integration Points

### WorldMap Component

**Monster Integration:**

1. **Initialization**: Monsters generated with map data in `useEffect`
2. **Movement Loop**: Updated every 2 seconds in animation loop
3. **Rendering**: Drawn in render loop before player character
4. **Encounter Detection**: Checked during player movement
5. **Panel Display**: MonsterPanel shown on encounter

**Key Code Sections:**
- Lines 461-516: Monster movement logic
- Lines 804-869: Monster rendering
- Lines 417-438: Monster encounter detection
- Lines 906-916: MonsterPanel display

### useRpgStore Integration

**Text-Based Monster Integration:**

- Lines 518-524: "Attack" command generates monster and grants XP
- Uses `generateMonster()` from contentGenerator
- Adds combat description to story text

---

## Current Limitations & Future Enhancements

### World Map Monsters

**Missing Features:**
1. ❌ **Combat System** - No actual combat when encountered
2. ❌ **XP/Gold Rewards** - No rewards on defeat
3. ❌ **Damage System** - Can't deal damage to player
4. ❌ **Loot Drops** - No items dropped on defeat
5. ❌ **Respawn System** - Defeated monsters don't respawn
6. ❌ **Combat UI** - No battle interface

**Recommended Enhancements:**
1. **Combat Integration**
   - Trigger combat system on encounter
   - Use monster stats in battle calculations
   - Award XP/gold on defeat
   - Add damage dealing to player

2. **Monster AI**
   - Chase player when nearby
   - Flee when low on HP
   - Group behavior (packs, herds)

3. **Monster Respawning**
   - Defeated monsters respawn after time
   - Use noise to determine respawn locations
   - Scale respawn time with monster level

4. **Monster Drops**
   - Loot tables per monster type
   - Gold/items on defeat
   - Rare drops for higher-level monsters

5. **Monster Animations**
   - Idle animations
   - Movement animations
   - Attack/defeat animations

### Text-Based Monsters

**Missing Features:**
1. ⚠️ **Combat System** - Always victory, no actual combat
2. ❌ **HP Damage** - Player doesn't take damage
3. ❌ **Loot Collection** - Loot generated but not added to inventory
4. ❌ **Defeat Handling** - No defeat scenario (always wins)

**Recommended Enhancements:**
1. **Turn-Based Combat**
   - Player and monster take turns
   - HP damage calculations
   - Defense/attack modifiers
   - Special abilities

2. **Loot Collection**
   - Add generated loot to inventory
   - Show loot notification
   - Rarity-based rewards

3. **Defeat Handling**
   - Player can lose combat
   - HP reduction on defeat
   - Game over or respawn system

---

## Performance Considerations

### World Map Monsters

**Optimization:**
- ✅ **Viewport Culling** - Only visible monsters are rendered
- ✅ **Movement Throttling** - Monsters move every 2s (not every frame)
- ✅ **Defeated Filtering** - Defeated monsters skipped in loops
- ⚠️ **No Spatial Indexing** - Linear search for encounters (O(n))

**Typical Performance:**
- 20-50 monsters per 100x100 map
- Movement updates: 20-50 monsters every 2s
- Rendering: Only visible monsters (typically 5-15)

**Potential Optimizations:**
- Spatial grid for faster encounter detection
- Monster pooling for respawn system
- Canvas sprite caching for icons

### Text-Based Monsters

**Performance:**
- ✅ **On-Demand Generation** - Only generated when needed
- ✅ **No Persistence** - No memory overhead
- ✅ **Fast Generation** - Simple random selection

---

## Code Structure Summary

### Files

1. **`src/games/rpg/utils/mapGenerator.ts`**
   - `MapMonster` interface
   - `generateWorldMap()` - Monster generation logic
   - `getMonsterAt()` - Encounter detection
   - `defeatMonster()` - Defeat handling

2. **`src/games/rpg/components/WorldMap.tsx`**
   - Monster movement loop
   - Monster rendering
   - Encounter detection
   - MonsterPanel integration

3. **`src/games/rpg/components/MonsterPanel.tsx`**
   - Monster encounter UI
   - Stat display
   - Draggable panel

4. **`src/games/rpg/utils/contentGenerator.ts`**
   - `Monster` interface
   - `generateMonster()` - Text-based monster generation
   - `generateCombatDescription()` - Combat text generation

5. **`src/games/rpg/state/useRpgStore.tsx`**
   - "Attack" command integration
   - XP reward system

---

## Example Usage

### World Map Monster Encounter

```typescript
// Generate map with monsters
const mapData = generateWorldMap(100, 100, 12345);

// Find monster at player position
const monster = getMonsterAt(mapData, playerX, playerY);
if (monster) {
  console.log(`Encountered: ${monster.name} (Level ${monster.level})`);
  
  // TODO: Trigger combat system
  // startCombat(monster);
  
  // On victory
  defeatMonster(mapData, monster.id);
}
```

### Text-Based Monster Generation

```typescript
// Generate monster for combat
const monster = generateMonster(characterLevel);

// Use in combat
const xpReward = 50 + monster.level * 15;
character.xp += xpReward;

// Add loot to inventory
monster.loot.forEach(item => {
  addItem(item);
});
```

---

## Conclusion

The RPG game mode has **two fully functional monster systems** that serve different purposes:

1. **World Map Monsters** provide visual exploration and encounter mechanics on the world map
2. **Text-Based Monsters** provide combat content for the main RPG interface

Both systems are well-architected but currently lack full combat integration. The foundation is solid for future enhancements including:
- Turn-based combat
- Damage systems
- Loot collection
- Monster AI
- Respawning mechanics

The code is modular, performant, and ready for expansion.

