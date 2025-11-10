import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPalette } from "./ColorPalette";
import { toast } from "sonner";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<"draw" | "erase">("draw");

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth > 768 ? 800 : window.innerWidth - 40,
      height: window.innerWidth > 768 ? 600 : 400,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = brushSize;

    setFabricCanvas(canvas);
    toast.success("Canvas ready! Start drawing!");

    const handleResize = () => {
      if (window.innerWidth > 768) {
        canvas.setWidth(800);
        canvas.setHeight(600);
      } else {
        canvas.setWidth(window.innerWidth - 40);
        canvas.setHeight(400);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas || !fabricCanvas.freeDrawingBrush) return;

    if (activeTool === "erase") {
      fabricCanvas.freeDrawingBrush.color = "#ffffff";
      fabricCanvas.freeDrawingBrush.width = brushSize * 2;
    } else {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  const handleToolChange = (tool: "draw" | "erase") => {
    setActiveTool(tool);
    toast.info(tool === "draw" ? "Brush selected" : "Eraser selected");
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
      fabricCanvas.renderAll();
      toast.info("Undo");
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast.success("Canvas cleared!");
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <Toolbar
          activeTool={activeTool}
          brushSize={brushSize}
          onToolChange={handleToolChange}
          onBrushSizeChange={setBrushSize}
          onUndo={handleUndo}
          onClear={handleClear}
        />
      </div>
      
      <div className="rounded-2xl shadow-strong overflow-hidden border-4 border-border bg-canvas-bg">
        <canvas ref={canvasRef} />
      </div>

      <div className="w-full max-w-4xl">
        <ColorPalette activeColor={activeColor} onColorChange={setActiveColor} />
      </div>
    </div>
  );
};
