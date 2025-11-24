# RPG World Map - NPC System

## Overview

The NPC system adds friendly, procedurally-generated non-player characters to the world map using Simplex Noise for spawn placement. NPCs can be merchants, quest givers, guardians, scholars, or wanderers, and they provide interaction opportunities for the player.

## NPC Interface

```typescript
export interface MapNPC {
  id: string;
  x: number;                    // Current tile X position
  y: number;                    // Current tile Y position
  name: string;                 // NPC name (e.g., "Aelric")
  title: string;                // NPC title (e.g., "Traveling Merchant")
  description: string;           // NPC description
  type: 'merchant' | 'quest_giver' | 'guardian' | 'wanderer' | 'scholar';
  dialogue: string[];            // Dialogue lines the NPC can say
  hasQuest: boolean;            // Whether NPC has a quest available
  questId?: string;             // Quest ID if hasQuest is true
  discovered: boolean;           // Whether player has discovered this NPC
  stationary: boolean;           // Whether NPC moves or stays in place
  spawnX: number;               // Original spawn position X
  spawnY: number;               // Original spawn position Y
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  lastMoveTime: number;         // Timestamp for movement timing
}
```

## NPC Generation

### Noise-Based Spawning

NPCs are generated using Simplex Noise (`npcNoise2D`) with a unique seed offset:

```typescript
const npcNoise2D = createNoise2D(() => mapSeed + 9000);
```

### Spawn Conditions

NPCs spawn when:
1. **Noise threshold**: `npcNoise > 0.5 + locationBonus`
   - Near locations (within 30% of map radius): +0.3 bonus
   - In wilderness: No bonus

2. **Valid terrain**: Not on ocean, mountains, or where monsters/resources/features/rivers are
3. **Distance from locations**: Prefer spawning near locations (safe areas)
4. **Spacing**: At least 10 tiles apart from other NPCs

### Location-Based Types

NPC types are determined by proximity to locations:

```typescript
if (nearLocation && locationDist < maxRadius * 0.15) {
  // Very close to location: merchant or quest giver
  type = npcNoise > 0.7 ? 'merchant' : 'quest_giver';
} else if (nearLocation) {
  // Near location: guardian or scholar
  type = npcNoise > 0.6 ? 'guardian' : 'scholar';
} else {
  // Wilderness: wanderer
  type = 'wanderer';
}
```

### NPC Types and Characteristics

| Type | Icon | Color | Spawn Location | Stationary | Description |
|------|------|-------|----------------|------------|-------------|
| Merchant | 💰 | Gold `#ffd700` | Near locations | No | Sells rare goods and items |
| Quest Giver | 📜 | Purple `#9b59b6` | Near locations | No | Offers quests to players |
| Guardian | 🛡️ | Blue `#3498db` | Near locations | Yes | Protects sacred areas |
| Wanderer | 🚶 | Gray `#95a5a6` | Wilderness | No | Travels the land |
| Scholar | 📚 | Orange `#e67e22` | Near locations | Yes | Studies ancient lore |

### NPC Names

NPCs are given names from a predefined pool:
- Aelric, Brenna, Cedric, Dara, Ewan, Fiona, Gareth, Helena
- Ivor, Jenna, Kael, Luna, Marcus, Nora, Owen, Piper
- Quinn, Rhea, Soren, Tara, Ulric, Vera, Wren, Xara

### NPC Titles

Each type has specific title pools:

- **Merchant**: Traveling Merchant, Shadow Trader, Wandering Vendor
- **Quest Giver**: Quest Master, Task Provider, Mission Giver
- **Guardian**: Ancient Guardian, Temple Keeper, Sacred Protector
- **Wanderer**: Mysterious Wanderer, Lone Traveler, Drifting Soul
- **Scholar**: Ancient Scholar, Knowledge Seeker, Lore Keeper

### NPC Dialogue

Each type has unique dialogue lines:

- **Merchant**: 
  - "I have rare items from distant lands..."
  - "Gold speaks louder than words, traveler."
  - "Looking for something specific? I might have it."

- **Quest Giver**:
  - "I have a task that needs completing..."
  - "Adventurer, I need your help!"
  - "There is work to be done, if you're willing."

- **Guardian**:
  - "This place is protected by ancient magic."
  - "Few have passed this way and lived to tell."
  - "The old ways must be preserved."

- **Wanderer**:
  - "The road is long, but the journey is worth it."
  - "I've seen many things in my travels..."
  - "Every path leads somewhere, eventually."

- **Scholar**:
  - "The secrets of the past are written in these ruins."
  - "Knowledge is the greatest treasure."
  - "I study the ancient texts... there is much to learn."

### Quest Assignment

- **Quest Givers**: Always have quests (`hasQuest: true`)
- **Other NPCs**: 30% chance to have a quest
- Quest ID is generated as `quest-{npcIndex}`

## NPC Behavior

### Stationary vs. Mobile

- **Stationary NPCs**: Guardians and Scholars stay in place
- **Mobile NPCs**: Merchants, Quest Givers, and Wanderers can move (future feature)

### Discovery System

NPCs are discovered when:
- Player moves within 2 tiles of the NPC
- NPC becomes visible (within 5 tiles) and is automatically discovered

Once discovered:
- NPC name is displayed above their icon
- NPC can be interacted with
- NPC appears on the map permanently

## NPC Rendering

### Visual Representation

NPCs are rendered with type-specific icons and colors:

1. **NPC Icon**: 12px Arial font, centered on tile
2. **Name Display**: White text above NPC when discovered
3. **Visibility**: Only discovered NPCs or NPCs within 5 tiles are shown

### Rendering Order

NPCs are rendered **before** monsters and the player character, so they appear behind those entities.

## NPC Encounters

### Detection

