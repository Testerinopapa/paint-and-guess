/**
 * Avatar Customization Component
 * 
 * A draggable popup panel for customizing the character's avatar during character creation.
 * Displays a preview of the avatar and provides options to randomize or reset to default.
 * 
 * @see docs/rpg-npcs.md for component pattern reference
 */

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Shuffle, RotateCcw, Image, Layers } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CharacterAvatar } from "./CharacterAvatar";
import { CharacterSprite, type CharacterType } from "./CharacterSprite";
import { createDefaultAvatarConfig, generateAvatarId } from "@/lib/avatar/config";
import type { AvatarConfig } from "@/lib/avatar/config";
import { getAssetsByCategory } from "@/lib/avatar/categories/assets";

interface AvatarCustomizationProps {
  /** Character name - used for default avatar generation */
  characterName: string;
  /** Callback when avatar configuration changes */
  onAvatarChange: (config: AvatarConfig | null) => void;
  /** Optional initial avatar configuration */
  initialAvatarConfig?: AvatarConfig | null;
  /** Callback when sprite type changes */
  onSpriteTypeChange?: (spriteType: CharacterType) => void;
  /** Optional initial sprite type */
  initialSpriteType?: CharacterType;
}

/**
 * AvatarCustomization Component
 * 
 * Provides a draggable interface for customizing character avatars during creation.
 * Positioned to the right of the character creation form.
 */
