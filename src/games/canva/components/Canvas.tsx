import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricObject, PencilBrush, Path } from "fabric";
import * as fabric from "fabric";
import { useCanva } from "../state/CanvaContext";

// Batching constants (same as Paint & Guess)
const MIN_POINTS_PER_BATCH = 2;
const BATCH_INTERVAL_MS = 16; // ~60fps
const FAST_DRAW_THRESHOLD_MS = 8;
const FAST_DRAW_MIN_BATCH = 1;
const FLUSH_INTERVAL_MS = 8;

// Fixed canvas dimensions - must be consistent across all clients
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface CanvaCanvasProps {
  color?: string;
  brushSize?: number;
  onColorChange?: (color: string) => void;
  onBrushSizeChange?: (size: number) => void;
}

export function CanvaCanvas({ 
  color: externalColor, 
  brushSize: externalBrushSize,
  onColorChange,
  onBrushSizeChange,
}: CanvaCanvasProps = {} as CanvaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { socket, gameState, isDrawer } = useCanva();
  const [internalColor, setInternalColor] = useState("#000000");
  const [internalBrushSize, setInternalBrushSize] = useState(5);
  
  // Use external props if provided, otherwise use internal state
  const color = externalColor ?? internalColor;
  const brushSize = externalBrushSize ?? internalBrushSize;
  
  const setColor = (newColor: string) => {
    if (onColorChange) {
      onColorChange(newColor);
    } else {
      setInternalColor(newColor);
    }
  };
  
  const setBrushSize = (newSize: number) => {
    if (onBrushSizeChange) {
      onBrushSizeChange(newSize);
    } else {
      setInternalBrushSize(newSize);
    }
  };
  
  // Determine if drawing should be enabled
  // Allow drawing if: game not active (free draw mode) OR (game active AND is drawer AND round active)
  const canDraw = !gameState.isGameActive || (gameState.isGameActive && isDrawer && gameState.isRoundActive);
  
  // Drawing state tracking
  const isDrawingRef = useRef(false);
  const pathPointsRef = useRef<number[][]>([]);
  const currentPathIdRef = useRef<string | null>(null);
  const lastSentPointIndexRef = useRef(0);
  const lastSendTimeRef = useRef(0);
  const lastPointTimeRef = useRef(0);
  const flushIntervalRef = useRef<number | null>(null);
  const eventSequenceRef = useRef(0);
  
  // Receiving state tracking
  const activePathsRef = useRef<Map<string, Path>>(new Map());
  const accumulatedPathPointsRef = useRef<Map<string, number[][]>>(new Map());
  const pathPropertiesRef = useRef<Map<string, { opacity: number; hardness: number; strokeWidth: number }>>(new Map());
  const finalizedPathsRef = useRef<Set<string>>(new Set());

  // Calculate and apply scale to fit container
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const availableWidth = containerRect.width - 16; // Account for padding
      const availableHeight = containerRect.height - 16;

      const scaleX = availableWidth / CANVAS_WIDTH;
      const scaleY = availableHeight / CANVAS_HEIGHT;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

      if (scale < 1) {
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'center';
      } else {
        container.style.transform = '';
      }
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    window.addEventListener('resize', updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("[CanvaCanvas] Initializing canvas...");

    const canvasElement = canvasRef.current;
    
    // CRITICAL: Set explicit width/height on canvas element to prevent CSS scaling issues
    // This ensures the canvas's internal coordinate system matches its display size
    canvasElement.width = CANVAS_WIDTH;
    canvasElement.height = CANVAS_HEIGHT;
    canvasElement.style.width = `${CANVAS_WIDTH}px`;
    canvasElement.style.height = `${CANVAS_HEIGHT}px`;

    const canvas = new FabricCanvas(canvasElement, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "#ffffff",
    });
    
    // Ensure canvas maintains its dimensions and doesn't get scaled by Fabric
    canvas.setDimensions({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    
    // CRITICAL: Calculate canvas offset - without this, getPointer() returns wrong coordinates
    // This accounts for the canvas element's position on the page (offsetTop/offsetLeft)
    
    // Debug: Get canvas element position before calcOffset
    const rectBefore = canvasElement.getBoundingClientRect();
    console.log("[CanvaCanvas] Before calcOffset() - DOM element position:", {
      left: rectBefore.left,
      top: rectBefore.top,
      width: rectBefore.width,
      height: rectBefore.height,
      offsetLeft: canvasElement.offsetLeft,
      offsetTop: canvasElement.offsetTop,
    });
    
    canvas.calcOffset();
    
    // Debug: Get Fabric's calculated offset values
    const fabricOffset = (canvas as any)._offset;
    console.log("[CanvaCanvas] After calcOffset() - Fabric offset:", {
      left: fabricOffset?.left,
      top: fabricOffset?.top,
    });
    
    // Debug: Verify canvas dimensions
    console.log("[CanvaCanvas] Canvas dimensions:", {
      fabricWidth: canvas.getWidth(),
      fabricHeight: canvas.getHeight(),
      elementWidth: canvasElement.width,
      elementHeight: canvasElement.height,
      styleWidth: canvasElement.style.width,
      styleHeight: canvasElement.style.height,
    });
    
    // Disable any viewport transforms that might affect coordinates
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    fabricCanvasRef.current = canvas;

    // Recalculate offset on window resize and container size changes
    const recalcOffset = () => {
      if (!canvas) return;
      const rect = canvasElement.getBoundingClientRect();
      console.log("[CanvaCanvas] Recalculating offset. Element position:", {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
      canvas.calcOffset();
      const fabricOffset = (canvas as any)._offset;
      console.log("[CanvaCanvas] Fabric offset:", {
        left: fabricOffset?.left,
        top: fabricOffset?.top,
      });
    };

    const handleResize = () => {
      recalcOffset();
    };
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver to detect container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        // Small delay to ensure layout has settled
        setTimeout(recalcOffset, 0);
      });
      resizeObserver.observe(containerRef.current);
    }

    console.log("[CanvaCanvas] Canvas initialized successfully");

    return () => {
      console.log("[CanvaCanvas] Disposing canvas");
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      canvas.dispose();
    };
  }, []);

  // Update brush properties
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas?.freeDrawingBrush) return;

    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = color;
  }, [color, brushSize]);

  // Send drawing events: path-start, path-update, path-complete
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !socket) return;
    
    // Get current state for permission checks
    const checkCanDraw = () => {
      return !gameState.isGameActive || (gameState.isGameActive && gameState.currentDrawer?.id === gameState.selfId && gameState.isRoundActive);
    };

    const sendDrawingEvent = (event: { type: string; pathId?: string; sequence?: number; data?: any; color?: string; width?: number; opacity?: number; hardness?: number }) => {
      socket.emit("canva:drawing-event", {
        ...event,
        sequence: event.sequence ?? ++eventSequenceRef.current,
      });
    };

    // Track drawing state for sending events
    let localIsDrawing = false;
    let localPathPoints: number[][] = [];
    let localPathId: string | null = null;
    let localPath: Path | null = null; // Local path for rendering

    // Handle mouse down - start drawing and sending
    const handleMouseDown = (options: any) => {
      if (localIsDrawing) return;
      
      // Check if drawing is allowed - use function to get current state
      if (!checkCanDraw()) {
        return;
      }
      
      // Debug: Compare raw event coordinates with getPointer() result
      const rawEvent = options.e;
      const clientX = rawEvent.clientX || rawEvent.touches?.[0]?.clientX;
      const clientY = rawEvent.clientY || rawEvent.touches?.[0]?.clientY;
      const rect = canvas.getElement().getBoundingClientRect();
      const manualCalc = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
      
      const pointer = canvas.getPointer(options.e);
      
      console.log("[CanvaCanvas] MouseDown - Coordinate calculation:", {
        rawClientX: clientX,
        rawClientY: clientY,
        elementRect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        manualCalculation: manualCalc,
        fabricGetPointer: { x: pointer.x, y: pointer.y },
        difference: {
          x: pointer.x - manualCalc.x,
          y: pointer.y - manualCalc.y,
        },
        fabricOffset: (canvas as any)._offset,
      });
      
      // Clamp coordinates to canvas bounds to ensure consistency across clients
      const x = Math.max(0, Math.min(pointer.x, CANVAS_WIDTH));
      const y = Math.max(0, Math.min(pointer.y, CANVAS_HEIGHT));
      localIsDrawing = true;
      localPathPoints = [[x, y]];
      lastSentPointIndexRef.current = 0;
      lastSendTimeRef.current = Date.now();
      lastPointTimeRef.current = Date.now();
      localPathId = `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      currentPathIdRef.current = localPathId;

      // Create local path immediately for real-time rendering
      // CRITICAL: Set left/top to 0 so path coordinates are absolute canvas coordinates
      // Fabric.js will otherwise auto-calculate left/top from bounding box, causing offset issues
      const fabricPath: any[] = [['M', x, y]];
      localPath = new Path(fabricPath, {
        stroke: color,
        strokeWidth: brushSize,
        fill: '',
        selectable: false,
        evented: false,
        objectCaching: false,
        left: 0,
        top: 0,
        originX: 'left',
        originY: 'top',
      });
      canvas.add(localPath);
      canvas.renderAll();

      // Start periodic flush
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
      flushIntervalRef.current = window.setInterval(() => {
        if (!localIsDrawing || !localPathId) {
          if (flushIntervalRef.current) {
            clearInterval(flushIntervalRef.current);
            flushIntervalRef.current = null;
          }
          return;
        }

        // Flush pending points periodically
        if (localPathPoints.length > lastSentPointIndexRef.current) {
          const pendingPoints = localPathPoints.slice(lastSentPointIndexRef.current);
          if (pendingPoints.length > 0) {
            sendDrawingEvent({
              type: "path-update",
              pathId: localPathId,
              data: {
                newPoints: pendingPoints,
                startIndex: lastSentPointIndexRef.current,
                stroke: color,
                strokeWidth: brushSize,
                opacity: 1,
                hardness: 1,
              },
            });
            lastSentPointIndexRef.current = localPathPoints.length;
            lastSendTimeRef.current = Date.now();
          }
        }
      }, FLUSH_INTERVAL_MS);

      // Send path-start event
      sendDrawingEvent({
        type: "path-start",
        pathId: localPathId,
        color: color,
        width: brushSize,
        opacity: 1,
        hardness: 1,
      });
    };

    // Handle mouse move - capture points, update local path, and send updates
    const handleMouseMove = (options: any) => {
      if (!localIsDrawing || !localPathId || !localPath) return;

      try {
        const pointer = canvas.getPointer(options.e);
        
        // Debug: Log first few points to verify coordinate consistency
        if (localPathPoints.length < 3) {
          const rawEvent = options.e;
          const clientX = rawEvent.clientX || rawEvent.touches?.[0]?.clientX;
          const clientY = rawEvent.clientY || rawEvent.touches?.[0]?.clientY;
          const rect = canvas.getElement().getBoundingClientRect();
          console.log("[CanvaCanvas] MouseMove point", localPathPoints.length + 1, ":", {
            fabricGetPointer: { x: pointer.x, y: pointer.y },
            manualCalc: {
              x: clientX - rect.left,
              y: clientY - rect.top,
            },
          });
        }
        
        // Clamp coordinates to canvas bounds to ensure consistency
        const x = Math.max(0, Math.min(pointer.x, CANVAS_WIDTH));
        const y = Math.max(0, Math.min(pointer.y, CANVAS_HEIGHT));
        localPathPoints.push([x, y]);
        pathPointsRef.current = localPathPoints;

        // Update local path in real-time for immediate visual feedback
        // CRITICAL: Keep left/top at 0 to maintain absolute coordinates
        const fabricPath: any[] = [['M', localPathPoints[0][0], localPathPoints[0][1]]];
        for (let i = 1; i < localPathPoints.length; i++) {
          fabricPath.push(['L', localPathPoints[i][0], localPathPoints[i][1]]);
        }
        localPath.set({ 
          path: fabricPath,
          left: 0,
          top: 0,
          originX: 'left',
          originY: 'top',
        });
        canvas.renderAll();

        const now = Date.now();
        const timeSinceLastSend = now - lastSendTimeRef.current;
        const timeSinceLastPoint = lastPointTimeRef.current > 0 ? now - lastPointTimeRef.current : Infinity;
        const newPointsCount = localPathPoints.length - lastSentPointIndexRef.current;

        // Detect fast drawing
        const isFastDrawing = timeSinceLastPoint < FAST_DRAW_THRESHOLD_MS;
        const minBatchSize = isFastDrawing ? FAST_DRAW_MIN_BATCH : MIN_POINTS_PER_BATCH;

        const shouldSend = newPointsCount >= minBatchSize ||
                          (timeSinceLastSend >= BATCH_INTERVAL_MS && newPointsCount > 0) ||
                          (isFastDrawing && newPointsCount >= 1);

        lastPointTimeRef.current = now;

        if (shouldSend && localPathPoints.length > lastSentPointIndexRef.current) {
          const newPoints = localPathPoints.slice(lastSentPointIndexRef.current);

          sendDrawingEvent({
            type: "path-update",
            pathId: localPathId,
            data: {
              newPoints: newPoints,
              startIndex: lastSentPointIndexRef.current,
              stroke: color,
              strokeWidth: brushSize,
              opacity: 1,
              hardness: 1,
            },
          });

          lastSentPointIndexRef.current = localPathPoints.length;
          lastSendTimeRef.current = now;
        }
      } catch (error) {
        console.debug("[CanvaCanvas] Error in mouse move:", error);
      }
    };

    // Handle mouse up - flush remaining points and send complete
    const handleMouseUp = () => {
      if (!localIsDrawing || !localPathId) return;

      // Flush any remaining points immediately
      if (localPathPoints.length > lastSentPointIndexRef.current) {
        const remainingPoints = localPathPoints.slice(lastSentPointIndexRef.current);
        if (remainingPoints.length > 0) {
          sendDrawingEvent({
            type: "path-update",
            pathId: localPathId,
            data: {
              newPoints: remainingPoints,
              startIndex: lastSentPointIndexRef.current,
              stroke: color,
              strokeWidth: brushSize,
              opacity: 1,
              hardness: 1,
            },
          });
        }
      }

      // Send path-complete with final path data
      // CRITICAL: Don't use toJSON() - it serializes coordinates relative to path position
      // Instead, manually construct path data from absolute coordinates we already have
      if (localPathPoints.length > 0 && localPath) {
        // Build Fabric path string from absolute coordinates
        const fabricPath: any[] = [['M', localPathPoints[0][0], localPathPoints[0][1]]];
        for (let i = 1; i < localPathPoints.length; i++) {
          fabricPath.push(['L', localPathPoints[i][0], localPathPoints[i][1]]);
        }
        
        // Manually construct the path data object with absolute coordinates
        const pathData = {
          type: 'path',
          version: '5.3.0',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          fill: '',
          stroke: color,
          strokeWidth: brushSize,
          strokeDashArray: null,
          strokeLineCap: 'round',
          strokeDashOffset: 0,
          strokeLineJoin: 'round',
          strokeMiterLimit: 4,
          scaleX: 1,
          scaleY: 1,
          angle: 0,
          flipX: false,
          flipY: false,
          opacity: 1,
          visible: true,
          backgroundColor: '',
          fillRule: 'nonzero',
          paintFirst: 'fill',
          globalCompositeOperation: 'source-over',
          skewX: 0,
          skewY: 0,
          rx: 0,
          ry: 0,
          path: fabricPath,
          originX: 'left',
          originY: 'top',
        };
        
        console.log("[CanvaCanvas] Sending path-complete:", {
          pathId: localPathId,
          totalPoints: localPathPoints.length,
          firstPoint: localPathPoints[0],
          lastPoint: localPathPoints[localPathPoints.length - 1],
          pathDataFirstCommands: fabricPath.slice(0, 3),
          pathDataLeft: pathData.left,
          pathDataTop: pathData.top,
        });
        
        sendDrawingEvent({
          type: "path-complete",
          pathId: localPathId,
          data: pathData,
        });
      }

      // Clean up
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      localIsDrawing = false;
      localPathId = null;
      localPath = null;
      currentPathIdRef.current = null;
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
    };
  }, [socket, color, brushSize, gameState.isGameActive, gameState.isRoundActive, gameState.currentDrawer, gameState.selfId]);

  // Listen for drawing events from DOM (bridged from CanvaContext)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleDrawingEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const event = customEvent.detail as { type: string; pathId?: string; data?: any; color?: string; width?: number; opacity?: number; hardness?: number };

      if (!event || !event.type) return;

      // Handle path-start - create placeholder
      if (event.type === "path-start" && event.pathId) {
        accumulatedPathPointsRef.current.set(event.pathId, []);
        pathPropertiesRef.current.set(event.pathId, {
          opacity: event.opacity ?? 1,
          hardness: event.hardness ?? 1,
          strokeWidth: event.width ?? 5,
        });
        finalizedPathsRef.current.delete(event.pathId);
        return;
      }

      // Handle path-update - update path in real-time
      if (event.type === "path-update" && event.pathId && event.data) {
        // Ignore if already finalized
        if (finalizedPathsRef.current.has(event.pathId)) return;

        try {
          let path = activePathsRef.current.get(event.pathId);
          let newPoints: number[][] = [];
          let allPathPoints: number[][] = [];

          if (event.data.newPoints) {
            // Differential format: append new points
            const accumulated = accumulatedPathPointsRef.current.get(event.pathId) || [];
            newPoints = event.data.newPoints;
            allPathPoints = [...accumulated, ...newPoints];
            accumulatedPathPointsRef.current.set(event.pathId, allPathPoints);
          } else if (event.data.path) {
            // Legacy format: full path
            allPathPoints = event.data.path;
            accumulatedPathPointsRef.current.set(event.pathId, allPathPoints);
          } else {
            return;
          }

          if (!allPathPoints || allPathPoints.length === 0) return;

          const props = pathPropertiesRef.current.get(event.pathId) || { opacity: 1, hardness: 1, strokeWidth: 5 };
          const currentProps = {
            opacity: event.data.opacity ?? props.opacity,
            hardness: event.data.hardness ?? props.hardness,
            strokeWidth: event.data.strokeWidth ?? props.strokeWidth,
          };
          pathPropertiesRef.current.set(event.pathId, currentProps);

          if (!path) {
            // Create new path
            const fabricPath: any[] = [['M', allPathPoints[0][0], allPathPoints[0][1]]];
            for (let i = 1; i < allPathPoints.length; i++) {
              fabricPath.push(['L', allPathPoints[i][0], allPathPoints[i][1]]);
            }

            // Debug: Log received path coordinates
            console.log("[CanvaCanvas] Creating remote path from path-update:", {
              pathId: event.pathId,
              firstPoint: allPathPoints[0],
              lastPoint: allPathPoints[allPathPoints.length - 1],
              totalPoints: allPathPoints.length,
              fabricPathCommands: fabricPath.slice(0, 3), // First 3 commands
            });

            const shadowBlur = currentProps.hardness < 1 ? (1 - currentProps.hardness) * currentProps.strokeWidth * 2 : 0;

            path = new Path(fabricPath, {
              stroke: event.data.stroke || "#000000",
              strokeWidth: currentProps.strokeWidth,
              opacity: currentProps.opacity,
              fill: "",
              selectable: false,
              evented: false,
              objectCaching: false,
              shadow: shadowBlur > 0 ? {
                blur: shadowBlur,
                offsetX: 0,
                offsetY: 0,
                color: event.data.stroke || "#000000",
              } : null,
            });

            activePathsRef.current.set(event.pathId, path);
            canvas.add(path);
            canvas.renderAll();
          } else {
            // Update existing path
            const fabricPath: any[] = [['M', allPathPoints[0][0], allPathPoints[0][1]]];
            for (let i = 1; i < allPathPoints.length; i++) {
              fabricPath.push(['L', allPathPoints[i][0], allPathPoints[i][1]]);
            }

            const shadowBlur = currentProps.hardness < 1 ? (1 - currentProps.hardness) * currentProps.strokeWidth * 2 : 0;

            (path as any).set({
              path: fabricPath,
              stroke: event.data.stroke,
              strokeWidth: currentProps.strokeWidth,
              opacity: currentProps.opacity,
              shadow: shadowBlur > 0 ? {
                blur: shadowBlur,
                offsetX: 0,
                offsetY: 0,
                color: event.data.stroke || "#000000",
              } : null,
            });

            canvas.renderAll();
          }
        } catch (error) {
          console.error("[CanvaCanvas] Error updating path:", error);
        }
        return;
      }

      // Handle path-complete - finalize path
      if (event.type === "path-complete" && event.data) {
        const pathId = event.pathId;
        if (!pathId) return;

        // Mark as finalized
        finalizedPathsRef.current.add(pathId);

        // Remove from active paths
        const activePath = activePathsRef.current.get(pathId);
        if (activePath) {
          canvas.remove(activePath);
          activePathsRef.current.delete(pathId);
        }

        // Use path-complete data to create final path
        // CRITICAL: Don't use enlivenObjects() - it recalculates bounding box incorrectly
        // Instead, create Path directly from path data, same as path-update
        console.log("[CanvaCanvas] path-complete received:", {
          pathId: event.pathId,
          dataKeys: Object.keys(event.data || {}),
          dataLeft: (event.data as any)?.left,
          dataTop: (event.data as any)?.top,
          dataPath: (event.data as any)?.path?.slice(0, 3), // First 3 path commands
        });
        
        try {
          const pathData = event.data as any;
          if (!pathData.path || !Array.isArray(pathData.path)) {
            console.error("[CanvaCanvas] path-complete: Invalid path data", pathData);
            return;
          }

          // Extract path commands directly - these are already absolute coordinates
          const fabricPath = pathData.path;
          
          // Extract first coordinate to verify what we're receiving
          const firstMove = fabricPath.find((cmd: any) => cmd[0] === 'M');
          const firstLine = fabricPath.find((cmd: any) => cmd[0] === 'L');
          
          console.log("[CanvaCanvas] Creating final path from path-complete:", {
            pathId: event.pathId,
            firstMoveCommand: firstMove,
            firstLineCommand: firstLine,
            totalCommands: fabricPath.length,
            pathDataLeft: pathData.left,
            pathDataTop: pathData.top,
          });

          // Create Path exactly like path-update does - let Fabric calculate left/top automatically
          // The path coordinates are absolute, so Fabric will set left/top to the minimum coordinates
          const finalPath = new Path(fabricPath, {
            stroke: pathData.stroke || "#000000",
            strokeWidth: pathData.strokeWidth || 5,
            opacity: pathData.opacity ?? 1,
            fill: pathData.fill || "",
            selectable: false,
            evented: false,
            objectCaching: false,
          });

          // Debug: Check what Fabric calculated
          const bbox = finalPath.getBoundingRect();
          console.log("[CanvaCanvas] Path after creation (Fabric auto-calculated):", {
            pathId: event.pathId,
            pathLeft: (finalPath as any).left,
            pathTop: (finalPath as any).top,
            bboxLeft: bbox.left,
            bboxTop: bbox.top,
            firstMoveCommand: firstMove,
            expectedLeft: firstMove ? firstMove[1] : 'N/A',
            expectedTop: firstMove ? firstMove[2] : 'N/A',
          });

          canvas.add(finalPath);
          canvas.renderAll();
        } catch (err: any) {
          console.error("[CanvaCanvas] Error creating path from path-complete:", err);
        }

        // Clean up tracking
        accumulatedPathPointsRef.current.delete(pathId);
        pathPropertiesRef.current.delete(pathId);
      }
    };

    window.addEventListener("canva:drawing-event", handleDrawingEvent);

    // Handle canvas clear event
    const handleCanvasClear = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      console.log("[CanvaCanvas] Clearing canvas");
      
      // Remove all objects from canvas
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
      
      // Clear all tracking maps
      activePathsRef.current.clear();
      accumulatedPathPointsRef.current.clear();
      pathPropertiesRef.current.clear();
      finalizedPathsRef.current.clear();
      
      // Reset drawing state
      isDrawingRef.current = false;
      pathPointsRef.current = [];
      currentPathIdRef.current = null;
      lastSentPointIndexRef.current = 0;
      lastSendTimeRef.current = 0;
      lastPointTimeRef.current = 0;
      
      console.log("[CanvaCanvas] Canvas cleared");
    };

    window.addEventListener("canva:canvas-clear", handleCanvasClear);

    return () => {
      window.removeEventListener("canva:drawing-event", handleDrawingEvent);
      window.removeEventListener("canva:canvas-clear", handleCanvasClear);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-8 rounded border"
            disabled={!canDraw}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
            disabled={!canDraw}
          />
          <span className="text-sm w-8">{brushSize}</span>
        </div>
        {gameState.isGameActive && !canDraw && (
          <div className="text-sm text-muted-foreground">
            {isDrawer ? "Wait for round to start" : "Only the drawer can draw"}
          </div>
        )}
      </div>
      <div 
        ref={containerRef}
        className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white relative"
        style={{ 
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ 
            display: 'block',
            cursor: canDraw ? 'crosshair' : 'not-allowed',
          }} 
        />
        {!canDraw && gameState.isGameActive && (
          <div className="absolute inset-0 pointer-events-auto" />
        )}
      </div>
    </div>
  );
}
