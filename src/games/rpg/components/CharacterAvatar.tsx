/**
 * Character Avatar Component
 * 
 * Displays RPG character avatars using the existing avatar system infrastructure.
 * Supports both full AvatarConfig customization and simple seed-based generation.
 * 
 * @see docs/avatar-system-analysis.md for avatar system architecture
 */

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getDiceBearAvatarUrl, getDiceBearAvatarUrlFromSeed } from "@/lib/avatar/dicebear/api";
import { createDefaultAvatarConfig } from "@/lib/avatar/config";
import type { AvatarConfig } from "@/lib/avatar/config";
import { useMemo } from "react";

interface CharacterAvatarProps {
  /** Character name - used as seed if no avatarConfig provided */
  characterName: string;
  /** Optional full avatar configuration for customization */
  avatarConfig?: AvatarConfig;
  /** Optional simple seed string for deterministic generation */
  avatarSeed?: string;
  /** Avatar size in pixels (default: 128) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Fallback emoji/text when avatar fails to load (default: "⚔️") */
  fallback?: string;
  /** DiceBear style to use (default: "avataaars") */
  style?: string;
}

/**
 * CharacterAvatar Component
 * 
 * Renders a character avatar using the existing DiceBear avatar system.
 * If avatarConfig is provided, uses full customization. Otherwise,
 * generates a deterministic avatar from character name or seed.
 */
export function CharacterAvatar({
  characterName,
  avatarConfig,
  avatarSeed,
  size = 128,
  className,
  fallback = "⚔️",
  style = "avataaars",
}: CharacterAvatarProps) {
  // Generate avatar URL based on available configuration
  const avatarUrl = useMemo(() => {
    try {
      // Priority 1: Use provided avatar config (full customization)
      if (avatarConfig) {
        return getDiceBearAvatarUrl(avatarConfig, { 
          format: "svg", 
          size,
          style 
        });
      }
      
      // Priority 2: Use provided seed
      if (avatarSeed) {
        return getDiceBearAvatarUrlFromSeed(avatarSeed, { 
          format: "svg", 
          size,
          style 
        });
      }
      
      // Priority 3: Generate from character name (deterministic)
      // Create a default config with character name as seed
      const defaultConfig = createDefaultAvatarConfig(characterName);
      return getDiceBearAvatarUrl(defaultConfig, { 
        format: "svg", 
        size,
        style 
      });
    } catch (error) {
      console.error("[CharacterAvatar] Failed to generate avatar URL:", error);
      return null;
    }
  }, [avatarConfig, avatarSeed, characterName, size, style]);

  return (
    <Avatar className={className}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={`${characterName}'s avatar`}
          className="object-cover"
        />
      )}
      <AvatarFallback className="text-4xl bg-secondary/30">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}


