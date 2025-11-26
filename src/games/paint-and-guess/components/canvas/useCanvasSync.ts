import { useEffect } from "react";
import { Canvas as FabricCanvas, FabricObject, Path } from "fabric";
import * as fabric from "fabric";

interface UseCanvasSyncOptions {
  fabricCanvas: FabricCanvas | null;
  isDrawer: boolean;
  isGameActive: boolean;
  roundNumber: number;
  isCanvasValid: (canvas: FabricCanvas | null) => boolean;
  isReceivingRef: React.MutableRefObject<boolean>;
}

// Debugging: Enable/disable canvas sync debugging
// Enable by running in console: window.__DEBUG_CANVAS_SYNC__ = true
const isDebugEnabled = () => {
  return process.env.NODE_ENV === 'development' && 
    (typeof window !== 'undefined' && (window as any).__DEBUG_CANVAS_SYNC__ !== false);
};

// Expose debug utilities to window for easy access (created dynamically)
if (typeof window !== 'undefined') {
  // Create the debug object immediately, but it will check the flag dynamically
  (window as any).__canvasSyncDebug = {
    getPathDebugInfo: (pathId?: string) => {
      if (!isDebugEnabled()) return [];
      if (pathId) {
        return pathDebugMap.get(pathId);
      }
      return Array.from(pathDebugMap.entries()).map(([id, info]) => ({ pathId: id, ...info }));
    },
    clearDebugInfo: () => {
      if (!isDebugEnabled()) return;
      pathDebugMap.clear();
      eventSequenceCounter = 0;
    },
    compareCanvases: (fabricCanvas: FabricCanvas | null) => {
      if (!isDebugEnabled() || !fabricCanvas) return null;
      const objects = fabricCanvas.getObjects();
      const paths = objects.filter(obj => obj.type === 'path');
      return {
        totalObjects: objects.length,
        pathObjects: paths.length,
        paths: paths.map((obj: any) => ({
          pathLength: obj.path ? (Array.isArray(obj.path) ? obj.path.length : 'unknown') : 0,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
        })),
      };
    },
    isEnabled: () => isDebugEnabled(),
  };
}

interface PathDebugInfo {
  pathId: string;
  startTime: number;
  updateCount: number;
  lastUpdatePointCount: number;
  completeTime?: number;
  completePointCount?: number;
  finalized: boolean;
  ignoredUpdates: number;
  events: Array<{
    type: string;
    timestamp: number;
    pointCount: number;
    sequence: number;
  }>;
}

