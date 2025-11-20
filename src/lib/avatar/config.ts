/**
 * Avatar Configuration System
 * 
 * This module provides the core data structures and utilities for the avatar customization system.
 * It defines TypeScript interfaces, default configurations, and storage/transmission utilities.
 * 
 * @module avatarConfig
 */

/**
 * Hair customization options for an avatar
 * 
 * @interface AvatarHair
 * @property {string} style - Hair style identifier (e.g., 'short', 'long', 'curly')
 * @property {string} color - Hair color as hex string (e.g., '#000000') or preset ID
 */
export interface AvatarHair {
  style: string;
  color: string;
}

/**
 * Clothing customization options for an avatar
 * 
 * @interface AvatarClothes
 * @property {string | null} top - Top/clothing item ID (null if using outfit)
 * @property {string | null} bottom - Bottom item ID (null if using outfit)
 * @property {string | null} outfit - Full outfit ID (overrides top/bottom when set)
 * @property {string} color - Primary clothing color as hex string (e.g., '#3B82F6')
 */
export interface AvatarClothes {
  top: string | null;
  bottom: string | null;
  outfit: string | null; // Full outfit (overrides top/bottom)
  color: string; // Primary clothing color
}

/**
 * Accessories customization options for an avatar
 * 
 * @interface AvatarAccessories
 * @property {string | null} hat - Hat/headwear ID (null if none)
 * @property {string | null} glasses - Glasses/eyewear ID (null if none)
 * @property {string[]} jewelry - Array of jewelry item IDs
 * @property {string[]} other - Array of other accessory IDs
 */
export interface AvatarAccessories {
  hat: string | null;
  glasses: string | null;
  jewelry: string[];
  other: string[];
}

/**
 * Facial feature customization options for an avatar
 * 
 * @interface AvatarFace
 * @property {string} eyes - Eye style identifier (e.g., 'default', 'happy', 'wink')
 * @property {string} eyebrows - Eyebrow style identifier (e.g., 'default', 'thick', 'thin')
 * @property {string} mouth - Mouth style identifier (e.g., 'default', 'smile', 'big-smile')
 * @property {string | null} facialHair - Facial hair ID (null if none)
 */
export interface AvatarFace {
  eyes: string;
  eyebrows: string;
  mouth: string;
  facialHair: string | null;
}

/**
 * Body customization options for an avatar
 * 
 * @interface AvatarBody
 * @property {string} shape - Body shape identifier (e.g., 'slim', 'average', 'athletic')
 * @property {'small' | 'medium' | 'large'} size - Body size option
 */
export interface AvatarBody {
  shape: string;
  size: 'small' | 'medium' | 'large';
}

/**
 * DiceBear-only customization options
 * 
 * These options are only available when using DiceBear renderer.
 * 
 * @interface DiceBearOptions
 * @property {string | null} clothingGraphic - Graphic to apply to graphic shirts (e.g., 'bat', 'pizza')
 * @property {'default' | 'circle'} backgroundStyle - Background shape style
 * @property {string | null} backgroundColor - Background color as hex or preset ID
 */
export interface DiceBearOptions {
  clothingGraphic: string | null;
  backgroundStyle: 'default' | 'circle';
  backgroundColor: string | null;
}

/**
 * Complete avatar configuration
 * 
 * Contains all customization options for a player's avatar.
 * This is the main data structure used throughout the avatar system.
 * 
 * @interface AvatarConfig
 * @property {string} id - Unique identifier generated from config content
 * @property {string} name - User-defined avatar name (max 30 characters)
 * @property {string} skinTone - Skin tone as hex color (e.g., '#FFDBAC') or preset ID
 * @property {AvatarHair} hair - Hair customization options
 * @property {AvatarClothes} clothes - Clothing customization options
 * @property {AvatarAccessories} accessories - Accessories customization options
 * @property {AvatarFace} face - Facial features customization options
 * @property {AvatarBody} body - Body shape and size customization options
 * @property {DiceBearOptions} [dicebear] - DiceBear-only options (optional, only used with DiceBear renderer)
 * @property {string} [customDrawings] - JSON string of Fabric.js canvas drawings (optional, for drawable avatar feature)
 */
