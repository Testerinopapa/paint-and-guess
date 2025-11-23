/**
 * Map generation utilities for 2-bit Final Fantasy style world map
 * Generates tile-based terrain with procedural landmass generation using Simplex Noise
 */

import { createNoise2D } from 'simplex-noise';

export type TileType = 'ocean' | 'grass' | 'forest' | 'mountain' | 'desert';

export interface MapLocation {
  id: string;
  name: string;
  x: number; // Tile coordinates
  y: number;
  discovered: boolean;
  type: 'ruins' | 'sanctum' | 'town' | 'dungeon';
}

export interface MapResource {
  id: string;
  x: number;
  y: number;
  type: 'treasure' | 'ore' | 'herb' | 'crystal';
  collected: boolean;
  value: number; // Gold value or item rarity
}

export interface MapFeature {
  id: string;
  x: number;
  y: number;
  type: 'cave' | 'ruins' | 'shrine' | 'monolith';
  discovered: boolean;
}

export interface MapMonster {
  id: string;
  x: number;
  y: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  type: 'shadow' | 'beast' | 'undead' | 'elemental' | 'demon';
  patrolRadius: number; // How far the monster can patrol from spawn
  spawnX: number; // Original spawn position
  spawnY: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  lastMoveTime: number; // For movement timing
  defeated: boolean;
}

export interface MapNPC {
  id: string;
  x: number;
  y: number;
  name: string;
  title: string;
  description: string;
  type: 'merchant' | 'quest_giver' | 'guardian' | 'wanderer' | 'scholar';
  dialogue: string[];
  hasQuest: boolean;
  questId?: string;
  discovered: boolean;
  stationary: boolean; // Whether NPC moves or stays in place
  spawnX: number; // Original spawn position
  spawnY: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'idle';
  lastMoveTime: number; // For movement timing
}

export interface MapData {
  width: number;
  height: number;
  tiles: TileType[][];
  locations: MapLocation[];
  resources: MapResource[];
  features: MapFeature[];
  monsters: MapMonster[];
  npcs: MapNPC[];
  elevation: number[][]; // Height map (0-1, where 1 is highest)
  rivers: Array<{ x: number; y: number }>; // River tile coordinates
}

const TILE_SIZE = 16; // 16x16 pixels per tile (Final Fantasy style)

/**
 * Simple seeded random number generator (for location placement)
 */
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Generate a procedural 2-bit world map using Simplex Noise
 */
