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
  const isDisposedRef = useRef(false);

  // Helper function to check if canvas is valid and not disposed
  const isCanvasValid = (canvas: FabricCanvas | null): boolean => {
    if (!canvas || isDisposedRef.current) {
      console.debug("[Canvas] Canvas is null or disposed");
      return false;
    }
    // Check if the underlying context exists by accessing the lowerCanvasEl
    try {
      const lowerCanvasEl = (canvas as any).lowerCanvasEl;
      if (!lowerCanvasEl) {
        console.debug("[Canvas] Canvas lowerCanvasEl is null");
        return false;
      }
      const context = lowerCanvasEl.getContext('2d');
      if (!context) {
        console.debug("[Canvas] Canvas context is null");
        return false;
      }
      return true;
    } catch (error) {
      console.debug("[Canvas] Error checking canvas context:", error);
      return false;
    }
  };

  // Initialize canvas - sets up Fabric.js canvas with proper initial state
  useEffect(() => {
    if (!canvasRef.current) return;

    console.debug("[Canvas] Initializing new canvas", {
      isGameActive: gameState.isGameActive,
      isDrawer: gameState.isDrawer,
    });

    // Mark as not disposed before creating new canvas
    isDisposedRef.current = false;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth > 768 ? 800 : window.innerWidth - 40,
      height: window.innerWidth > 768 ? 600 : 400,
      backgroundColor: "#ffffff",
      isDrawingMode: false,
      renderOnAddRemove: true, // Ensure rendering happens on add/remove
      skipTargetFind: !gameState.isDrawer, // Skip target finding for guessers
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = brushSize;

    // Ensure immediate setting of drawing mode based on game state to fix HMR issue
    canvas.isDrawingMode = gameState.isGameActive && gameState.isDrawer;

    // Disable all interactions for guessers
    if (!gameState.isDrawer) {
      canvas.selection = false;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'default';
      canvas.moveCursor = 'default';
      canvas.skipTargetFind = true; // Skip target finding for guessers
    }

    setFabricCanvas(canvas);

    const handleResize = () => {
      if (isCanvasValid(canvas)) {
        if (window.innerWidth > 768) {
          canvas.setWidth(800);
          canvas.setHeight(600);
        } else {
          canvas.setWidth(window.innerWidth - 40);
          canvas.setHeight(400);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      console.debug("[Canvas] Disposing canvas");
      window.removeEventListener("resize", handleResize);
      isDisposedRef.current = true;
      try {
        canvas.dispose();
      } catch (error) {
        console.debug("[Canvas] Error disposing canvas:", error);
      }
      setFabricCanvas(null);
    };
  }, [gameState.isGameActive, gameState.isDrawer]);

  // Update drawing mode and clear canvas when game state changes
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas)) {
      console.debug("[Canvas] Skipping clear - canvas not valid", {
        hasCanvas: !!fabricCanvas,
        isDisposed: isDisposedRef.current,
      });
      return;
    }
    
    console.debug("[Canvas] Updating drawing mode and clearing canvas", {
      isGameActive: gameState.isGameActive,
      isDrawer: gameState.isDrawer,
      roundNumber: gameState.roundNumber,
    });
    
    fabricCanvas!.isDrawingMode = gameState.isGameActive && gameState.isDrawer;
    
    // Disable all interactions for guessers
    if (!gameState.isDrawer) {
      fabricCanvas!.selection = false;
      fabricCanvas!.defaultCursor = 'default';
      fabricCanvas!.hoverCursor = 'default';
      fabricCanvas!.moveCursor = 'default';
      fabricCanvas!.skipTargetFind = true; // Skip target finding for guessers
    }
    
    if (gameState.isGameActive && gameState.isDrawer) {
      // Clear canvas at the start of each round
      try {
        fabricCanvas!.clear();
        fabricCanvas!.backgroundColor = "#ffffff";
        fabricCanvas!.renderAll();
      } catch (error) {
        console.error("[Canvas] Error clearing canvas:", error);
      }
    }
  }, [fabricCanvas, gameState.isDrawer, gameState.isGameActive, gameState.roundNumber]);

  // Ensure all objects are non-interactive for guessers
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || gameState.isDrawer) return;

    // Make all existing objects non-interactive
    const objects = fabricCanvas!.getObjects();
    if (objects.length > 0) {
      objects.forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
        obj.hoverCursor = 'default';
        obj.moveCursor = 'default';
      });
      fabricCanvas!.selection = false;
      // Use requestRenderAll for better rendering
      if (fabricCanvas!.requestRenderAll) {
        fabricCanvas!.requestRenderAll();
      } else {
        fabricCanvas!.renderAll();
      }
    }
  }, [fabricCanvas, gameState.isDrawer]);

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
  }, [activeTool, activeColor, brushSize, fabricCanvas]);

  // Send drawing events (drawer only)
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || !gameState.isDrawer || !gameState.isGameActive) return;

    const handlePathCreated = (e: { path: FabricObject }) => {
      if (isReceivingRef.current) return; // Prevent echo
      if (!isCanvasValid(fabricCanvas)) return; // Check again in case canvas was disposed

      const path = e.path;
      const pathData = path.toJSON();
      
      sendDrawingEvent({
        type: "path",
        data: pathData,
      });
    };

    fabricCanvas!.on("path:created", handlePathCreated);

    return () => {
      if (isCanvasValid(fabricCanvas)) {
        fabricCanvas!.off("path:created", handlePathCreated);
      }
    };
  }, [fabricCanvas, gameState.isDrawer, gameState.isGameActive, sendDrawingEvent]);

  // Receive drawing events (guessers only)
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || gameState.isDrawer || !gameState.isGameActive) {
      console.debug("[Canvas] Skipping guesser drawing event setup", {
        hasCanvas: !!fabricCanvas,
        isDrawer: gameState.isDrawer,
        isGameActive: gameState.isGameActive,
      });
      return;
    }

    console.debug("[Canvas] Setting up guesser drawing event listeners");

    const handleDrawingEvent = (e: Event) => {
      if (!isCanvasValid(fabricCanvas)) {
        console.debug("[Canvas] Canvas invalid, skipping drawing event");
        return; // Check canvas is still valid
      }
      
      const customEvent = e as CustomEvent;
      const event = customEvent.detail;
      
      if (event.type === "path" && event.data && !isReceivingRef.current) {
        isReceivingRef.current = true;
        
        console.debug("[Canvas] Received drawing event for guesser", {
          hasData: !!event.data,
          eventType: event.type,
        });
        
        try {
          // Get existing objects
          const existingObjects = fabricCanvas!.getObjects().map((obj) => obj.toJSON());
          
          // Add new path to existing objects
          const allObjects = [...existingObjects, event.data];
          
          // Make sure the new object data is non-interactive before loading
          if (event.data) {
            event.data.selectable = false;
            event.data.evented = false;
          }
          
          // Reload canvas with all objects
          fabricCanvas!.loadFromJSON(
            {
              version: "6.9.0",
              objects: allObjects,
            },
            () => {
              if (!isCanvasValid(fabricCanvas)) {
                isReceivingRef.current = false;
                return;
              }
              // Make all objects non-interactive immediately
              const objects = fabricCanvas!.getObjects();
              objects.forEach((obj) => {
                obj.selectable = false;
                obj.evented = false;
                obj.hoverCursor = 'default';
                obj.moveCursor = 'default';
                // Disable object caching to ensure visibility
                obj.objectCaching = false;
              });
              
              // Ensure canvas selection is disabled
              fabricCanvas!.selection = false;
              
              // Use requestRenderAll for better rendering (forces repaint)
              if (fabricCanvas!.requestRenderAll) {
                fabricCanvas!.requestRenderAll();
              } else {
                fabricCanvas!.renderAll();
              }
              
              // Force browser repaint using requestAnimationFrame
              requestAnimationFrame(() => {
                if (isCanvasValid(fabricCanvas)) {
                  if (fabricCanvas!.requestRenderAll) {
                    fabricCanvas!.requestRenderAll();
                  } else {
                    fabricCanvas!.renderAll();
                  }
                }
              });
              
              console.debug("[Canvas] Drawing event processed, objects rendered", {
                objectCount: objects.length,
              });
              isReceivingRef.current = false;
            }
          );
        } catch (error) {
          console.error("[Canvas] Error handling drawing event:", error);
          isReceivingRef.current = false;
        }
      }
    };

    const handleCanvasCleared = () => {
      if (!isCanvasValid(fabricCanvas)) {
        console.debug("[Canvas] Canvas invalid, skipping clear event");
        return;
      }
      if (isReceivingRef.current) return;
      
      console.debug("[Canvas] Received canvas cleared event for guesser");
      isReceivingRef.current = true;
      try {
        fabricCanvas!.clear();
        fabricCanvas!.backgroundColor = "#ffffff";
        // Use requestRenderAll for better rendering
        if (fabricCanvas!.requestRenderAll) {
          fabricCanvas!.requestRenderAll();
        } else {
          fabricCanvas!.renderAll();
        }
        // Force repaint
        requestAnimationFrame(() => {
          if (isCanvasValid(fabricCanvas)) {
            if (fabricCanvas!.requestRenderAll) {
              fabricCanvas!.requestRenderAll();
            } else {
              fabricCanvas!.renderAll();
            }
          }
        });
        console.debug("[Canvas] Canvas cleared for guesser");
      } catch (error) {
        console.error("[Canvas] Error clearing canvas from event:", error);
      }
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
    if (!isCanvasValid(fabricCanvas) || !gameState.isDrawer) return;
    try {
      const objects = fabricCanvas!.getObjects();
      if (objects.length > 0) {
        fabricCanvas!.remove(objects[objects.length - 1]);
        fabricCanvas!.renderAll();
        toast.info("Undo");
      }
    } catch (error) {
      console.error("[Canvas] Error undoing:", error);
    }
  };

  const handleClear = () => {
    if (!isCanvasValid(fabricCanvas) || !gameState.isDrawer) return;
    try {
      fabricCanvas!.clear();
      fabricCanvas!.backgroundColor = "#ffffff";
      fabricCanvas!.renderAll();
      clearCanvas();
      toast.success("Canvas cleared!");
    } catch (error) {
      console.error("[Canvas] Error clearing canvas:", error);
    }
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
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
            <div className="bg-background/90 px-4 py-2 rounded-lg border shadow-lg">
              <p className="text-sm font-semibold">Watch and guess the word!</p>
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