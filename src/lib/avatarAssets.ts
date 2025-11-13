/**
 * Avatar Asset Definitions
 * 
 * This module defines all available customization options for avatars.
 * Each category (skin tone, hair, clothes, etc.) has an array of AssetOption objects.
 * 
 * @module avatarAssets
 */

/**
 * Represents a single customization option
 * 
 * @interface AssetOption
 * @property {string} id - Unique identifier for the option (used in config)
 * @property {string} name - Human-readable name for display
 * @property {string} [emoji] - Emoji representation for quick visual reference
 * @property {string} [svg] - SVG path or component reference (for future use)
 * @property {boolean} [colorable] - Whether this option can be colored
 */
export interface AssetOption {
  id: string;
  name: string;
  emoji?: string; // For display/fallback
  svg?: string; // SVG path or component reference
  colorable?: boolean; // Can be colored
}

/**
 * Skin tone preset options
 * 
 * These are quick-select options for common skin tones.
 * Users can also use custom color picker for any hex color.
 * 
 * @constant {AssetOption[]} SKIN_TONE_PRESETS
 */
export const SKIN_TONE_PRESETS: AssetOption[] = [
  { id: 'light', name: 'Light', emoji: '👶', colorable: true },
  { id: 'medium-light', name: 'Medium Light', emoji: '👧', colorable: true },
  { id: 'medium', name: 'Medium', emoji: '👨', colorable: true },
  { id: 'medium-dark', name: 'Medium Dark', emoji: '👩', colorable: true },
  { id: 'dark', name: 'Dark', emoji: '👴', colorable: true },
];

/**
 * Color values for skin tone presets
 * 
 * Maps preset IDs to their hex color values.
 * Used for rendering and color picker initialization.
 * 
 * @constant {Record<string, string>} SKIN_TONE_COLORS
 */
export const SKIN_TONE_COLORS: Record<string, string> = {
  light: '#FFDBAC',
  'medium-light': '#F1C27D',
  medium: '#E0AC69',
  'medium-dark': '#C68642',
  dark: '#8D5524',
};

/**
 * Hair style options
 * 
 * Available hair styles that can be selected.
 * Each style can be combined with any hair color.
 * 
 * @constant {AssetOption[]} HAIR_STYLES
 */
export const HAIR_STYLES: AssetOption[] = [
  { id: 'short', name: 'Short', emoji: '👤' },
  { id: 'medium', name: 'Medium', emoji: '👨' },
  { id: 'long', name: 'Long', emoji: '👩' },
  { id: 'curly', name: 'Curly', emoji: '👨‍🦱' },
  { id: 'wavy', name: 'Wavy', emoji: '👩‍🦱' },
  { id: 'bald', name: 'Bald', emoji: '👨‍🦲' },
  { id: 'bun', name: 'Bun', emoji: '👩‍🦰' },
  { id: 'ponytail', name: 'Ponytail', emoji: '👱‍♀️' },
];

/**
 * Hair color preset options
 * 
 * Quick-select hair colors. Users can also use custom color picker.
 * 
 * @constant {AssetOption[]} HAIR_COLORS
 */
export const HAIR_COLORS: AssetOption[] = [
  { id: 'black', name: 'Black', colorable: true },
  { id: 'brown', name: 'Brown', colorable: true },
  { id: 'blonde', name: 'Blonde', colorable: true },
  { id: 'red', name: 'Red', colorable: true },
  { id: 'gray', name: 'Gray', colorable: true },
  { id: 'white', name: 'White', colorable: true },
];

/**
 * Color values for hair color presets
 * 
 * Maps preset IDs to their hex color values.
 * 
 * @constant {Record<string, string>} HAIR_COLOR_VALUES
 */
export const HAIR_COLOR_VALUES: Record<string, string> = {
  black: '#000000',
  brown: '#8B4513',
  blonde: '#FFD700',
  red: '#A0522D',
  gray: '#808080',
  white: '#FFFFFF',
};

/**
 * Clothing - Top items
 * 
 * Upper body clothing options. Can be combined with bottoms or overridden by outfits.
 * 
 * @constant {AssetOption[]} CLOTHING_TOPS
 */
export const CLOTHING_TOPS: AssetOption[] = [
  { id: 'tshirt', name: 'T-Shirt', emoji: '👕', colorable: true },
  { id: 'dress-shirt', name: 'Dress Shirt', emoji: '👔', colorable: true },
  { id: 'tank-top', name: 'Tank Top', emoji: '🎽', colorable: true },
  { id: 'jacket', name: 'Jacket', emoji: '🧥', colorable: true },
  { id: 'hoodie', name: 'Hoodie', emoji: '🧥', colorable: true },
  { id: 'sweater', name: 'Sweater', emoji: '🧶', colorable: true },
];

