# RPG World Map - Monster System

## Overview

The monster system adds dynamic, procedurally-generated enemies to the world map using Simplex Noise for spawn placement. Monsters patrol their territories, can be encountered by the player, and are rendered with type-specific visuals.

## Monster Interface

```typescript
export interface MapMonster {
  id: string;
  x: number;                    // Current tile X position
  y: number;                    // Current tile Y position
  name: string;                 // Monster name (e.g., "Shadow Wraith")
  level: number;                // Monster level (scales with elevation/noise)
  hp: number;                   // Current hit points
  maxHp: number;                // Maximum hit points
  type: 'shadow' | 'beast' | 'undead' | 'elemental' | 'demon';
  patrolRadius: number;         // How far monster can patrol from spawn (3-6 tiles)
  spawnX: number;               // Original spawn position X
  spawnY: number;               // Original spawn position Y
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  lastMoveTime: number;         // Timestamp for movement timing
  defeated: boolean;            // Whether monster has been defeated
}
```

## Monster Generation

### Noise-Based Spawning

Monsters are generated using Simplex Noise (`monsterNoise2D`) with a unique seed offset:

```typescript
const monsterNoise2D = createNoise2D(() => mapSeed + 8000);
```

### Spawn Conditions

Monsters spawn when:
1. **Noise threshold**: `monsterNoise > 0.4 + terrainDanger`
   - Forests: +0.1 danger modifier
   - Mountains: +0.15 danger modifier
   - Deserts: +0.1 danger modifier
   - Other terrain: +0.05 danger modifier

2. **Valid terrain**: Not on ocean, locations, resources, or rivers
3. **Distance from locations**: At least 20% of map radius from towns/sanctums
4. **Spacing**: At least 8 tiles apart from other monsters

### Terrain-Based Types

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

### Level and HP Calculation

- **Level**: `1 + elevation * 5 + noise * 3` (scales with terrain height and noise)
- **Max HP**: `50 + level * 15 + noise * 30`
- **Patrol Radius**: `3 + noise * 3` (3-6 tiles)

### Monster Names

Each type has a pool of names:

- **Shadow**: Shadow Wraith, Dark Apparition, Phantom Stalker
- **Beast**: Wild Beast, Feral Predator, Ancient Guardian
- **Undead**: Cursed Spirit, Wandering Skeleton, Restless Dead
- **Elemental**: Stone Golem, Wind Elemental, Fire Sprite
- **Demon**: Desert Fiend, Sand Demon, Scorched Horror

## Monster Behavior

### Patrol System

Monsters patrol within their `patrolRadius` from their spawn point:

1. **Random Movement**: Every 2 seconds, monsters attempt to move in a random direction
2. **Boundary Check**: If movement would exceed patrol radius, it's rejected
3. **Return to Spawn**: If a monster wanders too far, it moves back toward spawn
4. **Collision**: Only moves to walkable tiles (not ocean or mountains)

### Movement Logic

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
  // Pick random direction and validate...
} else {
  // Return to spawn point
  // Move toward spawnX, spawnY
}
```

## Monster Rendering

### Visual Representation

Monsters are rendered with type-specific icons and colors:

| Type | Icon | Color | Hex |
|------|------|-------|-----|
| Shadow | 👻 | Purple | `#4a148c` |
| Beast | 🐺 | Brown | `#6d4c41` |
| Undead | 💀 | Gray | `#424242` |
| Elemental | 🔥 | Orange | `#ff6f00` |
| Demon | 😈 | Dark Red | `#b71c1c` |

### Rendering Details

1. **Monster Icon**: 12px Arial font, centered on tile
2. **Level Indicator**: Small white text above monster (`Lv{level}`)
3. **HP Bar**: Green/red bar below monster when damaged
   - Green bar shows current HP percentage
   - Red background shows missing HP

### Rendering Order

Monsters are rendered **before** the player character, so they appear behind the player sprite.

## Monster Encounters

### Detection

When the player moves to a tile, the system checks for nearby monsters:

```typescript
const nearbyMonster = getMonsterAt(mapData, tileX, tileY);
```

A monster is considered "nearby" if:
- Player is within 1 tile (Manhattan distance)
- Monster is not defeated

### Encounter Trigger

Currently, encounters are logged to console. Future integration points:

```typescript
if (nearbyMonster && !nearbyMonster.defeated) {
  console.log(`Encountered ${nearbyMonster.name} (Level ${nearbyMonster.level})!`);
  // TODO: Trigger combat system
  // TODO: Show monster details UI
  // TODO: Initiate battle sequence
}
```

## Utility Functions

### `getMonsterAt(mapData, x, y)`

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

### `defeatMonster(mapData, monsterId)`

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

## Integration Points

### WorldMap Component

Monsters are integrated into the `WorldMap` component:

1. **Initialization**: Generated with map data in `useEffect`
2. **Movement Loop**: Updated every 2 seconds in the animation loop
3. **Rendering**: Drawn in the render loop before the player character
4. **Encounter Detection**: Checked during player movement

### Key Files

- **`src/games/rpg/utils/mapGenerator.ts`**: Monster generation, types, utilities
- **`src/games/rpg/components/WorldMap.tsx`**: Monster rendering, movement, encounters

## Future Enhancements

### Potential Additions

1. **Combat Integration**
   - Trigger existing combat system on encounter
   - Use monster stats in battle calculations
   - Award XP/gold on defeat

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

6. **Monster Variants**
   - Elite monsters (higher stats)
   - Boss monsters (larger, unique)
   - Mini-bosses at key locations

## Code Structure

### Generation Flow

```
generateWorldMap()
  ├─ Create noise generators (monsterNoise2D)
  ├─ Generate terrain
  ├─ Generate locations
  ├─ Generate resources
  ├─ Generate monsters ← Monster generation
  │   ├─ Loop through all tiles
  │   ├─ Check noise threshold
  │   ├─ Validate spawn conditions
  │   ├─ Determine monster type
  │   ├─ Calculate level/HP
  │   └─ Add to monsters array
  ├─ Generate features
  └─ Return MapData (includes monsters)
```

### Update Flow

```
WorldMap Component
  ├─ Animation Loop (60 FPS)
  │   ├─ Player movement
  │   ├─ Camera following
  │   └─ Monster movement (every 2s) ← Monster behavior
  │       ├─ Check patrol radius
  │       ├─ Random movement
  │       └─ Return to spawn if needed
  └─ Render Loop (60 FPS)
      ├─ Render terrain
      ├─ Render rivers
      ├─ Render resources
      ├─ Render features
      ├─ Render monsters ← Monster rendering
      └─ Render player
```

## Performance Considerations

- **Monster Count**: Typically 20-50 monsters per 100x100 map
- **Movement Frequency**: Monsters move every 2 seconds (not every frame)
- **Rendering**: Only visible monsters are rendered (viewport culling)
- **Collision**: Simple distance checks, no complex pathfinding

## Example Usage

```typescript
// Generate map with monsters
const mapData = generateWorldMap(100, 100, 12345);

// Find monster at player position
const monster = getMonsterAt(mapData, playerX, playerY);
if (monster) {
  console.log(`Encountered: ${monster.name} (Level ${monster.level})`);
  
  // Trigger combat
  startCombat(monster);
  
  // On victory
  defeatMonster(mapData, monster.id);
}
```

## Notes

- Monsters use the same seed as the map for deterministic generation
- Monster positions are stored in tile coordinates (integers)
- Defeated monsters remain in the array but are not rendered or updated
- Monster movement is independent of player movement (asynchronous)

