import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, FabricObject } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPalette } from "./ColorPalette";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";

interface CanvasProps {
  onCanvasReady?: (ready: boolean) => void;
}

export const Canvas = ({ onCanvasReady }: CanvasProps = {}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<"draw" | "erase">("draw");
  const { gameState, sendDrawingEvent, clearCanvas } = useGame();
  const isReceivingRef = useRef(false);

  // Initialize canvas - sets up Fabric.js canvas with proper initial state
  const lastRoundRef = useRef<number>(0);
  const canvasInstanceRef = useRef<FabricCanvas | null>(null); // Track canvas for cleanup

  const isMultiplayer = Boolean(gameState.roomId);
  const onCanvasReadyRef = useRef(onCanvasReady);

  // Keep callback ref up to date
  useEffect(() => {
    onCanvasReadyRef.current = onCanvasReady;
  }, [onCanvasReady]);

  // Notify parent when canvas ready state changes
  useEffect(() => {
    onCanvasReadyRef.current?.(isCanvasReady);
  }, [isCanvasReady]);

  // Initialize canvas (only once on mount)
  useEffect(() => {
    console.log('[Canvas] 🎨 Component mounted, starting initialization');
    
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 50; // Max 2.5 seconds of retries (50 * 50ms)
    let initTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // Don't re-initialize if canvas already exists
    if (canvasInstanceRef.current) {
      console.log('[Canvas] Canvas already exists, marking as ready');
      setFabricCanvas(canvasInstanceRef.current);
      setIsCanvasReady(true);
      return;
    }

    const initCanvas = () => {
      if (!isMounted) {
        console.log('[Canvas] Component unmounted, aborting initialization');
        return;
      }

      if (!canvasRef.current || !containerRef.current) {
        console.log('[Canvas] Refs not ready, retrying...', { retryCount });
        retryCount++;
        if (retryCount < maxRetries) {
          initTimeoutId = setTimeout(initCanvas, 50);
        } else {
          console.error('[Canvas] Max retries reached, refs never became ready');
          // Mark as ready anyway to prevent infinite waiting
          setIsCanvasReady(true);
        }
        return;
      }
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Don't initialize if container has no width (prevents "this.lower is undefined" error)
      if (!containerWidth || containerWidth === 0) {
        console.log('[Canvas] Container not ready, retrying...', { containerWidth, retryCount });
        retryCount++;
        if (retryCount < maxRetries) {
          initTimeoutId = setTimeout(initCanvas, 50);
        } else {
          console.error('[Canvas] Max retries reached, container never got dimensions');
          // Mark as ready anyway to prevent infinite waiting
          setIsCanvasReady(true);
        }
        return;
      }

      // Reset retry count when we have valid dimensions
      retryCount = 0;

      // Calculate height with reasonable defaults
      const height = Math.max(Math.min(containerWidth * 0.75, 640), 400);
      const width = Math.max(containerWidth, 100); // Ensure minimum width

      console.log('[Canvas] Container ready, initializing canvas', { width, height, containerWidth });

      try {
        // Create canvas with error handling
        const canvas = new FabricCanvas(canvasRef.current, {
          width: width,
          height: height,
          backgroundColor: "#ffffff",
          isDrawingMode: false,
        });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = brushSize;

    // Ensure immediate setting of drawing mode based on game state to fix HMR issue
    canvas.isDrawingMode = gameState.isGameActive && gameState.isDrawer;
        // Create initial brush (will be recreated when drawing mode is enabled)
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = activeColor;
        canvas.freeDrawingBrush.width = brushSize;

        console.log('[Canvas] Canvas created', {
          width: canvas.width,
          height: canvas.height,
          isDrawingMode: canvas.isDrawingMode,
          hasBrush: !!canvas.freeDrawingBrush,
          brushColor: canvas.freeDrawingBrush.color,
          brushWidth: canvas.freeDrawingBrush.width
        });

        // Add global mouse event listeners for debugging (these fire for all modes)
        canvas.on('mouse:down', (e) => {
          console.log('[Canvas] ⬇️ Mouse down (Fabric)', {
            pointer: e.pointer,
            isDrawingMode: canvas.isDrawingMode,
            hasBrush: !!canvas.freeDrawingBrush,
            brushColor: canvas.freeDrawingBrush?.color,
            brushWidth: canvas.freeDrawingBrush?.width
          });
        });

        canvas.on('mouse:move', (e) => {
          if (canvas.isDrawingMode) {
            const nativeEvent = e.e as MouseEvent | undefined;
            console.log('[Canvas] 🖱️ Mouse move (drawing mode)', {
              pointer: e.pointer,
              buttons: nativeEvent?.buttons,
              isDrawingMode: canvas.isDrawingMode
            });
          }
        });

        canvas.on('mouse:up', (e) => {
          console.log('[Canvas] ⬆️ Mouse up (Fabric)', {
            pointer: e.pointer,
            isDrawingMode: canvas.isDrawingMode
          });
        });

        // Force an initial render
        canvas.renderAll();
        
        // Store canvas in ref for cleanup
        canvasInstanceRef.current = canvas;
        console.log('[Canvas] Canvas stored in ref');
        
        // Set canvas state
        setFabricCanvas((prevCanvas) => {
          if (prevCanvas && prevCanvas !== canvas) {
            console.warn('[Canvas] ⚠️ Previous canvas exists during state update, disposing it');
            try {
              prevCanvas.dispose();
            } catch (error) {
              console.error('[Canvas] Error disposing previous canvas:', error);
            }
          }
          return canvas;
        });
        
        // Wait one frame to ensure everything is fully initialized
        requestAnimationFrame(() => {
          if (!isMounted) return;
          
          // Final render
          canvas.renderAll();
          
          console.log('[Canvas] ✅ Canvas fully initialized and ready for drawing mode', {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            hasBrush: !!canvas.freeDrawingBrush
          });
          
          // Mark canvas as ready
          setIsCanvasReady(true);
        });
      } catch (error) {
        console.error('[Canvas] Error creating canvas:', error);
        // Mark as ready anyway to prevent infinite waiting
        setIsCanvasReady(true);
      }
    };

    // Start initialization after a brief delay to ensure DOM is ready
    initTimeoutId = setTimeout(() => {
      requestAnimationFrame(initCanvas);
    }, 100);

    // Cleanup only on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, [gameState.isGameActive, gameState.isDrawer, activeColor, brushSize]);

  // Update drawing mode and clear canvas when game state changes
      console.log('[Canvas] 🔄 Component unmounting, cleaning up');
      isMounted = false;
      
      if (initTimeoutId) {
        clearTimeout(initTimeoutId);
      }
      
      setIsCanvasReady(false);
      onCanvasReadyRef.current?.(false);
      
      const canvas = canvasInstanceRef.current;
      if (canvas) {
        console.log('[Canvas] ⚠️ Disposing canvas on unmount');
        try {
          canvas.dispose();
        } catch (error) {
          console.error('[Canvas] Error disposing canvas:', error);
        }
        canvasInstanceRef.current = null;
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  // Resize canvas whenever the container changes size
  useEffect(() => {
    if (!fabricCanvas || !containerRef.current) return;

    const updateCanvasSize = () => {
      if (!containerRef.current || !fabricCanvas) return;

      const containerWidth = containerRef.current.clientWidth;
      
      // CRITICAL: Don't resize if container has no width
      // This prevents the "this.lower is undefined" error
      if (!containerWidth || containerWidth === 0) {
        return;
      }

      const width = containerWidth;
      const height = Math.max(Math.min(width * 0.75, 640), 400);

      // Only resize if we have valid dimensions (minimum 100px width, 400px height)
      if (width >= 100 && height >= 400) {
        try {
          fabricCanvas.setWidth(width);
          fabricCanvas.setHeight(height);
          fabricCanvas.renderAll();
        } catch (error) {
          console.warn('Canvas resize error:', error);
        }
      }
    };

    // Wait for container to be fully rendered before first resize
    requestAnimationFrame(() => {
      updateCanvasSize();
    });

    const observer = new ResizeObserver((entries) => {
      // Check if we have valid dimensions before resizing
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          updateCanvasSize();
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [fabricCanvas]);

  // Handle round changes - clear canvas when new round starts
  useEffect(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.isDrawingMode = gameState.isGameActive && gameState.isDrawer;
    
    if (gameState.isGameActive && gameState.isDrawer) {
      // Clear canvas at the start of each round
    if (!isMultiplayer || !gameState.isGameActive) return;

    if (gameState.roundNumber !== lastRoundRef.current) {
      // Clear canvas for new round
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";
      lastRoundRef.current = gameState.roundNumber;
      
      // The drawing mode effect will handle brush re-initialization
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, gameState.roundNumber, gameState.isGameActive, isMultiplayer]);

  // Update brush properties when tool or color changes
  // Update drawing mode and brush configuration based on game state
  useEffect(() => {
    if (!fabricCanvas?.freeDrawingBrush) return;

    if (!fabricCanvas) {
      console.log('[Canvas] Drawing mode effect: canvas not ready yet', {
        hasCanvas: false,
        isGameActive: gameState.isGameActive,
        isDrawer: gameState.isDrawer,
        canvasInstanceExists: !!canvasInstanceRef.current
      });
      return;
    }

    const shouldBeDrawing = isMultiplayer 
      ? (gameState.isGameActive && gameState.isDrawer)
      : true;

    console.log('[Canvas] Drawing mode effect triggered', {
      shouldBeDrawing,
      isMultiplayer,
      isGameActive: gameState.isGameActive,
      isDrawer: gameState.isDrawer,
      currentDrawingMode: fabricCanvas.isDrawingMode,
      hasBrush: !!fabricCanvas.freeDrawingBrush,
      canvasWidth: fabricCanvas.width,
      canvasHeight: fabricCanvas.height
    });

    if (shouldBeDrawing) {
      // Use requestAnimationFrame to ensure canvas is fully rendered before enabling drawing mode
      // This is critical - Fabric.js needs the canvas DOM to be stable before attaching event handlers
      requestAnimationFrame(() => {
        if (!fabricCanvas) return;

        // ALWAYS recreate brush when enabling drawing mode
        // This ensures it's fresh and properly initialized
        console.log('[Canvas] Creating new brush and enabling drawing mode');
        fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
        
        // Apply brush properties based on current tool
    if (activeTool === "erase") {
      fabricCanvas.freeDrawingBrush.color = "#ffffff";
      fabricCanvas.freeDrawingBrush.width = brushSize * 2;
    } else {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }
        
        console.log('[Canvas] Brush configured', {
          color: fabricCanvas.freeDrawingBrush.color,
          width: fabricCanvas.freeDrawingBrush.width,
          tool: activeTool
        });
        
        // Enable drawing mode AFTER brush is configured
        fabricCanvas.isDrawingMode = true;
        
        // Force a render to ensure Fabric.js attaches event handlers
        fabricCanvas.renderAll();
        
        // Wait one more frame to ensure event handlers are fully attached
        // This is the key fix - gives Fabric.js time to initialize its internal state
        requestAnimationFrame(() => {
          if (!fabricCanvas) return;
          
          // Verify drawing mode is still enabled (Fabric.js might have disabled it)
          if (!fabricCanvas.isDrawingMode) {
            console.warn('[Canvas] Drawing mode was disabled, re-enabling...');
            fabricCanvas.isDrawingMode = true;
            fabricCanvas.renderAll();
          }
          
          console.log('[Canvas] Drawing mode enabled (verified)', {
            isDrawingMode: fabricCanvas.isDrawingMode,
            brushType: fabricCanvas.freeDrawingBrush?.constructor?.name,
            canvasWidth: fabricCanvas.width,
            canvasHeight: fabricCanvas.height,
            hasBrush: !!fabricCanvas.freeDrawingBrush,
            brushReady: fabricCanvas.freeDrawingBrush !== null
          });
        });
      });
    } else {
      // Disable drawing mode for guessers
      console.log('[Canvas] Disabling drawing mode (not drawer)');
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.renderAll();
    }

    if (!gameState.isGameActive && isMultiplayer) {
      lastRoundRef.current = 0;
    }
  }, [
    fabricCanvas, 
    gameState.isDrawer, 
    gameState.isGameActive, 
    isMultiplayer, 
    activeTool, 
    activeColor, 
    brushSize
  ]);

  // Send drawing events (drawer only)
  useEffect(() => {
    if (!fabricCanvas || !gameState.isDrawer || !gameState.isGameActive || !isMultiplayer) {
      console.log('[Canvas] Not setting up drawing event handler', {
        hasCanvas: !!fabricCanvas,
        isDrawer: gameState.isDrawer,
        isGameActive: gameState.isGameActive,
        isMultiplayer
      });
      return;
    }

    console.log('[Canvas] Setting up path:created event handler for drawer');

    const handlePathCreated = (e: { path: FabricObject }) => {
      if (isReceivingRef.current) return; // Prevent echo

      if (isReceivingRef.current) {
        console.log('[Canvas] Ignoring path:created (receiving)');
        return; // Prevent echo
      }
      
      const path = e.path;
      const pathData = path.toJSON();
      
      console.log('[Canvas] Path created!', {
        pathType: path.type,
        pathData
      });
      
      sendDrawingEvent({
        type: "path",
        data: pathData,
      });
      
      console.log('[Canvas] Drawing event sent via socket');
    };

    fabricCanvas.on("path:created", handlePathCreated);

    // Listen for mouse events to debug drawing
    const handleMouseDown = (e: any) => {
      const nativeEvent = e.e as MouseEvent | undefined;
      console.log('[Canvas] Mouse down event', {
        pointer: e.pointer,
        isDrawingMode: fabricCanvas.isDrawingMode,
        button: nativeEvent?.button,
        buttons: nativeEvent?.buttons
      });
    };

    const handleMouseMove = (e: any) => {
      const nativeEvent = e.e as MouseEvent | undefined;
      if (fabricCanvas.isDrawingMode && nativeEvent?.buttons === 1) {
        console.log('[Canvas] Mouse move while drawing', {
          pointer: e.pointer
        });
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      console.log('[Canvas] Cleaning up drawing event handlers');
      fabricCanvas.off("path:created", handlePathCreated);
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
    };
  }, [fabricCanvas, gameState.isDrawer, gameState.isGameActive, sendDrawingEvent, isMultiplayer]);

  // Receive drawing events (guessers only)
  useEffect(() => {
    if (!fabricCanvas || gameState.isDrawer || !gameState.isGameActive || !isMultiplayer) return;

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
            version: "6.9.0",
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
  }, [fabricCanvas, gameState.isDrawer, gameState.isGameActive, isMultiplayer]);

  const handleToolChange = (tool: "draw" | "erase") => {
    if (isMultiplayer && !gameState.isDrawer) return;
    setActiveTool(tool);
    toast.info(tool === "draw" ? "Brush selected" : "Eraser selected");
  };

  const handleUndo = () => {
    if (!fabricCanvas || (isMultiplayer && !gameState.isDrawer)) return;
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
      fabricCanvas.renderAll();
      toast.info("Undo");
    }
  };

  const handleClear = () => {
    if (!fabricCanvas || (isMultiplayer && !gameState.isDrawer)) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    if (isMultiplayer) {
      clearCanvas();
    }
    toast.success("Canvas cleared!");
  };

  if (isMultiplayer && !gameState.isGameActive) {
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
    <div className="flex flex-col gap-6 w-full px-0 md:px-2">
      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full max-w-3xl mx-auto p-4 bg-muted rounded-lg text-xs font-mono">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <strong>Canvas Ready:</strong> {isCanvasReady ? '✅' : '⏳'}
            </div>
            <div>
              <strong>Drawing Mode:</strong> {fabricCanvas?.isDrawingMode ? '✅' : '❌'}
            </div>
            <div>
              <strong>Has Brush:</strong> {fabricCanvas?.freeDrawingBrush ? '✅' : '❌'}
            </div>
            <div>
              <strong>Is Drawer:</strong> {gameState.isDrawer ? '✅' : '❌'}
            </div>
            <div>
              <strong>Game Active:</strong> {gameState.isGameActive ? '✅' : '❌'}
            </div>
            <div>
              <strong>Multiplayer:</strong> {isMultiplayer ? '✅' : '❌'}
            </div>
            <div>
              <strong>Round:</strong> {gameState.roundNumber}
            </div>
            <div>
              <strong>Canvas Size:</strong> {fabricCanvas ? `${Math.round(fabricCanvas.width)}x${Math.round(fabricCanvas.height)}` : 'N/A'}
            </div>
            <div>
              <strong>Objects:</strong> {fabricCanvas?.getObjects().length || 0}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto">
        <Toolbar
          activeTool={activeTool}
          brushSize={brushSize}
          onToolChange={handleToolChange}
          onBrushSizeChange={setBrushSize}
          onUndo={handleUndo}
          onClear={handleClear}
          disabled={isMultiplayer && !gameState.isDrawer}
        />
      </div>
      
      <div
        ref={containerRef}
        className="relative w-full max-w-3xl mx-auto rounded-2xl shadow-strong overflow-hidden border-4 border-border bg-canvas-bg"
        style={{ touchAction: 'none' }}
      >
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full" 
          style={{ 
            cursor: (isMultiplayer && !gameState.isDrawer) ? 'default' : 'crosshair',
            touchAction: 'none'
          }}
        />
        {isMultiplayer && !gameState.isDrawer && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px] pointer-events-none z-10">
            <div className="bg-background/90 px-4 py-2 rounded-lg border">
              <p className="text-lg font-semibold">Watch and guess the word!</p>
            </div>
          </div>
        )}
      </div>

      {(isMultiplayer ? gameState.isDrawer : true) && (
        <div className="w-full max-w-3xl mx-auto">
        <ColorPalette activeColor={activeColor} onColorChange={setActiveColor} />
      </div>
      )}
    </div>
  );
};