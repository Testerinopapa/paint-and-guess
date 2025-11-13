/**
 * Adapter to convert AvatarConfig to Dicebear options
 * 
 * This module maps our AvatarConfig structure to Dicebear's avataaars style options.
 * Dicebear uses a different structure, so we need to translate between the two.
 * 
 * @module avatarDicebearAdapter
 */

import { AvatarConfig } from './avatarConfig';
import { createAvatar } from '@dicebear/core';
import * as avataaarsStyle from '@dicebear/avataaars';

/**
 * Map our hair style to Dicebear hair style
 */
function mapHairStyle(style: string): string {
  const styleMap: Record<string, string> = {
    'short': 'shortHairShortFlat',
    'medium': 'shortHairShortWaved',
    'long': 'longHairStraight',
    'curly': 'longHairCurly',
    'wavy': 'longHairWavy',
    'bald': 'noHair',
    'bun': 'longHairBun',
    'ponytail': 'longHairPonytail',
  };
  
  return styleMap[style] || 'shortHairShortFlat';
}

/**
 * Map our hair color to Dicebear hair color
 */
function mapHairColor(color: string): string {
  // Dicebear uses specific color names
  const colorMap: Record<string, string> = {
    'black': 'black',
    'brown': 'brown',
    'blonde': 'blonde',
    'red': 'auburn',
    'gray': 'gray',
    'white': 'platinum',
  };
  
  // If it's a preset, use the mapped value
  if (colorMap[color]) {
    return colorMap[color];
  }
  
  // If it's a hex color, try to match closest preset
  // For now, default to brown
  return 'brown';
}

/**
 * Map our skin tone to Dicebear skin color
 */
function mapSkinTone(skinTone: string): string {
  // Dicebear has specific skin tone options
  const toneMap: Record<string, string> = {
    '#FFDBAC': 'tanned',
    '#F1C27D': 'yellow',
    '#E0AC69': 'pale',
    '#C68642': 'light',
    '#8D5524': 'brown',
  };
  
  // Try to match by hex color
  if (toneMap[skinTone]) {
    return toneMap[skinTone];
  }
  
  // Default to pale
  return 'pale';
}

/**
 * Map our clothing to Dicebear clothing
 */
function mapClothing(config: AvatarConfig): string {
  // If outfit is selected, map it
  if (config.clothes.outfit) {
    const outfitMap: Record<string, string> = {
      'suit': 'blazerShirt',
      'uniform': 'shirtCrewNeck',
      'costume': 'overall',
      'casual': 'hoodie',
      'formal': 'blazerSweater',
    };
    return outfitMap[config.clothes.outfit] || 'shirtCrewNeck';
  }
  
  // If top is selected, map it
  if (config.clothes.top) {
    const topMap: Record<string, string> = {
      'tshirt': 'shirtCrewNeck',
      'dress-shirt': 'shirtVNeck',
      'tank-top': 'shirtScoopNeck',
      'jacket': 'blazerShirt',
      'hoodie': 'hoodie',
      'sweater': 'blazerSweater',
    };
    return topMap[config.clothes.top] || 'shirtCrewNeck';
  }
  
  return 'shirtCrewNeck';
}

/**
 * Map our accessories to Dicebear accessories
 */
function mapAccessories(config: AvatarConfig): {
  top?: string;
  accessories?: string[];
} {
  const accessories: string[] = [];
  let top: string | undefined;
  
  // Map hat
  if (config.accessories.hat) {
    const hatMap: Record<string, string> = {
      'cap': 'hat',
      'beanie': 'winterHat1',
      'fedora': 'hat',
      'helmet': 'helmet',
      'graduation-cap': 'graduationCap',
      'crown': 'crown',
    };
    top = hatMap[config.accessories.hat] || 'hat';
  }
  
  // Map glasses
  if (config.accessories.glasses) {
    const glassesMap: Record<string, string> = {
      'regular': 'eyeglasses',
      'sunglasses': 'sunglasses',
      'goggles': 'eyepatch', // Closest match
      'monocle': 'eyeglasses', // Closest match
    };
    accessories.push(glassesMap[config.accessories.glasses] || 'eyeglasses');
  }
  
  return {
    top,
    accessories: accessories.length > 0 ? accessories : undefined,
  };
}

/**
 * Map our face features to Dicebear options
 */
