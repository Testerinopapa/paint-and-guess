import { useState, useEffect, useMemo } from "react";

interface CharacterSpriteProps {
  /** Animation state: 'idle' | 'run' | 'jump' */
  animation?: "idle" | "run" | "jump";
  /** Weapon state: 'unarmed' | 'handgun' | 'rifle' */
  weapon?: "unarmed" | "handgun" | "rifle";
  /** Size multiplier (default: 1) */
  scale?: number;
  /** Animation speed in milliseconds per frame (default: 150) */
  frameDelay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CharacterSprite Component
 * 
 * Displays animated 2D pixel art character sprites from the Character asset pack.
 * Layers sprites correctly: BackHand -> Body -> FrontHand
 */
export function CharacterSprite({
  animation = "idle",
  weapon = "unarmed",
  scale = 1,
  frameDelay = 150,
  className = "",
}: CharacterSpriteProps) {
  const [currentFrame, setCurrentFrame] = useState(0);

  // Get frame count based on animation type
  const frameCount = useMemo(() => {
    switch (animation) {
      case "idle":
        return 8;
      case "run":
        return 10;
      case "jump":
        return 7;
      default:
        return 8;
    }
  }, [animation]);

  // Normalize weapon name for file paths
  const weaponPath = useMemo(() => {
    switch (weapon) {
      case "unarmed":
        return "UnArmed";
      case "handgun":
        return "HandGun";
      case "rifle":
        return "Rifle";
      default:
        return "UnArmed";
    }
  }, [weapon]);

  // Normalize animation name for file paths
  const animationPath = useMemo(() => {
    return animation.charAt(0).toUpperCase() + animation.slice(1);
  }, [animation]);

  // Generate sprite paths
  const getSpritePath = (layer: "body" | "backHand" | "frontHand", frame: number): string => {
    const frameNum = String(frame + 1).padStart(2, "0");
    const basePath = "/assets/characters/Character/Character/01-Character";
    
    switch (layer) {
      case "body":
        return `${basePath}/01-Body/${animationPath}/${animationPath}-Body-${frameNum}.png`;
      case "backHand":
        return `${basePath}/02-BackHand/${animationPath}/${weaponPath}/${animationPath}-${weaponPath}-BackHand-${frameNum}.png`;
      case "frontHand":
        // Handle typo in folder name (UnArned vs UnArmed)
        const frontWeaponPath = weapon === "unarmed" ? "UnArned" : weaponPath;
        return `${basePath}/03-FrontHand/${animationPath}/${frontWeaponPath}/${animationPath}-${weaponPath}-FrontHand-${frameNum}.png`;
      default:
        return "";
    }
  };

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frameCount);
    }, frameDelay);

    return () => clearInterval(interval);
  }, [frameCount, frameDelay]);

  const bodyPath = getSpritePath("body", currentFrame);
  const backHandPath = getSpritePath("backHand", currentFrame);
  const frontHandPath = getSpritePath("frontHand", currentFrame);

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: `${64 * scale}px`,
        height: `${64 * scale}px`,
        imageRendering: "pixelated",
      }}
    >
      {/* Back Hand Layer (bottom) */}
      <img
        src={backHandPath}
        alt={`${animation} ${weapon} back hand frame ${currentFrame + 1}`}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ zIndex: 1 }}
        onError={(e) => {
          // Silently handle missing sprites
          e.currentTarget.style.display = "none";
        }}
      />
      
      {/* Body Layer (middle) */}
      <img
        src={bodyPath}
        alt={`${animation} body frame ${currentFrame + 1}`}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ zIndex: 2 }}
        onError={(e) => {
          console.warn(`[CharacterSprite] Failed to load body sprite: ${bodyPath}`);
          e.currentTarget.style.display = "none";
        }}
      />
      
      {/* Front Hand Layer (top) */}
      <img
        src={frontHandPath}
        alt={`${animation} ${weapon} front hand frame ${currentFrame + 1}`}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ zIndex: 3 }}
        onError={(e) => {
          // Silently handle missing sprites
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}