export function generateWorldMap(width: number = 100, height: number = 100, seed?: number): MapData {
  // Create noise generators with seed support
  // Use seed if provided, otherwise use random seed
  const mapSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
  const noise2D = createNoise2D(() => mapSeed);
  
  // Secondary noise for terrain type variation (different seed offset)
  const terrainNoise2D = createNoise2D(() => mapSeed + 1000);
  
  // Island noise (different seed offset)
  const islandNoise2D = createNoise2D(() => mapSeed + 2000);
  
  // Elevation noise (for height map)
  const elevationNoise2D = createNoise2D(() => mapSeed + 3000);
  
  // Resource placement noise
  const resourceNoise2D = createNoise2D(() => mapSeed + 4000);
  
  // Feature placement noise (caves, ruins, etc.)
  const featureNoise2D = createNoise2D(() => mapSeed + 5000);
  
  // Location placement noise
  const locationNoise2D = createNoise2D(() => mapSeed + 6000);
  
  // River generation noise
  const riverNoise2D = createNoise2D(() => mapSeed + 7000);
  
  // Monster spawn noise
  const monsterNoise2D = createNoise2D(() => mapSeed + 8000);
  
  // NPC spawn noise
  const npcNoise2D = createNoise2D(() => mapSeed + 9000);
  
  // Random generator for location placement
  const random = seed !== undefined ? seededRandom(seed) : () => Math.random();

  const tiles: TileType[][] = [];
  const elevation: number[][] = [];
  
  // Initialize with ocean
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    elevation[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = 'ocean';
      elevation[y][x] = 0;
    }
  }

  // Noise parameters
  const continentScale = 0.08; // Controls continent size/zoom
  const terrainScale = 0.15; // Controls terrain variation
  const islandScale = 0.12; // Controls island distribution
  
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Distance from center for continent shape
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normalizedDistance = distance / maxRadius;
      
      // Main continent noise (creates natural landmass shape)
      const continentNoise = noise2D(x * continentScale, y * continentScale);
      // Combine noise with distance for natural continent edges
      const landThreshold = 0.2 - normalizedDistance * 0.6; // More land near center
      const isLand = continentNoise > landThreshold;
      
      if (isLand) {
        // Generate elevation (height map)
        const elevationValue = elevationNoise2D(x * 0.1, y * 0.1);
        // Normalize elevation to 0-1 range, with higher values near center
        elevation[y][x] = Math.max(0, Math.min(1, (elevationValue + 1) / 2 + (1 - normalizedDistance) * 0.3));
        
        // Terrain type noise (for biome distribution)
        const terrainNoise = terrainNoise2D(x * terrainScale, y * terrainScale);
        
        // Determine terrain type based on distance zones, noise, and elevation
        const height = elevation[y][x];
        
        if (normalizedDistance < 0.3) {
          // Center zone: mountains and forests
          if (height > 0.7 || terrainNoise < -0.3) {
            tiles[y][x] = 'mountain';
          } else if (terrainNoise < 0.2) {
            tiles[y][x] = 'forest';
          } else {
            tiles[y][x] = 'grass';
          }
        } else if (normalizedDistance < 0.6) {
          // Mid zone: mix of grass and forest
          if (height > 0.8) {
            tiles[y][x] = 'mountain';
          } else if (terrainNoise < -0.1) {
            tiles[y][x] = 'grass';
          } else if (terrainNoise < 0.4) {
            tiles[y][x] = 'forest';
          } else {
            tiles[y][x] = 'mountain';
          }
        } else {
          // Outer zone: mostly grass, some desert
          if (terrainNoise < 0.2) {
            tiles[y][x] = 'grass';
          } else if (terrainNoise < 0.6) {
            tiles[y][x] = 'desert';
          } else {
            tiles[y][x] = 'forest';
          }
        }
      } else {
        // Ocean - check for islands using noise
        const islandNoise = islandNoise2D(x * islandScale, y * islandScale);
        // Islands appear in ocean far from main continent
        if (normalizedDistance > 1.0 && islandNoise > 0.4) {
          // Small islands
          const islandTerrainNoise = terrainNoise2D(x * terrainScale * 2, y * terrainScale * 2);
          tiles[y][x] = islandTerrainNoise < 0 ? 'grass' : 'forest';
          elevation[y][x] = 0.3; // Low elevation for islands
        }
      }
    }
  }

  // Generate rivers using noise-based paths
  const rivers: Array<{ x: number; y: number }> = [];
  const riverPoints = new Set<string>();
  
  // Generate 2-4 rivers flowing from high elevation to ocean
  const numRivers = 2 + Math.floor(random() * 3);
  for (let r = 0; r < numRivers; r++) {
    // Start river at high elevation point
    const startAngle = (r / numRivers) * Math.PI * 2;
    const startDist = maxRadius * (0.3 + random() * 0.2);
    let riverX = Math.floor(centerX + Math.cos(startAngle) * startDist);
    let riverY = Math.floor(centerY + Math.sin(startAngle) * startDist);
    
    // Ensure start is on land
    if (riverX >= 0 && riverX < width && riverY >= 0 && riverY < height && tiles[riverY][riverX] !== 'ocean') {
      const riverPath: Array<{ x: number; y: number }> = [];
      let currentX = riverX;
      let currentY = riverY;
      const maxLength = 50;
      
      for (let step = 0; step < maxLength; step++) {
        if (currentX < 0 || currentX >= width || currentY < 0 || currentY >= height) break;
        if (tiles[currentY][currentX] === 'ocean') break; // Reached ocean
        
        riverPath.push({ x: currentX, y: currentY });
        riverPoints.add(`${currentX},${currentY}`);
        
        // Use noise to guide river direction (downhill + noise)
        const noiseX = riverNoise2D(currentX * 0.2, currentY * 0.2);
        const noiseY = riverNoise2D(currentX * 0.2 + 100, currentY * 0.2 + 100);
        
        // Flow towards ocean (away from center) with noise variation
        const dx = currentX - centerX;
        const dy = currentY - centerY;
        const angle = Math.atan2(dy, dx);
        
        const nextX = Math.round(currentX + Math.cos(angle + noiseX * 0.5) + noiseX * 0.3);
        const nextY = Math.round(currentY + Math.sin(angle + noiseY * 0.5) + noiseY * 0.3);
        
        if (nextX === currentX && nextY === currentY) break;
        currentX = nextX;
        currentY = nextY;
      }
      
      rivers.push(...riverPath);
    }
  }

  // Generate locations using noise to find good spots
  const locations: MapLocation[] = [];
  const locationPositions = new Set<string>();
  
  // Starting location (Ruins of Eldrath) - fixed position
  const startX = Math.floor(centerX - maxRadius * 0.3);
  const startY = Math.floor(centerY - maxRadius * 0.2);
  locations.push({
    id: 'ruins-of-eldrath',
    name: 'Ruins of Eldrath',
    x: startX,
    y: startY,
    discovered: true,
    type: 'ruins',
  });
  locationPositions.add(`${startX},${startY}`);
  
  // Generate additional locations using noise
  const locationTypes: Array<MapLocation['type']> = ['sanctum', 'town', 'dungeon', 'ruins'];
  let attempts = 0;
  const maxLocations = 5;
  
  while (locations.length < maxLocations && attempts < 200) {
    attempts++;
    const x = Math.floor(random() * width);
    const y = Math.floor(random() * height);
    
    // Check if valid location spot (on land, not too close to others, good noise value)
    if (tiles[y][x] === 'ocean' || tiles[y][x] === 'mountain') continue;
    if (riverPoints.has(`${x},${y}`)) continue; // Not on river
    
    // Check distance from other locations
    let tooClose = false;
    for (const loc of locations) {
      const dist = Math.sqrt((x - loc.x) ** 2 + (y - loc.y) ** 2);
      if (dist < maxRadius * 0.15) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;
    
    // Use noise to find "interesting" spots (peaks/valleys in location noise)
    const locNoise = locationNoise2D(x * 0.05, y * 0.05);
    if (locNoise > 0.3) { // Only place in high-interest areas
      const type = locationTypes[Math.floor(random() * locationTypes.length)];
      const names = {
        sanctum: ['Lower Sanctum', 'Temple of Light', 'Sacred Grove'],
        town: ['Ancient Town', 'Merchant Haven', 'Coastal Village'],
        dungeon: ['Dark Caverns', 'Abandoned Keep', 'Shadow Depths'],
        ruins: ['Old Ruins', 'Forgotten Temple', 'Ancient Library'],
      };
      
      locations.push({
        id: `${type}-${locations.length}`,
        name: names[type][Math.floor(random() * names[type].length)],
        x,
        y,
        discovered: false,
        type,
      });
      locationPositions.add(`${x},${y}`);
    }
  }

  // Generate resources (treasures, ores, herbs, crystals) using noise
  const resources: MapResource[] = [];
  const resourcePositions = new Set<string>();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] === 'ocean') continue;
      if (locationPositions.has(`${x},${y}`)) continue; // Don't place on locations
      if (riverPoints.has(`${x},${y}`)) continue; // Don't place on rivers
      
      const resNoise = resourceNoise2D(x * 0.2, y * 0.2);
      
      // Place resources in resource-rich areas (noise peaks)
      if (resNoise > 0.5) {
        const resourceTypeNoise = resourceNoise2D(x * 0.3 + 500, y * 0.3 + 500);
        let type: MapResource['type'];
        let value: number;
        
        // Determine resource type based on terrain and noise
        if (tiles[y][x] === 'mountain') {
          type = resourceTypeNoise > 0 ? 'ore' : 'crystal';
          value = 20 + Math.floor(random() * 30);
        } else if (tiles[y][x] === 'forest') {
          type = resourceTypeNoise > 0 ? 'herb' : 'treasure';
          value = 10 + Math.floor(random() * 20);
        } else if (tiles[y][x] === 'desert') {
          type = 'crystal';
          value = 15 + Math.floor(random() * 25);
        } else {
          type = resourceTypeNoise > 0.3 ? 'treasure' : 'herb';
          value = 5 + Math.floor(random() * 15);
        }
        
        // Ensure minimum spacing between resources
        let tooClose = false;
        for (const res of resources) {
          const dist = Math.sqrt((x - res.x) ** 2 + (y - res.y) ** 2);
          if (dist < 3) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          resources.push({
            id: `resource-${resources.length}`,
            x,
            y,
            type,
            collected: false,
            value,
          });
          resourcePositions.add(`${x},${y}`);
        }
      }
    }
  }

  // Generate monsters using noise (spawn in dangerous areas)
  const monsters: MapMonster[] = [];
  const monsterPositions = new Set<string>();
  
  // Monster types by terrain
  const getMonsterTypeForTerrain = (tile: TileType, elevation: number): MapMonster['type'] => {
    if (tile === 'forest') return 'beast';
    if (tile === 'mountain' || elevation > 0.7) return 'elemental';
    if (tile === 'desert') return 'demon';
    // Default for grass and other terrain - randomly pick
    const types: MapMonster['type'][] = ['shadow', 'undead', 'beast'];
    return types[Math.floor(random() * types.length)];
  };
  
  const getMonsterNameForType = (type: MapMonster['type']): string => {
    const names: Record<MapMonster['type'], string[]> = {
      shadow: ['Shadow Wraith', 'Dark Apparition', 'Phantom Stalker'],
      beast: ['Wild Beast', 'Feral Predator', 'Ancient Guardian'],
      undead: ['Cursed Spirit', 'Wandering Skeleton', 'Restless Dead'],
      elemental: ['Stone Golem', 'Wind Elemental', 'Fire Sprite'],
      demon: ['Desert Fiend', 'Sand Demon', 'Scorched Horror'],
    };
    const typeNames = names[type];
    return typeNames[Math.floor(random() * typeNames.length)];
  };
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] === 'ocean') continue;
      if (locationPositions.has(`${x},${y}`)) continue;
      if (resourcePositions.has(`${x},${y}`)) continue;
      if (riverPoints.has(`${x},${y}`)) continue;
      
      const monNoise = monsterNoise2D(x * 0.1, y * 0.1);
      const elev = elevation[y][x] || 0;
      
      // Spawn monsters in dangerous areas (higher noise = more dangerous)
      // More monsters in forests, mountains, and far from locations
      const terrainDanger = tiles[y][x] === 'forest' ? 0.1 : 
                           tiles[y][x] === 'mountain' ? 0.15 : 
                           tiles[y][x] === 'desert' ? 0.1 : 0.05;
      
      if (monNoise > 0.4 + terrainDanger) {
        // Check distance from locations (monsters avoid towns/sanctums)
        let tooCloseToLocation = false;
        for (const loc of locations) {
          const dist = Math.sqrt((x - loc.x) ** 2 + (y - loc.y) ** 2);
          if (dist < maxRadius * 0.2) {
            tooCloseToLocation = true;
            break;
          }
        }
        if (tooCloseToLocation) continue;
        
        // Check spacing between monsters
        let tooClose = false;
        for (const mon of monsters) {
          const dist = Math.sqrt((x - mon.x) ** 2 + (y - mon.y) ** 2);
          if (dist < 8) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;
        
        const type = getMonsterTypeForTerrain(tiles[y][x], elev);
        const level = Math.floor(1 + elev * 5 + monNoise * 3); // Level based on elevation and noise
        const maxHp = 50 + level * 15 + Math.floor(monNoise * 30);
        
        monsters.push({
          id: `monster-${monsters.length}`,
          x,
          y,
          name: getMonsterNameForType(type),
          level,
          hp: maxHp,
          maxHp,
          type,
          patrolRadius: 3 + Math.floor(monNoise * 3), // 3-6 tile patrol radius
          spawnX: x,
          spawnY: y,
          direction: 'idle',
          lastMoveTime: 0,
          defeated: false,
        });
        monsterPositions.add(`${x},${y}`);
      }
    }
  }

  // Generate features (caves, ruins, shrines, monoliths) using noise
  const features: MapFeature[] = [];
  const featurePositions = new Set<string>();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] === 'ocean') continue;
      if (locationPositions.has(`${x},${y}`)) continue;
      if (resourcePositions.has(`${x},${y}`)) continue;
      
      const featNoise = featureNoise2D(x * 0.08, y * 0.08);
      
      // Place features in feature-rich areas
      if (featNoise > 0.6) {
        const featTypeNoise = featureNoise2D(x * 0.1 + 1000, y * 0.1 + 1000);
        let type: MapFeature['type'];
        
        if (tiles[y][x] === 'mountain' && elevation[y][x] > 0.6) {
          type = 'cave';
        } else if (tiles[y][x] === 'forest') {
          type = featTypeNoise > 0 ? 'shrine' : 'monolith';
        } else if (tiles[y][x] === 'desert') {
          type = 'ruins';
        } else {
          type = featTypeNoise > 0.3 ? 'shrine' : 'monolith';
        }
        
        // Ensure spacing
        let tooClose = false;
        for (const feat of features) {
          const dist = Math.sqrt((x - feat.x) ** 2 + (y - feat.y) ** 2);
          if (dist < 5) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          features.push({
            id: `feature-${features.length}`,
            x,
            y,
            type,
            discovered: false,
          });
          featurePositions.add(`${x},${y}`);
        }
      }
    }
  }

  // Generate NPCs using noise (spawn near locations and safe areas)
  const npcs: MapNPC[] = [];
  const npcPositions = new Set<string>();
  
  // NPC type names and dialogues
  const getNPCTypeInfo = (type: MapNPC['type']) => {
    const info = {
      merchant: {
        titles: ['Traveling Merchant', 'Shadow Trader', 'Wandering Vendor'],
        dialogues: [
          'I have rare items from distant lands...',
          'Gold speaks louder than words, traveler.',
          'Looking for something specific? I might have it.',
        ],
      },
      quest_giver: {
        titles: ['Quest Master', 'Task Provider', 'Mission Giver'],
        dialogues: [
          'I have a task that needs completing...',
          'Adventurer, I need your help!',
          'There is work to be done, if you\'re willing.',
        ],
      },
      guardian: {
        titles: ['Ancient Guardian', 'Temple Keeper', 'Sacred Protector'],
        dialogues: [
          'This place is protected by ancient magic.',
          'Few have passed this way and lived to tell.',
          'The old ways must be preserved.',
        ],
      },
      wanderer: {
        titles: ['Mysterious Wanderer', 'Lone Traveler', 'Drifting Soul'],
        dialogues: [
          'The road is long, but the journey is worth it.',
          'I\'ve seen many things in my travels...',
          'Every path leads somewhere, eventually.',
        ],
      },
      scholar: {
        titles: ['Ancient Scholar', 'Knowledge Seeker', 'Lore Keeper'],
        dialogues: [
          'The secrets of the past are written in these ruins.',
          'Knowledge is the greatest treasure.',
          'I study the ancient texts... there is much to learn.',
        ],
      },
    };
    return info[type];
  };
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] === 'ocean') continue;
      if (tiles[y][x] === 'mountain') continue; // NPCs don't spawn on mountains
      if (monsterPositions.has(`${x},${y}`)) continue; // Not where monsters are
      if (resourcePositions.has(`${x},${y}`)) continue;
      if (featurePositions.has(`${x},${y}`)) continue;
      if (riverPoints.has(`${x},${y}`)) continue;
      
      const npcNoise = npcNoise2D(x * 0.08, y * 0.08);
      const elev = elevation[y][x] || 0;
      
      // NPCs spawn near locations (safe areas) or in interesting spots
      let nearLocation = false;
      let locationDist = Infinity;
      for (const loc of locations) {
        const dist = Math.sqrt((x - loc.x) ** 2 + (y - loc.y) ** 2);
        if (dist < maxRadius * 0.3) {
          nearLocation = true;
          locationDist = Math.min(locationDist, dist);
        }
      }
      
      // Higher chance near locations, lower chance in wilderness
      const locationBonus = nearLocation ? 0.3 : 0.0;
      const spawnThreshold = 0.5 + locationBonus;
      
      if (npcNoise > spawnThreshold) {
        // Check spacing between NPCs
        let tooClose = false;
        for (const npc of npcs) {
          const dist = Math.sqrt((x - npc.x) ** 2 + (y - npc.y) ** 2);
          if (dist < 10) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;
        
        // Determine NPC type based on location and noise
        let type: MapNPC['type'];
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
        
        const typeInfo = getNPCTypeInfo(type);
        const title = typeInfo.titles[Math.floor(random() * typeInfo.titles.length)];
        const dialogue = typeInfo.dialogues[Math.floor(random() * typeInfo.dialogues.length)];
        const hasQuest = type === 'quest_giver' || (random() < 0.3);
        
        // Generate name (simple for now, could use faker if available)
        const names = [
          'Aelric', 'Brenna', 'Cedric', 'Dara', 'Ewan', 'Fiona', 'Gareth', 'Helena',
          'Ivor', 'Jenna', 'Kael', 'Luna', 'Marcus', 'Nora', 'Owen', 'Piper',
          'Quinn', 'Rhea', 'Soren', 'Tara', 'Ulric', 'Vera', 'Wren', 'Xara',
        ];
        const name = names[Math.floor(random() * names.length)];
        
        npcs.push({
          id: `npc-${npcs.length}`,
          x,
          y,
          name,
          title,
          description: `A ${title.toLowerCase()} who ${type === 'merchant' ? 'sells rare goods' : type === 'quest_giver' ? 'offers quests' : type === 'guardian' ? 'protects this area' : type === 'scholar' ? 'studies ancient lore' : 'wanders the land'}.`,
          type,
          dialogue: [dialogue],
          hasQuest,
          questId: hasQuest ? `quest-${npcs.length}` : undefined,
          discovered: false,
          stationary: type === 'guardian' || type === 'scholar', // Guardians and scholars stay put
          spawnX: x,
          spawnY: y,
          direction: 'idle',
          lastMoveTime: 0,
        });
        npcPositions.add(`${x},${y}`);
      }
    }
  }

  return {
    width,
    height,
    tiles,
    locations,
    resources,
    features,
    monsters,
    npcs,
    elevation,
    rivers,
  };
}

