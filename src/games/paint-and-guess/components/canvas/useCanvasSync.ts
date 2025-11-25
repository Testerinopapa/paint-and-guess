import { useEffect } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";

interface UseCanvasSyncOptions {
  fabricCanvas: FabricCanvas | null;
  isDrawer: boolean;
  isGameActive: boolean;
  roundNumber: number;
  isCanvasValid: (canvas: FabricCanvas | null) => boolean;
  isReceivingRef: React.MutableRefObject<boolean>;
}

/**
 * Handles canvas synchronization: receiving drawing events, clearing, round transitions
 */
export function useCanvasSync({
  fabricCanvas,
  isDrawer,
  isGameActive,
  roundNumber,
  isCanvasValid,
  isReceivingRef,
}: UseCanvasSyncOptions) {
  // Ensure all objects are non-interactive for guessers
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || isDrawer) return;

    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      objects.forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
        obj.hoverCursor = 'default';
        obj.moveCursor = 'default';
      });
      fabricCanvas.selection = false;
      if (fabricCanvas.requestRenderAll) {
        fabricCanvas.requestRenderAll();
      } else {
        fabricCanvas.renderAll();
      }
    }
  }, [fabricCanvas, isDrawer, isCanvasValid]);

  // Clear canvas on round changes
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || !isGameActive) return;
    
    try {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";
      fabricCanvas.renderAll();
      console.debug("[CanvasSync] Canvas cleared for round", roundNumber);
    } catch (error) {
      console.error("[CanvasSync] Error clearing canvas:", error);
    }
  }, [fabricCanvas, roundNumber, isGameActive, isCanvasValid]);

  // Listen for canvas clear events (for both drawer and guessers)
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || !isGameActive) return;
    
    const handleCanvasClear = () => {
      if (!isCanvasValid(fabricCanvas)) return;
      console.debug("[CanvasSync] Canvas clear event received");
      try {
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = "#ffffff";
        fabricCanvas.requestRenderAll();
      } catch (error) {
        console.error("[CanvasSync] Error clearing canvas:", error);
      }
    };
    
    window.addEventListener("canvas-cleared", handleCanvasClear);
    
    return () => {
      window.removeEventListener("canvas-cleared", handleCanvasClear);
    };
  }, [fabricCanvas, isGameActive, isCanvasValid]);

  // Receive drawing events (guessers only)
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || isDrawer || !isGameActive) {
      return;
    }

    console.debug("[CanvasSync] Setting up guesser drawing event listeners");

    // Track active paths being drawn in real-time
    const activePaths = new Map<string, FabricObject>();

    const handleDrawingEvent = (e: Event) => {
      if (!isCanvasValid(fabricCanvas)) {
        return;
      }
      
      const customEvent = e as CustomEvent;
      const event = customEvent.detail;
      
      // Handle path start - create temporary path placeholder
      if (event.type === "path-start" && event.pathId) {
        try {
          // Just store the path ID, the actual path will be created on first update
          // This prevents creating an empty path that might cause rendering issues
          if (!activePaths.has(event.pathId)) {
            activePaths.set(event.pathId, null as any); // Placeholder
          }
        } catch (error) {
          console.error("[CanvasSync] Error creating path start:", error);
        }
        return;
      }

      // Handle path update - update existing path in real-time
      if (event.type === "path-update" && event.pathId && event.data) {
        try {
          let path = activePaths.get(event.pathId);
          const pathPoints = event.data.path;
          
          if (!pathPoints || pathPoints.length === 0) return;

          if (!path || path === null) {
            // Create path if it doesn't exist
            import("fabric").then(({ Path }) => {
              if (!isCanvasValid(fabricCanvas)) return;

              // Build path array for Fabric.js (starts with M, then L commands)
              const fabricPath: any[] = [['M', pathPoints[0][0], pathPoints[0][1]]];
              for (let i = 1; i < pathPoints.length; i++) {
                fabricPath.push(['L', pathPoints[i][0], pathPoints[i][1]]);
              }

              path = new Path(fabricPath, {
                stroke: event.data.stroke || "#000000",
                strokeWidth: event.data.strokeWidth || 5,
                fill: "",
                selectable: false,
                evented: false,
                objectCaching: false,
              });

              activePaths.set(event.pathId, path);
              fabricCanvas.add(path);
              fabricCanvas.requestRenderAll();
            });
          } else {
            // Update existing path with new points
            // Build path array for Fabric.js
            const fabricPath: any[] = [['M', pathPoints[0][0], pathPoints[0][1]]];
            for (let i = 1; i < pathPoints.length; i++) {
              fabricPath.push(['L', pathPoints[i][0], pathPoints[i][1]]);
            }

            (path as any).set({
              path: fabricPath,
              stroke: event.data.stroke,
              strokeWidth: event.data.strokeWidth,
            });

            fabricCanvas.requestRenderAll();
          }
        } catch (error) {
          console.error("[CanvasSync] Error updating path:", error);
        }
        return;
      }

      // Handle path complete - finalize path
      if (event.type === "path-complete" && event.pathId && event.data) {
        isReceivingRef.current = true;
        
        try {
          // Remove temporary path if it exists
          const tempPath = activePaths.get(event.pathId);
          if (tempPath) {
            try {
              fabricCanvas.remove(tempPath);
            } catch (e) {
              // Path might already be removed, ignore
            }
          }
          activePaths.delete(event.pathId);

          // Use enlivenObjects for final path (this is the complete, optimized path)
          import("fabric").then(({ util }) => {
            util.enlivenObjects([event.data]).then((objects: FabricObject[]) => {
              if (!isCanvasValid(fabricCanvas)) {
                isReceivingRef.current = false;
                return;
              }
              
              objects.forEach((obj) => {
                obj.selectable = false;
                obj.evented = false;
                obj.hoverCursor = 'default';
                obj.moveCursor = 'default';
                obj.objectCaching = false;
                fabricCanvas.add(obj);
              });
              
              fabricCanvas.requestRenderAll();
              isReceivingRef.current = false;
            }).catch((err: Error) => {
              console.error("[CanvasSync] Error enlivening objects:", err);
              isReceivingRef.current = false;
            });
          }).catch((err: Error) => {
            console.error("[CanvasSync] Error importing fabric util:", err);
            isReceivingRef.current = false;
          });
        } catch (error) {
          console.error("[CanvasSync] Error handling path complete:", error);
          isReceivingRef.current = false;
        }
        return;
      }

      // Legacy support: handle old "path" type events
      if (event.type === "path" && event.data && !isReceivingRef.current) {
        isReceivingRef.current = true;
        
        try {
          import("fabric").then(({ util }) => {
            util.enlivenObjects([event.data]).then((objects: FabricObject[]) => {
              if (!isCanvasValid(fabricCanvas)) {
                isReceivingRef.current = false;
                return;
              }
              
              objects.forEach((obj) => {
                obj.selectable = false;
                obj.evented = false;
                obj.hoverCursor = 'default';
                obj.moveCursor = 'default';
                obj.objectCaching = false;
                fabricCanvas.add(obj);
              });
              
              fabricCanvas.requestRenderAll();
              isReceivingRef.current = false;
            }).catch((err: Error) => {
              console.error("[CanvasSync] Error enlivening objects:", err);
              isReceivingRef.current = false;
            });
          }).catch((err: Error) => {
            console.error("[CanvasSync] Error importing fabric util:", err);
            isReceivingRef.current = false;
          });
        } catch (error) {
          console.error("[CanvasSync] Error handling drawing event:", error);
          isReceivingRef.current = false;
        }
      }
    };

    const handleCanvasCleared = () => {
      if (!isCanvasValid(fabricCanvas)) return;
      if (isReceivingRef.current) return;
      
      isReceivingRef.current = true;
      try {
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = "#ffffff";
        fabricCanvas.requestRenderAll();
      } catch (error) {
        console.error("[CanvasSync] Error clearing canvas from event:", error);
      }
      isReceivingRef.current = false;
    };
    
    const handleRoundEnded = () => {
      if (!isCanvasValid(fabricCanvas)) return;
      console.debug("[CanvasSync] Round ended, clearing canvas");
      try {
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = "#ffffff";
        fabricCanvas.requestRenderAll();
      } catch (error) {
        console.error("[CanvasSync] Error clearing canvas on round end:", error);
      }
    };
    
    const handleRoundStarted = () => {
      if (!isCanvasValid(fabricCanvas)) return;
      console.debug("[CanvasSync] Round started, clearing canvas");
      try {
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = "#ffffff";
        fabricCanvas.requestRenderAll();
      } catch (error) {
        console.error("[CanvasSync] Error clearing canvas on round start:", error);
      }
    };

    window.addEventListener("drawing-event", handleDrawingEvent);
    window.addEventListener("canvas-cleared", handleCanvasCleared);
    window.addEventListener("round-ended", handleRoundEnded);
    window.addEventListener("round-started", handleRoundStarted);

    return () => {
      window.removeEventListener("drawing-event", handleDrawingEvent);
      window.removeEventListener("canvas-cleared", handleCanvasCleared);
      window.removeEventListener("round-ended", handleRoundEnded);
      window.removeEventListener("round-started", handleRoundStarted);
    };
  }, [fabricCanvas, isDrawer, isGameActive, isCanvasValid, isReceivingRef]);
}