// Global debug state (for guesser side)
let pathDebugMap = new Map<string, PathDebugInfo>();
let eventSequenceCounter = 0;

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
    // Track paths that have been finalized (to ignore late path-update events)
    const finalizedPaths = new Set<string>();
    // Track brush properties (opacity, hardness) for each path
    const pathProperties = new Map<string, { opacity: number; hardness: number; strokeWidth: number }>();
    
    // Debug: Track path debugging info
    if (isDebugEnabled()) {
      pathDebugMap.clear();
      eventSequenceCounter = 0;
    }
    
    // Batch rendering updates using requestAnimationFrame for smoother performance
    let renderScheduled = false;
    const scheduleRender = () => {
      if (!renderScheduled && isCanvasValid(fabricCanvas)) {
        renderScheduled = true;
        requestAnimationFrame(() => {
          if (isCanvasValid(fabricCanvas)) {
            if (fabricCanvas.requestRenderAll) {
              fabricCanvas.requestRenderAll();
            } else {
              fabricCanvas.renderAll();
            }
          }
          renderScheduled = false;
        });
      }
    };

    // Debug: Log canvas state snapshot
    const logCanvasState = (label: string, pathId?: string) => {
      if (!isDebugEnabled() || !isCanvasValid(fabricCanvas)) return;
      
      const objects = fabricCanvas.getObjects();
      const pathObjects = objects.filter(obj => obj.type === 'path');
      
      const state = {
        timestamp: Date.now(),
        label,
        pathId,
        totalObjects: objects.length,
        pathObjects: pathObjects.length,
        pathDetails: pathObjects.map((obj: any) => ({
          type: obj.type,
          pathLength: obj.path ? (Array.isArray(obj.path) ? obj.path.length : 'unknown') : 0,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
        })),
      };
      
      console.log(`[CanvasSync Debug] ${label}:`, state);
      
      // Also log path debug info if available
      if (pathId && pathDebugMap.has(pathId)) {
        console.log(`[CanvasSync Debug] Path ${pathId} info:`, pathDebugMap.get(pathId));
      }
    };

    const handleDrawingEvent = (e: Event) => {
      if (!isCanvasValid(fabricCanvas)) {
        return;
      }
      
      const customEvent = e as CustomEvent;
      const event = customEvent.detail;
      const eventTimestamp = Date.now();
      const sequence = ++eventSequenceCounter;
      
      // Debug: Track all events
      if (isDebugEnabled() && event.pathId) {
        const pointCount = event.data?.path ? (Array.isArray(event.data.path) ? event.data.path.length : 0) : 0;
        
        if (!pathDebugMap.has(event.pathId)) {
          pathDebugMap.set(event.pathId, {
            pathId: event.pathId,
            startTime: eventTimestamp,
            updateCount: 0,
            lastUpdatePointCount: 0,
            finalized: false,
            ignoredUpdates: 0,
            events: [],
          });
        }
        
        const debugInfo = pathDebugMap.get(event.pathId)!;
        debugInfo.events.push({
          type: event.type,
          timestamp: eventTimestamp,
          pointCount,
          sequence,
        });
        
        console.log(`[CanvasSync Debug] Event #${sequence} - ${event.type} for path ${event.pathId}:`, {
          pointCount,
          timestamp: eventTimestamp,
          finalized: finalizedPaths.has(event.pathId),
        });
      }
      
      // Handle path start - create temporary path placeholder
      if (event.type === "path-start" && event.pathId) {
        try {
          // Just store the path ID, the actual path will be created on first update
          // This prevents creating an empty path that might cause rendering issues
          if (!activePaths.has(event.pathId)) {
            activePaths.set(event.pathId, null as any); // Placeholder
          }
          // Remove from finalized set if it was there (new stroke with same ID pattern)
          finalizedPaths.delete(event.pathId);
          
          // Store brush properties from path-start event
          pathProperties.set(event.pathId, {
            opacity: event.opacity ?? 1,
            hardness: event.hardness ?? 1,
            strokeWidth: event.width ?? 5,
          });
          
          if (isDebugEnabled()) {
            logCanvasState(`path-start: ${event.pathId}`, event.pathId);
          }
        } catch (error) {
          console.error("[CanvasSync] Error creating path start:", error);
        }
        return;
      }

      // Handle path update - update existing path in real-time
      if (event.type === "path-update" && event.pathId && event.data) {
        // Ignore path-update events for paths that have already been finalized
        // This prevents race conditions where path-complete arrives before all path-updates
        if (finalizedPaths.has(event.pathId)) {
          if (isDebugEnabled()) {
            const debugInfo = pathDebugMap.get(event.pathId);
            if (debugInfo) {
              debugInfo.ignoredUpdates++;
              console.warn(`[CanvasSync Debug] Ignored path-update #${sequence} for finalized path ${event.pathId} (${debugInfo.ignoredUpdates} total ignored)`);
            }
          }
          return;
        }
        
        try {
          let path = activePaths.get(event.pathId);
          const pathPoints = event.data.path;
          
          if (!pathPoints || pathPoints.length === 0) return;
          
          // Get or update stored properties from path-update
          const existing = pathProperties.get(event.pathId) || { opacity: 1, hardness: 1, strokeWidth: 5 };
          const currentProps = {
            opacity: event.data.opacity ?? existing.opacity,
            hardness: event.data.hardness ?? existing.hardness,
            strokeWidth: event.data.strokeWidth ?? existing.strokeWidth,
          };
          pathProperties.set(event.pathId, currentProps);
          
          // Debug: Track update info
          if (isDebugEnabled()) {
            const debugInfo = pathDebugMap.get(event.pathId);
            if (debugInfo) {
              debugInfo.updateCount++;
              debugInfo.lastUpdatePointCount = pathPoints.length;
            }
          }

          if (!path || path === null) {
            // Create path if it doesn't exist - synchronous for immediate rendering
            if (!isCanvasValid(fabricCanvas)) return;

            // Build path array for Fabric.js (starts with M, then L commands)
            const fabricPath: any[] = [['M', pathPoints[0][0], pathPoints[0][1]]];
            for (let i = 1; i < pathPoints.length; i++) {
              fabricPath.push(['L', pathPoints[i][0], pathPoints[i][1]]);
            }

            const opacity = event.data.opacity ?? 1;
            const hardness = event.data.hardness ?? 1;
            const shadowBlur = hardness < 1 ? (1 - hardness) * (event.data.strokeWidth || 5) * 2 : 0;
            
            path = new Path(fabricPath, {
              stroke: event.data.stroke || "#000000",
              strokeWidth: event.data.strokeWidth || 5,
              opacity: opacity,
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

            activePaths.set(event.pathId, path);
            fabricCanvas.add(path);
            // Schedule render for next frame (batched for performance)
            scheduleRender();
          } else {
            // Update existing path with new points
            // Build path array for Fabric.js
            const fabricPath: any[] = [['M', pathPoints[0][0], pathPoints[0][1]]];
            for (let i = 1; i < pathPoints.length; i++) {
              fabricPath.push(['L', pathPoints[i][0], pathPoints[i][1]]);
            }

            // Use stored properties as fallback
            const opacity = currentProps.opacity;
            const hardness = currentProps.hardness;
            const shadowBlur = hardness < 1 ? (1 - hardness) * currentProps.strokeWidth * 2 : 0;
            
            (path as any).set({
              path: fabricPath,
              stroke: event.data.stroke,
              strokeWidth: currentProps.strokeWidth,
              opacity: opacity,
              shadow: shadowBlur > 0 ? {
                blur: shadowBlur,
                offsetX: 0,
                offsetY: 0,
                color: event.data.stroke || "#000000",
              } : null,
            });

            // Schedule render for next frame (batched for performance)
            scheduleRender();
          }
          
          if (isDebugEnabled()) {
            logCanvasState(`path-update: ${event.pathId} (${pathPoints.length} points)`, event.pathId);
          }
        } catch (error) {
          console.error("[CanvasSync] Error updating path:", error);
        }
        return;
      }

      // Handle path complete - finalize path
      if (event.type === "path-complete" && event.data) {
        // If pathId is missing, try to match to the most recent unfinalized path
        let targetPathId = event.pathId;
        if (!targetPathId) {
          // Find the most recent path that hasn't been finalized
          const unfinalizedPaths = Array.from(pathDebugMap.entries())
            .filter(([id, info]) => !info.finalized)
            .sort((a, b) => b[1].startTime - a[1].startTime); // Most recent first
          
          if (unfinalizedPaths.length > 0) {
            targetPathId = unfinalizedPaths[0][0];
            if (isDebugEnabled()) {
              console.warn(`[CanvasSync Debug] path-complete missing pathId, matched to most recent unfinalized path: ${targetPathId}`);
            }
          } else {
            if (isDebugEnabled()) {
              console.warn(`[CanvasSync Debug] path-complete missing pathId and no unfinalized paths to match`);
            }
            return; // Can't process without a pathId and no candidate paths
          }
        }
        
        // Mark this path as finalized immediately to prevent late path-update events
        finalizedPaths.add(targetPathId);
        
        // Debug: Extract point count from path-complete data
        let completePointCount = 0;
        if (isDebugEnabled()) {
          try {
            // Try to extract path points from the JSON data
            const pathData = event.data;
            if (pathData.path && Array.isArray(pathData.path)) {
              // Count non-M commands (actual path segments)
              completePointCount = pathData.path.filter((cmd: any) => 
                Array.isArray(cmd) && cmd[0] !== 'M'
              ).length + 1; // +1 for the M command
            }
            
            const debugInfo = pathDebugMap.get(targetPathId);
            if (debugInfo) {
              debugInfo.completeTime = eventTimestamp;
              debugInfo.completePointCount = completePointCount;
              debugInfo.finalized = true;
              
              const timeDiff = eventTimestamp - debugInfo.startTime;
              const updatesAfterComplete = debugInfo.events.filter(e => 
                e.timestamp > eventTimestamp && e.type === 'path-update'
              ).length;
              
              console.log(`[CanvasSync Debug] path-complete for ${targetPathId}:`, {
                totalUpdates: debugInfo.updateCount,
                lastUpdatePoints: debugInfo.lastUpdatePointCount,
                completePoints: completePointCount,
                timeToComplete: `${timeDiff}ms`,
                updatesAfterComplete,
                ignoredUpdates: debugInfo.ignoredUpdates,
                eventSequence: debugInfo.events.map(e => `${e.type}#${e.sequence}`).join(' -> '),
              });
            }
          } catch (e) {
            console.warn('[CanvasSync Debug] Error extracting point count:', e);
          }
        }
        
        isReceivingRef.current = true;
        
        try {
          // Remove temporary path if it exists
          const tempPath = activePaths.get(targetPathId);
          if (tempPath) {
            try {
              fabricCanvas.remove(tempPath);
            } catch (e) {
              // Path might already be removed, ignore
            }
          }
          activePaths.delete(targetPathId);

          // Use enlivenObjects for final path (this is the complete, optimized path)
          // fabric.util is accessed from the fabric namespace
          fabric.util.enlivenObjects([event.data]).then((objects: FabricObject[]) => {
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
              
              // Ensure opacity and shadow are applied from stored properties or event data
              if (obj.type === 'path') {
                // Get properties from stored path properties (from path-start) or event data
                const storedProps = pathProperties.get(targetPathId);
                const opacity = storedProps?.opacity ?? event.data.opacity ?? obj.opacity ?? 1;
                const hardness = storedProps?.hardness ?? event.data.hardness ?? 1;
                const strokeWidth = obj.strokeWidth || storedProps?.strokeWidth || event.data.strokeWidth || 5;
                const strokeColor = obj.stroke || event.data.stroke || "#000000";
                
                // Apply opacity
                obj.set({ opacity: opacity });
                
                // Apply hardness using shadowBlur
                if (hardness < 1) {
                  const shadowBlur = (1 - hardness) * strokeWidth * 2;
                  obj.set({
                    shadow: {
                      blur: shadowBlur,
                      offsetX: 0,
                      offsetY: 0,
                      color: strokeColor,
                    },
                  });
                } else {
                  // Hard brush - no shadow
                  obj.set({ shadow: null });
                }
                
                // Clean up stored properties
                pathProperties.delete(targetPathId);
              }
              
              fabricCanvas.add(obj);
            });
            
            if (fabricCanvas.requestRenderAll) {
              fabricCanvas.requestRenderAll();
            } else {
              fabricCanvas.renderAll();
            }
            
            if (isDebugEnabled()) {
              logCanvasState(`path-complete: ${targetPathId} (${completePointCount} points)`, targetPathId);
              
              // Log final comparison
              const finalDebugInfo = pathDebugMap.get(targetPathId);
              if (finalDebugInfo && finalDebugInfo.lastUpdatePointCount > 0) {
                const pointDiff = completePointCount - finalDebugInfo.lastUpdatePointCount;
                if (pointDiff < 0) {
                  console.warn(`[CanvasSync Debug] ⚠️ path-complete has FEWER points (${completePointCount}) than last update (${finalDebugInfo.lastUpdatePointCount})!`);
                } else if (pointDiff > 0) {
                  console.log(`[CanvasSync Debug] ✓ path-complete has ${pointDiff} more points than last update`);
                }
              }
            }
            
            isReceivingRef.current = false;
          }).catch((err: Error) => {
            console.error("[CanvasSync] Error enlivening objects:", err);
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
          // fabric.util is accessed from the fabric namespace
          fabric.util.enlivenObjects([event.data]).then((objects: FabricObject[]) => {
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
            
            if (fabricCanvas.requestRenderAll) {
              fabricCanvas.requestRenderAll();
            } else {
              fabricCanvas.renderAll();
            }
            isReceivingRef.current = false;
          }).catch((err: Error) => {
            console.error("[CanvasSync] Error enlivening objects:", err);
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

