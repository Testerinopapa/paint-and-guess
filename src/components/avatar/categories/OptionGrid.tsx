import { AssetOption } from "@/lib/avatar/categories/assets";
import { cn } from "@/lib/utils";

interface OptionGridProps {
  options: AssetOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  columns?: number;
  showLabels?: boolean;
  category: string; // Category identifier (for future use)
}

export function OptionGrid({
  options,
  selectedId,
  onSelect,
  columns = 5,
  showLabels = false,
  category,
}: OptionGridProps) {

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            "aspect-square rounded-lg border-2 p-2 transition-all hover:scale-110 hover:border-primary flex flex-col items-center justify-center overflow-hidden",
            selectedId === option.id
              ? "border-primary bg-primary/10"
              : "border-border hover:bg-accent"
          )}
          title={option.name}
        >
          {option.emoji && (
            <span className="text-3xl mb-1">{option.emoji}</span>
          )}
          {showLabels && (
            <span className="text-xs text-center mt-1">{option.name}</span>
          )}
        </button>
      ))}
    </div>
  );
}