export interface AvatarConfig {
  id: string;
  name: string;
  skinTone: string; // Hex color or preset ID
  hair: AvatarHair;
  clothes: AvatarClothes;
  accessories: AvatarAccessories;
  face: AvatarFace;
  body: AvatarBody;
  dicebear?: DiceBearOptions; // Optional DiceBear-only features
  customDrawings?: string; // Optional: JSON string of Fabric.js canvas drawings
  customImageUrl?: string; // Optional: Data URL or URL of uploaded custom image (replaces DiceBear avatar)
}

/**
 * Default avatar configuration used as fallback and initial state
 * 
 * All new avatars start with these values. Individual properties can be
 * customized by the user through the avatar customization interface.
 * 
 * @constant {AvatarConfig} DEFAULT_AVATAR_CONFIG
 */
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  id: 'default',
  name: 'My Avatar',
  skinTone: '#FFDBAC',
  hair: {
    style: 'short',
    color: '#000000',
  },
  clothes: {
    top: 'tshirt',
    bottom: 'jeans',
    outfit: null,
    color: '#3B82F6',
  },
  accessories: {
    hat: null,
    glasses: null,
    jewelry: [],
    other: [],
  },
  face: {
    eyes: 'default',
    eyebrows: 'default',
    mouth: 'smile',
    facialHair: null,
  },
  body: {
    shape: 'average',
    size: 'medium',
  },
  dicebear: {
    clothingGraphic: null,
    backgroundStyle: 'default',
    backgroundColor: null,
  },
};

/**
 * SessionStorage key for storing tab identifier
 * @constant {string} TAB_ID_KEY
 */
const TAB_ID_KEY = 'paint-and-guess-tab-id';

/**
 * Get or generate a unique identifier for the current browser tab
 * This ID persists for the tab's lifetime (until tab is closed)
 * 
 * @returns {string} Unique tab identifier
 */
