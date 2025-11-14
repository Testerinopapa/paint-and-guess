import { OptionGrid } from "./OptionGrid";
import { Label } from "@/components/ui/label";
import { AvatarConfig } from "@/lib/avatar/config";

interface AccessoriesSelectorProps {
  config: AvatarConfig;
  onUpdate: (updates: Partial<AvatarConfig['accessories']>) => void;
}

// Simplified accessory options matching reference
const ACCESSORY_OPTIONS = [
  { id: 'none', name: 'None', emoji: '' },
  { id: 'glasses', name: 'Glasses', emoji: '👓' },
  { id: 'hat', name: 'Hat', emoji: '🎩' },
  { id: 'earrings', name: 'Earrings', emoji: '💍' },
];

export function AccessoriesSelector({ config, onUpdate }: AccessoriesSelectorProps) {
  // Determine current accessory type
  const getCurrentAccessory = (): string => {
    if (config.accessories.glasses) return 'glasses';
    if (config.accessories.hat) return 'hat';
    // Check if earrings is in other array
    if (config.accessories.other && config.accessories.other.includes('earrings')) {
      return 'earrings';
    }
    return 'none';
  };

  const handleAccessorySelect = (id: string) => {
    const newValue = id === getCurrentAccessory() ? 'none' : id;
    
    console.debug('[AccessoriesSelector] Accessory selected', { 
      id, 
      newValue,
      previous: getCurrentAccessory()
    });

    // Clear all accessories first
    const updates: Partial<AvatarConfig['accessories']> = {
      hat: null,
      glasses: null,
      other: [],
    };

    // Set the selected accessory
    if (newValue === 'glasses') {
      updates.glasses = 'regular'; // Use a default glasses ID
    } else if (newValue === 'hat') {
      updates.hat = 'cap'; // Use a default hat ID
    } else if (newValue === 'earrings') {
      updates.other = ['earrings'];
    }

    onUpdate(updates);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Accessory</Label>
      <OptionGrid
        options={ACCESSORY_OPTIONS}
        selectedId={getCurrentAccessory()}
        onSelect={handleAccessorySelect}
        columns={2}
        category="accessory"
      />
    </div>
  );
}

