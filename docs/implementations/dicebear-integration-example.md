# DiceBear Integration - Practical Implementation Example

This document provides a concrete code example of how to integrate DiceBear into your avatar system.

## Step 1: Create DiceBear Mapper

```typescript
// src/lib/avatar/dicebear/mapper.ts

import { AvatarConfig } from "@/lib/avatar/config";
import type { StyleOptions } from "@dicebear/avataaars";

/**
 * Maps your AvatarConfig to DiceBear Avataaars options
 */
export function avatarConfigToDiceBearOptions(
  config: AvatarConfig
): StyleOptions<{}> {
  return {
    // Use config ID as seed for consistent generation
    seed: config.id,
    
    // Skin tone mapping
    skinColor: mapSkinTone(config.skinTone),
    
    // Hair style and color
    topType: mapHairStyle(config.hair.style),
    hairColor: mapHairColor(config.hair.color),
    
    // Clothing
    clotheType: mapClothingType(config.clothes),
    clotheColor: mapClothingColor(config.clothes.color),
    
    // Accessories
    accessoriesType: mapAccessories(config.accessories),
    glassesType: mapGlasses(config.accessories.glasses),
    
    // Facial features
    eyeType: mapEyeType(config.face.eyes),
    eyebrowType: mapEyebrowType(config.face.eyebrows),
    mouthType: mapMouthType(config.face.mouth),
    facialHairType: mapFacialHair(config.face.facialHair),
    facialHairColor: config.face.facialHair 
      ? mapHairColor(config.hair.color) 
      : undefined,
  };
}

// Mapping functions
function mapSkinTone(skinTone: string): string {
  const mapping: Record<string, string> = {
    '#FFDBAC': 'Pale',      // light
    '#F1C27D': 'Light',     // medium-light
    '#E0AC69': 'LightBrown', // medium
    '#C68642': 'Brown',     // medium-dark
    '#8D5524': 'DarkBrown', // dark
  };
  
  // Check if it's a preset ID
  if (!skinTone.startsWith('#')) {
    const colorMap: Record<string, string> = {
      light: 'Pale',
      'medium-light': 'Light',
      medium: 'LightBrown',
      'medium-dark': 'Brown',
      dark: 'DarkBrown',
    };
    return colorMap[skinTone] || 'Pale';
  }
  
  // Find closest match for hex colors
  return mapping[skinTone] || 'Pale';
}

function mapHairStyle(style: string): string {
  const mapping: Record<string, string> = {
    short: 'ShortHairShortCurly',
    medium: 'ShortHairShortFlat',
    long: 'LongHairStraight',
    curly: 'ShortHairShortCurly',
    wavy: 'LongHairWavy',
    bald: 'NoHair',
    bun: 'LongHairBun',
    ponytail: 'LongHairPonytail',
  };
  
  return mapping[style] || 'ShortHairShortCurly';
}

function mapHairColor(color: string): string {
  const mapping: Record<string, string> = {
    '#000000': 'Black',
    '#8B4513': 'Brown',
    '#FFD700': 'Blonde',
    '#A0522D': 'Auburn',
    '#808080': 'Gray',
    '#FFFFFF': 'Platinum',
  };
  
  if (!color.startsWith('#')) {
    const colorMap: Record<string, string> = {
      black: 'Black',
      brown: 'Brown',
      blonde: 'Blonde',
      red: 'Auburn',
      gray: 'Gray',
      white: 'Platinum',
    };
    return colorMap[color] || 'Black';
  }
  
  return mapping[color] || 'Black';
}

function mapClothingType(clothes: AvatarConfig['clothes']): string {
  if (clothes.outfit) {
    const outfitMap: Record<string, string> = {
      suit: 'BlazerShirt',
      uniform: 'Overall',
      costume: 'GraphicShirt',
      casual: 'Hoodie',
      formal: 'BlazerShirt',
    };
    return outfitMap[clothes.outfit] || 'Hoodie';
  }
  
  if (clothes.top) {
    const topMap: Record<string, string> = {
      tshirt: 'GraphicShirt',
      'dress-shirt': 'ShirtCrewNeck',
      'tank-top': 'ShirtScoopNeck',
      jacket: 'BlazerShirt',
      hoodie: 'Hoodie',
      sweater: 'ShirtCrewNeck',
    };
    return topMap[clothes.top] || 'Hoodie';
  }
  
  return 'Hoodie';
}

function mapClothingColor(color: string): string {
  // DiceBear uses color names, map hex to closest match
  const colorMap: Record<string, string> = {
    '#3B82F6': 'Blue01',
    '#EF4444': 'Red01',
    '#10B981': 'Green01',
    '#F59E0B': 'Orange01',
    '#8B5CF6': 'Purple01',
    '#000000': 'Black',
    '#FFFFFF': 'White',
  };
  
  // Simple hex to color name mapping
  // You can expand this with a proper color matching algorithm
  return colorMap[color] || 'Blue01';
}

function mapAccessories(accessories: AvatarConfig['accessories']): string {
  if (accessories.hat) {
    const hatMap: Record<string, string> = {
      cap: 'Hat',
      beanie: 'WinterHat1',
      fedora: 'Hat',
      helmet: 'Helmet',
      'graduation-cap': 'GraduationCap',
      crown: 'Turban',
    };
    return hatMap[accessories.hat] || 'Blank';
  }
  
  return 'Blank';
}

function mapGlasses(glasses: string | null): string {
  if (!glasses) return 'Blank';
  
  const mapping: Record<string, string> = {
    regular: 'Round',
    sunglasses: 'Kurt',
    goggles: 'Blank', // Not directly supported
    monocle: 'Blank', // Not directly supported
  };
  
  return mapping[glasses] || 'Blank';
}

function mapEyeType(eyes: string): string {
  const mapping: Record<string, string> = {
    default: 'Default',
    happy: 'Happy',
    surprised: 'Surprised',
    wink: 'Wink',
    sleepy: 'Sleep',
  };
  
  return mapping[eyes] || 'Default';
}

function mapEyebrowType(eyebrows: string): string {
  const mapping: Record<string, string> = {
    default: 'Default',
    raised: 'RaisedExcited',
    thick: 'Angry',
    thin: 'DefaultNatural',
    arched: 'RaisedExcitedNatural',
    angry: 'Angry',
  };
  
  return mapping[eyebrows] || 'Default';
}

function mapMouthType(mouth: string): string {
  const mapping: Record<string, string> = {
    smile: 'Smile',
    'big-smile': 'Smile',
    neutral: 'Default',
    default: 'Default',
    laugh: 'Smile',
  };
  
  return mapping[mouth] || 'Default';
}

function mapFacialHair(facialHair: string | null): string {
  if (!facialHair || facialHair === 'none') return 'Blank';
  
  const mapping: Record<string, string> = {
    mustache: 'Blank', // Not directly supported, use BeardMedium
    beard: 'BeardMedium',
    goatee: 'BeardLight',
  };
  
  return mapping[facialHair] || 'Blank';
}
```

