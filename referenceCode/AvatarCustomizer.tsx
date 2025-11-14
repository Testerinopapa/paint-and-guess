import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvatarPreview } from "./AvatarPreview";
import { CategoryButton } from "./CategoryButton";
import { ColorPicker } from "./ColorPicker";
import { OptionSelector } from "./OptionSelector";
import { AvatarConfig, defaultAvatar, CustomizationCategory } from "@/types/avatar";
import { Palette, Shirt, Sparkles, Eye, User, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AvatarCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConfig?: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
}

const skinTones = ['#F5C097', '#E5A872', '#C68642', '#8D5524', '#613E26'];
const hairColors = ['#4A2C2A', '#6B4423', '#8B572A', '#D4A76A', '#E8D4B0', '#1C1C1C'];
const clothingColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const categories = [
  { id: 'skin' as CustomizationCategory, label: 'Skin', icon: Palette },
  { id: 'hair' as CustomizationCategory, label: 'Hair', icon: User },
  { id: 'clothes' as CustomizationCategory, label: 'Clothes', icon: Shirt },
  { id: 'accessories' as CustomizationCategory, label: 'Accessories', icon: Sparkles },
  { id: 'face' as CustomizationCategory, label: 'Face', icon: Smile },
];

export const AvatarCustomizer = ({ open, onOpenChange, initialConfig, onSave }: AvatarCustomizerProps) => {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig || defaultAvatar);
  const [activeCategory, setActiveCategory] = useState<CustomizationCategory>('skin');

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-subtle">
          <DialogTitle className="text-2xl font-bold">Customize Your Avatar</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Live Preview Section */}
          <div className="w-2/5 bg-[var(--preview-bg)] flex flex-col items-center justify-center p-8 border-r">
            <div className="text-center space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
              <div className="bg-card rounded-2xl p-8 shadow-strong">
                <AvatarPreview config={config} size={240} />
              </div>
            </div>
          </div>

          {/* Customization Options Section */}
          <div className="flex-1 flex flex-col">
            {/* Category Navigation */}
            <div className="border-b p-4 bg-card">
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <CategoryButton
                    key={category.id}
                    icon={category.icon}
                    label={category.label}
                    isActive={activeCategory === category.id}
                    onClick={() => setActiveCategory(category.id)}
                  />
                ))}
              </div>
            </div>

            {/* Options Panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">
              {activeCategory === 'skin' && (
                <ColorPicker
                  label="Skin Tone"
                  colors={skinTones}
                  selectedColor={config.skinTone}
                  onColorChange={(color) => setConfig({ ...config, skinTone: color })}
                />
              )}

              {activeCategory === 'hair' && (
                <div className="space-y-6">
                  <OptionSelector
                    label="Hair Style"
                    options={[
                      { value: 'short', label: 'Short' },
                      { value: 'long', label: 'Long' },
                      { value: 'curly', label: 'Curly' },
                    ]}
                    selectedOption={config.hairStyle}
                    onOptionChange={(value) => setConfig({ ...config, hairStyle: value })}
                  />
                  <ColorPicker
                    label="Hair Color"
                    colors={hairColors}
                    selectedColor={config.hairColor}
                    onColorChange={(color) => setConfig({ ...config, hairColor: color })}
                  />
                </div>
              )}

              {activeCategory === 'clothes' && (
                <ColorPicker
                  label="Clothing Color"
                  colors={clothingColors}
                  selectedColor={config.topColor}
                  onColorChange={(color) => setConfig({ ...config, topColor: color })}
                />
              )}

              {activeCategory === 'accessories' && (
                <OptionSelector
                  label="Accessory"
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'glasses', label: 'Glasses' },
                    { value: 'hat', label: 'Hat' },
                    { value: 'earrings', label: 'Earrings' },
                  ]}
                  selectedOption={config.accessoryType}
                  onOptionChange={(value) => setConfig({ ...config, accessoryType: value })}
                />
              )}

              {activeCategory === 'face' && (
                <div className="space-y-6">
                  <OptionSelector
                    label="Eyes"
                    options={[
                      { value: 'default', label: 'Default' },
                      { value: 'happy', label: 'Happy' },
                      { value: 'surprised', label: 'Surprised' },
                    ]}
                    selectedOption={config.eyeType}
                    onOptionChange={(value) => setConfig({ ...config, eyeType: value })}
                  />
                  <OptionSelector
                    label="Eyebrows"
                    options={[
                      { value: 'default', label: 'Default' },
                      { value: 'raised', label: 'Raised' },
                      { value: 'angry', label: 'Angry' },
                    ]}
                    selectedOption={config.eyebrowType}
                    onOptionChange={(value) => setConfig({ ...config, eyebrowType: value })}
                  />
                  <OptionSelector
                    label="Mouth"
                    options={[
                      { value: 'smile', label: 'Smile' },
                      { value: 'neutral', label: 'Neutral' },
                      { value: 'laugh', label: 'Laugh' },
                    ]}
                    selectedOption={config.mouthType}
                    onOptionChange={(value) => setConfig({ ...config, mouthType: value })}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t p-4 bg-card flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-primary"
              >
                Save Avatar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
