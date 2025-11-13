import { useState, useEffect } from "react";
import { AssetOption } from "@/lib/avatarAssets";
import { cn } from "@/lib/utils";
import { generateOptionPreview } from "@/lib/avatarOptionPreview";
import { getCachedSprite, setCachedSprite, generateSpriteKey } from "@/lib/avatarSpriteCache";

interface OptionGridProps {
  options: AssetOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  columns?: number;
  showLabels?: boolean;
  category: string; // Category for sprite generation (e.g., 'hair-style', 'skin-tone')
  spriteSize?: number; // Size of sprite preview (default: 48)
}

export function OptionGrid({
  options,
  selectedId,
  onSelect,
  columns = 5,
  showLabels = false,
  category,
  spriteSize = 48,
}: OptionGridProps) {
  // Store sprite data URIs for each option
  const [sprites, setSprites] = useState<Record<string, string>>({});
  const [loadingSprites, setLoadingSprites] = useState<Set<string>>(new Set());

  // Load sprites for all options
  useEffect(() => {
    const loadSprites = async () => {
      const newSprites: Record<string, string> = {};
      const loading = new Set<string>();

      for (const option of options) {
        const cacheKey = generateSpriteKey(category, option.id, spriteSize);
        const cached = getCachedSprite(cacheKey);
        
        if (cached) {
          newSprites[option.id] = cached;
        } else {
          loading.add(option.id);
          try {
            const sprite = generateOptionPreview(category, option.id, spriteSize);
            setCachedSprite(cacheKey, sprite);
            newSprites[option.id] = sprite;
            loading.delete(option.id);
          } catch (error) {
            console.error(`[OptionGrid] Failed to load sprite for ${option.id}:`, error);
            loading.delete(option.id);
          }
        }
      }

      setSprites(newSprites);
      setLoadingSprites(loading);
    };

    loadSprites();
  }, [options, category, spriteSize]);

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const sprite = sprites[option.id];
        const isLoading = loadingSprites.has(option.id);
        const hasSprite = !!sprite;

        return (
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
            {hasSprite ? (
              <img
                src={sprite}
                alt={option.name}
                className="w-full h-full object-contain rounded"
                style={{ imageRendering: 'crisp-edges' }}
              />
            ) : isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              // Fallback to emoji if sprite fails to load
              option.emoji && (
                <span className="text-3xl mb-1">{option.emoji}</span>
              )
            )}
            {showLabels && (
              <span className="text-xs text-center mt-1">{option.name}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