/**
 * Clothing - Bottom items
 * 
 * Lower body clothing options. Can be combined with tops or overridden by outfits.
 * 
 * @constant {AssetOption[]} CLOTHING_BOTTOMS
 */
export const CLOTHING_BOTTOMS: AssetOption[] = [
  { id: 'jeans', name: 'Jeans', emoji: '👖', colorable: true },
  { id: 'shorts', name: 'Shorts', emoji: '🩳', colorable: true },
  { id: 'pants', name: 'Pants', emoji: '👖', colorable: true },
  { id: 'skirt', name: 'Skirt', emoji: '👗', colorable: true },
  { id: 'dress', name: 'Dress', emoji: '👗', colorable: true },
];

/**
 * Clothing - Full outfits
 * 
 * Complete outfit options that override both top and bottom selections.
 * When an outfit is selected, top and bottom are set to null.
 * 
 * @constant {AssetOption[]} CLOTHING_OUTFITS
 */
export const CLOTHING_OUTFITS: AssetOption[] = [
  { id: 'suit', name: 'Suit', emoji: '🤵', colorable: true },
  { id: 'uniform', name: 'Uniform', emoji: '👔', colorable: true },
  { id: 'costume', name: 'Costume', emoji: '🎭', colorable: true },
  { id: 'casual', name: 'Casual', emoji: '👕', colorable: true },
  { id: 'formal', name: 'Formal', emoji: '👔', colorable: true },
];

/**
 * Accessories - Hats and headwear
 * 
 * Headwear options. Only one hat can be selected at a time (toggleable).
 * 
 * @constant {AssetOption[]} ACCESSORY_HATS
 */
export const ACCESSORY_HATS: AssetOption[] = [
  { id: 'cap', name: 'Cap', emoji: '🧢' },
  { id: 'beanie', name: 'Beanie', emoji: '🧢' },
  { id: 'fedora', name: 'Fedora', emoji: '🎩' },
  { id: 'helmet', name: 'Helmet', emoji: '⛑️' },
  { id: 'graduation-cap', name: 'Graduation Cap', emoji: '🎓' },
  { id: 'crown', name: 'Crown', emoji: '👑' },
];

/**
 * Accessories - Glasses and eyewear
 * 
 * Eyewear options. Only one pair of glasses can be selected at a time (toggleable).
 * 
 * @constant {AssetOption[]} ACCESSORY_GLASSES
 */
export const ACCESSORY_GLASSES: AssetOption[] = [
  { id: 'regular', name: 'Regular Glasses', emoji: '👓' },
  { id: 'sunglasses', name: 'Sunglasses', emoji: '🕶️' },
  { id: 'goggles', name: 'Goggles', emoji: '🥽' },
  { id: 'monocle', name: 'Monocle', emoji: '🧐' },
];

/**
 * Accessories - Other items
 * 
 * Miscellaneous accessories. Multiple items can be selected (additive).
 * 
 * @constant {AssetOption[]} ACCESSORY_OTHER
 */
export const ACCESSORY_OTHER: AssetOption[] = [
  { id: 'ring', name: 'Ring', emoji: '💍' },
  { id: 'watch', name: 'Watch', emoji: '⌚' },
  { id: 'backpack', name: 'Backpack', emoji: '🎒' },
  { id: 'necklace', name: 'Necklace', emoji: '📿' },
];

/**
 * Face - Eye styles
 * 
 * Eye expression options (default, happy, wink, sleepy, surprised).
 * 
 * @constant {AssetOption[]} FACE_EYES
 */
export const FACE_EYES: AssetOption[] = [
  { id: 'default', name: 'Default', emoji: '👁️' },
  { id: 'happy', name: 'Happy', emoji: '😊' },
  { id: 'wink', name: 'Wink', emoji: '😉' },
  { id: 'sleepy', name: 'Sleepy', emoji: '😴' },
  { id: 'surprised', name: 'Surprised', emoji: '😲' },
];

/**
 * Face - Eyebrow styles
 * 
 * Eyebrow shape options (default, thick, thin, arched).
 * 
 * @constant {AssetOption[]} FACE_EYEBROWS
 */
