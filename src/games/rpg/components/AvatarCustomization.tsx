import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Draggable from "react-draggable";
import { X, User, Image, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CharacterAvatar } from "./CharacterAvatar";
import { CharacterSprite, type SpritePack, type CharacterType } from "./CharacterSprite";
import { createDefaultAvatarConfig, type AvatarConfig } from "@/lib/avatar/config";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AvatarCustomizationProps {
  characterName: string;
  onAvatarChange: (config: AvatarConfig | null) => void;
}

export const AvatarCustomization = ({ characterName, onAvatarChange }: AvatarCustomizationProps) => {
  const avatarNodeRef = useRef<HTMLDivElement>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(() => {
    // Try to load existing config, or create default
    const existing = safeLoadAvatarConfig();
    return existing || createDefaultAvatarConfig(characterName || "Character");
  });

  // Toggle between sprite and SVG avatar (shared preference with PlayerPanel)
  const [useSprite, setUseSprite] = useState(() => {
    const saved = localStorage.getItem("rpg-player-avatar-mode");
    return saved === "sprite";
  });

  // Sprite pack selection
  const [spritePack, setSpritePack] = useState<SpritePack>(() => {
    const saved = localStorage.getItem("rpg-sprite-pack");
    return (saved === "soldier-orc" ? "soldier-orc" : "character") as SpritePack;
  });

  // Character type for soldier-orc pack
  const [characterType, setCharacterType] = useState<CharacterType>(() => {
    const saved = localStorage.getItem("rpg-character-type");
    return (saved === "orc" ? "orc" : "soldier") as CharacterType;
  });

  useEffect(() => {
    localStorage.setItem("rpg-player-avatar-mode", useSprite ? "sprite" : "svg");
  }, [useSprite]);

  useEffect(() => {
    localStorage.setItem("rpg-sprite-pack", spritePack);
  }, [spritePack]);

  useEffect(() => {
    localStorage.setItem("rpg-character-type", characterType);
  }, [characterType]);

  const handleRandomize = () => {
    // Generate a random seed based on current time
    const randomSeed = `${characterName}-${Date.now()}-${Math.random()}`;
    const newConfig = createDefaultAvatarConfig(randomSeed);
    setAvatarConfig(newConfig);
    onAvatarChange(newConfig);
  };

  const handleReset = () => {
    const defaultConfig = createDefaultAvatarConfig(characterName || "Character");
    setAvatarConfig(defaultConfig);
    onAvatarChange(defaultConfig);
  };

  return (
    <TooltipProvider>
      <Draggable
        nodeRef={avatarNodeRef}
        handle=".avatar-handle"
        defaultPosition={{ 
          x: typeof window !== "undefined" ? window.innerWidth / 2 + 250 : 0, 
          y: typeof window !== "undefined" ? window.innerHeight / 2 - 200 : 100 
        }}
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
            className="w-80 bg-card border-2 border-primary/30 rounded-lg shadow-2xl"
          >
            {/* Header */}
            <div
              className="avatar-handle cursor-move flex items-center justify-between p-4 bg-secondary/30 border-b-2 border-primary/30 rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-primary">Avatar Customization</h3>
              </div>
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
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-primary/50 bg-secondary/30 flex items-center justify-center">
                {useSprite ? (
                  <CharacterSprite
                    animation="idle"
                    weapon="unarmed"
                    scale={spritePack === "soldier-orc" ? 1.92 : 3}
                    frameDelay={150}
                    className="w-full h-full flex items-center justify-center"
                    spritePack={spritePack}
                    characterType={characterType}
                  />
                ) : (
                  <CharacterAvatar
                    characterName={characterName || "Character"}
                    avatarConfig={avatarConfig || undefined}
                    size={192}
                    className="w-full h-full"
                    fallback="⚔️"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Your character's appearance
              </p>
            </div>

            {/* Sprite Pack Selection (only shown when using sprites) */}
            {useSprite && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Sprite Pack
                </p>
                <Select
                  value={spritePack}
                  onValueChange={(value) => setSpritePack(value as SpritePack)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="character">Character Pack</SelectItem>
                    <SelectItem value="soldier-orc">Soldier & Orc Pack</SelectItem>
                  </SelectContent>
                </Select>
                
                {spritePack === "soldier-orc" && (
                  <Select
                    value={characterType}
                    onValueChange={(value) => setCharacterType(value as CharacterType)}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soldier">Soldier</SelectItem>
                      <SelectItem value="orc">Orc</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Customization Options */}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Quick Actions
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRandomize}
                    className="w-full"
                  >
                    🎲 Randomize Avatar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="w-full"
                  >
                    🔄 Reset to Default
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 bg-muted/30 rounded-md border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Your avatar is generated based on your character name. 
                  Use "Randomize" to try different looks!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Draggable>
    </TooltipProvider>
  );
};