export const AvatarCustomization = ({
  characterName,
  onAvatarChange,
  initialAvatarConfig,
  onSpriteTypeChange,
  initialSpriteType = "character",
}: AvatarCustomizationProps) => {
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(
    initialAvatarConfig || createDefaultAvatarConfig(characterName)
  );
  const avatarNodeRef = useRef<HTMLDivElement>(null);
  
  // Toggle between sprite and SVG avatar
  const [useSprite, setUseSprite] = useState(() => {
    const saved = localStorage.getItem("rpg-character-creation-avatar-mode");
    return saved === "sprite";
  });
  
  // Character sprite type selection
  const [spriteType, setSpriteType] = useState<CharacterType>(() => {
    if (initialSpriteType) return initialSpriteType;
    const saved = localStorage.getItem("rpg-character-creation-sprite-type");
    return (saved as CharacterType) || "character";
  });

  useEffect(() => {
    localStorage.setItem("rpg-character-creation-avatar-mode", useSprite ? "sprite" : "svg");
  }, [useSprite]);
  
  useEffect(() => {
    localStorage.setItem("rpg-character-creation-sprite-type", spriteType);
    onSpriteTypeChange?.(spriteType);
  }, [spriteType, onSpriteTypeChange]);

  // Notify parent when avatar config changes
  useEffect(() => {
    onAvatarChange(avatarConfig);
  }, [avatarConfig, onAvatarChange]);

  /**
   * Randomize Avatar
   * 
   * Generates a new avatar configuration with random selections from available assets.
   */
  const handleRandomize = () => {
    const skinTones = getAssetsByCategory("skin-tone");
    const hairStyles = getAssetsByCategory("hair-style");
    const hairColors = getAssetsByCategory("hair-color");
    const tops = getAssetsByCategory("clothing-top");
    const bottoms = getAssetsByCategory("clothing-bottom");
    const outfits = getAssetsByCategory("clothing-outfit");
    const hats = getAssetsByCategory("accessory-hat");
    const glasses = getAssetsByCategory("accessory-glasses");
    const eyes = getAssetsByCategory("face-eyes");
    const eyebrows = getAssetsByCategory("face-eyebrows");
    const mouths = getAssetsByCategory("face-mouth");
    const facialHair = getAssetsByCategory("face-facial-hair");
    const bodyShapes = getAssetsByCategory("body-shape");

    const randomItem = <T,>(arr: T[]): T | null => {
      return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
    };

    const randomConfig: AvatarConfig = {
      id: "", // Will be generated after config is created
      name: characterName,
      skinTone: randomItem(skinTones)?.id || "default",
      hair: {
        style: randomItem(hairStyles)?.id || "default",
        color: randomItem(hairColors)?.id || "#000000",
      },
      clothes: {
        top: randomItem(tops)?.id || null,
        bottom: randomItem(bottoms)?.id || null,
        outfit: randomItem(outfits)?.id || null,
        color: "#3B82F6",
      },
      accessories: {
        hat: randomItem(hats)?.id || null,
        glasses: randomItem(glasses)?.id || null,
        jewelry: [],
        other: [],
      },
      face: {
        eyes: randomItem(eyes)?.id || "default",
        eyebrows: randomItem(eyebrows)?.id || "default",
        mouth: randomItem(mouths)?.id || "default",
        facialHair: randomItem(facialHair)?.id || null,
      },
      body: {
        shape: randomItem(bodyShapes)?.id || "default",
        size: Math.random() > 0.5 ? "medium" : Math.random() > 0.5 ? "large" : "small",
      },
      diceBear: {
        clothingGraphic: null,
        backgroundStyle: "default",
        backgroundColor: null,
      },
    };

    // Generate ID from the complete config
    randomConfig.id = generateAvatarId(randomConfig);
    setAvatarConfig(randomConfig);
  };

  /**
   * Reset to Default
   * 
   * Resets the avatar configuration to default values based on character name.
   */
  const handleReset = () => {
    const defaultConfig = createDefaultAvatarConfig(characterName);
    setAvatarConfig(defaultConfig);
  };

  return (
    <TooltipProvider>
      <Draggable
        nodeRef={avatarNodeRef}
        handle=".avatar-handle"
        defaultPosition={{ x: typeof window !== "undefined" ? window.innerWidth - 420 : 0, y: 100 }}
      >
        <div
          ref={avatarNodeRef}
          style={{
            position: "fixed",
            zIndex: 50,
            left: 0,
            top: 0,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-card border-2 border-primary/30 shadow-2xl w-80">
              {/* Header */}
              <div
                className="avatar-handle flex items-center justify-between p-4 border-b border-primary/20 cursor-move bg-primary/5"
              >
                  <h3 className="text-lg font-bold text-primary">Avatar Preview</h3>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUseSprite(!useSprite);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {useSprite ? (
                            <Image className="w-4 h-4" />
                          ) : (
                            <Layers className="w-4 h-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Switch to {useSprite ? "SVG Avatar" : "Sprite Animation"}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setAvatarConfig(null);
                        onAvatarChange(null);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

              {/* Avatar Preview */}
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-primary/50 bg-secondary/30 flex items-center justify-center">
                  {useSprite ? (
                    <CharacterSprite
                      characterType={spriteType}
                      animation="idle"
                      weapon="unarmed"
                      scale={4}
                      frameDelay={150}
                      className="w-full h-full flex items-center justify-center"
                    />
                  ) : (
                    <CharacterAvatar
                      characterName={characterName}
                      avatarConfig={avatarConfig || undefined}
                      size={256}
                      className="w-full h-full"
                    />
                  )}
                </div>

                {/* Sprite Type Selection (only when using sprite) */}
                {useSprite && (
                  <div className="w-full space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Sprite Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={spriteType === "character" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSpriteType("character")}
                          className="text-xs"
                        >
                          Character
                        </Button>
                        <Button
                          variant={spriteType === "ninja" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSpriteType("ninja")}
                          className="text-xs"
                        >
                          Ninja
                        </Button>
                        <Button
                          variant={spriteType === "knight" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSpriteType("knight")}
                          className="text-xs"
                        >
                          Knight
                        </Button>
                        <Button
                          variant={spriteType === "wizard" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSpriteType("wizard")}
                          className="text-xs"
                        >
                          Wizard
                        </Button>
                        <Button
                          variant={spriteType === "skeleton" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSpriteType("skeleton")}
                          className="text-xs"
                        >
                          Skeleton
                        </Button>
                        <Button
                          variant={spriteType === "goblin" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSpriteType("goblin")}
                          className="text-xs"
                        >
                          Goblin
                        </Button>
                        <Button
                          variant={spriteType === "martialHero" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSpriteType("martialHero")}
                          className="text-xs"
                        >
                          Martial Hero
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={handleRandomize}
                    className="flex-1 border-primary/30 hover:bg-primary/10"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Randomize
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 border-primary/30 hover:bg-primary/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-2">
                  Drag this panel to move it around
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </Draggable>
    </TooltipProvider>
  );
};
