import { OptionGrid } from "./OptionGrid";
import { CLOTHING_TOPS, CLOTHING_BOTTOMS, CLOTHING_OUTFITS } from "@/lib/avatar/categories/assets";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AvatarConfig } from "@/lib/avatar/config";

interface ClothesSelectorProps {
  config: AvatarConfig;
  onUpdate: (updates: Partial<AvatarConfig['clothes']>) => void;
}

export function ClothesSelector({ config, onUpdate }: ClothesSelectorProps) {
  const handleTopSelect = (id: string) => {
    console.debug('[ClothesSelector] Top selected', { 
      id, 
      previousTop: config.clothes.top,
      clearingOutfit: true 
    });
    onUpdate({ top: id, outfit: null });
  };

  const handleBottomSelect = (id: string) => {
    console.debug('[ClothesSelector] Bottom selected', { 
      id, 
      previousBottom: config.clothes.bottom,
      clearingOutfit: true 
    });
    onUpdate({ bottom: id, outfit: null });
  };

  const handleOutfitSelect = (id: string) => {
    console.debug('[ClothesSelector] Outfit selected', { 
      id, 
      previousOutfit: config.clothes.outfit,
      clearingTopBottom: true 
    });
    onUpdate({ outfit: id, top: null, bottom: null });
  };

  const handleColorChange = (color: string) => {
    console.debug('[ClothesSelector] Color changed', { 
      color, 
      previousColor: config.clothes.color,
      isValid: /^#[0-9A-F]{6}$/i.test(color)
    });
    onUpdate({ color });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-2 block">Full Outfits</Label>
        <OptionGrid
          options={CLOTHING_OUTFITS}
          selectedId={config.clothes.outfit}
          onSelect={handleOutfitSelect}
          columns={5}
          category="clothing-outfit"
        />
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Tops</Label>
        <OptionGrid
          options={CLOTHING_TOPS}
          selectedId={config.clothes.top}
          onSelect={handleTopSelect}
          columns={5}
          category="clothing-top"
        />
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Bottoms</Label>
        <OptionGrid
          options={CLOTHING_BOTTOMS}
          selectedId={config.clothes.bottom}
          onSelect={handleBottomSelect}
          columns={5}
          category="clothing-bottom"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Clothing Color</Label>
        <div className="flex gap-3 items-center">
          <Input
            type="color"
            value={config.clothes.color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-20 h-12 cursor-pointer rounded-xl border-2"
          />
          <Input
            type="text"
            value={config.clothes.color.toUpperCase()}
            onChange={(e) => {
              const value = e.target.value;
              if (/^#[0-9A-F]{0,6}$/i.test(value) && value.length === 7) {
                handleColorChange(value);
              }
            }}
            className="font-mono uppercase"
            placeholder="#3B82F6"
            maxLength={7}
          />
        </div>
      </div>
    </div>
  );
}