## Step 2: Create DiceBear Preview Component

```typescript
// src/components/avatar/preview/AvatarPreviewDiceBear.tsx

import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { AvatarConfig } from "@/lib/avatar/config";
import { avatarConfigToDiceBearOptions } from "@/lib/avatar/dicebear/mapper";
import { useMemo } from "react";

interface AvatarPreviewDiceBearProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

/**
 * DiceBear-based avatar preview component
 * 
 * Renders avatar using DiceBear's Avataaars style.
 * Automatically maps AvatarConfig to DiceBear options.
 */
export function AvatarPreviewDiceBear({
  config,
  size = 200,
  className = "",
}: AvatarPreviewDiceBearProps) {
  const svg = useMemo(() => {
    try {
      const options = avatarConfigToDiceBearOptions(config);
      const avatar = createAvatar(avataaars, options);
      return avatar.toString();
    } catch (error) {
      console.error("Failed to generate DiceBear avatar:", error);
      // Return a fallback SVG
      return `<svg width="${size}" height="${size}" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="95" fill="#e0e0e0"/>
        <text x="100" y="110" text-anchor="middle" font-size="40">👤</text>
      </svg>`;
    }
  }, [config, size]);

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="img"
      aria-label={`Avatar preview: ${config.name || 'Custom avatar'}`}
    >
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        style={{ width: size, height: size }}
        className="animate-scale-in"
      />
    </div>
  );
}
```

## Step 3: Update Main Preview Component