function getTabId(): string {
  if (typeof window === 'undefined') return 'default';
  
  // Try to get existing tab ID from sessionStorage
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  
  if (!tabId) {
    // Generate a new unique ID for this tab
    tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  
  return tabId;
}

/**
 * Get the storage key for avatar configuration (includes tab ID)
 * @returns {string} Storage key with tab identifier
 */
function getAvatarStorageKey(): string {
  const tabId = getTabId();
  return `paint-and-guess-avatar-config-${tabId}`;
}

/**
 * Current version of the avatar config storage format
 * Increment this when making breaking changes to the config structure
 * @constant {number} AVATAR_STORAGE_VERSION
 */
const AVATAR_STORAGE_VERSION = 1;

/**
 * Internal structure for stored avatar data with versioning
 * 
 * @interface StoredAvatar
 * @property {number} version - Storage format version for migration support
 * @property {AvatarConfig} config - The actual avatar configuration
 * @property {number} timestamp - Unix timestamp when config was saved
 */
interface StoredAvatar {
  version: number;
  config: AvatarConfig;
  timestamp: number;
}

/**
 * Migrate avatar config from older versions to current version
 * 
 * This function handles schema changes between versions. When the storage
 * format changes, add migration logic here to convert old configs.
 * 
 * @param {any} config - The config from the old version (may be partial or different structure)
 * @param {number} fromVersion - The version number of the old config
 * @returns {AvatarConfig} Migrated config compatible with current version
 * 
 * @example
 * // When adding a new required field in version 2:
 * if (fromVersion < 2) {
 *   return { ...config, newField: defaultValue };
 * }
 */
function migrateAvatarConfig(config: any, fromVersion: number): AvatarConfig {
  // Handle version migrations here
  if (fromVersion < 1) {
    // Version 0: Legacy format (no versioning) - try to preserve what we can
    console.debug('[avatarConfig] Migrating from version 0 (legacy)');
    
    // If it looks like a valid config structure, try to use it
    if (config && typeof config === 'object' && config.name) {
      try {
        // Attempt to create a valid config from legacy data
        const migrated: AvatarConfig = {
          id: config.id || generateAvatarId(config),
          name: config.name || DEFAULT_AVATAR_CONFIG.name,
          skinTone: config.skinTone || DEFAULT_AVATAR_CONFIG.skinTone,
          hair: config.hair || DEFAULT_AVATAR_CONFIG.hair,
          clothes: config.clothes || DEFAULT_AVATAR_CONFIG.clothes,
          accessories: config.accessories || DEFAULT_AVATAR_CONFIG.accessories,
          face: config.face || DEFAULT_AVATAR_CONFIG.face,
          body: config.body || DEFAULT_AVATAR_CONFIG.body,
        };
        return migrated;
      } catch (error) {
        console.warn('[avatarConfig] Failed to migrate legacy config, using defaults', error);
        return createDefaultAvatarConfig();
      }
    }
    
    // If legacy format is unrecognizable, return default
    return createDefaultAvatarConfig();
  }
  
  // Version 1: Current version, no migration needed
  if (fromVersion === 1) {
    return config as AvatarConfig;
  }
  
  // Future versions: Add migration logic here
  // Example for version 2:
  // if (fromVersion < 2) {
  //   return { ...config, newField: defaultValue };
  // }
  
  console.warn(`[avatarConfig] Unknown version ${fromVersion}, attempting to use as-is`);
  return config as AvatarConfig;
}

/**
 * Load avatar configuration from localStorage with versioning support
 * 
 * Automatically handles:
 * - Version migration for older config formats
 * - Corrupted data cleanup
 * - Legacy format conversion
 * 
 * @returns {AvatarConfig | null} The loaded avatar config, or null if none exists or loading fails
 * 
 * @example
 * const config = loadAvatarConfig();
 * if (config) {
 *   console.log('Loaded avatar:', config.name);
 * } else {
 *   console.log('No saved avatar found');
 * }
 */
export function loadAvatarConfig(): AvatarConfig | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const storageKey = getAvatarStorageKey();
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    // Check if it's the new versioned format
    if (data.version !== undefined) {
      const storedData = data as StoredAvatar;
      
      // Handle version migration
      if (storedData.version !== AVATAR_STORAGE_VERSION) {
        console.log(`Migrating avatar config from version ${storedData.version} to ${AVATAR_STORAGE_VERSION}`);
        const migrated = migrateAvatarConfig(storedData.config, storedData.version);
        // Save migrated version
        saveAvatarConfig(migrated);
        return migrated;
      }
      
      return storedData.config;
    }
    
    // Legacy format (no version) - migrate it
    console.log('Migrating legacy avatar config');
    const migrated = migrateAvatarConfig(data, 0);
    saveAvatarConfig(migrated);
    return migrated;
  } catch (error) {
    console.error('Failed to load avatar config:', error);
    // Clear corrupted data
    try {
      const storageKey = getAvatarStorageKey();
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore errors during cleanup
    }
  }
  
  return null;
}

/**
 * Save avatar configuration to localStorage with versioning
 * 
 * Stores the config with version information for future migration support.
 * Handles quota exceeded errors gracefully.
 * 
 * @param {AvatarConfig} config - The avatar configuration to save
 * @throws {Error} Logs error if save fails (doesn't throw to prevent app crash)
 * 
 * @example
 * const myConfig = createDefaultAvatarConfig('My Avatar');
 * saveAvatarConfig(myConfig);
 */