/**
 * Get tile color for 2-bit rendering
 */
export function getTileColor(tile: TileType): string {
  const colors: Record<TileType, string> = {
    ocean: '#1a237e',      // Deep blue
    grass: '#4caf50',       // Green
    forest: '#2e7d32',      // Dark green
    mountain: '#757575',    // Gray
    desert: '#ffc107',      // Amber/yellow
  };
  return colors[tile] || colors.ocean;
}

/**
 * Check if a tile is walkable
 */
export function isWalkable(tile: TileType): boolean {
  return tile !== 'ocean' && tile !== 'mountain';
}

/**
 * Get location by name
 */
export function getLocationByName(mapData: MapData, name: string): MapLocation | undefined {
  return mapData.locations.find(loc => loc.name === name);
}

/**
 * Get location by coordinates (within 2 tiles)
 */
export function getLocationAt(mapData: MapData, x: number, y: number): MapLocation | undefined {
  return mapData.locations.find(loc => {
    const dx = Math.abs(loc.x - x);
    const dy = Math.abs(loc.y - y);
    return dx <= 2 && dy <= 2;
  });
}

/**
 * Get resource at coordinates (within 1 tile)
 */
export function getResourceAt(mapData: MapData, x: number, y: number): MapResource | undefined {
  return mapData.resources.find(res => {
    if (res.collected) return false;
    const dx = Math.abs(res.x - x);
    const dy = Math.abs(res.y - y);
    return dx <= 1 && dy <= 1;
  });
}