```typescript
// src/components/avatar/preview/AvatarPreview.tsx

import { AvatarConfig } from "@/lib/avatar/config";
import { AvatarPreviewSVG } from "./AvatarPreviewSVG";
import { AvatarPreviewDiceBear } from "./AvatarPreviewDiceBear";

interface AvatarPreviewProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  renderer?: 'custom' | 'dicebear';
  activeCategory?: string;
}

/**
 * Avatar preview component with renderer selection
 * 
 * Supports both custom SVG rendering and DiceBear rendering.
 * Defaults to DiceBear for better visual quality.
 */
export function AvatarPreview({ 
  config, 
  size = 200, 
  className = "",
  renderer = 'dicebear', // Default to DiceBear
  activeCategory = 'skin',
}: AvatarPreviewProps) {
  if (renderer === 'dicebear') {
    return (
      <AvatarPreviewDiceBear 
        config={config} 
        size={size} 
        className={className} 
      />
    );
  }
  
  return (
    <AvatarPreviewSVG 
      config={config} 
      size={size} 
      className={className} 
      activeCategory={activeCategory}
    />
  );
}
```

## Step 4: Update Config Type (Optional)

```typescript
// src/lib/avatar/config.ts

// Add to AvatarConfig interface:
export interface AvatarConfig {
  id: string;
  name: string;
  skinTone: string;
  hair: AvatarHair;
  clothes: AvatarClothes;
  accessories: AvatarAccessories;
  face: AvatarFace;
  body: AvatarBody;
  
  // New optional fields for DiceBear
  renderer?: 'custom' | 'dicebear'; // Which renderer to use
  dicebearStyle?: 'avataaars'; // Future: support more styles
}

// Update DEFAULT_AVATAR_CONFIG:
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  // ... existing fields
  renderer: 'dicebear', // Default to DiceBear
  dicebearStyle: 'avataaars',
};
```

## Step 5: Add Renderer Selector (Optional UI Enhancement)

```typescript
// src/components/avatar/RendererSelector.tsx

import { AvatarConfig } from "@/lib/avatar/config";
import { Button } from "@/components/ui/button";
import { Palette, Sparkles } from "lucide-react";

interface RendererSelectorProps {
  config: AvatarConfig;
  onRendererChange: (renderer: 'custom' | 'dicebear') => void;
}

export function RendererSelector({ config, onRendererChange }: RendererSelectorProps) {
  const currentRenderer = config.renderer || 'dicebear';
  
  return (
    <div className="flex gap-2 p-2 bg-muted rounded-lg">
      <Button
        variant={currentRenderer === 'dicebear' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onRendererChange('dicebear')}
        className="flex items-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        DiceBear
      </Button>
      <Button
        variant={currentRenderer === 'custom' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onRendererChange('custom')}
        className="flex items-center gap-2"
      >
        <Palette className="h-4 w-4" />
        Custom
      </Button>
    </div>
  );
}
```

## Step 6: Usage Example

```typescript
// In your AvatarCustomizer component:

import { AvatarPreview } from "@/components/avatar/preview";
import { RendererSelector } from "@/components/avatar/RendererSelector";
import { useState } from "react";

function AvatarCustomizer() {
  const [config, setConfig] = useState<AvatarConfig>(loadAvatarConfig() || createDefaultAvatarConfig());
  
  const handleRendererChange = (renderer: 'custom' | 'dicebear') => {
    setConfig(prev => ({ ...prev, renderer }));
  };
  
  return (
    <div className="avatar-customizer">
      {/* Renderer selector */}
      <RendererSelector 
        config={config} 
        onRendererChange={handleRendererChange} 
      />
      
      {/* Preview */}
      <AvatarPreview 
        config={config} 
        renderer={config.renderer || 'dicebear'}
        size={300}
      />
      
      {/* Rest of customization UI */}
    </div>
  );
}
```

## Testing the Integration

```typescript
// Example test to verify mapping works:

import { avatarConfigToDiceBearOptions } from "@/lib/avatar/dicebear/mapper";
import { createDefaultAvatarConfig } from "@/lib/avatar/config";

const config = createDefaultAvatarConfig();
const options = avatarConfigToDiceBearOptions(config);

console.log('DiceBear options:', options);
// Should output valid DiceBear options object
```

## Next Steps

1. **Test the mapper** - Verify all config values map correctly
2. **Refine mappings** - Adjust based on visual results
3. **Add error handling** - Handle edge cases gracefully
4. **Update selectors** - Show DiceBear-compatible options
5. **Add style selector** - Allow users to choose different DiceBear styles
6. **Performance optimization** - Cache generated SVGs

## Notes

- The mapper functions are simplified examples - you may need to refine them based on your specific needs
- DiceBear has many more options than shown - explore the [Avataaars documentation](https://www.dicebear.com/styles/avataaars) for all available options
- Consider adding a "Randomize" function that uses DiceBear's seed-based generation
- You can add more DiceBear styles by installing additional packages (e.g., `@dicebear/big-smile`)

