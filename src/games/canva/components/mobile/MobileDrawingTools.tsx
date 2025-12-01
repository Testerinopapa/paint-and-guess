import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";

interface MobileDrawingToolsProps {
  color: string;
  brushSize: number;
  canDraw: boolean;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo?: () => void;
}

export function MobileDrawingTools({
  color,
  brushSize,
  canDraw,
  onColorChange,
  onBrushSizeChange,
  onUndo,
}: MobileDrawingToolsProps) {
  return (
    <div className="fixed top-14 left-0 right-0 h-16 bg-card border-b z-40 flex items-center gap-3 px-4">
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-12 h-12 rounded border-2 border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canDraw}
        />
      </div>
      <div className="flex-1 flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Size:</label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canDraw}
        />
        <span className="text-sm font-semibold w-8 text-center">{brushSize}</span>
      </div>
      {canDraw && onUndo && (
        <Button variant="outline" size="sm" onClick={onUndo} className="h-9">
          <Undo2 className="w-4 h-4 mr-1" />
          Undo
        </Button>
      )}
    </div>
  );
}

