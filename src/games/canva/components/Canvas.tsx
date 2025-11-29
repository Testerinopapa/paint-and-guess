import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricObject, PencilBrush } from "fabric";
import * as fabric from "fabric";
import { useCanva } from "../state/CanvaContext";

export function CanvaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const { socket } = useCanva();
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("[CanvaCanvas] Initializing canvas...");

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    // Explicitly create PencilBrush
    const brush = new PencilBrush(canvas);
    canvas.freeDrawingBrush = brush;
    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = color;
    canvas.isDrawingMode = true;

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

  // Send drawing events when path is created
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !socket) {
      console.log("[CanvaCanvas] Cannot setup send handler - canvas or socket missing");
      return;
    }

    console.log("[CanvaCanvas] Setting up path:created handler");

    const handlePathCreated = (e: { path: FabricObject }) => {
      const path = e.path;
      if (!path) return;

      const pathData = path.toJSON();
      console.log("[CanvaCanvas] Sending drawing event:", { type: "path-complete" });
      
      socket.emit("canva:drawing-event", {
        type: "path-complete",
        data: pathData,
      });
    };

    canvas.on("path:created", handlePathCreated);

    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [socket]);

  // Listen for drawing events from DOM (bridged from CanvaContext)
  useEffect(() => {
    console.log("[CanvaCanvas] Setting up DOM event listener for canva:drawing-event");

    const handleDrawingEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const event = customEvent.detail as { type: string; data: any };
      const canvas = fabricCanvasRef.current;

      console.log("[CanvaCanvas] Received DOM drawing event:", { type: event?.type, hasData: !!event?.data });

      if (!canvas) {
        console.log("[CanvaCanvas] Canvas not ready, ignoring event");
        return;
      }

      if (event?.type === "path-complete" && event?.data) {
        console.log("[CanvaCanvas] Processing path-complete event");
        
        fabric.util.enlivenObjects([event.data])
          .then((objects: FabricObject[]) => {
            console.log("[CanvaCanvas] Enlivened objects:", objects.length);
            
            objects.forEach((obj) => {
              obj.selectable = false;
              obj.evented = false;
              canvas.add(obj);
            });
            
            canvas.renderAll();
            console.log("[CanvaCanvas] Drawing rendered, total objects:", canvas.getObjects().length);
          })
          .catch((err: Error) => {
            console.error("[CanvaCanvas] Error enlivening objects:", err);
          });
      }
    };

    window.addEventListener("canva:drawing-event", handleDrawingEvent);
    console.log("[CanvaCanvas] DOM event listener registered");

    return () => {
      window.removeEventListener("canva:drawing-event", handleDrawingEvent);
      console.log("[CanvaCanvas] DOM event listener removed");
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
