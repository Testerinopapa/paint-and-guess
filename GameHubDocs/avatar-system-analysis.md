# Avatar System Analysis

## Overview

The avatar system in Paint & Guess is a comprehensive customization framework that allows players to create and personalize their avatars. The system supports multiple rendering methods (DiceBear, custom SVG, and drawable avatars), persistent storage, validation, and integration with the multiplayer game state.

## Architecture

### Core Components

#### 1. Configuration Layer (`src/lib/avatar/`)

**`config.ts`** - Core data structures and storage
- **Interfaces:**
  - `AvatarConfig`: Main configuration object containing all customization options
  - `AvatarHair`: Hair style and color configuration
  - `AvatarClothes`: Clothing options (top, bottom, outfit, color)
  - `AvatarAccessories`: Hat, glasses, jewelry, and other accessories
  - `AvatarFace`: Eyes, eyebrows, mouth, and facial hair
  - `AvatarBody`: Body shape and size
  - `DiceBearOptions`: DiceBear-specific rendering options

- **Key Functions:**
  - `createDefaultAvatarConfig()`: Creates a new avatar with default values
  - `loadAvatarConfig()`: Loads avatar from localStorage with version migration
  - `saveAvatarConfig()`: Saves avatar to localStorage with versioning
  - `generateAvatarId()`: Creates deterministic ID from config content
  - `cloneAvatarConfig()`: Deep copy utility
  - `encodeAvatarConfig()` / `decodeAvatarConfig()`: Network transmission utilities

- **Storage:**
  - Uses localStorage with key: `paint-and-guess-avatar-config`
  - Versioned storage format (current version: 1)
  - Automatic migration from legacy formats
  - Handles quota exceeded errors gracefully

**`validation.ts`** - Runtime validation and sanitization
- `validateAvatarConfig()`: Type guard for config validation
- `sanitizeAvatarConfig()`: Fixes and normalizes invalid configs
- `safeLoadAvatarConfig()`: Loads and validates config safely
- Validates:
  - Skin tone (hex colors or preset IDs)
  - Hair colors (hex or presets)
  - Clothing colors (hex only)
  - Name (1-30 characters)
  - All required fields and types

**`dicebear/`** - DiceBear integration
- **`mapper.ts`**: Maps `AvatarConfig` to DiceBear `Options` format
  - Converts skin tone presets to hex colors
  - Maps hair styles and colors
  - Handles clothing graphics and backgrounds
  - Generates deterministic seeds for consistent rendering

- **`api.ts`**: DiceBear API utilities
  - `getDiceBearAvatarUrl()`: Generates avatar URL from config
  - `getDiceBearAvatarUrlFromSeed()`: Generates URL from seed string
  - Handles format options (png, svg, etc.) and sizing

**`categories/assets.ts`** - Asset definitions
- Defines available options for each category:
  - Skin tones (with hex color mappings)
  - Hair styles and colors
  - Clothing items (tops, bottoms, outfits)
  - Accessories (hats, glasses, jewelry)
  - Face features (eyes, eyebrows, mouths, facial hair)
  - Body shapes and sizes

**`preview/`** - Preview generation utilities
- `getAvatarEmojiParts.ts`: Generates emoji representation
- `getAvatarSVGData.ts`: Custom SVG rendering data
- `getPreviewEmoji.ts`: Main emoji preview generator

#### 2. UI Components (`src/games/paint-and-guess/components/avatar/`)

**`AvatarCustomizer.tsx`** - Main customization dialog
- Full-featured dialog for avatar customization
- Tabbed interface with categories:
  - Skin: Skin tone selection
  - Hair: Hair style and color
  - Clothes: Clothing selection and color
  - Accessories: Hats, glasses, jewelry
  - Face: Eyes, eyebrows, mouth, facial hair
  - Style: DiceBear-specific options
- Features:
  - Live preview updates
  - Random avatar generation
  - Reset to defaults
  - Image upload support (custom images)
  - Drawable avatar mode
  - Validation and sanitization on save

**`preview/`** - Preview components
- **`AvatarPreview.tsx`**: Main preview component with renderer selection
  - Supports 'dicebear' (default) and 'custom' renderers
  - Props: `config`, `size`, `className`, `activeCategory`, `renderer`

- **`AvatarPreviewDiceBear.tsx`**: DiceBear-based rendering
  - Uses DiceBear API to generate avatar images
  - Handles caching and error states

- **`AvatarPreviewSVG.tsx`**: Custom SVG rendering
  - Fallback renderer using custom SVG generation
  - Renders based on config without external API

