import { useEffect } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { toast } from "sonner";

interface UseCanvasDrawingOptions {
  fabricCanvas: FabricCanvas | null;
  isDrawer: boolean;
  isGameActive: boolean;
  activeTool: "draw" | "erase";
  activeColor: string;
  brushSize: number;
  brushOpacity: number;
  brushHardness: number;
  sendDrawingEvent: (event: { type: string; data: any }) => void;
  isCanvasValid: (canvas: FabricCanvas | null) => boolean;
  isReceivingRef: React.MutableRefObject<boolean>;
}

/**
 * Handles drawing functionality: brush properties, sending drawing events
 */
export function useCanvasDrawing({
  fabricCanvas,
  isDrawer,
  isGameActive,
  activeTool,
  activeColor,
  brushSize,
  brushOpacity,
  brushHardness,
  sendDrawingEvent,
  isCanvasValid,
  isReceivingRef,
}: UseCanvasDrawingOptions) {
  // Update brush properties when tool, color, opacity, or hardness changes
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || !fabricCanvas?.freeDrawingBrush) return;

    if (activeTool === "erase") {
      fabricCanvas.freeDrawingBrush.color = "#ffffff";
      fabricCanvas.freeDrawingBrush.width = brushSize * 2;
      // Reset shadow for eraser
      (fabricCanvas.freeDrawingBrush as any).shadow = null;
    } else {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
      
      // Apply hardness using shadowBlur (0 = hard edge, higher = softer)
      const shadowBlur = brushHardness < 1 ? (1 - brushHardness) * brushSize * 2 : 0;
      (fabricCanvas.freeDrawingBrush as any).shadow = shadowBlur > 0 ? {
        blur: shadowBlur,
        offsetX: 0,
        offsetY: 0,
        color: activeColor,
      } : null;
    }
  }, [activeTool, activeColor, brushSize, brushOpacity, brushHardness, fabricCanvas, isCanvasValid]);

  // Update drawing mode when role or game state changes
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas)) return;
    
    fabricCanvas.isDrawingMode = isGameActive && isDrawer;
    
    // Disable all interactions for guessers
    if (!isDrawer) {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = 'default';
      fabricCanvas.hoverCursor = 'default';
      fabricCanvas.moveCursor = 'default';
      fabricCanvas.skipTargetFind = true;
    } else {
      // Enable interactions for drawer
      fabricCanvas.selection = true;
      fabricCanvas.skipTargetFind = false;
    }
  }, [fabricCanvas, isDrawer, isGameActive, isCanvasValid]);

  // Send drawing events (drawer only) - Real-time streaming
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || !isDrawer || !isGameActive) return;

    let isDrawing = false;
    let currentPathId: string | null = null;
    let lastSentPath: any = null;
    let pathPoints: number[][] = [];
    let lastSentPointIndex = 0; // Track how many points we've sent
    let lastSendTime = 0; // Track when we last sent an update
    const BATCH_INTERVAL_MS = 16; // ~60fps - send at most every frame
    const MIN_POINTS_PER_BATCH = 2; // Batch at least 2 points together (reduced for lower latency)
    
    // Debug: Track sent events (check dynamically)
    const isDebugEnabled = () => {
      return process.env.NODE_ENV === 'development' && 
        (typeof window !== 'undefined' && (window as any).__DEBUG_CANVAS_SYNC__ !== false);
    };
    
    let drawerEventSequence = 0;
    const drawerPathDebug: {
      pathId: string;
      startTime: number;
      updateCount: number;
      lastUpdatePointCount: number;
      completeTime?: number;
      completePointCount?: number;
    }[] = [];

    // Handle path completion (finalize)
    const handlePathCreated = (e: { path: FabricObject }) => {
      if (isReceivingRef.current) return; // Prevent echo
      if (!isCanvasValid(fabricCanvas)) return;

      const path = e.path;
      
      // Apply opacity and hardness to the path object
      if (activeTool !== "erase") {
        path.set({
          opacity: brushOpacity,
        });
        
        // Apply hardness using shadowBlur
        const shadowBlur = brushHardness < 1 ? (1 - brushHardness) * brushSize * 2 : 0;
        if (shadowBlur > 0) {
          path.set({
            shadow: {
              blur: shadowBlur,
              offsetX: 0,
              offsetY: 0,
              color: activeColor,
            },
          });
        } else {
          path.set({ shadow: null });
        }
      }
      
      const pathData = path.toJSON();
      
      // Debug: Extract point count and log
      let completePointCount = 0;
      if (isDebugEnabled() && currentPathId) {
        try {
          if (pathData.path && Array.isArray(pathData.path)) {
            completePointCount = pathData.path.filter((cmd: any) => 
              Array.isArray(cmd) && cmd[0] !== 'M'
            ).length + 1;
          }
          
          const debugEntry = drawerPathDebug.find(d => d.pathId === currentPathId);
          if (debugEntry) {
            debugEntry.completeTime = Date.now();
            debugEntry.completePointCount = completePointCount;
            
            const timeDiff = debugEntry.completeTime - debugEntry.startTime;
            console.log(`[CanvasDrawing Debug] SENT path-complete for ${currentPathId}:`, {
              totalUpdates: debugEntry.updateCount,
              lastUpdatePoints: debugEntry.lastUpdatePointCount,
              completePoints: completePointCount,
              timeToComplete: `${timeDiff}ms`,
              totalPathPoints: pathPoints.length,
            });
          }
        } catch (e) {
          console.warn('[CanvasDrawing Debug] Error extracting point count:', e);
        }
      }
      
      // Send final path
      sendDrawingEvent({
        type: "path-complete",
        pathId: currentPathId,
        sequence: ++drawerEventSequence,
        data: pathData,
      });

      // Send any remaining points that haven't been sent yet
      if (pathPoints.length > lastSentPointIndex) {
        const remainingPoints = pathPoints.slice(lastSentPointIndex);
        sendDrawingEvent({
          type: "path-update",
          pathId: currentPathId,
          sequence: ++drawerEventSequence,
          data: {
            newPoints: remainingPoints,
            startIndex: lastSentPointIndex,
            stroke: fabricCanvas.freeDrawingBrush.color,
            strokeWidth: fabricCanvas.freeDrawingBrush.width,
            opacity: activeTool === "erase" ? 1 : brushOpacity,
            hardness: activeTool === "erase" ? 1 : brushHardness,
          },
        });
      }

      // Clean up
      isDrawing = false;
      currentPathId = null;
      pathPoints = [];
      lastSentPath = null;
      lastSentPointIndex = 0;
      lastSendTime = 0;
    };

    // Send incremental updates during mouse move (only when drawing)
    // Note: We track drawing state via mouse:down/mouse:up, not button state,
    // because button state can become unreliable during long continuous strokes
    const handleMouseMove = (options: any) => {
      // Only check isDrawing flag - don't check isDrawingMode as it might be
      // temporarily disabled during certain operations, but we're still drawing
      if (!isDrawing || !fabricCanvas) return;
      // Don't check options.e.buttons - it can become unreliable during long strokes
      // Don't check isDrawingMode - it might be temporarily disabled but drawing continues
      // Instead, rely on the isDrawing flag set by mouse:down/mouse:up
      
      try {
        const pointer = fabricCanvas.getPointer(options.e);
        pathPoints.push([pointer.x, pointer.y]);

        const now = Date.now();
        const timeSinceLastSend = now - lastSendTime;
        const newPointsCount = pathPoints.length - lastSentPointIndex;
        
        // Batch points: send when we have enough new points OR enough time has passed
        // This reduces network overhead while maintaining smooth updates
        const shouldSend = newPointsCount >= MIN_POINTS_PER_BATCH || 
                          (timeSinceLastSend >= BATCH_INTERVAL_MS && newPointsCount > 0);
        
        if (shouldSend && pathPoints.length > lastSentPointIndex) {
          // Send only NEW points (differential update) - much smaller payload
          const newPoints = pathPoints.slice(lastSentPointIndex);
          
          const pathData = {
            newPoints: newPoints, // Only new points since last update
            startIndex: lastSentPointIndex, // Where these points start in the full path
            stroke: fabricCanvas.freeDrawingBrush.color,
            strokeWidth: fabricCanvas.freeDrawingBrush.width,
            opacity: activeTool === "erase" ? 1 : brushOpacity,
            hardness: activeTool === "erase" ? 1 : brushHardness,
          };

          // Debug: Track sent updates
          if (isDebugEnabled() && currentPathId) {
            let debugEntry = drawerPathDebug.find(d => d.pathId === currentPathId);
            if (!debugEntry) {
              debugEntry = {
                pathId: currentPathId,
                startTime: Date.now(),
                updateCount: 0,
                lastUpdatePointCount: 0,
              };
              drawerPathDebug.push(debugEntry);
            }
            debugEntry.updateCount++;
            debugEntry.lastUpdatePointCount = pathPoints.length;
            
            console.log(`[CanvasDrawing Debug] SENT path-update #${++drawerEventSequence} for ${currentPathId}:`, {
              totalPoints: pathPoints.length,
              newPoints: newPoints.length,
              startIndex: lastSentPointIndex,
              sequence: drawerEventSequence,
            });
          }

          // Send batched update
          sendDrawingEvent({
            type: "path-update",
            pathId: currentPathId,
            sequence: ++drawerEventSequence,
            data: pathData,
          });
          
          lastSentPointIndex = pathPoints.length;
          lastSendTime = now;
          lastSentPath = pathData;
        }
      } catch (error) {
        console.debug("[CanvasDrawing] Error getting path update:", error);
      }
    };

    // Handle drawing start
    const handleMouseDown = (options: any) => {
      if (!fabricCanvas?.isDrawingMode) return;
      if (isReceivingRef.current) return;

      // Ensure we're not already drawing (safety check)
      if (isDrawing) {
        // If we're already drawing, finalize the previous path first
        isDrawing = false;
        pathPoints = [];
        lastSentPointIndex = 0;
        lastSendTime = 0;
      }

      isDrawing = true;
      pathPoints = [];
      lastSentPointIndex = 0;
      lastSendTime = Date.now();
      currentPathId = `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Send path start event
      sendDrawingEvent({
        type: "path-start",
        pathId: currentPathId,
        sequence: ++drawerEventSequence,
        color: fabricCanvas.freeDrawingBrush.color,
        width: fabricCanvas.freeDrawingBrush.width,
        opacity: activeTool === "erase" ? 1 : brushOpacity,
        hardness: activeTool === "erase" ? 1 : brushHardness,
      });

      // Note: We rely on mouse:move events for tracking.
      // If mouse:move stops firing, Fabric.js will still create the path
      // and path:created will fire when the mouse is released, sending the complete path.
    };

    // Reset path points on mouse up
    const handleMouseUp = () => {
      // Only reset if we were actually drawing
      if (isDrawing) {
        isDrawing = false;
        pathPoints = [];
      }
    };

    fabricCanvas.on("path:created", handlePathCreated);
    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    return () => {
      if (isCanvasValid(fabricCanvas)) {
        fabricCanvas.off("path:created", handlePathCreated);
        fabricCanvas.off("mouse:down", handleMouseDown);
        fabricCanvas.off("mouse:move", handleMouseMove);
        fabricCanvas.off("mouse:up", handleMouseUp);
      }
    };
  }, [fabricCanvas, isDrawer, isGameActive, sendDrawingEvent, isCanvasValid, isReceivingRef, activeTool, brushOpacity, brushHardness]);

  // Undo handler
  const handleUndo = () => {
    if (!isCanvasValid(fabricCanvas) || !isDrawer) return;
    try {
      const objects = fabricCanvas.getObjects();
      if (objects.length > 0) {
        fabricCanvas.remove(objects[objects.length - 1]);
        fabricCanvas.renderAll();
        toast.info("Undo");
      }
    } catch (error) {
      console.error("[CanvasDrawing] Error undoing:", error);
    }
  };

  // Clear handler
  const handleClear = (clearCanvas: () => void) => {
    if (!isCanvasValid(fabricCanvas) || !isDrawer) return;
    try {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";
      fabricCanvas.renderAll();
      clearCanvas();
      toast.success("Canvas cleared!");
    } catch (error) {
      console.error("[CanvasDrawing] Error clearing canvas:", error);
    }
  };

  return {
    handleUndo,
    handleClear,
  };
}