/**
 * Get feature at coordinates (within 2 tiles)
 */
export function getFeatureAt(mapData: MapData, x: number, y: number): MapFeature | undefined {
  return mapData.features.find(feat => {
    const dx = Math.abs(feat.x - x);
    const dy = Math.abs(feat.y - y);
    return dx <= 2 && dy <= 2;
  });
}

/**
 * Get monster at coordinates (within 1 tile)
 */
export function getMonsterAt(mapData: MapData, x: number, y: number): MapMonster | undefined {
  return mapData.monsters.find(mon => {
    if (mon.defeated) return false;
    const dx = Math.abs(mon.x - x);
    const dy = Math.abs(mon.y - y);
    return dx <= 1 && dy <= 1;
  });
}

/**
 * Defeat a monster (mark as defeated)
 */
export function defeatMonster(mapData: MapData, monsterId: string): MapMonster | undefined {
  const monster = mapData.monsters.find(m => m.id === monsterId);
  if (monster) {
    monster.defeated = true;
    monster.hp = 0;
  }
  return monster;
}

/**
 * Get NPC at coordinates (within 2 tiles)
 */
export function getNPCAt(mapData: MapData, x: number, y: number): MapNPC | undefined {
  if (!mapData.npcs) return undefined;
  return mapData.npcs.find(npc => {
    const dx = Math.abs(npc.x - x);
    const dy = Math.abs(npc.y - y);
    return dx <= 2 && dy <= 2;
  });
}

/**
 * Discover an NPC (mark as discovered)
 */
export function discoverNPC(mapData: MapData, npcId: string): MapNPC | undefined {
  const npc = mapData.npcs.find(n => n.id === npcId);
  if (npc) {
    npc.discovered = true;
  }
  return npc;
}

/**
 * Collect a resource (mark as collected)
 */
export function collectResource(mapData: MapData, resourceId: string): MapResource | undefined {
  const resource = mapData.resources.find(r => r.id === resourceId);
  if (resource) {
    resource.collected = true;
  }
  return resource;
}

/**
 * Discover a feature (mark as discovered)
 */
export function discoverFeature(mapData: MapData, featureId: string): MapFeature | undefined {
  const feature = mapData.features.find(f => f.id === featureId);
  if (feature) {
    feature.discovered = true;
  }
  return feature;
}

/**
 * Get elevation at coordinates
 */
export function getElevationAt(mapData: MapData, x: number, y: number): number {
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  if (tileX >= 0 && tileX < mapData.width && tileY >= 0 && tileY < mapData.height) {
    return mapData.elevation[tileY][tileX];
  }
  return 0;
}

export { TILE_SIZE };

