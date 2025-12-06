import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// Fixed canvas dimensions
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);

  // Calculate and apply scale to fit container
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const availableWidth = containerRect.width - 32; // Account for padding
      const availableHeight = containerRect.height - 32;

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

    const canvasElement = canvasRef.current;
    
    // Set explicit width/height on canvas element to prevent CSS scaling issues
    canvasElement.width = CANVAS_WIDTH;
    canvasElement.height = CANVAS_HEIGHT;
    canvasElement.style.width = `${CANVAS_WIDTH}px`;
    canvasElement.style.height = `${CANVAS_HEIGHT}px`;

    const canvas = new FabricCanvas(canvasElement, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "#ffffff",
    });
    
    // Ensure canvas maintains its dimensions
    canvas.setDimensions({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    
    // Calculate canvas offset for proper pointer coordinates
    canvas.calcOffset();
    
    // Disable any viewport transforms
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    // Enable free drawing
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = color;

    fabricCanvasRef.current = canvas;

    // Recalculate offset on window resize
    const recalcOffset = () => {
      if (!canvas || !canvasElement || !canvasElement.parentElement) return;
      try {
        canvas.calcOffset();
      } catch (error) {
        // Canvas might be disposed, ignore
      }
    };

    const handleResize = () => {
      recalcOffset();
    };
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver to detect container size changes
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
        // Ignore disposal errors
      }
    };
  }, []);

  // Update brush properties when color or size changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas?.freeDrawingBrush) return;

    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = color;
  }, [color, brushSize]);

  // Clear canvas function
  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Whiteboard</h1>
        <p className="text-sm text-muted-foreground">
          Draw freely on the canvas. Use the controls below to adjust color and brush size.
        </p>
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
          className="border-2 border-border rounded-lg overflow-hidden bg-white shadow-lg"
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
              cursor: 'crosshair',
            }} 
          />
        </div>
      </div>
    </div>
  );
}

