import { useState, useEffect } from "react";
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
] as const;

const RECENT_COLORS_MAX = 6;
const STORAGE_KEY = "paint-and-guess-recent-colors";

// Validate hex color format
const isValidHexColor = (value: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(value);
};

export const ColorPalette = ({ activeColor, onColorChange }: ColorPaletteProps) => {
  // Sync customColor with activeColor prop
  const [customColor, setCustomColor] = useState(activeColor);
  
  // Load recent colors from localStorage
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync customColor when activeColor prop changes
  useEffect(() => {
    setCustomColor(activeColor);
  }, [activeColor]);

  // Persist recent colors to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentColors));
    } catch (error) {
      console.debug("[ColorPalette] Failed to save recent colors:", error);
    }
  }, [recentColors]);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setCustomColor(color);
    
    // Add to recent colors (remove if already exists, then add to front)
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      return [color, ...filtered].slice(0, RECENT_COLORS_MAX);
    });
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    
    // Only update active color if valid
    if (isValidHexColor(color)) {
      onColorChange(color);
      // Add to recent colors without calling handleColorSelect (avoid double call)
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c !== color);
        return [color, ...filtered].slice(0, RECENT_COLORS_MAX);
      });
    }
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
                aria-label={`Select color ${color}`}
                aria-pressed={activeColor === color}
                className="relative w-full aspect-square rounded-xl transition-all hover:scale-110 active:scale-95 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
        <div>
          <h3 className="text-sm font-semibold mb-3 text-foreground">Recent</h3>
          {recentColors.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {recentColors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  onClick={() => handleColorSelect(color)}
                  aria-label={`Select recent color ${color}`}
                  aria-pressed={activeColor === color}
                  className="relative w-12 h-12 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
          ) : (
            <div className="text-sm text-muted-foreground">No recent colors yet</div>
          )}
        </div>

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
                aria-label="Color picker"
              />
            </div>
            <Input
              type="text"
              value={customColor.toUpperCase()}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                // Allow empty or partial hex codes while typing
                if (value === "" || /^#[0-9A-F]{0,6}$/i.test(value)) {
                  setCustomColor(value);
                  // Only apply if valid complete hex color
                  if (isValidHexColor(value)) {
                    onColorChange(value);
                    // Add to recent colors without calling handleColorSelect (avoid double call)
                    setRecentColors((prev) => {
                      const filtered = prev.filter((c) => c !== value);
                      return [value, ...filtered].slice(0, RECENT_COLORS_MAX);
                    });
                  }
                }
              }}
              className="font-mono uppercase"
              placeholder="#000000"
              maxLength={7}
              aria-label="Custom color hex code"
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
