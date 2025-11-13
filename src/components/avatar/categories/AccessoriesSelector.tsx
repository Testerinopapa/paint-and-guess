import { OptionGrid } from "./OptionGrid";
import {
  ACCESSORY_HATS,
  ACCESSORY_GLASSES,
  ACCESSORY_OTHER,
} from "@/lib/avatar/categories/assets";
import { Label } from "@/components/ui/label";
import { AvatarConfig } from "@/lib/avatar/config";

interface AccessoriesSelectorProps {
  config: AvatarConfig;
  onUpdate: (updates: Partial<AvatarConfig['accessories']>) => void;
}

export function AccessoriesSelector({ config, onUpdate }: AccessoriesSelectorProps) {
  const handleHatSelect = (id: string) => {
    const newValue = id === config.accessories.hat ? null : id;
    console.debug('[AccessoriesSelector] Hat selected', { 
      id, 
      previousHat: config.accessories.hat,
      newHat: newValue,
      action: newValue ? 'added' : 'removed'
    });
    onUpdate({ hat: newValue });
  };

  const handleGlassesSelect = (id: string) => {
    const newValue = id === config.accessories.glasses ? null : id;
    console.debug('[AccessoriesSelector] Glasses selected', { 
      id, 
      previousGlasses: config.accessories.glasses,
      newGlasses: newValue,
      action: newValue ? 'added' : 'removed'
    });
    onUpdate({ glasses: newValue });
  };

  const handleOtherSelect = (id: string) => {
    const current = config.accessories.other || [];
    const updated = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    console.debug('[AccessoriesSelector] Other accessory selected', { 
      id, 
      previousOther: current,
      newOther: updated,
      action: current.includes(id) ? 'removed' : 'added'
    });
    onUpdate({ other: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-2 block">Hats</Label>
        <OptionGrid
          options={ACCESSORY_HATS}
          selectedId={config.accessories.hat}
          onSelect={handleHatSelect}
          columns={5}
          category="accessory-hat"
        />
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Glasses</Label>
        <OptionGrid
          options={ACCESSORY_GLASSES}
          selectedId={config.accessories.glasses}
          onSelect={handleGlassesSelect}
          columns={5}
          category="accessory-glasses"
        />
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">Other Accessories</Label>
        <OptionGrid
          options={ACCESSORY_OTHER}
          selectedId={null}
          onSelect={handleOtherSelect}
          columns={5}
        />
        {config.accessories.other && config.accessories.other.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Selected: {config.accessories.other.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

