/**
 * Generate preview sprites for individual options
 * 
 * This module provides utilities to generate Dicebear avatar previews
 * for individual customization options (e.g., a specific hair style,
 * clothing item, etc.) by applying that option to a default config.
 * 
 * @module avatarOptionPreview
 */

import { AvatarConfig, createDefaultAvatarConfig } from './avatarConfig';
import { generateAvatarDataUri } from './avatarDicebearAdapter';
import { SKIN_TONE_COLORS, HAIR_COLOR_VALUES } from './avatarAssets';

/**
 * Generate a preview sprite for a specific option
 * 
 * Creates a default avatar config and applies the specified option,
 * then generates a Dicebear preview for that option.
 * 
 * @param category - The category of the option (e.g., 'hair-style', 'skin-tone')
 * @param optionId - The ID of the specific option to preview
 * @param size - Size of the preview sprite in pixels (default: 64)
 * @returns Data URI string for the preview image
 */
/**
 * Create a consistent base config for option previews
 * This ensures all previews use the same base, only varying the selected option
 */
function createPreviewBaseConfig(): AvatarConfig {
  const base = createDefaultAvatarConfig();
  // Use a fixed, consistent base configuration for all previews
  // This ensures previews only differ by the selected option
  base.skinTone = '#F1C27D'; // Medium-light skin tone
  base.hair.style = 'short';
  base.hair.color = 'brown';
  base.clothes.top = 'tshirt';
  base.clothes.outfit = null;
  base.clothes.bottom = null;
  base.clothes.color = '#3B82F6'; // Blue
  base.face.eyes = 'default';
  base.face.eyebrows = 'default';
  base.face.mouth = 'default';
  base.face.facialHair = null;
  base.accessories.hat = null;
  base.accessories.glasses = null;
  base.body.shape = 'average';
  base.body.size = 'medium';
  return base;
}

export function generateOptionPreview(
  category: string,
  optionId: string,
  size: number = 64
): string {
  // Use a consistent base config for all previews
  const config = createPreviewBaseConfig();
  
  // Use a fixed seed for option previews to ensure consistency
  // This ensures the same option always shows the same preview
  config.id = `preview-${category}-${optionId}`;
  
  // Apply the specific option to config based on category
  switch (category) {
    case 'hair-style':
      config.hair.style = optionId;
      break;
    case 'hair-color':
      config.hair.color = optionId;
      // Use a default hair style if bald
      if (config.hair.style === 'bald') {
        config.hair.style = 'short';
      }
      break;
    case 'skin-tone':
      // Map preset ID to hex color
      if (SKIN_TONE_COLORS[optionId]) {
        config.skinTone = SKIN_TONE_COLORS[optionId];
      } else {
        config.skinTone = optionId; // Assume it's already a hex color
      }
      break;
    case 'clothing-top':
      config.clothes.top = optionId;
      config.clothes.outfit = null;
      break;
    case 'clothing-bottom':
      config.clothes.bottom = optionId;
      config.clothes.outfit = null;
      break;
    case 'clothing-outfit':
      config.clothes.outfit = optionId;
      config.clothes.top = null;
      config.clothes.bottom = null;
      break;
    case 'accessory-hat':
      config.accessories.hat = optionId;
      break;
    case 'accessory-glasses':
      config.accessories.glasses = optionId;
      break;
    case 'face-eyes':
      config.face.eyes = optionId;
      break;
    case 'face-eyebrows':
      config.face.eyebrows = optionId;
      break;
    case 'face-mouth':
      config.face.mouth = optionId;
      break;
    case 'face-facial-hair':
      config.face.facialHair = optionId === 'none' ? null : optionId;
      break;
    case 'body-shape':
      config.body.shape = optionId;
      break;
    // Add more cases as needed
    default:
      console.warn(`[avatarOptionPreview] Unknown category: ${category}`);
  }
  
  try {
    // Generate the preview with consistent config
    const dataUri = generateAvatarDataUri(config);
    return dataUri;
  } catch (error) {
    console.error(`[avatarOptionPreview] Failed to generate preview for ${category}:${optionId}`, error);
    console.error(`[avatarOptionPreview] Error details:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      category,
      optionId,
      config,
    });
    // Return a placeholder data URI (transparent 1x1 pixel)
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+';
  }
}

