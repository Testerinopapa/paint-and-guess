import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AvatarConfig } from "@/lib/avatar/config";

interface ClothesSelectorProps {
  config: AvatarConfig;
  onUpdate: (updates: Partial<AvatarConfig['clothes']>) => void;
}

export function ClothesSelector({ config, onUpdate }: ClothesSelectorProps) {
  const handleColorChange = (color: string) => {
    console.debug('[ClothesSelector] Color changed', { 
      color, 
      previousColor: config.clothes.color,
      isValid: /^#[0-9A-F]{6}$/i.test(color)
    });
    onUpdate({ color });
  };

  return (
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
  );
}
