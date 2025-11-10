import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, FabricObject } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPalette } from "./ColorPalette";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<"draw" | "erase">("draw");
  const { gameState, sendDrawingEvent, clearCanvas } = useGame();
  const isReceivingRef = useRef(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth > 768 ? 800 : window.innerWidth - 40,
      height: window.innerWidth > 768 ? 600 : 400,
      backgroundColor: "#ffffff",
      isDrawingMode: false,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = brushSize;

    setFabricCanvas(canvas);

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

  // Update drawing mode and clear canvas when game state changes
  useEffect(() => {
    if (!fabricCanvas) return;
    
    if (gameState.isGameActive) {
      fabricCanvas.isDrawingMode = gameState.isDrawer;
      
      // Clear canvas at the start of each round
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";
      fabricCanvas.renderAll();
    } else {
      fabricCanvas.isDrawingMode = false;
    }
  }, [fabricCanvas, gameState.isDrawer, gameState.isGameActive, gameState.roundNumber]);

  // Update brush properties
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

  // Send drawing events (drawer only)
  useEffect(() => {
    if (!fabricCanvas || !gameState.isDrawer || !gameState.isGameActive) return;

    const handlePathCreated = (e: { path: FabricObject }) => {
      if (isReceivingRef.current) return; // Prevent echo
      
      const path = e.path;
      const pathData = path.toJSON(['selectable', 'evented']);
      
      sendDrawingEvent({
        type: "path",
        data: pathData,
      });
    };

    fabricCanvas.on("path:created", handlePathCreated);

    return () => {
      fabricCanvas.off("path:created", handlePathCreated);
    };
  }, [fabricCanvas, gameState.isDrawer, gameState.isGameActive, sendDrawingEvent]);

  // Receive drawing events (guessers only)
  useEffect(() => {
    if (!fabricCanvas || gameState.isDrawer || !gameState.isGameActive) return;

    const handleDrawingEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const event = customEvent.detail;
      
      if (event.type === "path" && event.data && !isReceivingRef.current) {
        isReceivingRef.current = true;
        
        // Get existing objects
        const existingObjects = fabricCanvas.getObjects().map((obj) => obj.toJSON());
        
        // Add new path to existing objects
        const allObjects = [...existingObjects, event.data];
        
        // Reload canvas with all objects
        fabricCanvas.loadFromJSON(
          {
            version: fabricCanvas.version || "6.9.0",
            objects: allObjects,
          },
          () => {
            // Make all objects non-interactive
            const objects = fabricCanvas.getObjects();
            objects.forEach((obj) => {
              obj.selectable = false;
              obj.evented = false;
            });
            fabricCanvas.renderAll();
            isReceivingRef.current = false;
          }
        );
      }
    };

    const handleCanvasCleared = () => {
      if (isReceivingRef.current) return;
      isReceivingRef.current = true;
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";
      fabricCanvas.renderAll();
      isReceivingRef.current = false;
    };

    window.addEventListener("drawing-event", handleDrawingEvent);
    window.addEventListener("canvas-cleared", handleCanvasCleared);

    return () => {
      window.removeEventListener("drawing-event", handleDrawingEvent);
      window.removeEventListener("canvas-cleared", handleCanvasCleared);
    };
  }, [fabricCanvas, gameState.isDrawer, gameState.isGameActive]);

  const handleToolChange = (tool: "draw" | "erase") => {
    if (!gameState.isDrawer) return;
    setActiveTool(tool);
    toast.info(tool === "draw" ? "Brush selected" : "Eraser selected");
  };

  const handleUndo = () => {
    if (!fabricCanvas || !gameState.isDrawer) return;
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
      fabricCanvas.renderAll();
      toast.info("Undo");
    }
  };

  const handleClear = () => {
    if (!fabricCanvas || !gameState.isDrawer) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    clearCanvas();
    toast.success("Canvas cleared!");
  };

  if (!gameState.isGameActive) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Waiting for game to start...</p>
          <p className="text-muted-foreground">
            {gameState.players.length < 2
              ? "Need at least 2 players to start"
              : "Click 'Start Game' when ready"}
          </p>
        </div>
      </div>
    );
  }

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
          disabled={!gameState.isDrawer}
        />
      </div>
      
      <div className="rounded-2xl shadow-strong overflow-hidden border-4 border-border bg-canvas-bg relative">
        <canvas ref={canvasRef} />
        {!gameState.isDrawer && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px] pointer-events-none z-10">
            <div className="bg-background/90 px-4 py-2 rounded-lg border">
              <p className="text-lg font-semibold">Watch and guess the word!</p>
            </div>
          </div>
        )}
      </div>

      {gameState.isDrawer && (
        <div className="w-full max-w-4xl">
          <ColorPalette activeColor={activeColor} onColorChange={setActiveColor} />
        </div>
      )}
    </div>
  );
};
