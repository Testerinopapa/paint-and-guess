# Character Sprite Integration Guide

This document describes the process of integrating new character sprites into the RPG game mode, including the component architecture, scripts, and step-by-step procedures.

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Adding a New Sprite Type](#adding-a-new-sprite-type)
4. [Sprite Sheet Processing](#sprite-sheet-processing)
5. [File Structure Requirements](#file-structure-requirements)
6. [State Management](#state-management)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The RPG game mode supports multiple character sprite types that can be selected during character creation. Each sprite type has its own animation frames and file structure.

### Supported Sprite Types

- **character**: Original layered sprites (BackHand → Body → FrontHand) with weapon support
- **ninja**: Individual frame files from FreeNinja pack
- **knight**: Individual frame files from Knight pack
- **wizard**: Individual frame files from WizardPack
- **skeleton**: Individual frame files from Monsters_Creatures_Fantasy/Skeleton

### Animation States

All sprite types support three animation states:
- `idle`: Standing/idle animation
- `run`: Running/walking animation
- `jump`: Jumping/attack animation

---

## Component Architecture

### CharacterSprite Component

**Location**: `src/games/rpg/components/CharacterSprite.tsx`

The `CharacterSprite` component is responsible for rendering animated character sprites. It handles:
- Frame counting and animation loops
- Path generation for different sprite types
- Rendering logic (layered vs. single-layer sprites)
- Frame reset on sprite type/animation changes

#### Key Functions

1. **Frame Count Logic** (`frameCount` useMemo)
   - Returns the number of frames for each animation state per character type
   - **Important**: Frame counts are hardcoded and must match the actual number of frame files

2. **Animation Mapping Functions**
   - `getNinjaAnimationFolder()` / `getNinjaAnimationPrefix()`
   - `getKnightAnimationFolder()` / `getKnightAnimationPrefix()`
   - `getWizardAnimationFolder()` / `getWizardAnimationPrefix()`
   - `getSkeletonAnimationFolder()` / `getSkeletonAnimationPrefix()`
   
   These functions map animation states (`idle`, `run`, `jump`) to folder names and file prefixes.

3. **Path Generation** (`getSpritePath()`)
   - Constructs file paths based on character type, animation, and frame number
   - Handles different path structures for different sprite types

4. **Rendering Logic**
   - Character type: Uses layered rendering (back hand, body, front hand)
   - Other types: Uses single-layer rendering with `object-contain` CSS

#### Frame Reset Logic

```typescript
useEffect(() => {
  setCurrentFrame(0);
}, [frameCount, characterType, animation]);
```

This ensures the animation always starts from frame 0 when switching sprite types or animations, preventing out-of-bounds errors.

---

## Adding a New Sprite Type

### Step 1: Update Type Definition

Add the new sprite type to `CharacterType`:

```typescript
export type CharacterType = "character" | "ninja" | "knight" | "wizard" | "skeleton" | "your-new-type";
```

### Step 2: Add Frame Count Logic

In the `frameCount` useMemo, add a new condition:

```typescript
if (characterType === "your-new-type") {
  switch (animation) {
    case "idle":
      return 8; // Adjust based on actual frame count
    case "run":
      return 8;
    case "jump":
      return 5;
    default:
      return 8;
  }
}
```

**⚠️ Warning**: Frame counts must match the actual number of frame files. Incorrect counts will cause animation errors.

### Step 3: Add Animation Mapping Functions

Create two functions to map animation states to folder names and file prefixes:

```typescript
const getYourNewTypeAnimationFolder = (): string => {
  switch (animation) {
    case "idle":
      return "Idle";
    case "run":
      return "Walk"; // or "Run" depending on your folder structure
    case "jump":
      return "Attack"; // or "Jump" depending on your folder structure
    default:
      return "Idle";
  }
};

const getYourNewTypeAnimationPrefix = (): string => {
  switch (animation) {
    case "idle":
      return "Idle-Body";
    case "run":
      return "Walk-Body"; // Match folder structure
    case "jump":
      return "Attack-Body";
    default:
      return "Idle-Body";
  }
};
```

### Step 4: Add Path Generation Logic

In `getSpritePath()`, add a condition for your new sprite type:

```typescript
if (characterType === "your-new-type") {
  const folderName = getYourNewTypeAnimationFolder();
  const frameNum = String(frame + 1).padStart(2, "0");
  const prefix = getYourNewTypeAnimationPrefix();
  return `/YourSpritePack/01-YourType/${folderName}/${prefix}-${frameNum}.png`;
}
```

### Step 5: Add Rendering Logic

Add a rendering block for your sprite type:

```typescript
if (characterType === "your-new-type") {
  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: `${128 * scale}px`,
        height: `${128 * scale}px`,
        imageRendering: "pixelated",
      }}
    >
      <img
        src={bodyPath}
        alt={`${animation} your-new-type frame ${currentFrame + 1}`}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ zIndex: 1 }}
        onError={(e) => {
          console.warn(`[CharacterSprite] Failed to load your-new-type sprite: ${bodyPath}`);
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
```

### Step 6: Add UI Button

In `src/games/rpg/components/AvatarCustomization.tsx`, add a button to the sprite type selection grid:

```typescript
<Button
  variant={spriteType === "your-new-type" ? "default" : "outline"}
  size="sm"
  onClick={() => setSpriteType("your-new-type")}
  className="text-xs"
>
  Your New Type
</Button>
```

You may need to adjust the grid layout (e.g., `grid-cols-3` to `grid-cols-4`) if adding more buttons.

---

## Sprite Sheet Processing

### split-sprite-sheet.ts Script

**Location**: `scripts/split-sprite-sheet.ts`

This script splits horizontal sprite sheets into individual frame images, matching the structure expected by `CharacterSprite`.

#### Usage

```bash
npx tsx scripts/split-sprite-sheet.ts <sprite-sheet-path> <output-dir> <frame-width> [frame-count] [frame-prefix]
```

#### Parameters

- `sprite-sheet-path`: Path to the sprite sheet image (relative to project root)
- `output-dir`: Directory where individual frames will be saved
- `frame-width`: Expected width of each frame in pixels
- `frame-count`: (Optional) Number of frames to extract
- `frame-prefix`: (Optional) Prefix for output files (e.g., "Idle-Body" → "Idle-Body-01.png")

#### Examples

```bash
# Split ninja idle animation (8 frames)
npx tsx scripts/split-sprite-sheet.ts public/FreeNinja/01-Ninja/Idle/yellowNinja-idle.png public/FreeNinja/01-Ninja/Idle 100 8 "Idle-Body"

# Split knight idle animation (12 frames, but only use 10)
npx tsx scripts/split-sprite-sheet.ts public/Knight/01-Knight/Idle/Idle.png public/Knight/01-Knight/Idle 160 12 "Idle-Body"
```

#### How It Works

1. **Sprite Detection**: The script detects sprite boundaries by:
   - Scanning for transitions from empty (transparent) to non-empty columns
   - Calculating a "unit size" based on known sprite dimensions (5 units for sprite, 19 units for gap)
   - Finding sprite start positions

2. **Frame Extraction**:
   - Starts extraction 2 units before each sprite (to include empty space)
   - Includes the full sprite width (5 units) plus 1 unit of padding
   - Prevents overlap between frames
   - Stops 1 unit before the next sprite

3. **Output**:
   - Creates individual PNG files named `{prefix}-{frameNumber}.png`
   - Frame numbers are zero-padded (01, 02, 03, etc.)

#### Known Limitations

- Designed for sprite sheets with consistent spacing (5-unit sprites, 19-unit gaps)
- May need adjustment for different sprite sheet layouts
- Frame counts must be manually verified after extraction

---

## File Structure Requirements

### Standard Structure

All sprite types (except `character`) follow this structure:

```
public/
  YourSpritePack/
    01-YourType/
      Idle/
        Idle-Body-01.png
        Idle-Body-02.png
        ...
      Walk/ (or Run/)
        Walk-Body-01.png
        Walk-Body-02.png
        ...
      Attack/ (or Jump/)
        Attack-Body-01.png
        Attack-Body-02.png
        ...
```

### Character Type Structure

The original `character` type uses a layered structure:

```
public/assets/characters/Character/Character/01-Character/
  01-Body/
    Idle/
      Idle-Body-01.png
      ...
    Run/
      Run-Body-01.png
      ...
  02-BackHand/
    Idle/
      UnArmed/
        Idle-UnArmed-BackHand-01.png
        ...
  03-FrontHand/
    Idle/
      UnArned/ (note: typo in folder name)
        Idle-UnArmed-FrontHand-01.png
        ...
```

### Naming Convention

- Frame files must be named: `{Animation}-Body-{FrameNumber}.png`
- Frame numbers must be zero-padded to 2 digits (01, 02, 03, etc.)
- Frame numbers start at 01 (not 00)

---

## State Management

### RPG Store Integration

**Location**: `src/games/rpg/state/useRpgStore.tsx`

Sprite types are stored in the RPG Zustand store:

```typescript
interface Character {
  spriteType?: CharacterType;
  // ... other properties
}

interface RpgStore {
  setCharacterSpriteType: (spriteType: CharacterType) => void;
  // ... other methods
}
```

### Character Creation Flow

1. User selects sprite type in `AvatarCustomization` component
2. Selection is stored in local storage: `rpg-character-creation-sprite-type`
3. `onSpriteTypeChange` callback notifies `CharacterCreation` component
4. On form submission, `setCharacterSpriteType()` is called
5. Sprite type is persisted in the RPG store

### Local Storage

- **Key**: `rpg-character-creation-sprite-type`
- **Value**: One of the `CharacterType` values
- **Purpose**: Persists user's sprite type preference across sessions

---

## Troubleshooting

### Animation Shows Wrong Frame Count

**Symptom**: Animation tries to load frames that don't exist (e.g., `Idle-Body-07.png` when only 6 frames exist)

**Solution**: 
1. Verify the actual number of frame files in the directory
2. Update the `frameCount` logic in `CharacterSprite.tsx`
3. Ensure the frame reset `useEffect` includes `characterType` in dependencies

### Sprites Appear Cut in Half

**Symptom**: After splitting a sprite sheet, some frames show the sprite cut in half or mostly black space

**Solution**:
1. Check the sprite sheet dimensions and spacing
2. Adjust the `split-sprite-sheet.ts` script parameters:
   - `spriteWidthUnits` and `gapWidthUnits` in `findSpriteStarts()`
   - `emptySpaceBeforePx` calculation
3. Manually verify extracted frames and recut if necessary

### Sprite Size Inconsistencies

**Symptom**: One frame appears larger/smaller than others during animation

**Solution**:
1. Check that all frame images have consistent dimensions
2. Verify the container size in the rendering logic (should be `128 * scale` for most types)
3. Ensure `object-contain` CSS class is applied correctly

### Path Resolution Errors

**Symptom**: Script fails with "Sprite sheet not found" or incorrect paths

**Solution**:
1. Use relative paths from project root (e.g., `public/...`)
2. Verify `findProjectRoot()` in `split-sprite-sheet.ts` correctly identifies the project root
3. Check that paths use forward slashes (`/`) even on Windows

### Frame Count Mismatch

**Symptom**: Console warnings about missing sprite files

**Solution**:
1. Count the actual frame files in the directory
2. Update the `frameCount` return value to match
3. **Important**: Do not change frame counts marked with "DO NOT CHANGE THIS IT BREAKS EVERYTHING" comments without verifying the actual file count

---

## Scripts Reference

### split-sprite-sheet.ts

**Purpose**: Split horizontal sprite sheets into individual frame images

**Dependencies**: `sharp` (image processing library)

**Key Functions**:
- `findSpriteStarts()`: Detects sprite boundaries using unit-based calculations
- `detectSpriteBounds()`: Finds actual sprite boundaries within a frame area
- `splitSpriteSheet()`: Main function that extracts frames

**Algorithm**:
1. Detect sprite starts by scanning for empty-to-non-empty column transitions
2. Calculate unit size based on distance between first two sprites
3. Extract frames starting 2 units before each sprite
4. Include sprite width (5 units) + 1 unit padding
5. Prevent overlap between frames

---

## Best Practices

1. **Always verify frame counts**: Count actual files before setting frame counts in code
2. **Test animations**: Verify all animation states work after adding a new sprite type
3. **Consistent naming**: Follow the `{Animation}-Body-{FrameNumber}.png` convention
4. **Path consistency**: Use forward slashes in paths, even on Windows
5. **Error handling**: The component includes `onError` handlers that hide missing sprites gracefully
6. **Documentation**: Update this document when adding new sprite types or changing the process

---

## Related Files

- `src/games/rpg/components/CharacterSprite.tsx` - Main sprite rendering component
- `src/games/rpg/components/AvatarCustomization.tsx` - Character creation sprite selection UI
- `src/games/rpg/components/CharacterCreation.tsx` - Character creation form
- `src/games/rpg/components/PlayerPanel.tsx` - Main game player panel (uses CharacterSprite)
- `src/games/rpg/state/useRpgStore.tsx` - RPG game state management
- `scripts/split-sprite-sheet.ts` - Sprite sheet splitting script

---

## Version History

- **Initial Version**: Documented integration of ninja, knight, wizard, and skeleton sprites
- **Frame Count Fixes**: Wizard (5 frames), Skeleton (3 frames) - user-verified counts
- **Script Improvements**: Added unit-based sprite detection for better frame extraction

