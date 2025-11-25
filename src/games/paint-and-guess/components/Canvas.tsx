import { useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { ColorPalette } from "./ColorPalette";
import { useGame } from "@/games/paint-and-guess";
import { toast } from "sonner";
import { useCanvasLifecycle } from "./canvas/useCanvasLifecycle";
import { useCanvasDrawing } from "./canvas/useCanvasDrawing";
import { useCanvasSync } from "./canvas/useCanvasSync";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [activeTool, setActiveTool] = useState<"draw" | "erase">("draw");
  const { gameState, isDrawer, isGameActive, sendDrawingEvent, clearCanvas } = useGame();
  const isReceivingRef = useRef(false);
  
  // Canvas lifecycle management
  const { fabricCanvas, isCanvasValid } = useCanvasLifecycle({
    canvasRef,
    containerRef,
    isDrawer,
    isGameActive,
    activeColor,
    brushSize,
    activeTool,
  });
  
  // Drawing functionality
  const { handleUndo, handleClear } = useCanvasDrawing({
    fabricCanvas,
    isDrawer,
    isGameActive,
    activeTool,
    activeColor,
    brushSize,
    sendDrawingEvent,
    isCanvasValid,
    isReceivingRef,
  });
  
  // Synchronization (receiving events, clearing)
  useCanvasSync({
    fabricCanvas,
    isDrawer,
    isGameActive,
    roundNumber: gameState.round.number,
    isCanvasValid,
    isReceivingRef,
  });

  const handleToolChange = (tool: "draw" | "erase") => {
    if (!isDrawer) return;
    setActiveTool(tool);
    toast.info(tool === "draw" ? "Brush selected" : "Eraser selected");
  };

  // Show waiting state when game is not active or during round transition
  if (!isGameActive || gameState.phase === "round-ended" || gameState.phase === "game-ended") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          {gameState.phase === "round-ended" ? (
            <>
              <p className="text-lg font-semibold mb-2">Round Complete!</p>
              <p className="text-muted-foreground">
                Next round starting soon...
              </p>
            </>
          ) : gameState.phase === "game-ended" ? (
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
    <div 
      ref={containerRef} 
      className="flex flex-col items-center gap-2 sm:gap-4 md:gap-6 p-2 sm:p-4 md:p-8 h-full w-full min-w-0 max-h-full overflow-hidden"
      style={{ minHeight: 0 }} // Ensure flex child can shrink
    >
      {/* Only show toolbar for drawers */}
      {isDrawer && (
        <div className="w-full min-w-0 max-w-full flex-shrink-0">
          <Toolbar
            activeTool={activeTool}
            brushSize={brushSize}
            onToolChange={handleToolChange}
            onBrushSizeChange={setBrushSize}
            onUndo={handleUndo}
            onClear={() => handleClear(clearCanvas)}
          />
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-center w-full min-h-0 min-w-0 max-h-full overflow-hidden" style={{ minHeight: 0 }}>
        <div className="rounded-lg sm:rounded-xl md:rounded-2xl shadow-strong overflow-hidden border-2 sm:border-4 border-border bg-canvas-bg relative max-w-full max-h-full">
          <canvas 
            ref={canvasRef} 
            className="max-w-full max-h-full"
            style={{ display: 'block' }} // Prevent inline spacing
          />
          {!isDrawer && (
            <div className="absolute top-1 sm:top-2 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
              <div className="bg-background/90 px-2 sm:px-4 py-1 sm:py-2 rounded-lg border shadow-lg">
                <p className="text-xs sm:text-sm font-semibold">Watch and guess the word!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isDrawer && (
        <div className="w-full min-w-0 max-w-full flex-shrink-0">
          <ColorPalette activeColor={activeColor} onColorChange={setActiveColor} />
        </div>
      )}
    </div>
  );
};