- **`AvatarPreviewDrawable.tsx`**: Drawable avatar preview
  - Supports custom drawings via Fabric.js canvas
  - Handles `customDrawings` JSON data

**`categories/`** - Category-specific selectors
- **`SkinToneSelector.tsx`**: Skin tone color picker
- **`HairSelector.tsx`**: Hair style and color selector
- **`ClothesSelector.tsx`**: Clothing item and color selector
- **`AccessoriesSelector.tsx`**: Accessories selection (hats, glasses, etc.)
- **`FaceSelector.tsx`**: Facial features selector
- **`BodySelector.tsx`**: Body shape and size selector
- **`StyleSelector.tsx`**: DiceBear style options
- **`OptionGrid.tsx`**: Reusable grid component for option selection

#### 3. Integration Points

**`HubLayout.tsx`** - Sidebar integration
- Displays avatar button in navigation sidebar
- Always visible in the sidebar (not tied to any specific route)
- Opens `AvatarCustomizer` dialog
- Dispatches `avatar-config-updated` custom event on save
- Manages avatar state and localStorage sync

**`Lobby.tsx`** - Lobby page integration
- Listens for `avatar-config-updated` events
- Fetches latest avatar config before room operations
- Displays informational message directing users to sidebar
- Passes avatar config when creating/joining rooms

**`GameContext.tsx`** - Game state integration
- Player interface includes `avatar?: string | AvatarConfig`
- Supports both old string format and new config object
- `joinRoom()` encodes avatar config for network transmission
- Avatar data sent via socket.io to other players

**`PlayerList.tsx`** - Player display
- Renders player avatars in game room
- Handles both old string format and new config format
- Uses DiceBear API to generate avatar URLs
- Falls back to emoji if avatar unavailable

## Data Flow

### Avatar Creation/Editing Flow

1. **User opens customizer** (from HubLayout sidebar or Lobby)
   - `AvatarCustomizer` loads config from:
     - `initialConfig` prop (if provided)
     - localStorage via `loadAvatarConfig()`
     - Default config if none exists

2. **User makes changes**
   - Selectors update config state
   - Preview updates in real-time
   - Config validated on each change

3. **User saves**
   - Config validated and sanitized
   - Saved to localStorage via `saveAvatarConfig()`
   - `onSave` callback triggered
   - Custom event `avatar-config-updated` dispatched
   - Dialog closes

4. **Other components sync**
   - `Lobby` listens for `avatar-config-updated` event
   - Updates local state
   - Fetches latest config before room operations

### Avatar Usage in Game

1. **Joining a room**
   - `Lobby` fetches latest avatar config
   - Passes to `GameContext.joinRoom()`
   - Config encoded as JSON string
   - Sent via socket.io to server

2. **Server/Other players receive**
   - Avatar data stored in player object
   - Broadcast to all players in room

3. **Rendering**
   - `PlayerList` receives player data
   - Checks if avatar is string (old) or object (new)
   - Generates DiceBear URL or uses custom rendering
   - Displays in player list

## Storage & Persistence

### localStorage Structure

```typescript
{
  version: 1,
  config: AvatarConfig,
  timestamp: number
}
```

### Version Migration

- **Version 0**: Legacy format (no versioning)
  - Automatically migrated to version 1
  - Preserves valid data, fills defaults for missing fields

- **Version 1**: Current format
  - Full type safety
  - All required fields
  - Optional DiceBear and custom drawing fields

### Storage Key

- Key: `paint-and-guess-avatar-config`
- Single avatar per browser/device
- Persists across sessions

## Rendering Methods

### 1. DiceBear (Default)

- **Library**: `@dicebear/avataaars`
- **Method**: API-based URL generation
- **Pros**: High quality, consistent rendering, large variety
- **Cons**: Requires internet connection, external dependency
- **Usage**: Primary renderer for all avatars

### 2. Custom SVG

- **Method**: Client-side SVG generation
- **Pros**: Works offline, no external API
- **Cons**: Limited customization options
- **Usage**: Fallback when DiceBear unavailable

### 3. Drawable Avatar

- **Method**: Fabric.js canvas drawings
- **Pros**: Fully customizable by user
- **Cons**: Requires more storage, complex serialization
- **Usage**: Optional feature for custom drawings

### 4. Custom Image Upload

- **Method**: User-uploaded images (data URLs)
- **Pros**: Complete user control
- **Cons**: Large storage size, no validation
- **Usage**: Optional feature

## Event System

### Custom Events

