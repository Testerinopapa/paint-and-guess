import { useState, useEffect, useMemo } from "react";

export type CharacterType = "character" | "ninja" | "knight" | "wizard" | "skeleton" | "goblin" | "martialHero";

interface CharacterSpriteProps {
  /** Character type: 'character' | 'ninja' | 'knight' | 'wizard' | 'skeleton' | 'goblin' | 'martialHero' */
  characterType?: CharacterType;
  /** Animation state: 'idle' | 'run' | 'jump' */
  animation?: "idle" | "run" | "jump";
  /** Weapon state: 'unarmed' | 'handgun' | 'rifle' (only for 'character' type) */
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
 * Displays animated 2D pixel art character sprites.
 * Supports multiple character types:
 * - 'character': Layered sprites (BackHand -> Body -> FrontHand)
 * - 'ninja': Individual frame files (Idle-Body-01.png, etc.)
 * - 'knight': Individual frame files (Idle-Body-01.png, etc.)
 * - 'wizard': Individual frame files (Idle-Body-01.png, etc.)
 * - 'skeleton': Individual frame files (Idle-Body-01.png, etc.)
 * - 'goblin': Individual frame files (Idle-Body-01.png, etc.)
 * - 'martialHero': Individual frame files (Idle-Body-01.png, etc.)
 */
export function CharacterSprite({
  characterType = "character",
  animation = "idle",
  weapon = "unarmed",
  scale = 1,
  frameDelay = 150,
  className = "",
}: CharacterSpriteProps) {
  const [currentFrame, setCurrentFrame] = useState(0);

  // Get frame count based on animation type and character type
  const frameCount = useMemo(() => {
    // For ninja, use individual frame files
    if (characterType === "ninja") {
      switch (animation) {
        case "idle":
          return 8; // Idle has 8 frames
        case "run":
          return 8; // Walk will have 8 frames when split
        case "jump":
          return 5; // Hit has 5 frames
        default:
          return 8;
      }
    }
    
    // For knight, use individual frame files
    if (characterType === "knight") {
      switch (animation) {
        case "idle":
          return 10; // Idle has 10 frames
        case "run":
          return 8; // Run will have 8 frames when available
        case "jump":
          return 8; // Jump will have 8 frames when available
        default:
          return 10;
      }
    }
    
    // For wizard, use individual frame files
    if (characterType === "wizard") {
      switch (animation) {
        case "idle":
          return 5; // DO NOT CHANGE THIS IT BREAKS EVERYTHING
        case "run":
          return 6; // Run will have 6 frames when available
        case "jump":
          return 6; // Jump will have 6 frames when available
        default:
          return 6;
      }
    }
    
    // For skeleton, use individual frame files
    if (characterType === "skeleton") {
      switch (animation) {
        case "idle":
          return 3; // DO NOT CHANGE THIS IT BREAKS EVERYTHING
        case "run":
          return 4; // Run will have frames when available
        case "jump":
          return 4; // Jump will have frames when available
        default:
          return 4;
      }
    }
    
    // For goblin, use individual frame files
    if (characterType === "goblin") {
      switch (animation) {
        case "idle":
          return 3; // DO NOT CHANGE THIS
        case "run":
          return 4; // Run will have frames when available
        case "jump":
          return 4; // Jump will have frames when available
        default:
          return 4;
      }
    }
    
    // For martialHero, use individual frame files
    if (characterType === "martialHero") {
      switch (animation) {
        case "idle":
          return 7; // Idle has 8 frames
        case "run":
          return 8; // Run will have frames when available
        case "jump":
          return 8; // Jump will have frames when available
        default:
          return 8;
      }
    }
    
    // Original character type with multiple frames
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
  }, [animation, characterType]);

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

  // Map animation names to folder and file names for ninja
  const getNinjaAnimationFolder = (): string => {
    switch (animation) {
      case "idle":
        return "Idle";
      case "run":
        return "Walk";
      case "jump":
        return "Hit"; // Use hit as jump-like animation
      default:
        return "Idle";
    }
  };

  const getNinjaAnimationPrefix = (): string => {
    switch (animation) {
      case "idle":
        return "Idle-Body";
      case "run":
        return "Walk-Body"; // Will need to split walk sprite sheet
      case "jump":
        return "Hit-Body";
      default:
        return "Idle-Body";
    }
  };

  // Map animation names to folder and file names for knight
  const getKnightAnimationFolder = (): string => {
    switch (animation) {
      case "idle":
        return "Idle";
      case "run":
        return "Run";
      case "jump":
        return "Jump";
      default:
        return "Idle";
    }
  };

  const getKnightAnimationPrefix = (): string => {
    switch (animation) {
      case "idle":
        return "Idle-Body";
      case "run":
        return "Run-Body";
      case "jump":
        return "Jump-Body";
      default:
        return "Idle-Body";
    }
  };

  // Map animation names to folder and file names for wizard
  const getWizardAnimationFolder = (): string => {
    switch (animation) {
      case "idle":
        return "Idle";
      case "run":
        return "Run";
      case "jump":
        return "Jump";
      default:
        return "Idle";
    }
  };

  const getWizardAnimationPrefix = (): string => {
    switch (animation) {
      case "idle":
        return "Idle-Body";
      case "run":
        return "Run-Body";
      case "jump":
        return "Jump-Body";
      default:
        return "Idle-Body";
    }
  };

  // Map animation names to folder and file names for skeleton
  const getSkeletonAnimationFolder = (): string => {
    switch (animation) {
      case "idle":
        return "Idle";
      case "run":
        return "Walk";
      case "jump":
        return "Attack";
      default:
        return "Idle";
    }
  };

  const getSkeletonAnimationPrefix = (): string => {
    switch (animation) {
      case "idle":
        return "Idle-Body";
      case "run":
        return "Walk-Body";
      case "jump":
        return "Attack-Body";
      default:
        return "Idle-Body";
    }
  };

  // Map animation names to folder and file names for goblin
  const getGoblinAnimationFolder = (): string => {
    switch (animation) {
      case "idle":
        return "Idle";
      case "run":
        return "Walk";
      case "jump":
        return "Attack";
      default:
        return "Idle";
    }
  };

  const getGoblinAnimationPrefix = (): string => {
    switch (animation) {
      case "idle":
        return "Idle-Body";
      case "run":
        return "Walk-Body";
      case "jump":
        return "Attack-Body";
      default:
        return "Idle-Body";
    }
  };

  // Map animation names to folder and file names for martialHero
  const getMartialHeroAnimationFolder = (): string => {
    switch (animation) {
      case "idle":
        return "Idle";
      case "run":
        return "Run";
      case "jump":
        return "Jump";
      default:
        return "Idle";
    }
  };

  const getMartialHeroAnimationPrefix = (): string => {
    switch (animation) {
      case "idle":
        return "Idle-Body";
      case "run":
        return "Run-Body";
      case "jump":
        return "Jump-Body";
      default:
        return "Idle-Body";
    }
  };

  // Generate sprite paths
  const getSpritePath = (layer: "body" | "backHand" | "frontHand", frame: number): string => {
    // Handle ninja sprites (individual frame files)
    if (characterType === "ninja") {
      const folderName = getNinjaAnimationFolder();
      const frameNum = String(frame + 1).padStart(2, "0");
      const prefix = getNinjaAnimationPrefix();
      return `/FreeNinja/01-Ninja/${folderName}/${prefix}-${frameNum}.png`;
    }
    
    // Handle knight sprites (individual frame files)
    if (characterType === "knight") {
      const folderName = getKnightAnimationFolder();
      const frameNum = String(frame + 1).padStart(2, "0");
      const prefix = getKnightAnimationPrefix();
      return `/Knight/01-Knight/${folderName}/${prefix}-${frameNum}.png`;
    }
    
    // Handle wizard sprites (individual frame files)
    if (characterType === "wizard") {
      const folderName = getWizardAnimationFolder();
      const frameNum = String(frame + 1).padStart(2, "0");
      const prefix = getWizardAnimationPrefix();
      return `/WizardPack/01-Wizard/${folderName}/${prefix}-${frameNum}.png`;
    }
    
    // Handle skeleton sprites (individual frame files)
    if (characterType === "skeleton") {
      const folderName = getSkeletonAnimationFolder();
      const frameNum = String(frame + 1).padStart(2, "0");
      const prefix = getSkeletonAnimationPrefix();
      return `/Monsters_Creatures_Fantasy/Skeleton/01-Skeleton/${folderName}/${prefix}-${frameNum}.png`;
    }
    
    // Handle goblin sprites (individual frame files)
    if (characterType === "goblin") {
      const folderName = getGoblinAnimationFolder();
      const frameNum = String(frame + 1).padStart(2, "0");
      const prefix = getGoblinAnimationPrefix();
      return `/Monsters_Creatures_Fantasy/Goblin/01-Goblin/${folderName}/${prefix}-${frameNum}.png`;
    }
    
    // Handle martialHero sprites (individual frame files)
    if (characterType === "martialHero") {
      const folderName = getMartialHeroAnimationFolder();
      const frameNum = String(frame + 1).padStart(2, "0");
      const prefix = getMartialHeroAnimationPrefix();
      return `/MartialHero/01-MartialHero/${folderName}/${prefix}-${frameNum}.png`;
    }
    
    // Original character type with layered sprites
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

  // Reset currentFrame when frameCount changes to prevent out-of-range frames
  useEffect(() => {
    setCurrentFrame(0);
  }, [frameCount, characterType, animation]);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frameCount);
    }, frameDelay);

    return () => clearInterval(interval);
  }, [frameCount, frameDelay]);

  // Clamp currentFrame to valid range to prevent out-of-bounds access
  const safeFrame = Math.min(currentFrame, frameCount - 1);
  
  const bodyPath = getSpritePath("body", safeFrame);
  const backHandPath = getSpritePath("backHand", safeFrame);
  const frontHandPath = getSpritePath("frontHand", safeFrame);

  // For ninja, use individual frame files (like Character type)
  // Ninja frames are 128x128px, Character frames are 64x64px
  // Character: 64px native image in 128px container = 2x visual scale
  // Ninja: 128px native image, display at full size (128px) = 2x larger than character
  if (characterType === "ninja") {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{
          width: `${128 * scale}px`,
          height: `${128 * scale}px`,
          imageRendering: "pixelated",
        }}
      >
        {/* Ninja Body (single layer, no hands) - full size */}
        <img
          src={bodyPath}
          alt={`${animation} ninja frame ${currentFrame + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 1 }}
          onError={(e) => {
            console.warn(`[CharacterSprite] Failed to load ninja sprite: ${bodyPath}`);
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  // For knight, use individual frame files (like Character type)
  if (characterType === "knight") {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{
          width: `${128 * scale}px`,
          height: `${128 * scale}px`,
          imageRendering: "pixelated",
        }}
      >
        {/* Knight Body (single layer, no hands) */}
        <img
          src={bodyPath}
          alt={`${animation} knight frame ${currentFrame + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 1 }}
          onError={(e) => {
            console.warn(`[CharacterSprite] Failed to load knight sprite: ${bodyPath}`);
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  // For wizard, use individual frame files (like Character type)
  if (characterType === "wizard") {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{
          width: `${128 * scale}px`,
          height: `${128 * scale}px`,
          imageRendering: "pixelated",
        }}
      >
        {/* Wizard Body (single layer, no hands) */}
        <img
          src={bodyPath}
          alt={`${animation} wizard frame ${currentFrame + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 1 }}
          onError={(e) => {
            console.warn(`[CharacterSprite] Failed to load wizard sprite: ${bodyPath}`);
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  // For skeleton, use individual frame files (like Character type)
  if (characterType === "skeleton") {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{
          width: `${128 * scale}px`,
          height: `${128 * scale}px`,
          imageRendering: "pixelated",
        }}
      >
        {/* Skeleton Body (single layer, no hands) */}
        <img
          src={bodyPath}
          alt={`${animation} skeleton frame ${currentFrame + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 1 }}
          onError={(e) => {
            console.warn(`[CharacterSprite] Failed to load skeleton sprite: ${bodyPath}`);
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  // For goblin, use individual frame files (like Character type)
  if (characterType === "goblin") {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{
          width: `${128 * scale}px`,
          height: `${128 * scale}px`,
          imageRendering: "pixelated",
        }}
      >
        {/* Goblin Body (single layer, no hands) */}
        <img
          src={bodyPath}
          alt={`${animation} goblin frame ${currentFrame + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 1 }}
          onError={(e) => {
            console.warn(`[CharacterSprite] Failed to load goblin sprite: ${bodyPath}`);
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  // For martialHero, use individual frame files (like Character type)
  if (characterType === "martialHero") {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{
          width: `${128 * scale}px`,
          height: `${128 * scale}px`,
          imageRendering: "pixelated",
        }}
      >
        {/* MartialHero Body (single layer, no hands) */}
        <img
          src={bodyPath}
          alt={`${animation} martialHero frame ${currentFrame + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ zIndex: 1 }}
          onError={(e) => {
            console.warn(`[CharacterSprite] Failed to load martialHero sprite: ${bodyPath}`);
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

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