When the player moves to a tile, the system checks for nearby NPCs:

```typescript
const nearbyNPC = getNPCAt(mapData, tileX, tileY);
```

An NPC is considered "nearby" if:
- Player is within 2 tiles (Manhattan distance)
- NPC is not already discovered (auto-discovered on encounter)

### Encounter Trigger

Currently, NPCs are auto-discovered on encounter. Future integration points:

```typescript
if (nearbyNPC && !nearbyNPC.discovered) {
  discoverNPC(mapData, nearbyNPC.id);
  // TODO: Show dialogue UI
  // TODO: Open merchant shop if merchant
  // TODO: Show quest if quest giver
  // TODO: Display NPC information panel
}
```

## Utility Functions

### `getNPCAt(mapData, x, y)`

Finds an NPC at the given coordinates (within 2 tiles):

```typescript
export function getNPCAt(mapData: MapData, x: number, y: number): MapNPC | undefined {
  return mapData.npcs.find(npc => {
    const dx = Math.abs(npc.x - x);
    const dy = Math.abs(npc.y - y);
    return dx <= 2 && dy <= 2;
  });
}
```

### `discoverNPC(mapData, npcId)`

Marks an NPC as discovered:

```typescript
export function discoverNPC(mapData: MapData, npcId: string): MapNPC | undefined {
  const npc = mapData.npcs.find(n => n.id === npcId);
  if (npc) {
    npc.discovered = true;
  }
  return npc;
}
```

## Integration Points

### WorldMap Component

NPCs are integrated into the `WorldMap` component:

1. **Initialization**: Generated with map data in `useEffect`
2. **Rendering**: Drawn in the render loop before monsters and player
3. **Encounter Detection**: Checked during player movement
4. **Discovery**: Auto-discovered when player is nearby

### Key Files

- **`src/games/rpg/utils/mapGenerator.ts`**: NPC generation, types, utilities
- **`src/games/rpg/components/WorldMap.tsx`**: NPC rendering, encounters

## Comparison with Monsters

| Feature | NPCs | Monsters |
|---------|------|----------|
| Spawn Location | Near locations (safe) | Wilderness (dangerous) |
| Spawn Threshold | Higher (0.5+) | Lower (0.4+) |
| Spacing | 10 tiles | 8 tiles |
| Movement | Stationary (some types) | Patrol (all) |
| Discovery | Auto on encounter | Manual |
| Interaction | Friendly (dialogue, quests, shop) | Hostile (combat) |
| Visual | Colorful icons | Dark/red icons |

## Future Enhancements

### Potential Additions

1. **NPC Movement**
   - Mobile NPCs (merchants, quest givers, wanderers) patrol or move
   - Stationary NPCs stay in place (guardians, scholars)

2. **Dialogue System**
   - Interactive dialogue trees
   - Multiple conversation options
   - Dialogue history

3. **Merchant System**
   - Shop interface for merchants
   - Buy/sell items
   - Inventory management

4. **Quest System Integration**
   - Accept quests from quest givers
   - Track quest progress
   - Quest completion rewards

5. **NPC Relationships**
   - Reputation system
   - Faction relationships
   - Dynamic dialogue based on player actions

6. **NPC Services**
   - Scholars provide lore/information
   - Guardians offer protection/blessings
   - Wanderers share rumors/hints

7. **NPC Scheduling**
   - NPCs appear at certain times
   - Day/night cycles affect NPC availability
   - Seasonal NPCs

## Code Structure

### Generation Flow

```
generateWorldMap()
  ├─ Create noise generators (npcNoise2D)
  ├─ Generate terrain
  ├─ Generate locations
  ├─ Generate resources
  ├─ Generate monsters
  ├─ Generate NPCs ← NPC generation
  │   ├─ Loop through all tiles
  │   ├─ Check noise threshold + location proximity
  │   ├─ Validate spawn conditions
  │   ├─ Determine NPC type based on location
  │   ├─ Generate name, title, dialogue
  │   ├─ Assign quest if applicable
  │   └─ Add to npcs array
  ├─ Generate features
  └─ Return MapData (includes npcs)
```

### Update Flow

```
WorldMap Component
  ├─ Animation Loop (60 FPS)
  │   ├─ Player movement
  │   ├─ Camera following
  │   └─ NPC movement (future) ← NPC behavior
  └─ Render Loop (60 FPS)
      ├─ Render terrain
      ├─ Render rivers
      ├─ Render resources
      ├─ Render features
      ├─ Render NPCs ← NPC rendering
      ├─ Render monsters
      └─ Render player
```

## Performance Considerations

- **NPC Count**: Typically 10-25 NPCs per 100x100 map (fewer than monsters)
- **Movement**: Currently stationary (no movement overhead)
- **Rendering**: Only visible NPCs are rendered (viewport culling)
- **Discovery**: Simple distance checks, no complex pathfinding

## Example Usage

```typescript
// Generate map with NPCs
const mapData = generateWorldMap(100, 100, 12345);

// Find NPC at player position
const npc = getNPCAt(mapData, playerX, playerY);
if (npc) {
  console.log(`Encountered: ${npc.name} (${npc.title})`);
  
  // Discover NPC
  discoverNPC(mapData, npc.id);
  
  // Check NPC type and interact
  if (npc.type === 'merchant') {
    openShop(npc);
  } else if (npc.type === 'quest_giver' && npc.hasQuest) {
    showQuest(npc.questId);
  } else {
    showDialogue(npc);
  }
}
```

## Notes

- NPCs use the same seed as the map for deterministic generation
- NPC positions are stored in tile coordinates (integers)
- NPCs prefer spawning near locations (safe areas)
- Stationary NPCs (guardians, scholars) don't move
- NPCs are friendly and provide services/interactions
- Discovery is automatic when player is nearby (2 tiles)