export function saveAvatarConfig(config: AvatarConfig): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored: StoredAvatar = {
      version: AVATAR_STORAGE_VERSION,
      config,
      timestamp: Date.now(),
    };
    
    const json = JSON.stringify(stored);
    
    // Check storage size (rough estimate)
    const sizeInBytes = new Blob([json]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > 5) {
      console.warn('Avatar config is large:', sizeInMB.toFixed(2), 'MB');
    }
    
    const storageKey = getAvatarStorageKey();
    sessionStorage.setItem(storageKey, json);
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.error('sessionStorage quota exceeded. Avatar config not saved.');
      // Could implement a cleanup strategy here
    } else {
      console.error('Failed to save avatar config:', error);
    }
  }
}

/**
 * Generate a unique ID for avatar config based on its content
 * 
 * Uses a simple hash function to create a deterministic ID from the config.
 * Same config will always generate the same ID, useful for caching and comparison.
 * 
 * @param {AvatarConfig} config - The avatar configuration
 * @returns {string} Unique identifier in format 'avatar-{hash}'
 * 
 * @example
 * const id1 = generateAvatarId(config);
 * const id2 = generateAvatarId(config); // id1 === id2
 */
export function generateAvatarId(config: AvatarConfig): string {
  const configString = JSON.stringify(config);
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < configString.length; i++) {
    const char = configString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `avatar-${Math.abs(hash).toString(36)}`;
}

/**
 * Create a new avatar config with default values
 * 
 * Generates a fresh avatar configuration with all default values.
 * The ID is automatically generated from the default config content.
 * 
 * @param {string} [name] - Optional custom name (defaults to 'My Avatar')
 * @returns {AvatarConfig} New avatar config with defaults
 * 
 * @example
 * const newAvatar = createDefaultAvatarConfig('Player 1');
 * // Returns config with all defaults but custom name
 */
export function createDefaultAvatarConfig(name?: string): AvatarConfig {
  return {
    ...DEFAULT_AVATAR_CONFIG,
    id: generateAvatarId(DEFAULT_AVATAR_CONFIG),
    name: name || DEFAULT_AVATAR_CONFIG.name,
  };
}

/**
 * Create a deep copy of an avatar config
 * 
 * Uses JSON serialization to create a completely independent copy.
 * Useful for creating editable copies without mutating the original.
 * 
 * @param {AvatarConfig} config - The avatar configuration to clone
 * @returns {AvatarConfig} Deep copy of the config
 * 
 * @example
 * const original = loadAvatarConfig();
 * const editable = cloneAvatarConfig(original);
 * editable.name = 'Modified';
 * // original.name is unchanged
 */
export function cloneAvatarConfig(config: AvatarConfig): AvatarConfig {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Encode avatar config to JSON string for network transmission
 * 
 * Converts the config object to a JSON string suitable for sending
 * over the network (socket.io, HTTP, etc.).
 * 
 * @param {AvatarConfig} config - The avatar configuration to encode
 * @returns {string} JSON string representation of the config
 * 
 * @example
 * const encoded = encodeAvatarConfig(config);
 * socket.emit('join-room', { avatar: encoded });
 */
export function encodeAvatarConfig(config: AvatarConfig): string {
  return JSON.stringify(config);
}

/**
 * Decode avatar config from JSON string
 * 
 * Parses a JSON string back into an AvatarConfig object.
 * Returns null if parsing fails (invalid JSON or structure).
 * 
 * @param {string} encoded - JSON string representation of the config
 * @returns {AvatarConfig | null} Decoded config, or null if decoding fails
 * 
 * @example
 * const decoded = decodeAvatarConfig(encodedString);
 * if (decoded) {
 *   console.log('Decoded avatar:', decoded.name);
 * }
 */
export function decodeAvatarConfig(encoded: string): AvatarConfig | null {
  try {
    return JSON.parse(encoded) as AvatarConfig;
  } catch (error) {
    console.error('Failed to decode avatar config:', error);
    return null;
  }
}

