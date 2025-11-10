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
}

export const Toolbar = ({
  activeTool,
  brushSize,
  onToolChange,
  onBrushSizeChange,
  onUndo,
  onClear,
}: ToolbarProps) => {
  return (
    <div className="bg-toolbar-bg rounded-2xl p-4 md:p-6 shadow-medium border border-border">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
        {/* Drawing Tools */}
        <div className="flex gap-2">
          <Button
            variant={activeTool === "draw" ? "default" : "outline"}
            size="lg"
            onClick={() => onToolChange("draw")}
            className="gap-2 transition-all hover:scale-105"
          >
            <Paintbrush className="w-5 h-5" />
            <span className="hidden sm:inline">Brush</span>
          </Button>
          <Button
            variant={activeTool === "erase" ? "default" : "outline"}
            size="lg"
            onClick={() => onToolChange("erase")}
            className="gap-2 transition-all hover:scale-105"
          >
            <Eraser className="w-5 h-5" />
            <span className="hidden sm:inline">Eraser</span>
          </Button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-sm font-medium whitespace-nowrap">Size:</span>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            min={1}
            max={50}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-8 text-center">{brushSize}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={onUndo}
            className="gap-2 transition-all hover:scale-105"
          >
            <Undo className="w-5 h-5" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={onClear}
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
