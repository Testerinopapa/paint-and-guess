import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

interface ColorPaletteProps {
  activeColor: string;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#EF4444", // Red
  "#F97316", // Orange
  "#EAB308", // Yellow
  "#22C55E", // Green
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#A855F7", // Violet
  "#F59E0B", // Amber
];

export const ColorPalette = ({ activeColor, onColorChange }: ColorPaletteProps) => {
  const [customColor, setCustomColor] = useState(activeColor);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setCustomColor(color);
    
    // Add to recent colors
    if (!recentColors.includes(color)) {
      setRecentColors((prev) => [color, ...prev].slice(0, 6));
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorChange(color);
    handleColorSelect(color);
  };

  return (
    <div className="bg-toolbar-bg rounded-2xl p-4 md:p-6 shadow-medium border border-border">
      <div className="space-y-4">
        {/* Preset Colors */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-foreground">Colors</h3>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className="relative w-full aspect-square rounded-xl transition-all hover:scale-110 active:scale-95 shadow-soft"
                style={{
                  backgroundColor: color,
                  border: color === "#FFFFFF" ? "2px solid #e5e7eb" : "none",
                }}
              >
                {activeColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check
                      className="w-5 h-5"
                      style={{ color: color === "#FFFFFF" || color === "#EAB308" ? "#000000" : "#FFFFFF" }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Colors */}
        {recentColors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Recent</h3>
            <div className="flex gap-2 flex-wrap">
              {recentColors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  onClick={() => handleColorSelect(color)}
                  className="relative w-12 h-12 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-soft"
                  style={{ backgroundColor: color }}
                >
                  {activeColor === color && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Color Picker */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-foreground">Custom Color</h3>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-20 h-12 cursor-pointer rounded-xl border-2"
              />
            </div>
            <Input
              type="text"
              value={customColor.toUpperCase()}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-F]{0,6}$/i.test(value)) {
                  setCustomColor(value);
                  if (value.length === 7) {
                    onColorChange(value);
                    handleColorSelect(value);
                  }
                }
              }}
              className="font-mono uppercase"
              placeholder="#000000"
              maxLength={7}
            />
          </div>
        </div>

        {/* Active Color Preview */}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground">Active:</span>
          <div
            className="w-10 h-10 rounded-full shadow-medium border-2 border-border"
            style={{ backgroundColor: activeColor }}
          />
          <span className="font-mono text-sm font-medium">{activeColor.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
