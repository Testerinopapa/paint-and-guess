/**
 * Unit tests for avatar configuration system
 * 
 * Tests storage functions, versioning, and migration paths
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AvatarConfig,
  DEFAULT_AVATAR_CONFIG,
  loadAvatarConfig,
  saveAvatarConfig,
  generateAvatarId,
  createDefaultAvatarConfig,
  cloneAvatarConfig,
  encodeAvatarConfig,
  decodeAvatarConfig,
} from '../avatar/config';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Avatar Config System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateAvatarId', () => {
    it('should generate deterministic IDs', () => {
      const config: AvatarConfig = {
        ...DEFAULT_AVATAR_CONFIG,
        name: 'Test Avatar',
      };

      const id1 = generateAvatarId(config);
      const id2 = generateAvatarId(config);

      expect(id1).toBe(id2);
      expect(id1).toMatch(/^avatar-[a-z0-9]+$/);
    });

    it('should generate different IDs for different configs', () => {
      const config1 = { ...DEFAULT_AVATAR_CONFIG, name: 'Avatar 1' };
      const config2 = { ...DEFAULT_AVATAR_CONFIG, name: 'Avatar 2' };

      const id1 = generateAvatarId(config1);
      const id2 = generateAvatarId(config2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('createDefaultAvatarConfig', () => {
    it('should create config with default values', () => {
      const config = createDefaultAvatarConfig();

      expect(config).toMatchObject({
        name: 'My Avatar',
        skinTone: '#FFDBAC',
        hair: {
          style: 'short',
          color: '#000000',
        },
      });
    });

    it('should accept custom name', () => {
      const config = createDefaultAvatarConfig('Custom Name');

      expect(config.name).toBe('Custom Name');
      expect(config.id).toBeTruthy();
    });

    it('should generate unique ID', () => {
      const config = createDefaultAvatarConfig();
      expect(config.id).toBeTruthy();
      expect(config.id).not.toBe('default');
    });
  });

  describe('cloneAvatarConfig', () => {
    it('should create independent copy', () => {
      const original = createDefaultAvatarConfig('Original');
      const cloned = cloneAvatarConfig(original);

      cloned.name = 'Modified';
      cloned.hair.style = 'long';

      expect(original.name).toBe('Original');
      expect(original.hair.style).toBe('short');
      expect(cloned.name).toBe('Modified');
      expect(cloned.hair.style).toBe('long');
    });

    it('should deep clone nested objects', () => {
      const original = createDefaultAvatarConfig();
      const cloned = cloneAvatarConfig(original);

      cloned.accessories.jewelry.push('ring');

      expect(original.accessories.jewelry).not.toContain('ring');
      expect(cloned.accessories.jewelry).toContain('ring');
    });
  });

  describe('encodeAvatarConfig / decodeAvatarConfig', () => {
    it('should encode and decode config correctly', () => {
      const original = createDefaultAvatarConfig('Test');
      const encoded = encodeAvatarConfig(original);
      const decoded = decodeAvatarConfig(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.name).toBe('Test');
      expect(decoded?.id).toBe(original.id);
    });

    it('should return null for invalid JSON', () => {
      const decoded = decodeAvatarConfig('invalid json');
      expect(decoded).toBeNull();
    });

    it('should handle empty string', () => {
      const decoded = decodeAvatarConfig('');
      expect(decoded).toBeNull();
    });
  });

  describe('saveAvatarConfig / loadAvatarConfig', () => {
    it('should save and load config', () => {
      const config = createDefaultAvatarConfig('Saved Avatar');
      saveAvatarConfig(config);

      const loaded = loadAvatarConfig();

      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe('Saved Avatar');
      expect(loaded?.id).toBe(config.id);
    });

    it('should return null when no config exists', () => {
      const loaded = loadAvatarConfig();
      expect(loaded).toBeNull();
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('paint-and-guess-avatar-config', 'invalid json');
      
      const loaded = loadAvatarConfig();
      
      expect(loaded).toBeNull();
      // Should clear corrupted data
      expect(localStorage.getItem('paint-and-guess-avatar-config')).toBeNull();
    });

    it('should migrate legacy format (version 0)', () => {
      // Simulate old format without version
      const legacyConfig = {
        ...DEFAULT_AVATAR_CONFIG,
        name: 'Legacy Avatar',
      };
      localStorage.setItem('paint-and-guess-avatar-config', JSON.stringify(legacyConfig));

      const loaded = loadAvatarConfig();

      // Should migrate to new format
      expect(loaded).not.toBeNull();
      // Should have saved migrated version
      const saved = localStorage.getItem('paint-and-guess-avatar-config');
      expect(saved).toBeTruthy();
      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.version).toBe(1);
      }
    });

    it('should handle version migration', () => {
      // Simulate old versioned format
      const oldVersioned = {
        version: 0,
        config: DEFAULT_AVATAR_CONFIG,
        timestamp: Date.now(),
      };
      localStorage.setItem('paint-and-guess-avatar-config', JSON.stringify(oldVersioned));

      const loaded = loadAvatarConfig();

      expect(loaded).not.toBeNull();
      // Should have saved migrated version
      const saved = localStorage.getItem('paint-and-guess-avatar-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.version).toBe(1);
      }
    });

    it('should include timestamp in saved config', () => {
      const config = createDefaultAvatarConfig();
      saveAvatarConfig(config);

      const saved = localStorage.getItem('paint-and-guess-avatar-config');
      expect(saved).toBeTruthy();
      
      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.timestamp).toBeTypeOf('number');
        expect(parsed.timestamp).toBeGreaterThan(0);
      }
    });
  });

  describe('localStorage quota handling', () => {
    it('should handle quota exceeded gracefully', () => {
      // Mock localStorage to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        const error: any = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const config = createDefaultAvatarConfig();
      
      // Should not throw
      expect(() => saveAvatarConfig(config)).not.toThrow();

      // Restore
      localStorage.setItem = originalSetItem;
    });
  });

  describe('DEFAULT_AVATAR_CONFIG', () => {
    it('should have all required fields', () => {
      expect(DEFAULT_AVATAR_CONFIG).toHaveProperty('id');
      expect(DEFAULT_AVATAR_CONFIG).toHaveProperty('name');
      expect(DEFAULT_AVATAR_CONFIG).toHaveProperty('skinTone');
      expect(DEFAULT_AVATAR_CONFIG).toHaveProperty('hair');
      expect(DEFAULT_AVATAR_CONFIG).toHaveProperty('clothes');
      expect(DEFAULT_AVATAR_CONFIG).toHaveProperty('accessories');
      expect(DEFAULT_AVATAR_CONFIG).toHaveProperty('face');
      expect(DEFAULT_AVATAR_CONFIG).toHaveProperty('body');
    });

    it('should have valid structure', () => {
      expect(DEFAULT_AVATAR_CONFIG.hair).toHaveProperty('style');
      expect(DEFAULT_AVATAR_CONFIG.hair).toHaveProperty('color');
      expect(DEFAULT_AVATAR_CONFIG.clothes).toHaveProperty('color');
      expect(DEFAULT_AVATAR_CONFIG.body.size).toMatch(/^(small|medium|large)$/);
    });
  });
});

