import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Paintbrush, Eraser, Undo, Trash2 } from "lucide-react";

interface ToolbarProps {
  activeTool: "draw" | "erase";
  brushSize: number;
  onToolChange: (tool: "draw" | "erase") => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export const Toolbar = ({
  activeTool,
  brushSize,
  onToolChange,
  onBrushSizeChange,
  onUndo,
  onClear,
  disabled = false,
}: ToolbarProps) => {
  return (
    <div className="bg-toolbar-bg rounded-2xl p-4 md:p-6 shadow-medium border border-border opacity-90 w-full max-w-full min-w-0 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full min-w-0">
        {/* Drawing Tools */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant={activeTool === "draw" ? "default" : "outline"}
            size="lg"
            onClick={() => onToolChange("draw")}
            disabled={disabled}
            aria-label="Brush tool"
            aria-pressed={activeTool === "draw"}
            className="gap-2 transition-all hover:scale-105"
          >
            <Paintbrush className="w-5 h-5" />
            <span className="hidden sm:inline">Brush</span>
            <span className="sr-only"> (Press B)</span>
          </Button>
          <Button
            variant={activeTool === "erase" ? "default" : "outline"}
            size="lg"
            onClick={() => onToolChange("erase")}
            disabled={disabled}
            aria-label="Eraser tool"
            aria-pressed={activeTool === "erase"}
            className="gap-2 transition-all hover:scale-105"
          >
            <Eraser className="w-5 h-5" />
            <span className="hidden sm:inline">Eraser</span>
            <span className="sr-only"> (Press E)</span>
          </Button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-3 flex-1 min-w-0 w-full md:w-auto">
          <span className="text-sm font-medium whitespace-nowrap flex-shrink-0">Size:</span>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            min={1}
            max={50}
            step={1}
            disabled={disabled}
            className="flex-1 min-w-0"
            aria-label="Brush size"
            aria-valuemin={1}
            aria-valuemax={50}
            aria-valuenow={brushSize}
          />
          <span className="text-sm font-medium w-8 text-center flex-shrink-0">{brushSize}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="lg"
            onClick={onUndo}
            disabled={disabled}
            aria-label="Undo last action"
            className="gap-2 transition-all hover:scale-105"
          >
            <Undo className="w-5 h-5" />
            <span className="hidden sm:inline">Undo</span>
            <span className="sr-only"> (Press Ctrl+U or Cmd+U)</span>
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={onClear}
            disabled={disabled}
            aria-label="Clear canvas"
            className="gap-2 transition-all hover:scale-105"
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
