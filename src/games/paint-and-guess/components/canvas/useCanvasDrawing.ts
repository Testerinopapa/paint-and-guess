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
  sendDrawingEvent,
  isCanvasValid,
  isReceivingRef,
}: UseCanvasDrawingOptions) {
  // Update brush properties when tool or color changes
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || !fabricCanvas?.freeDrawingBrush) return;

    if (activeTool === "erase") {
      fabricCanvas.freeDrawingBrush.color = "#ffffff";
      fabricCanvas.freeDrawingBrush.width = brushSize * 2;
    } else {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas, isCanvasValid]);

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

    // Handle path completion (finalize)
    const handlePathCreated = (e: { path: FabricObject }) => {
      if (isReceivingRef.current) return; // Prevent echo
      if (!isCanvasValid(fabricCanvas)) return;

      const path = e.path;
      const pathData = path.toJSON();
      
      // Send final path
      sendDrawingEvent({
        type: "path-complete",
        pathId: currentPathId,
        data: pathData,
      });

      // Clean up
      isDrawing = false;
      currentPathId = null;
      pathPoints = [];
      lastSentPath = null;
    };

    // Send incremental updates during mouse move (only when drawing)
    const handleMouseMove = (options: any) => {
      if (!isDrawing || !fabricCanvas?.isDrawingMode) return;
      if (!options.e.buttons && !options.e.which) return; // Only when mouse button is down
      
      try {
        const pointer = fabricCanvas.getPointer(options.e);
        pathPoints.push([pointer.x, pointer.y]);

        // Send updates every 2 points (throttle to ~30-60fps depending on mouse speed)
        if (pathPoints.length >= 2 && pathPoints.length % 2 === 0) {
          const pathData = {
            path: [...pathPoints],
            stroke: fabricCanvas.freeDrawingBrush.color,
            strokeWidth: fabricCanvas.freeDrawingBrush.width,
          };

          // Only send if path has changed (check last few points to avoid duplicate sends)
          const recentPoints = pathPoints.slice(-5);
          const pathString = JSON.stringify(recentPoints);
          const lastPathString = lastSentPath ? JSON.stringify(lastSentPath.path.slice(-5)) : null;
          
          if (pathString !== lastPathString) {
            sendDrawingEvent({
              type: "path-update",
              pathId: currentPathId,
              data: pathData,
            });
            lastSentPath = pathData;
          }
        }
      } catch (error) {
        console.debug("[CanvasDrawing] Error getting path update:", error);
      }
    };

    // Handle drawing start
    const handleMouseDown = (options: any) => {
      if (!fabricCanvas?.isDrawingMode) return;
      if (isReceivingRef.current) return;

      isDrawing = true;
      pathPoints = [];
      currentPathId = `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Send path start event
      sendDrawingEvent({
        type: "path-start",
        pathId: currentPathId,
        color: fabricCanvas.freeDrawingBrush.color,
        width: fabricCanvas.freeDrawingBrush.width,
      });
    };

    // Reset path points on mouse up
    const handleMouseUp = () => {
      isDrawing = false;
      pathPoints = [];
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
  }, [fabricCanvas, isDrawer, isGameActive, sendDrawingEvent, isCanvasValid, isReceivingRef]);

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