export const FACE_EYEBROWS: AssetOption[] = [
  { id: 'default', name: 'Default', emoji: '🤨' },
  { id: 'thick', name: 'Thick', emoji: '🤨' },
  { id: 'thin', name: 'Thin', emoji: '🤨' },
  { id: 'arched', name: 'Arched', emoji: '🤨' },
];

/**
 * Face - Mouth styles
 * 
 * Mouth expression options (default, smile, big-smile, neutral).
 * 
 * @constant {AssetOption[]} FACE_MOUTH
 */
export const FACE_MOUTH: AssetOption[] = [
  { id: 'default', name: 'Default', emoji: '😐' },
  { id: 'smile', name: 'Smile', emoji: '😊' },
  { id: 'big-smile', name: 'Big Smile', emoji: '😃' },
  { id: 'neutral', name: 'Neutral', emoji: '😐' },
];

/**
 * Face - Facial hair options
 * 
 * Facial hair styles. Only one can be selected at a time (toggleable, includes 'none').
 * 
 * @constant {AssetOption[]} FACE_FACIAL_HAIR
 */
export const FACE_FACIAL_HAIR: AssetOption[] = [
  { id: 'none', name: 'None', emoji: '' },
  { id: 'mustache', name: 'Mustache', emoji: '👨' },
  { id: 'beard', name: 'Beard', emoji: '🧔' },
  { id: 'goatee', name: 'Goatee', emoji: '👨' },
];

/**
 * Body - Shape options
 * 
 * Body shape variations (slim, average, athletic, curvy).
 * 
 * @constant {AssetOption[]} BODY_SHAPES
 */
export const BODY_SHAPES: AssetOption[] = [
  { id: 'slim', name: 'Slim', emoji: '👤' },
  { id: 'average', name: 'Average', emoji: '👤' },
  { id: 'athletic', name: 'Athletic', emoji: '💪' },
  { id: 'curvy', name: 'Curvy', emoji: '👤' },
];

/**
 * Body - Size options
 * 
 * Body size variations (small, medium, large).
 * Note: This is a simplified array, not AssetOption[], as sizes don't need emoji.
 * 
 * @constant {Array<{id: string, name: string}>} BODY_SIZES
 */
export const BODY_SIZES: Array<{ id: string; name: string }> = [
  { id: 'small', name: 'Small' },
  { id: 'medium', name: 'Medium' },
  { id: 'large', name: 'Large' },
];

/**
 * Get asset option by ID from a category array
 * 
 * Searches through an array of AssetOption objects to find one with matching ID.
 * 
 * @param {AssetOption[]} category - Array of asset options to search
 * @param {string} id - The ID to search for
 * @returns {AssetOption | undefined} The matching asset option, or undefined if not found
 * 
 * @example
 * const hairStyle = getAssetById(HAIR_STYLES, 'short');
 * if (hairStyle) {
 *   console.log(hairStyle.name); // 'Short'
 * }
 */
export function getAssetById(
  category: AssetOption[],
  id: string
): AssetOption | undefined {
  return category.find((asset) => asset.id === id);
}

/**
 * Get all assets for a category by category name
 * 
 * Returns the appropriate asset array based on category string.
 * Used by selector components to get options for their category.
 * 
 * @param {string} category - Category identifier (e.g., 'skin-tone', 'hair-style')
 * @returns {AssetOption[]} Array of asset options for the category, or empty array if category not found
 * 
 * @example
 * const skinTones = getAssetsByCategory('skin-tone');
 * const hairStyles = getAssetsByCategory('hair-style');
 */
export function getAssetsByCategory(category: string): AssetOption[] {
  switch (category) {
    case 'skin-tone':
      return SKIN_TONE_PRESETS;
    case 'hair-style':
      return HAIR_STYLES;
    case 'hair-color':
      return HAIR_COLORS;
    case 'clothing-top':
      return CLOTHING_TOPS;
    case 'clothing-bottom':
      return CLOTHING_BOTTOMS;
    case 'clothing-outfit':
      return CLOTHING_OUTFITS;
    case 'accessory-hat':
      return ACCESSORY_HATS;
    case 'accessory-glasses':
      return ACCESSORY_GLASSES;
    case 'accessory-other':
      return ACCESSORY_OTHER;
    case 'face-eyes':
      return FACE_EYES;
    case 'face-eyebrows':
      return FACE_EYEBROWS;
    case 'face-mouth':
      return FACE_MOUTH;
    case 'face-facial-hair':
      return FACE_FACIAL_HAIR;
    case 'body-shape':
      return BODY_SHAPES;
    default:
      return [];
  }
}