**`avatar-config-updated`**
- **Dispatched by**: `HubLayout` when avatar is saved
- **Payload**: `{ detail: AvatarConfig }`
- **Listeners**: `Lobby.tsx`
- **Purpose**: Sync avatar updates across components

### Usage Pattern

```typescript
// Dispatch
window.dispatchEvent(new CustomEvent("avatar-config-updated", { 
  detail: config 
}));

// Listen
useEffect(() => {
  const handleAvatarUpdate = (event: Event) => {
    const detail = (event as CustomEvent<AvatarConfig>).detail;
    if (detail) {
      setAvatarConfig(detail);
    }
  };
  window.addEventListener("avatar-config-updated", handleAvatarUpdate);
  return () => window.removeEventListener("avatar-config-updated", handleAvatarUpdate);
}, []);
```

## Validation & Error Handling

### Validation Rules

1. **Required Fields**: All top-level fields must exist
2. **Type Checking**: All fields must match expected types
3. **Value Validation**:
   - Skin tone: Hex color or valid preset
   - Hair color: Hex color or valid preset
   - Clothing color: Hex color only
   - Name: 1-30 characters, non-empty
   - Body size: 'small' | 'medium' | 'large'

### Error Handling

- **Invalid Config**: Sanitized to valid defaults
- **Corrupted Storage**: Cleared and reset to defaults
- **Network Errors**: Falls back to cached/default avatar
- **Quota Exceeded**: Logs warning, doesn't crash app

## Dependencies

### External Libraries

- `@dicebear/avataaars`: Avatar generation
- `@dicebear/core`: Core DiceBear functionality
- `@radix-ui/react-avatar`: UI avatar component
- `fabric`: Canvas manipulation (for drawable avatars)

### Internal Dependencies

- `@/lib/utils`: Utility functions (cn, etc.)
- `@/components/ui/*`: UI components (Dialog, Button, Input, etc.)
- `sonner`: Toast notifications

## File Structure

```
src/
├── lib/
│   └── avatar/
│       ├── config.ts              # Core config & storage
│       ├── validation.ts           # Validation & sanitization
│       ├── categories/
│       │   └── assets.ts           # Asset definitions
│       ├── dicebear/
│       │   ├── api.ts              # DiceBear API utilities
│       │   └── mapper.ts            # Config to DiceBear mapping
│       └── preview/
│           ├── getAvatarEmojiParts.ts
│           ├── getAvatarSVGData.ts
│           └── getPreviewEmoji.ts
│
└── games/
    └── paint-and-guess/
        └── components/
            ├── AvatarCustomizer.tsx    # Main customizer dialog
            └── avatar/
                ├── preview/
                │   ├── AvatarPreview.tsx
                │   ├── AvatarPreviewDiceBear.tsx
                │   ├── AvatarPreviewSVG.tsx
                │   └── AvatarPreviewDrawable.tsx
                └── categories/
                    ├── SkinToneSelector.tsx
                    ├── HairSelector.tsx
                    ├── ClothesSelector.tsx
                    ├── AccessoriesSelector.tsx
                    ├── FaceSelector.tsx
                    ├── BodySelector.tsx
                    ├── StyleSelector.tsx
                    └── OptionGrid.tsx
```

## Integration Points Summary

| Component | Role | Avatar Usage |
|-----------|------|--------------|
| `HubLayout` | Sidebar navigation | Displays avatar button, manages customization |
| `Lobby` | Room creation/joining | Fetches avatar before operations, listens for updates |
| `GameContext` | Game state management | Encodes/transmits avatar via socket.io |
| `PlayerList` | Player display | Renders avatars in game room |
| `AvatarCustomizer` | Customization UI | Main editing interface |

## Future Enhancements

### Potential Improvements

1. **Multiple Avatars**: Support for multiple saved avatars
2. **Avatar Presets**: Pre-made avatar templates
3. **Avatar Sharing**: Export/import avatar configs
4. **Animation**: Animated avatar previews
5. **Accessibility**: Better screen reader support
6. **Performance**: Avatar caching and optimization
7. **Backend Sync**: Server-side avatar storage for cross-device sync

## Testing

### Test Files

- `src/lib/__tests__/avatarConfig.test.ts`: Config storage and validation tests

### Test Scripts

- `test:avatar-crawl`: E2E avatar customization testing
- `test:drawable-avatar`: Drawable avatar feature testing

## Notes

- The system maintains backward compatibility with old string-based avatar format
- All avatar operations are client-side (no backend avatar storage currently)
- DiceBear is the primary rendering method, with custom SVG as fallback
- Avatar configs are versioned for future migration support
- Custom events are used for cross-component communication (no global state)

