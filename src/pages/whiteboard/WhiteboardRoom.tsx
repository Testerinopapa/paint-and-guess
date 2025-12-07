import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Path } from "fabric";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Trash2, Users } from "lucide-react";
import { useWhiteboard } from "./state/WhiteboardContext";
import { useNavigate } from "react-router-dom";

// Fixed canvas dimensions
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

// Batching constants
const MIN_POINTS_PER_BATCH = 2;
const BATCH_INTERVAL_MS = 16; // ~60fps
const FAST_DRAW_THRESHOLD_MS = 8;
const FAST_DRAW_MIN_BATCH = 1;
const FLUSH_INTERVAL_MS = 8;

export default function WhiteboardRoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { socket, roomState, clearCanvas: emitClearCanvas } = useWhiteboard();
  const navigate = useNavigate();
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

  // Calculate and apply scale to fit container
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const FRAME_PADDING = 24; // 12px padding on each side
      const availableWidth = containerRect.width - 32;
      const availableHeight = containerRect.height - 32;

      const scaleX = availableWidth / (CANVAS_WIDTH + FRAME_PADDING);
      const scaleY = availableHeight / (CANVAS_HEIGHT + FRAME_PADDING);
      const scale = Math.min(scaleX, scaleY, 1);

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

    const canvasElement = canvasRef.current;
    
    canvasElement.width = CANVAS_WIDTH;
    canvasElement.height = CANVAS_HEIGHT;
    canvasElement.style.width = `${CANVAS_WIDTH}px`;
    canvasElement.style.height = `${CANVAS_HEIGHT}px`;

    const canvas = new FabricCanvas(canvasElement, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "#ffffff",
    });
    
    canvas.setDimensions({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    canvas.calcOffset();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    fabricCanvasRef.current = canvas;

    const recalcOffset = () => {
      if (!canvas || !canvasElement || !canvasElement.parentElement) return;
      try {
        canvas.calcOffset();
      } catch (error) {
        // Ignore
      }
    };

    const handleResize = () => {
      recalcOffset();
    };
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    let timeoutId: number | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(recalcOffset, 0);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      try {
        canvas.dispose();
      } catch (error) {
        // Ignore
      }
    };
  }, []);

  // Update brush properties
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas?.freeDrawingBrush) return;

    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = color;
  }, [color, brushSize]);

  // Send drawing events
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !socket) return;

    const sendDrawingEvent = (event: { type: string; pathId?: string; sequence?: number; data?: any; color?: string; width?: number; opacity?: number; hardness?: number }) => {
      socket.emit("whiteboard:drawing-event", {
        ...event,
        sequence: event.sequence ?? ++eventSequenceRef.current,
      });
    };

    let localIsDrawing = false;
    let localPathPoints: number[][] = [];
    let localPathId: string | null = null;
    let localPath: Path | null = null;

    const handleMouseDown = (options: any) => {
      if (localIsDrawing) return;
      
      const pointer = canvas.getPointer(options.e);
      const x = Math.max(0, Math.min(pointer.x, CANVAS_WIDTH));
      const y = Math.max(0, Math.min(pointer.y, CANVAS_HEIGHT));
      localIsDrawing = true;
      localPathPoints = [[x, y]];
      lastSentPointIndexRef.current = 0;
      lastSendTimeRef.current = Date.now();
      lastPointTimeRef.current = Date.now();
      localPathId = `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      currentPathIdRef.current = localPathId;

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

      sendDrawingEvent({
        type: "path-start",
        pathId: localPathId,
        color: color,
        width: brushSize,
        opacity: 1,
        hardness: 1,
      });
    };

    const handleMouseMove = (options: any) => {
      if (!localIsDrawing || !localPathId || !localPath) return;

      try {
        const pointer = canvas.getPointer(options.e);
        const x = Math.max(0, Math.min(pointer.x, CANVAS_WIDTH));
        const y = Math.max(0, Math.min(pointer.y, CANVAS_HEIGHT));
        localPathPoints.push([x, y]);
        pathPointsRef.current = localPathPoints;

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
        // Ignore
      }
    };

    const handleMouseUp = () => {
      if (!localIsDrawing || !localPathId) return;

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

      if (localPathPoints.length > 0 && localPath) {
        const fabricPath: any[] = [['M', localPathPoints[0][0], localPathPoints[0][1]]];
        for (let i = 1; i < localPathPoints.length; i++) {
          fabricPath.push(['L', localPathPoints[i][0], localPathPoints[i][1]]);
        }
        
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
        
        sendDrawingEvent({
          type: "path-complete",
          pathId: localPathId,
          data: pathData,
        });
      }

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

  // Listen for drawing events from other clients
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleDrawingEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const event = customEvent.detail as { type: string; pathId?: string; data?: any; color?: string; width?: number; opacity?: number; hardness?: number };

      if (!event || !event.type) return;

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

      if (event.type === "path-update" && event.pathId && event.data) {
        if (finalizedPathsRef.current.has(event.pathId)) return;

        try {
          let path = activePathsRef.current.get(event.pathId);
          let allPathPoints: number[][] = [];

          if (event.data.newPoints) {
            const accumulated = accumulatedPathPointsRef.current.get(event.pathId) || [];
            const newPoints = event.data.newPoints;
            allPathPoints = [...accumulated, ...newPoints];
            accumulatedPathPointsRef.current.set(event.pathId, allPathPoints);
          } else if (event.data.path) {
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
            const fabricPath: any[] = [['M', allPathPoints[0][0], allPathPoints[0][1]]];
            for (let i = 1; i < allPathPoints.length; i++) {
              fabricPath.push(['L', allPathPoints[i][0], allPathPoints[i][1]]);
            }

            path = new Path(fabricPath, {
              stroke: event.data.stroke || "#000000",
              strokeWidth: currentProps.strokeWidth,
              opacity: currentProps.opacity,
              fill: "",
              selectable: false,
              evented: false,
              objectCaching: false,
            });

            activePathsRef.current.set(event.pathId, path);
            canvas.add(path);
            canvas.renderAll();
          } else {
            const fabricPath: any[] = [['M', allPathPoints[0][0], allPathPoints[0][1]]];
            for (let i = 1; i < allPathPoints.length; i++) {
              fabricPath.push(['L', allPathPoints[i][0], allPathPoints[i][1]]);
            }

            (path as any).set({
              path: fabricPath,
              stroke: event.data.stroke,
              strokeWidth: currentProps.strokeWidth,
              opacity: currentProps.opacity,
            });

            canvas.renderAll();
          }
        } catch (error) {
          console.error("[WhiteboardRoom] Error updating path:", error);
        }
        return;
      }

      if (event.type === "path-complete" && event.data) {
        const pathId = event.pathId;
        if (!pathId) return;

        finalizedPathsRef.current.add(pathId);

        const activePath = activePathsRef.current.get(pathId);
        if (activePath) {
          canvas.remove(activePath);
          activePathsRef.current.delete(pathId);
        }

        try {
          const pathData = event.data as any;
          if (!pathData.path || !Array.isArray(pathData.path)) {
            return;
          }

          const fabricPath = pathData.path;
          const finalPath = new Path(fabricPath, {
            stroke: pathData.stroke || "#000000",
            strokeWidth: pathData.strokeWidth || 5,
            opacity: pathData.opacity ?? 1,
            fill: pathData.fill || "",
            selectable: false,
            evented: false,
            objectCaching: false,
          });

          canvas.add(finalPath);
          canvas.renderAll();
        } catch (err: any) {
          console.error("[WhiteboardRoom] Error creating path from path-complete:", err);
        }

        accumulatedPathPointsRef.current.delete(pathId);
        pathPropertiesRef.current.delete(pathId);
      }
    };

    window.addEventListener("whiteboard:drawing-event", handleDrawingEvent);

    const handleCanvasClear = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
      
      activePathsRef.current.clear();
      accumulatedPathPointsRef.current.clear();
      pathPropertiesRef.current.clear();
      finalizedPathsRef.current.clear();
      
      isDrawingRef.current = false;
      pathPointsRef.current = [];
      currentPathIdRef.current = null;
      lastSentPointIndexRef.current = 0;
      lastSendTimeRef.current = 0;
      lastPointTimeRef.current = 0;
    };

    window.addEventListener("whiteboard:canvas-clear", handleCanvasClear);

    return () => {
      window.removeEventListener("whiteboard:drawing-event", handleDrawingEvent);
      window.removeEventListener("whiteboard:canvas-clear", handleCanvasClear);
    };
  }, []);

  const handleClear = () => {
    emitClearCanvas();
  };

  if (!roomState.roomId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Not in a room</p>
          <Button onClick={() => navigate("/hub/whiteboard")}>Go to Whiteboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Whiteboard</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{roomState.players.length} {roomState.players.length === 1 ? 'player' : 'players'}</span>
            {roomState.gamePin && (
              <>
                <span>•</span>
                <span>PIN: {roomState.gamePin}</span>
              </>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate("/hub/whiteboard")}>
          Leave Room
        </Button>
      </div>

      <div className="flex gap-4 items-center mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-8 rounded border cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Brush Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm w-8 text-right">{brushSize}</span>
        </div>
        <Button
          variant="outline"
          onClick={handleClear}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear Canvas
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-muted/20 rounded-lg p-4 flex items-center justify-center">
        <div 
          ref={containerRef}
          className="whiteboard-frame"
          style={{ 
            width: `${CANVAS_WIDTH + 24}px`,
            height: `${CANVAS_HEIGHT + 24}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: `${CANVAS_WIDTH + 24} / ${CANVAS_HEIGHT + 24}`,
          }}
        >
          {/* Mounting holes */}
          <div className="mounting-hole top-left"></div>
          <div className="mounting-hole top-right"></div>
          <div className="mounting-hole bottom-left"></div>
          <div className="mounting-hole bottom-right"></div>
          
          <div 
            className="whiteboard-frame-inner"
            style={{ 
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
            }}
          >
            <canvas 
              ref={canvasRef} 
              style={{ 
                display: 'block',
                cursor: 'crosshair',
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

