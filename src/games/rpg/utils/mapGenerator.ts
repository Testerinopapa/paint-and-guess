/**
 * Map generation utilities for 2-bit Final Fantasy style world map
 * Generates tile-based terrain with procedural landmass generation
 */

export type TileType = 'ocean' | 'grass' | 'forest' | 'mountain' | 'desert';

export interface MapLocation {
  id: string;
  name: string;
  x: number; // Tile coordinates
  y: number;
  discovered: boolean;
  type: 'ruins' | 'sanctum' | 'town' | 'dungeon';
}

export interface MapData {
  width: number;
  height: number;
  tiles: TileType[][];
  locations: MapLocation[];
}

const TILE_SIZE = 16; // 16x16 pixels per tile (Final Fantasy style)

/**
 * Simple seeded random number generator
 */
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Generate a procedural 2-bit world map
 */
export function generateWorldMap(width: number = 100, height: number = 100, seed?: number): MapData {
  // Use seeded random if seed provided, otherwise use Math.random
  const random = seed !== undefined ? seededRandom(seed) : () => Math.random();

  const tiles: TileType[][] = [];
  
  // Initialize with ocean
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = 'ocean';
    }
  }

  // Generate landmasses using simple noise/random approach
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Create main continent
      if (distance < maxRadius) {
        const noise = random() * 0.3 - 0.15; // -0.15 to 0.15
        const adjustedRadius = maxRadius + noise * maxRadius;
        
        if (distance < adjustedRadius) {
          // Determine terrain type based on distance and randomness
          const rand = random();
          if (distance < maxRadius * 0.3) {
            // Center: mountains and forests
            tiles[y][x] = rand < 0.4 ? 'mountain' : rand < 0.7 ? 'forest' : 'grass';
          } else if (distance < maxRadius * 0.6) {
            // Mid: mix of grass and forest
            tiles[y][x] = rand < 0.5 ? 'grass' : rand < 0.8 ? 'forest' : 'mountain';
          } else {
            // Outer: mostly grass, some desert near edges
            tiles[y][x] = rand < 0.7 ? 'grass' : rand < 0.9 ? 'desert' : 'forest';
          }
        }
      }
      
      // Add some random islands
      if (random() < 0.001 && distance > maxRadius * 1.2) {
        const islandSize = 3 + Math.floor(random() * 5);
        for (let iy = Math.max(0, y - islandSize); iy < Math.min(height, y + islandSize); iy++) {
          for (let ix = Math.max(0, x - islandSize); ix < Math.min(width, x + islandSize); ix++) {
            const id = Math.sqrt((ix - x) ** 2 + (iy - y) ** 2);
            if (id < islandSize && random() < 0.7) {
              tiles[iy][ix] = random() < 0.6 ? 'grass' : 'forest';
            }
          }
        }
      }
    }
  }

  // Generate locations
  const locations: MapLocation[] = [
    {
      id: 'ruins-of-eldrath',
      name: 'Ruins of Eldrath',
      x: Math.floor(centerX - maxRadius * 0.3),
      y: Math.floor(centerY - maxRadius * 0.2),
      discovered: true, // Starting location
      type: 'ruins',
    },
    {
      id: 'lower-sanctum',
      name: 'Lower Sanctum',
      x: Math.floor(centerX),
      y: Math.floor(centerY),
      discovered: false,
      type: 'sanctum',
    },
    {
      id: 'ancient-town',
      name: 'Ancient Town',
      x: Math.floor(centerX + maxRadius * 0.4),
      y: Math.floor(centerY - maxRadius * 0.3),
      discovered: false,
      type: 'town',
    },
  ];

  return {
    width,
    height,
    tiles,
    locations,
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

export { TILE_SIZE };

