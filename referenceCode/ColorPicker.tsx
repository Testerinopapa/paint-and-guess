import { cn } from "@/lib/utils";

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  label: string;
}

export const ColorPicker = ({ colors, selectedColor, onColorChange, label }: ColorPickerProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={cn(
              "w-10 h-10 rounded-full border-2 transition-all duration-200",
              "hover:scale-110 active:scale-95",
              selectedColor === color
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-border hover:border-muted-foreground"
            )}
            style={{ backgroundColor: color }}
            aria-label={`Select ${color}`}
            aria-pressed={selectedColor === color}
          />
        ))}
      </div>
    </div>
  );
};