function mapFaceFeatures(config: AvatarConfig): {
  eyes?: string;
  eyebrows?: string;
  mouth?: string;
} {
  const eyesMap: Record<string, string> = {
    'default': 'default',
    'happy': 'happy',
    'wink': 'wink',
    'sleepy': 'sleep',
    'surprised': 'surprised',
  };
  
  const eyebrowsMap: Record<string, string> = {
    'default': 'default',
    'thick': 'angry',
    'thin': 'defaultNatural',
    'arched': 'raisedExcited',
  };
  
  const mouthMap: Record<string, string> = {
    'default': 'default',
    'smile': 'smile',
    'big-smile': 'twinkle',
    'neutral': 'serious',
  };
  
  return {
    eyes: eyesMap[config.face.eyes] || 'default',
    eyebrows: eyebrowsMap[config.face.eyebrows] || 'default',
    mouth: mouthMap[config.face.mouth] || 'default',
  };
}

/**
 * Convert AvatarConfig to Dicebear options
 * 
 * @param config - Our avatar configuration
 * @returns Dicebear options object
 */
/**
 * Generate a stable seed from option values
 * This ensures the same options always produce the same avatar
 */
function generateStableSeed(options: Record<string, any>): string {
  // Create a normalized object with only defined values, sorted keys
  // This ensures consistent seed generation
  const normalized: Record<string, any> = {};
  
  // Sort keys and only include defined (non-undefined) values
  const sortedKeys = Object.keys(options).sort();
  for (const key of sortedKeys) {
    if (key !== 'seed' && options[key] !== undefined) {
      // Normalize arrays to sorted strings for consistency
      if (Array.isArray(options[key])) {
        normalized[key] = [...options[key]].sort().join(',');
      } else {
        normalized[key] = options[key];
      }
    }
  }
  
  const seedString = JSON.stringify(normalized);
  // Simple hash to create a short seed
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export function configToDicebearOptions(config: AvatarConfig) {
  const accessories = mapAccessories(config);
  const faceFeatures = mapFaceFeatures(config);
  
  const options: Record<string, any> = {
    // Hair
    top: accessories.top || mapHairStyle(config.hair.style),
    hairColor: mapHairColor(config.hair.color),
    
    // Skin
    skinColor: mapSkinTone(config.skinTone),
    
    // Clothing
    clothing: mapClothing(config),
    clothingColor: config.clothes.color.replace('#', ''), // Dicebear expects hex without #
    
    // Face
    eyes: faceFeatures.eyes,
    eyebrows: faceFeatures.eyebrows,
    mouth: faceFeatures.mouth,
  };
  
  // Only add accessories if they exist
  if (accessories.accessories && accessories.accessories.length > 0) {
    options.accessories = accessories.accessories;
  }
  
  // Only add facial hair if it exists
  if (config.face.facialHair && config.face.facialHair !== 'none') {
    options.facialHair = 'beardMedium';
    options.facialHairColor = mapHairColor(config.hair.color);
  }
  
  // Generate stable seed from the actual option values
  // This ensures the same options always produce the same avatar
  options.seed = generateStableSeed(options);
  
  return options;
}

/**
 * Generate avatar SVG from AvatarConfig using Dicebear
 * 
 * @param config - Our avatar configuration
 * @returns SVG string
 */
export function generateAvatarWithDicebear(config: AvatarConfig): string {
  try {
    const options = configToDicebearOptions(config);
    console.debug('[avatarDicebearAdapter] Generating avatar with options:', options);
    
    // Use createAvatar from @dicebear/core with the style object (Dicebear v9 API)
    const avatar = createAvatar(avataaarsStyle, options);
    
    const svg = avatar.toString();
    console.debug('[avatarDicebearAdapter] Generated SVG length:', svg.length);
    return svg;
  } catch (error) {
    console.error('[avatarDicebearAdapter] Failed to generate avatar SVG:', error);
    throw error;
  }
}

/**
 * Generate avatar data URI from AvatarConfig using Dicebear
 * 
 * @param config - Our avatar configuration
 * @returns Data URI string (can be used in img src)
 */
export function generateAvatarDataUri(config: AvatarConfig): string {
  try {
    const options = configToDicebearOptions(config);
    console.debug('[avatarDicebearAdapter] Generating data URI with options:', {
      ...options,
      seed: options.seed?.substring(0, 10) + '...', // Truncate seed for readability
    });
    
    // Use createAvatar from @dicebear/core with the style object (Dicebear v9 API)
    const avatar = createAvatar(avataaarsStyle, options);
    
    const dataUri = avatar.toDataUri();
    console.debug('[avatarDicebearAdapter] Generated data URI successfully', {
      length: dataUri.length,
      seed: options.seed,
      top: options.top,
      hairColor: options.hairColor,
    });
    return dataUri;
  } catch (error) {
    console.error('[avatarDicebearAdapter] Failed to generate avatar data URI:', error);
    console.error('[avatarDicebearAdapter] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      config: config,
    });
    throw error;
  }
}

