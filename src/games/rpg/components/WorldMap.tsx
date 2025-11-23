import { useEffect, useRef, useState, useCallback } from "react";
import Draggable from "react-draggable";
import { X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  generateWorldMap,
  getTileColor,
  isWalkable,
  getLocationAt,
  getResourceAt,
  getFeatureAt,
  getMonsterAt,
  getNPCAt,
  collectResource,
  discoverFeature,
  discoverNPC,
  defeatMonster,
  type MapData,
  type MapLocation,
  type MapResource,
  type MapFeature,
  type MapMonster,
  type MapNPC,
  TILE_SIZE,
} from "../utils/mapGenerator";
import { useRpgStore } from "../state/useRpgStore";
import { MonsterPanel } from "./MonsterPanel";
import { NPCPanel } from "./NPCPanel";

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

interface WorldMapProps {
  isOpen: boolean;
  onClose: () => void;
  onNPCEncounter?: (npc: MapNPC) => void; // Callback when NPC is encountered
}

interface Camera {
  x: number;
  y: number;
}

interface Character {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

// Movement constants
const MOVEMENT_SPEED = 2.5; // tiles per second
const CAMERA_LERP_SPEED = 0.15; // camera interpolation speed (0-1, higher = faster)

export function WorldMap({ isOpen, onClose, onNPCEncounter }: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapDataRef = useRef<MapData | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [character, setCharacter] = useState<Character>({ x: 0, y: 0, direction: 'down' });
  const location = useRpgStore((state) => state.location);
  const setLocation = useRpgStore((state) => state.setLocation);
  
  // Panel position and size state
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [panelSize, setPanelSize] = useState({ width: 640, height: 480 });
  const worldMapNodeRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Use refs for smooth animation without causing re-renders
  const characterRef = useRef<Character>({ x: 0, y: 0, direction: 'down' });
  const cameraRef = useRef<Camera>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const renderFrameRef = useRef<number | null>(null);
  // Use ref for keys to avoid state update delays
  const keysRef = useRef<Set<string>>(new Set());
  
  // Animation time for water effects
  const animationTimeRef = useRef<number>(0);
  
  // Monster movement tracking
  const lastMonsterMoveRef = useRef<number>(0);
  const MONSTER_MOVE_INTERVAL = 2000; // Move every 2 seconds
  
  // Monster encounter state
  const [encounteredMonster, setEncounteredMonster] = useState<MapMonster | null>(null);
  const lastEncounteredMonsterRef = useRef<string | null>(null); // Track last encountered to avoid spam
  const encounteredMonsterRef = useRef<MapMonster | null>(null); // Keep ref for checking in animation loop
  
  // NPC encounter state
  const [encounteredNPC, setEncounteredNPC] = useState<MapNPC | null>(null);
  const lastEncounteredNPCRef = useRef<string | null>(null); // Track last encountered to avoid spam
  const encounteredNPCRef = useRef<MapNPC | null>(null); // Keep ref for checking in animation loop
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    fps: 0,
    deltaTime: 0,
    characterPos: { x: 0, y: 0 },
    cameraPos: { x: 0, y: 0 },
    tilePos: { x: 0, y: 0 },
    keys: [] as string[],
    movementSpeed: 0,
  });
  const fpsHistoryRef = useRef<number[]>([]);
  const lastFpsUpdateRef = useRef<number>(0);

  // Close panels when world map closes
  useEffect(() => {
    if (!isOpen) {
      setEncounteredMonster(null);
      lastEncounteredMonsterRef.current = null;
      encounteredMonsterRef.current = null;
      setEncounteredNPC(null);
      lastEncounteredNPCRef.current = null;
      encounteredNPCRef.current = null;
    }
  }, [isOpen]);

  // Initialize panel position (centered)
  useEffect(() => {
    if (typeof window !== "undefined" && isOpen) {
      setPanelPosition({
        x: (window.innerWidth - panelSize.width) / 2,
        y: (window.innerHeight - panelSize.height) / 2,
      });
    }
  }, [isOpen, panelSize.width, panelSize.height]);

  // Handle resize
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      
      const newWidth = Math.max(400, Math.min(1200, resizeStartRef.current.width - deltaX));
      const newHeight = Math.max(300, Math.min(800, resizeStartRef.current.height - deltaY));
      
      setPanelSize({ width: newWidth, height: newHeight });
      
      // Adjust position to keep top-left corner fixed
      setPanelPosition(prev => ({
        x: prev.x - (newWidth - resizeStartRef.current.width),
        y: prev.y - (newHeight - resizeStartRef.current.height),
      }));
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  // Initialize map on mount
  useEffect(() => {
    if (!mapDataRef.current) {
      const newMapData = generateWorldMap(100, 100);
      // Ensure npcs array exists (for backward compatibility)
      if (!newMapData.npcs) {
        newMapData.npcs = [];
      }
      mapDataRef.current = newMapData;
      
      // Set character to starting location
      const startLoc = mapDataRef.current.locations.find(loc => loc.name === 'Ruins of Eldrath');
      if (startLoc) {
        const initialPos = { x: startLoc.x, y: startLoc.y, direction: 'down' as const };
        setCharacter(initialPos);
        characterRef.current = initialPos;
        // Center camera on character
        const initialCamera = { x: startLoc.x, y: startLoc.y };
        setCamera(initialCamera);
        cameraRef.current = initialCamera;
      }
    }
  }, []);

  // Update character position based on current location
  useEffect(() => {
    if (mapDataRef.current) {
      const currentLoc = mapDataRef.current.locations.find(loc => loc.name === location);
      if (currentLoc) {
        const newPos = { x: currentLoc.x, y: currentLoc.y, direction: 'down' as const };
        setCharacter(newPos);
        characterRef.current = newPos;
        const newCamera = { x: currentLoc.x, y: currentLoc.y };
        setCamera(newCamera);
        cameraRef.current = newCamera;
      }
    }
  }, [location]);

  // Handle keyboard input for character movement
  useEffect(() => {
    if (!isOpen) {
      // Clear keys when map closes
      keysRef.current.clear();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for arrow keys to avoid scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);
    };

    // Also handle keydown on canvas focus
    const handleCanvasKeyDown = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysRef.current.clear();
    };
  }, [isOpen]);

  // Continuous animation loop for smooth movement
  useEffect(() => {
    if (!isOpen || !mapDataRef.current) return;

    let lastTime = performance.now();
    let lastLocationCheck = { x: -1, y: -1 };
    let lastStateUpdate = 0;
    let frameCount = 0;
    let fpsLastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      // Calculate FPS
      frameCount++;
      const fpsDeltaTime = currentTime - fpsLastTime;
      if (fpsDeltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / fpsDeltaTime);
        fpsHistoryRef.current.push(fps);
        if (fpsHistoryRef.current.length > 60) {
          fpsHistoryRef.current.shift();
        }
        const avgFps = Math.round(
          fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
        );
        
        // Update debug info every second
        if (currentTime - lastFpsUpdateRef.current >= 100) {
          lastFpsUpdateRef.current = currentTime;
          const currentKeys = Array.from(keysRef.current);
          const currentChar = characterRef.current;
          const currentCamera = cameraRef.current;
          
          setDebugInfo({
            fps: avgFps,
            deltaTime: deltaTime * 1000, // Convert to ms
            characterPos: { x: currentChar.x, y: currentChar.y },
            cameraPos: { x: currentCamera.x, y: currentCamera.y },
            tilePos: { x: Math.floor(currentChar.x), y: Math.floor(currentChar.y) },
            keys: currentKeys,
            movementSpeed: MOVEMENT_SPEED,
          });
        }
        
        frameCount = 0;
        fpsLastTime = currentTime;
      }

      const mapData = mapDataRef.current;
      if (!mapData) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Get current keys from ref (always up-to-date)
      const currentKeys = keysRef.current;

      // Update character position if keys are pressed
      if (currentKeys.size > 0) {
        const currentChar = characterRef.current;
        let newX = currentChar.x;
        let newY = currentChar.y;
        let newDirection = currentChar.direction;

        // Calculate movement based on delta time (tiles per second)
        const moveDistance = MOVEMENT_SPEED * deltaTime;

        if (currentKeys.has('arrowup') || currentKeys.has('w')) {
          newY -= moveDistance;
          newDirection = 'up';
        }
        if (currentKeys.has('arrowdown') || currentKeys.has('s')) {
          newY += moveDistance;
          newDirection = 'down';
        }
        if (currentKeys.has('arrowleft') || currentKeys.has('a')) {
          newX -= moveDistance;
          newDirection = 'left';
        }
        if (currentKeys.has('arrowright') || currentKeys.has('d')) {
          newX += moveDistance;
          newDirection = 'right';
        }

        // Check if new position is valid
        const tileX = Math.floor(newX);
        const tileY = Math.floor(newY);

        if (
          tileX >= 0 &&
          tileX < mapData.width &&
          tileY >= 0 &&
          tileY < mapData.height
        ) {
          const tile = mapData.tiles[tileY][tileX];
          if (isWalkable(tile)) {
            // Update character ref immediately for smooth movement
            characterRef.current = { x: newX, y: newY, direction: newDirection };
            
            // Update state periodically (every ~100ms) to avoid excessive re-renders
            if (currentTime - lastStateUpdate > 100) {
              lastStateUpdate = currentTime;
              setCharacter(characterRef.current);
            }

            // Check for location/resource/feature discovery (only check when entering new tile)
            if (tileX !== lastLocationCheck.x || tileY !== lastLocationCheck.y) {
              lastLocationCheck = { x: tileX, y: tileY };
              
              // Check for location discovery
              const reachedLocation = getLocationAt(mapData, tileX, tileY);
              if (reachedLocation && !reachedLocation.discovered) {
                reachedLocation.discovered = true;
                setLocation(reachedLocation.name);
              }
              
              // Check for resource collection
              const nearbyResource = getResourceAt(mapData, tileX, tileY);
              if (nearbyResource && !nearbyResource.collected) {
                collectResource(mapData, nearbyResource.id);
                // Could trigger a notification or add to inventory here
              }
              
              // Check for feature discovery
              const nearbyFeature = getFeatureAt(mapData, tileX, tileY);
              if (nearbyFeature && !nearbyFeature.discovered) {
                discoverFeature(mapData, nearbyFeature.id);
                // Could trigger a notification here
              }
              
              // Check for NPC encounter
              const nearbyNPC = getNPCAt(mapData, tileX, tileY);
              if (nearbyNPC) {
                // Discover NPC if not already discovered
                if (!nearbyNPC.discovered) {
                  discoverNPC(mapData, nearbyNPC.id);
                }
                
                // Only show panel if it's a different NPC (avoid spam)
                if (lastEncounteredNPCRef.current !== nearbyNPC.id) {
                  lastEncounteredNPCRef.current = nearbyNPC.id;
                  encounteredNPCRef.current = nearbyNPC;
                  setEncounteredNPC(nearbyNPC);
                  
                  // Trigger NPC encounter callback (for story window)
                  if (onNPCEncounter) {
                    onNPCEncounter(nearbyNPC);
                  }
                } else {
                  // Update NPC data if same NPC (for any changes)
                  encounteredNPCRef.current = nearbyNPC;
                  setEncounteredNPC(nearbyNPC);
                }
              } else {
                // Clear encounter if no NPC nearby
                if (lastEncounteredNPCRef.current !== null) {
                  lastEncounteredNPCRef.current = null;
                  encounteredNPCRef.current = null;
                  setEncounteredNPC(null);
                }
              }
              
              // Check for monster encounter
              const nearbyMonster = getMonsterAt(mapData, tileX, tileY);
              if (nearbyMonster && !nearbyMonster.defeated) {
                // Only show panel if it's a different monster (avoid spam)
                if (lastEncounteredMonsterRef.current !== nearbyMonster.id) {
                  lastEncounteredMonsterRef.current = nearbyMonster.id;
                  encounteredMonsterRef.current = nearbyMonster;
                  setEncounteredMonster(nearbyMonster);
                  console.log(`Encountered ${nearbyMonster.name} (Level ${nearbyMonster.level})!`);
                } else {
                  // Update monster data if same monster (for HP changes, etc.)
                  encounteredMonsterRef.current = nearbyMonster;
                  setEncounteredMonster(nearbyMonster);
                }
              } else {
                // Clear encounter if no monster nearby or monster is defeated
                if (lastEncounteredMonsterRef.current !== null) {
                  lastEncounteredMonsterRef.current = null;
                  encounteredMonsterRef.current = null;
                  setEncounteredMonster(null);
                }
              }
              
              // Also check if currently displayed monster was defeated
              if (encounteredMonsterRef.current && encounteredMonsterRef.current.defeated) {
                setEncounteredMonster(null);
                lastEncounteredMonsterRef.current = null;
                encounteredMonsterRef.current = null;
              }
              
              // Also check if currently displayed NPC still exists and is valid
              if (encounteredNPCRef.current) {
                const currentNPC = mapData.npcs.find(n => n.id === encounteredNPCRef.current?.id);
                if (!currentNPC) {
                  setEncounteredNPC(null);
                  lastEncounteredNPCRef.current = null;
                  encounteredNPCRef.current = null;
                }
              }
            }
          }
        }
      }
      
      // Update monster positions (patrol behavior)
      const monsterMoveTime = performance.now();
      if (monsterMoveTime - lastMonsterMoveRef.current > MONSTER_MOVE_INTERVAL) {
        lastMonsterMoveRef.current = monsterMoveTime;
        
        mapData.monsters.forEach(monster => {
          if (monster.defeated) return;
          
          // Simple patrol: move randomly within patrol radius
          const distFromSpawn = Math.sqrt(
            (monster.x - monster.spawnX) ** 2 + (monster.y - monster.spawnY) ** 2
          );
          
          if (distFromSpawn < monster.patrolRadius) {
            // Move randomly
            const directions = [
              { dx: 0, dy: -1, dir: 'up' as const },
              { dx: 0, dy: 1, dir: 'down' as const },
              { dx: -1, dy: 0, dir: 'left' as const },
              { dx: 1, dy: 0, dir: 'right' as const },
            ];
            
            const move = directions[Math.floor(Math.random() * directions.length)];
            const newX = monster.x + move.dx;
            const newY = monster.y + move.dy;
            
            // Check if new position is valid
            if (newX >= 0 && newX < mapData.width && 
                newY >= 0 && newY < mapData.height) {
              const tile = mapData.tiles[newY][newX];
              if (isWalkable(tile)) {
                // Check distance from spawn
                const newDist = Math.sqrt(
                  (newX - monster.spawnX) ** 2 + (newY - monster.spawnY) ** 2
                );
                if (newDist <= monster.patrolRadius) {
                  monster.x = newX;
                  monster.y = newY;
                  monster.direction = move.dir;
                }
              }
            }
          } else {
            // Return to spawn
            const dx = monster.spawnX - monster.x;
            const dy = monster.spawnY - monster.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              monster.x += dx > 0 ? 1 : -1;
              monster.direction = dx > 0 ? 'right' : 'left';
            } else {
              monster.y += dy > 0 ? 1 : -1;
              monster.direction = dy > 0 ? 'down' : 'up';
            }
          }
        });
      }

      // Smooth camera interpolation (lerp) - always update for smooth following
      const currentChar = characterRef.current;
      const currentCamera = cameraRef.current;
      const targetX = currentChar.x;
      const targetY = currentChar.y;
      
      // Linear interpolation for smooth camera following
      const newCameraX = currentCamera.x + (targetX - currentCamera.x) * CAMERA_LERP_SPEED;
      const newCameraY = currentCamera.y + (targetY - currentCamera.y) * CAMERA_LERP_SPEED;
      
      cameraRef.current = { x: newCameraX, y: newCameraY };
      
      // Update camera state every frame for smooth rendering
      setCamera(cameraRef.current);

      // Always continue animation loop (don't stop)
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isOpen, setLocation]);


  // Continuous render loop for smooth animation
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !mapDataRef.current) return;
    
    // Ensure npcs array exists (for backward compatibility with old maps)
    if (!mapDataRef.current.npcs) {
      mapDataRef.current.npcs = [];
    }

    let renderFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const mapData = mapDataRef.current;
      if (!canvas || !mapData) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set pixel-perfect rendering
      ctx.imageSmoothingEnabled = false;

      const viewportWidth = Math.floor(canvas.width / TILE_SIZE);
      const viewportHeight = Math.floor(canvas.height / TILE_SIZE);

      // Use refs for smooth rendering
      const currentCamera = cameraRef.current;
      const currentChar = characterRef.current;

      // Calculate visible tile range
      const startX = Math.max(0, Math.floor(currentCamera.x - viewportWidth / 2));
      const endX = Math.min(mapData.width, startX + viewportWidth);
      const startY = Math.max(0, Math.floor(currentCamera.y - viewportHeight / 2));
      const endY = Math.min(mapData.height, startY + viewportHeight);

      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create river lookup set for fast checking
      const riverSet = new Set(mapData.rivers.map(r => `${r.x},${r.y}`));
      
      // Render tiles with elevation shading
      for (let ty = startY; ty < endY; ty++) {
        for (let tx = startX; tx < endX; tx++) {
          const tile = mapData.tiles[ty][tx];
          const screenX = (tx - currentCamera.x + viewportWidth / 2) * TILE_SIZE;
          const screenY = (ty - currentCamera.y + viewportHeight / 2) * TILE_SIZE;

          // Base tile color
          let color = getTileColor(tile);
          
          // Apply elevation shading (darker = higher elevation)
          const elevation = mapData.elevation[ty]?.[tx] || 0;
          if (elevation > 0) {
            const shade = Math.max(0, 1 - elevation * 0.3); // Darker for higher elevation
            const rgb = hexToRgb(color);
            if (rgb) {
              color = `rgb(${Math.floor(rgb.r * shade)}, ${Math.floor(rgb.g * shade)}, ${Math.floor(rgb.b * shade)})`;
            }
          }
          
          // Animated water effect for ocean tiles
          if (tile === 'ocean') {
            // Use time-based noise for subtle water animation
            const time = animationTimeRef.current * 0.001;
            const waveOffset = Math.sin(tx * 0.1 + ty * 0.1 + time) * 0.1;
            const brightness = 1 + waveOffset;
            const rgb = hexToRgb(color);
            if (rgb) {
              color = `rgb(${Math.floor(rgb.r * brightness)}, ${Math.floor(rgb.g * brightness)}, ${Math.floor(rgb.b * brightness)})`;
            }
          }

          ctx.fillStyle = color;
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          
          // Render rivers on top of terrain
          if (riverSet.has(`${tx},${ty}`)) {
            ctx.fillStyle = '#1565c0'; // River blue
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      // Render locations
      mapData.locations.forEach(loc => {
        if (loc.discovered || loc.name === location) {
          const screenX = (loc.x - currentCamera.x + viewportWidth / 2) * TILE_SIZE;
          const screenY = (loc.y - currentCamera.y + viewportHeight / 2) * TILE_SIZE;

          // Draw location marker
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 4, 0, Math.PI * 2);
          ctx.fill();

          // Draw location name
          if (loc.name === location) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(loc.name, screenX + TILE_SIZE / 2, screenY - 4);
          }
        }
      });

      // Render resources
      mapData.resources.forEach(resource => {
        if (resource.collected) return;
        
        const screenX = (resource.x - currentCamera.x + viewportWidth / 2) * TILE_SIZE;
        const screenY = (resource.y - currentCamera.y + viewportHeight / 2) * TILE_SIZE;
        
        // Check if resource is visible
        if (screenX >= -TILE_SIZE && screenX < canvas.width + TILE_SIZE &&
            screenY >= -TILE_SIZE && screenY < canvas.height + TILE_SIZE) {
          
          let iconColor = '#ffffff';
          let icon = '●';
          
          switch (resource.type) {
            case 'treasure':
              iconColor = '#ffd700';
              icon = '💰';
              break;
            case 'ore':
              iconColor = '#9e9e9e';
              icon = '⛏️';
              break;
            case 'herb':
              iconColor = '#4caf50';
              icon = '🌿';
              break;
            case 'crystal':
              iconColor = '#9c27b0';
              icon = '💎';
              break;
          }
          
          // Draw resource icon (smaller than location markers)
          ctx.fillStyle = iconColor;
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      });

      // Render features
      mapData.features.forEach(feature => {
        const screenX = (feature.x - currentCamera.x + viewportWidth / 2) * TILE_SIZE;
        const screenY = (feature.y - currentCamera.y + viewportHeight / 2) * TILE_SIZE;
        
        // Check if feature is visible
        if (screenX >= -TILE_SIZE && screenX < canvas.width + TILE_SIZE &&
            screenY >= -TILE_SIZE && screenY < canvas.height + TILE_SIZE) {
          
          let iconColor = '#8b4513';
          let icon = '●';
          
          switch (feature.type) {
            case 'cave':
              iconColor = '#424242';
              icon = '🕳️';
              break;
            case 'ruins':
              iconColor = '#795548';
              icon = '🏛️';
              break;
            case 'shrine':
              iconColor = '#fff9c4';
              icon = '⛩️';
              break;
            case 'monolith':
              iconColor = '#607d8b';
              icon = '🗿';
              break;
          }
          
          // Only show discovered features or features near player
          const charTileX = Math.floor(currentChar.x);
          const charTileY = Math.floor(currentChar.y);
          const dist = Math.sqrt((feature.x - charTileX) ** 2 + (feature.y - charTileY) ** 2);
          
          if (feature.discovered || dist < 5) {
            // Draw feature icon
            ctx.fillStyle = iconColor;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          }
        }
      });

      // Render NPCs
      (mapData.npcs || []).forEach(npc => {
        const screenX = (npc.x - currentCamera.x + viewportWidth / 2) * TILE_SIZE;
        const screenY = (npc.y - currentCamera.y + viewportHeight / 2) * TILE_SIZE;
        
        // Check if NPC is visible
        if (screenX >= -TILE_SIZE && screenX < canvas.width + TILE_SIZE &&
            screenY >= -TILE_SIZE && screenY < canvas.height + TILE_SIZE) {
          
          // NPC icon by type
          let icon = '👤';
          let iconColor = '#4a90e2';
          
          switch (npc.type) {
            case 'merchant':
              icon = '💰';
              iconColor = '#ffd700';
              break;
            case 'quest_giver':
              icon = '📜';
              iconColor = '#9b59b6';
              break;
            case 'guardian':
              icon = '🛡️';
              iconColor = '#3498db';
              break;
            case 'wanderer':
              icon = '🚶';
              iconColor = '#95a5a6';
              break;
            case 'scholar':
              icon = '📚';
              iconColor = '#e67e22';
              break;
          }
          
          // Only show discovered NPCs or NPCs near player
          const charTileX = Math.floor(currentChar.x);
          const charTileY = Math.floor(currentChar.y);
          const dist = Math.sqrt((npc.x - charTileX) ** 2 + (npc.y - charTileY) ** 2);
          
          if (npc.discovered || dist < 5) {
            // Draw NPC icon
            ctx.fillStyle = iconColor;
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
            
            // Draw name above NPC if discovered
            if (npc.discovered) {
              ctx.fillStyle = '#ffffff';
              ctx.font = '8px monospace';
              ctx.fillText(npc.name, screenX + TILE_SIZE / 2, screenY - 4);
            }
          }
        }
      });

      // Render monsters
      mapData.monsters.forEach(monster => {
        if (monster.defeated) return;
        
        const screenX = (monster.x - currentCamera.x + viewportWidth / 2) * TILE_SIZE;
        const screenY = (monster.y - currentCamera.y + viewportHeight / 2) * TILE_SIZE;
        
        // Check if monster is visible
        if (screenX >= -TILE_SIZE && screenX < canvas.width + TILE_SIZE &&
            screenY >= -TILE_SIZE && screenY < canvas.height + TILE_SIZE) {
          
          // Monster color by type
          let monsterColor = '#8b0000'; // Default dark red
          let icon = '👹';
          
          switch (monster.type) {
            case 'shadow':
              monsterColor = '#4a148c';
              icon = '👻';
              break;
            case 'beast':
              monsterColor = '#6d4c41';
              icon = '🐺';
              break;
            case 'undead':
              monsterColor = '#424242';
              icon = '💀';
              break;
            case 'elemental':
              monsterColor = '#ff6f00';
              icon = '🔥';
              break;
            case 'demon':
              monsterColor = '#b71c1c';
              icon = '😈';
              break;
          }
          
          // Draw monster
          ctx.fillStyle = monsterColor;
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icon, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          
          // Draw level indicator (small number above monster)
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px monospace';
          ctx.fillText(`Lv${monster.level}`, screenX + TILE_SIZE / 2, screenY - 2);
          
          // Draw HP bar if damaged
          if (monster.hp < monster.maxHp) {
            const barWidth = TILE_SIZE - 2;
            const barHeight = 2;
            const hpPercent = monster.hp / monster.maxHp;
            
            // Background (red)
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(screenX + 1, screenY + TILE_SIZE - 4, barWidth, barHeight);
            
            // HP (green)
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(screenX + 1, screenY + TILE_SIZE - 4, barWidth * hpPercent, barHeight);
          }
        }
      });

      // Render character
      const charScreenX = (currentChar.x - currentCamera.x + viewportWidth / 2) * TILE_SIZE;
      const charScreenY = (currentChar.y - currentCamera.y + viewportHeight / 2) * TILE_SIZE;

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(charScreenX + TILE_SIZE / 2 - 3, charScreenY + TILE_SIZE / 2 - 3, 6, 6);

      // Update animation time for water effects
      animationTimeRef.current = performance.now();

      // Continue render loop
      renderFrameId = requestAnimationFrame(render);
    };

    renderFrameId = requestAnimationFrame(render);

    return () => {
      if (renderFrameId) {
        cancelAnimationFrame(renderFrameId);
      }
    };
  }, [isOpen, location]);

  // Update canvas size when panel resizes
  useEffect(() => {
    if (canvasRef.current && mapDataRef.current) {
      canvasRef.current.width = panelSize.width - 32;
      canvasRef.current.height = panelSize.height - 100;
    }
  }, [panelSize, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {encounteredMonster && (
        <MonsterPanel
          monster={encounteredMonster}
          isOpen={true}
          onClose={() => {
            setEncounteredMonster(null);
            lastEncounteredMonsterRef.current = null;
            encounteredMonsterRef.current = null;
          }}
        />
      )}
      {encounteredNPC && (
        <NPCPanel
          npc={encounteredNPC}
          isOpen={true}
          onClose={() => {
            setEncounteredNPC(null);
            lastEncounteredNPCRef.current = null;
            encounteredNPCRef.current = null;
          }}
        />
      )}
      <Draggable 
        nodeRef={worldMapNodeRef}
        handle=".world-map-header"
        position={panelPosition}
        onDrag={(e, data) => {
          setPanelPosition({ x: data.x, y: data.y });
        }}
      >
        <div
          ref={worldMapNodeRef}
          style={{
            position: "fixed",
            zIndex: 50,
            left: 0,
            top: 0,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-secondary/95 backdrop-blur-sm border-2 border-primary/50 rounded-lg shadow-2xl relative"
            style={{
              width: `${panelSize.width}px`,
              height: `${panelSize.height}px`,
            }}
          >
            {/* Resize Handle - Top Left Corner */}
            <div
              className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize bg-primary/20 hover:bg-primary/40 border-r-2 border-b-2 border-primary/50 rounded-tl-lg flex items-center justify-center group z-10"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isResizingRef.current = true;
                resizeStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  width: panelSize.width,
                  height: panelSize.height,
                };
              }}
              title="Drag to resize"
            >
              <div className="w-3 h-3 flex flex-wrap gap-0.5 opacity-60 group-hover:opacity-100">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <div className="w-1 h-1 bg-primary rounded-full"></div>
              </div>
            </div>

            <div className="world-map-header flex items-center justify-between p-2 border-b border-primary/30 cursor-move pl-8">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary">World Map</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 relative" style={{ height: `${panelSize.height - 60}px` }}>
              <canvas
                ref={canvasRef}
                width={panelSize.width - 32}
                height={panelSize.height - 100}
                className="w-full border border-primary/30 rounded"
                style={{ imageRendering: 'pixelated' }}
              />
          
          {/* Debug Overlay */}
          <div className="absolute top-6 left-6 bg-black/80 border border-primary/50 rounded p-2 font-mono text-xs text-primary">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-accent">FPS:</span>
                <span className={debugInfo.fps >= 55 ? "text-green-400" : debugInfo.fps >= 30 ? "text-yellow-400" : "text-red-400"}>
                  {debugInfo.fps}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">ΔT:</span>
                <span>{debugInfo.deltaTime.toFixed(2)}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">Speed:</span>
                <span>{debugInfo.movementSpeed} tiles/s</span>
              </div>
              <div className="border-t border-primary/30 my-1"></div>
              <div className="flex items-center gap-2">
                <span className="text-accent">Char:</span>
                <span>({debugInfo.characterPos.x.toFixed(2)}, {debugInfo.characterPos.y.toFixed(2)})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">Tile:</span>
                <span>({debugInfo.tilePos.x}, {debugInfo.tilePos.y})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent">Camera:</span>
                <span>({debugInfo.cameraPos.x.toFixed(2)}, {debugInfo.cameraPos.y.toFixed(2)})</span>
              </div>
              <div className="border-t border-primary/30 my-1"></div>
              <div className="flex items-center gap-2">
                <span className="text-accent">Keys:</span>
                <span className={debugInfo.keys.length > 0 ? "text-green-400" : "text-muted-foreground"}>
                  {debugInfo.keys.length > 0 ? debugInfo.keys.join(', ') : 'none'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground font-mono">
            Use Arrow Keys or WASD to move • Current: {location}
          </div>
        </div>
          </motion.div>
        </div>
      </Draggable>
    </>
  );
}

