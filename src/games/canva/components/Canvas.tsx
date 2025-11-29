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

export function CanvaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const { socket } = useCanva();
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  
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

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("[CanvaCanvas] Initializing canvas...");

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });


    fabricCanvasRef.current = canvas;
    console.log("[CanvaCanvas] Canvas initialized successfully");

    return () => {
      console.log("[CanvaCanvas] Disposing canvas");
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
      
      const pointer = canvas.getPointer(options.e);
      localIsDrawing = true;
      localPathPoints = [[pointer.x, pointer.y]];
      lastSentPointIndexRef.current = 0;
      lastSendTimeRef.current = Date.now();
      lastPointTimeRef.current = Date.now();
      localPathId = `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      currentPathIdRef.current = localPathId;

      // Create local path immediately for real-time rendering
      const fabricPath: any[] = [['M', pointer.x, pointer.y]];
      localPath = new Path(fabricPath, {
        stroke: color,
        strokeWidth: brushSize,
        fill: '',
        selectable: false,
        evented: false,
        objectCaching: false,
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
        localPathPoints.push([pointer.x, pointer.y]);
        pathPointsRef.current = localPathPoints;

        // Update local path in real-time for immediate visual feedback
        const fabricPath: any[] = [['M', localPathPoints[0][0], localPathPoints[0][1]]];
        for (let i = 1; i < localPathPoints.length; i++) {
          fabricPath.push(['L', localPathPoints[i][0], localPathPoints[i][1]]);
        }
        localPath.set({ path: fabricPath });
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
      if (localPathPoints.length > 0 && localPath) {
        const pathData = localPath.toJSON();
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
  }, [socket, color, brushSize]);

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
        fabric.util.enlivenObjects([event.data])
          .then((objects: FabricObject[]) => {
            objects.forEach((obj) => {
              obj.selectable = false;
              obj.evented = false;
              canvas.add(obj);
            });
            canvas.renderAll();
          })
          .catch((err: Error) => {
            console.error("[CanvaCanvas] Error enlivening path-complete:", err);
          });

        // Clean up tracking
        accumulatedPathPointsRef.current.delete(pathId);
        pathPropertiesRef.current.delete(pathId);
      }
    };

    window.addEventListener("canva:drawing-event", handleDrawingEvent);

    return () => {
      window.removeEventListener("canva:drawing-event", handleDrawingEvent);
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
          />
          <span className="text-sm w-8">{brushSize}</span>
        </div>
      </div>
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
