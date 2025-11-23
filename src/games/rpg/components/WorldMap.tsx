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
  type MapData,
  type MapLocation,
  TILE_SIZE,
} from "../utils/mapGenerator";
import { useRpgStore } from "../state/useRpgStore";

interface WorldMapProps {
  isOpen: boolean;
  onClose: () => void;
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

export function WorldMap({ isOpen, onClose }: WorldMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapDataRef = useRef<MapData | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [character, setCharacter] = useState<Character>({ x: 0, y: 0, direction: 'down' });
  const location = useRpgStore((state) => state.location);
  const setLocation = useRpgStore((state) => state.setLocation);
  
  // Use refs for smooth animation without causing re-renders
  const characterRef = useRef<Character>({ x: 0, y: 0, direction: 'down' });
  const cameraRef = useRef<Camera>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const renderFrameRef = useRef<number | null>(null);
  // Use ref for keys to avoid state update delays
  const keysRef = useRef<Set<string>>(new Set());
  
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

  // Initialize map on mount
  useEffect(() => {
    if (!mapDataRef.current) {
      mapDataRef.current = generateWorldMap(100, 100);
      
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

            // Check for location discovery (only check when entering new tile)
            if (tileX !== lastLocationCheck.x || tileY !== lastLocationCheck.y) {
              lastLocationCheck = { x: tileX, y: tileY };
              const reachedLocation = getLocationAt(mapData, tileX, tileY);
              if (reachedLocation && !reachedLocation.discovered) {
                reachedLocation.discovered = true;
                setLocation(reachedLocation.name);
              }
            }
          }
        }
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

      // Render tiles
      for (let ty = startY; ty < endY; ty++) {
        for (let tx = startX; tx < endX; tx++) {
          const tile = mapData.tiles[ty][tx];
          const screenX = (tx - currentCamera.x + viewportWidth / 2) * TILE_SIZE;
          const screenY = (ty - currentCamera.y + viewportHeight / 2) * TILE_SIZE;

          ctx.fillStyle = getTileColor(tile);
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
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

      // Render character
      const charScreenX = (currentChar.x - currentCamera.x + viewportWidth / 2) * TILE_SIZE;
      const charScreenY = (currentChar.y - currentCamera.y + viewportHeight / 2) * TILE_SIZE;

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(charScreenX + TILE_SIZE / 2 - 3, charScreenY + TILE_SIZE / 2 - 3, 6, 6);

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

  if (!isOpen) return null;

  return (
    <Draggable handle=".world-map-header">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-50 bg-secondary/95 backdrop-blur-sm border-2 border-primary/50 rounded-lg shadow-2xl"
        style={{
          width: '640px',
          height: '480px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="world-map-header flex items-center justify-between p-2 border-b border-primary/30 cursor-move">
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

        <div className="p-4 relative">
          <canvas
            ref={canvasRef}
            width={640}
            height={400}
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
    </Draggable>
  );
}

