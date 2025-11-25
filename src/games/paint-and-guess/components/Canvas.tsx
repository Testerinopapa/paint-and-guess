import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, PencilBrush, FabricObject } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPalette } from "./ColorPalette";
import { useGame } from "@/games/paint-and-guess";
import { toast } from "sonner";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<"draw" | "erase">("draw");
  const { gameState, sendDrawingEvent, clearCanvas } = useGame();
  const isReceivingRef = useRef(false);
  const isDisposedRef = useRef(false);
  const canvasReadyRef = useRef(false);
  
  // Calculate optimal canvas size based on container dimensions
  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current) {
      // Fallback to window size if container not ready
      const isMobile = window.innerWidth <= 768;
      return {
        width: isMobile ? Math.min(window.innerWidth - 40, 400) : 800,
        height: isMobile ? 300 : 600,
      };
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Account for toolbar and color palette space
    // Toolbar: ~80px, Color palette: ~200px (only for drawer), padding: ~48px total
    const verticalSpaceForUI = gameState.isDrawer ? 280 : 80;
    const horizontalPadding = 32; // 16px on each side
    
    const availableWidth = containerRect.width - horizontalPadding;
    const availableHeight = containerRect.height - verticalSpaceForUI;
    
    // Target aspect ratio (4:3 for drawing canvas)
    const targetAspectRatio = 4 / 3;
    
    // Calculate dimensions that fit within available space while maintaining aspect ratio
    let width = availableWidth;
    let height = width / targetAspectRatio;
    
    // If height exceeds available space, scale down based on height
    if (height > availableHeight) {
      height = availableHeight;
      width = height * targetAspectRatio;
    }
    
    // Ensure minimum sizes
    const minWidth = 300;
    const minHeight = 225;
    
    width = Math.max(width, minWidth);
    height = Math.max(height, minHeight);
    
    // Round to integers for crisp rendering
    return {
      width: Math.floor(width),
      height: Math.floor(height),
    };
  }, [gameState.isDrawer]);

  // Helper function to check if canvas is valid and not disposed
  const isCanvasValid = (canvas: FabricCanvas | null): boolean => {
    if (!canvas || isDisposedRef.current) {
      return false;
    }
    // Check if the underlying context exists by accessing the lowerCanvasEl
    try {
      const lowerCanvasEl = (canvas as any).lowerCanvasEl;
      if (!lowerCanvasEl) {
        return false;
      }
      const context = lowerCanvasEl.getContext('2d');
      if (!context) {
        return false;
      }
      return true;
    } catch (error) {
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
    canvasReadyRef.current = false;

    // Calculate initial size based on container
    // If container not ready yet, use fallback and resize will fix it
    const { width, height } = calculateCanvasSize();

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
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

    // Set canvas in state - Fabric.js should have lowerCanvasEl ready immediately
    // since the canvas element is connected to DOM
    setFabricCanvas(canvas);
    
    // Verify it's ready in the next frame
    requestAnimationFrame(() => {
      const lowerCanvasEl = (canvas as any).lowerCanvasEl;
      if (lowerCanvasEl && lowerCanvasEl.getContext) {
        canvasReadyRef.current = true;
      } else {
        // If still not ready, something went wrong
        console.warn("[Canvas] lowerCanvasEl not available after initialization");
      }
    });

    // Use ResizeObserver to watch container size changes (more efficient than window resize)
    const resizeObserver = new ResizeObserver(() => {
      if (isCanvasValid(canvas)) {
        const { width, height } = calculateCanvasSize();
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.renderAll();
      }
    });

    // Observe the container for size changes
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also do an initial resize after a short delay to ensure container is measured
    const initialResizeTimeout = setTimeout(() => {
      if (isCanvasValid(canvas)) {
        const { width, height } = calculateCanvasSize();
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.renderAll();
      }
    }, 100);

    // Also listen to window resize as fallback
    const handleWindowResize = () => {
      if (isCanvasValid(canvas)) {
        const { width, height } = calculateCanvasSize();
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.renderAll();
      }
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      console.debug("[Canvas] Disposing canvas");
      clearTimeout(initialResizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      isDisposedRef.current = true;
      
      // Clear the canvas state first to prevent other effects from using it
      setFabricCanvas(null);
      
      // Then dispose the canvas
      try {
        if (canvas && (canvas as any).lowerCanvasEl) {
          canvas.dispose();
        }
      } catch (error) {
        console.debug("[Canvas] Error disposing canvas:", error);
      }
    };
  }, [gameState.isGameActive, gameState.isDrawer, calculateCanvasSize]); // Include calculateCanvasSize to recalc when role changes

  // Update drawing mode and clear canvas when game state changes
  useEffect(() => {
    if (!fabricCanvas || isDisposedRef.current) {
      return;
    }

    if (!isCanvasValid(fabricCanvas)) {
      // Canvas not ready yet, skip this update
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
      fabricCanvas!.skipTargetFind = true;
    } else {
      // Enable interactions for drawer
      fabricCanvas!.selection = true;
      fabricCanvas!.skipTargetFind = false;
    }
    
    // Clear canvas at round changes
    if (gameState.isGameActive) {
      try {
        fabricCanvas!.clear();
        fabricCanvas!.backgroundColor = "#ffffff";
        fabricCanvas!.renderAll();
        console.debug("[Canvas] Canvas cleared for round", gameState.roundNumber);
      } catch (error) {
        console.error("[Canvas] Error clearing canvas:", error);
      }
    }
  }, [fabricCanvas, gameState.isDrawer, gameState.isGameActive, gameState.roundNumber]);
  
  // Listen for canvas clear events (for both drawer and guessers)
  useEffect(() => {
    if (!isCanvasValid(fabricCanvas) || !gameState.isGameActive) return;
    
    const handleCanvasClear = () => {
      if (!isCanvasValid(fabricCanvas)) return;
      console.debug("[Canvas] Canvas clear event received");
      try {
        fabricCanvas!.clear();
        fabricCanvas!.backgroundColor = "#ffffff";
        fabricCanvas!.requestRenderAll();
      } catch (error) {
        console.error("[Canvas] Error clearing canvas:", error);
      }
    };
    
    // Drawer also needs to listen for their own clear events
    // (in case they're a host watching their own actions)
    window.addEventListener("canvas-cleared", handleCanvasClear);
    
    return () => {
      window.removeEventListener("canvas-cleared", handleCanvasClear);
    };
  }, [fabricCanvas, gameState.isGameActive]);

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

  // Receive drawing events (guessers only) - Optimized for smoother rendering
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
        return;
      }
      
      const customEvent = e as CustomEvent;
      const event = customEvent.detail;
      
      if (event.type === "path" && event.data && !isReceivingRef.current) {
        isReceivingRef.current = true;
        
        try {
          // Use enlivenObjects for faster path creation instead of loadFromJSON
          // This avoids re-rendering the entire canvas
          import("fabric").then(({ util }) => {
            util.enlivenObjects([event.data]).then((objects: FabricObject[]) => {
              if (!isCanvasValid(fabricCanvas)) {
                isReceivingRef.current = false;
                return;
              }
              
              objects.forEach((obj) => {
                // Make non-interactive
                obj.selectable = false;
                obj.evented = false;
                obj.hoverCursor = 'default';
                obj.moveCursor = 'default';
                obj.objectCaching = false;
                
                // Add directly to canvas
                fabricCanvas!.add(obj);
              });
              
              // Single render call
              fabricCanvas!.requestRenderAll();
              isReceivingRef.current = false;
            }).catch((err: Error) => {
              console.error("[Canvas] Error enlivening objects:", err);
              isReceivingRef.current = false;
            });
          });
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
        fabricCanvas!.requestRenderAll();
        console.debug("[Canvas] Canvas cleared for guesser");
      } catch (error) {
        console.error("[Canvas] Error clearing canvas from event:", error);
      }
      isReceivingRef.current = false;
    };
    
    // Also listen for round-ended to clear canvas
    const handleRoundEnded = () => {
      if (!isCanvasValid(fabricCanvas)) return;
      console.debug("[Canvas] Round ended, clearing canvas");
      try {
        fabricCanvas!.clear();
        fabricCanvas!.backgroundColor = "#ffffff";
        fabricCanvas!.requestRenderAll();
      } catch (error) {
        console.error("[Canvas] Error clearing canvas on round end:", error);
      }
    };
    
    // Listen for round-started to clear canvas for the new round
    const handleRoundStarted = () => {
      if (!isCanvasValid(fabricCanvas)) return;
      console.debug("[Canvas] Round started, clearing canvas");
      try {
        fabricCanvas!.clear();
        fabricCanvas!.backgroundColor = "#ffffff";
        fabricCanvas!.requestRenderAll();
      } catch (error) {
        console.error("[Canvas] Error clearing canvas on round start:", error);
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

  // Show waiting state when game is not active or during round transition
  if (!gameState.isGameActive || gameState.gamePhase === "round-ended" || gameState.gamePhase === "game-ended") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          {gameState.gamePhase === "round-ended" ? (
            <>
              <p className="text-lg font-semibold mb-2">Round Complete!</p>
              <p className="text-muted-foreground">
                Next round starting soon...
              </p>
            </>
          ) : gameState.gamePhase === "game-ended" ? (
            <>
              <p className="text-lg font-semibold mb-2">Game Over!</p>
              <p className="text-muted-foreground">
                Start a new game when ready
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold mb-2">Waiting for game to start...</p>
              <p className="text-muted-foreground">
                {gameState.players.length < 2
                  ? "Need at least 2 players to start"
                  : "Click 'Start Game' when ready"}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-6 p-4 md:p-8 h-full w-full min-w-0">
      <div className="w-full min-w-0 max-w-full">
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
      
      <div className="flex-1 flex items-center justify-center w-full min-h-0 min-w-0">
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
      </div>

      {gameState.isDrawer && (
        <div className="w-full min-w-0 max-w-full">
          <ColorPalette activeColor={activeColor} onColorChange={setActiveColor} />
        </div>
      )}
    </div>
  );
};