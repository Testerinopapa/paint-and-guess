# Avatar Selection Layout - Scripts Reference

This document lists all scripts currently responsible for the avatar selection layout. The avatar system is organized into a clean skeleton structure that can be extended with different rendering backends.

## 📁 Directory Structure

```
src/
├── components/
│   ├── AvatarCustomizer.tsx          # Main avatar customization dialog
│   └── avatar/
│       ├── categories/                # Category selector components
│       │   ├── OptionGrid.tsx        # Reusable grid for displaying options
│       │   ├── SkinToneSelector.tsx  # Skin tone selection
│       │   ├── HairSelector.tsx      # Hair style & color selection
│       │   ├── ClothesSelector.tsx   # Clothing selection
│       │   ├── AccessoriesSelector.tsx # Accessories selection
│       │   ├── FaceSelector.tsx      # Face features selection
│       │   └── BodySelector.tsx      # Body shape & size selection
│       └── preview/
│           └── AvatarPreview.tsx     # Simple placeholder preview component
│
├── lib/
│   └── avatar/
│       ├── config.ts                 # Core configuration types & utilities
│       ├── validation.ts             # Configuration validation & sanitization
│       └── categories/
│           └── assets.ts             # Asset definitions (options, colors, etc.)
│
└── pages/
    └── Lobby.tsx                     # Integration point (opens customizer)
```

---

## 🎨 Main Components

### 1. `src/components/AvatarCustomizer.tsx`

**Purpose**: Main dialog component that orchestrates the entire avatar customization UI.

**Key Responsibilities**:
- Manages avatar configuration state
- Provides dialog UI with tabs for different categories
- Handles save/reset/randomize actions
- Displays live preview of avatar
- Validates and sanitizes configuration

**Key Features**:
- Tabbed interface for categories
- Left sidebar with preview and name input
- Right side with category selectors
- Save/Reset/Randomize buttons
- Real-time preview updates

**Props**:
```typescript
interface AvatarCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: AvatarConfig) => void;
  initialConfig?: AvatarConfig | null;
}
```

**State Management**:
- Uses `useState` for `AvatarConfig`
- `useEffect` to sync with `initialConfig`
- `useCallback` for config updates

**Imports**:
- `AvatarPreview` - Preview component
- `AvatarConfig`, `createDefaultAvatarConfig`, etc. - Config utilities
- `validateAvatarConfig`, `sanitizeAvatarConfig` - Validation
- Category selectors (SkinToneSelector, HairSelector, etc.)
- `getAssetsByCategory` - Asset utilities

---

## 🎯 Category Selectors

### 2. `src/components/avatar/categories/OptionGrid.tsx`

**Purpose**: Reusable grid component for displaying customization options.

**Key Responsibilities**:
- Renders a grid of selectable options
- Displays emoji icons for each option
- Handles selection state
- Shows labels optionally

**Props**:
```typescript
interface OptionGridProps {
  options: AssetOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  columns?: number;           // Default: 5
  showLabels?: boolean;       // Default: false
  category: string;           // Category identifier (for future use)
}
```

**Features**:
- Responsive grid layout
- Hover effects and selection highlighting
- Emoji-based icons
- Optional labels
- Click handlers for selection

**Used By**:
- All category selector components (SkinToneSelector, HairSelector, etc.)

---

### 3. `src/components/avatar/categories/SkinToneSelector.tsx`

**Purpose**: Skin tone selection with preset options and custom color picker.

**Key Responsibilities**:
- Display skin tone presets
- Allow custom color selection
- Update avatar configuration

**Props**:
```typescript
interface SkinToneSelectorProps {
  selectedTone: string;
  onSelect: (tone: string) => void;
}
```

**Features**:
- Preset skin tone options (Light, Medium Light, etc.)
- Custom hex color picker
- Visual color preview
- Maps preset IDs to hex colors

**Imports**:
- `OptionGrid` - Grid component
- `SKIN_TONE_PRESETS`, `SKIN_TONE_COLORS` - Asset definitions
- `Input`, `Label` - UI components

---

### 4. `src/components/avatar/categories/HairSelector.tsx`

**Purpose**: Hair style and color selection.

**Key Responsibilities**:
- Display hair style options
- Display hair color options
- Handle style and color selection
- Support preset and custom colors

**Props**:
```typescript
interface HairSelectorProps {
  config: AvatarConfig;
  onUpdate: (updates: Partial<AvatarConfig['hair']>) => void;
}
```

**Features**:
- Hair style selection (short, medium, long, curly, etc.)
- Hair color presets (black, brown, blonde, etc.)
- Custom hair color picker
- Separate sections for style and color

**Imports**:
- `OptionGrid` - Grid component
- `HAIR_STYLES`, `HAIR_COLORS`, `HAIR_COLOR_VALUES` - Asset definitions
- `AvatarConfig` - Config types

---

### 5. `src/components/avatar/categories/ClothesSelector.tsx`

**Purpose**: Clothing selection (tops, bottoms, outfits).

**Key Responsibilities**:
- Display clothing tops
- Display clothing bottoms
- Display full outfits
- Handle clothing color selection
- Manage outfit vs top/bottom logic

**Props**:
```typescript
interface ClothesSelectorProps {
  config: AvatarConfig;
  onUpdate: (updates: Partial<AvatarConfig['clothes']>) => void;
}
```

**Features**:
- Top selection (T-Shirt, Dress Shirt, etc.)
- Bottom selection (Jeans, Shorts, etc.)
- Outfit selection (Suit, Uniform, etc.)
- Clothing color picker
- Outfit overrides top/bottom

**Imports**:
- `OptionGrid` - Grid component
- `CLOTHING_TOPS`, `CLOTHING_BOTTOMS`, `CLOTHING_OUTFITS` - Asset definitions
- `AvatarConfig` - Config types

---

### 6. `src/components/avatar/categories/AccessoriesSelector.tsx`

**Purpose**: Accessories selection (hats, glasses, jewelry, other).

**Key Responsibilities**:
- Display hat options
- Display glasses options
- Display other accessories
- Handle multi-select for jewelry/other
- Handle single-select for hat/glasses

**Props**:
```typescript
interface AccessoriesSelectorProps {
  config: AvatarConfig;
  onUpdate: (updates: Partial<AvatarConfig['accessories']>) => void;
}
```

**Features**:
- Hat selection (Cap, Beanie, Fedora, etc.)
- Glasses selection (Regular, Sunglasses, etc.)
- Other accessories (Ring, Watch, etc.)
- Toggle-based selection
- Multi-select support for arrays

**Imports**:
- `OptionGrid` - Grid component
- `ACCESSORY_HATS`, `ACCESSORY_GLASSES`, `ACCESSORY_OTHER` - Asset definitions
- `AvatarConfig` - Config types

---

### 7. `src/components/avatar/categories/FaceSelector.tsx`

**Purpose**: Face features selection (eyes, eyebrows, mouth, facial hair).

**Key Responsibilities**:
- Display eye options
- Display eyebrow options
- Display mouth options
- Display facial hair options
- Handle facial feature selection

**Props**:
```typescript
interface FaceSelectorProps {
  config: AvatarConfig;
  onUpdate: (updates: Partial<AvatarConfig['face']>) => void;
}
```

**Features**:
- Eye selection (Default, Happy, Wink, etc.)
- Eyebrow selection (Default, Thick, Thin, etc.)
- Mouth selection (Default, Smile, Big Smile, etc.)
- Facial hair selection (None, Mustache, Beard, etc.)
- Separate sections for each feature

**Imports**:
- `OptionGrid` - Grid component
- `FACE_EYES`, `FACE_EYEBROWS`, `FACE_MOUTH`, `FACE_FACIAL_HAIR` - Asset definitions
- `AvatarConfig` - Config types

---

### 8. `src/components/avatar/categories/BodySelector.tsx`

**Purpose**: Body shape and size selection.

**Key Responsibilities**:
- Display body shape options
- Display body size options
- Handle shape and size selection

**Props**:
```typescript
interface BodySelectorProps {
  config: AvatarConfig;
  onUpdate: (updates: Partial<AvatarConfig['body']>) => void;
}
```

**Features**:
- Body shape selection (Slim, Average, Athletic, Curvy)
- Body size selection (Small, Medium, Large)
- Radio button-style selection
- Separate sections for shape and size

**Imports**:
- `OptionGrid` - Grid component
- `BODY_SHAPES`, `BODY_SIZES` - Asset definitions
- `AvatarConfig` - Config types

---

## 🖼️ Preview Components

### 9. `src/components/avatar/preview/AvatarPreview.tsx`

**Purpose**: Simple placeholder preview component.

**Key Responsibilities**:
- Display avatar preview placeholder
- Accept avatar configuration
- Render at specified size

**Props**:
```typescript
interface AvatarPreviewProps {
  config: AvatarConfig;
  size?: number;        // Default: 200
  className?: string;
}
```

**Features**:
- Simple emoji placeholder (👤)
- Configurable size
- Rounded background
- Placeholder until rendering system is implemented

**Imports**:
- `AvatarConfig` - Config types

**Note**: This is a placeholder component. Replace with actual rendering system when implementing avatar visualization.

---

## 📚 Core Libraries

### 10. `src/lib/avatar/config.ts`

**Purpose**: Core configuration system - types, defaults, storage, and utilities.

**Key Exports**:
- `AvatarConfig` - Main configuration interface
- `AvatarHair` - Hair configuration interface
- `AvatarClothes` - Clothing configuration interface
- `AvatarAccessories` - Accessories configuration interface
- `AvatarFace` - Face features interface
- `AvatarBody` - Body configuration interface
- `DEFAULT_AVATAR_CONFIG` - Default configuration
- `createDefaultAvatarConfig()` - Create default config
- `loadAvatarConfig()` - Load from localStorage
- `saveAvatarConfig()` - Save to localStorage
- `cloneAvatarConfig()` - Deep copy config
- `generateAvatarId()` - Generate unique ID
- `encodeAvatarConfig()` - Encode for transmission
- `decodeAvatarConfig()` - Decode from transmission

**Key Features**:
- Versioned storage format
- Migration support for older versions
- localStorage persistence
- JSON encoding/decoding for network transmission
- Deterministic ID generation

**Storage Format**:
```typescript
interface StoredAvatar {
  version: number;
  config: AvatarConfig;
  timestamp: number;
}
```

---

### 11. `src/lib/avatar/validation.ts`

**Purpose**: Configuration validation and sanitization.

**Key Exports**:
- `validateAvatarConfig()` - Validate config structure
- `sanitizeAvatarConfig()` - Sanitize invalid config
- `safeLoadAvatarConfig()` - Load with validation

**Key Features**:
- Type checking for all config properties
- Default value fallbacks
- Format validation (hex colors, etc.)
- Graceful error handling
- Data integrity checks

**Validation Rules**:
- Skin tone: Hex color or preset ID
- Hair style: Valid style ID
- Hair color: Hex color or preset ID
- Clothing: Valid item IDs or null
- Accessories: Valid item IDs or null/array
- Face features: Valid feature IDs
- Body: Valid shape and size IDs

---

### 12. `src/lib/avatar/categories/assets.ts`

**Purpose**: Asset definitions - all available customization options.

**Key Exports**:
- `AssetOption` - Option interface
- `SKIN_TONE_PRESETS` - Skin tone options
- `SKIN_TONE_COLORS` - Skin tone color values
- `HAIR_STYLES` - Hair style options
- `HAIR_COLORS` - Hair color options
- `HAIR_COLOR_VALUES` - Hair color values
- `CLOTHING_TOPS` - Top clothing options
- `CLOTHING_BOTTOMS` - Bottom clothing options
- `CLOTHING_OUTFITS` - Outfit options
- `ACCESSORY_HATS` - Hat options
- `ACCESSORY_GLASSES` - Glasses options
- `ACCESSORY_OTHER` - Other accessories
- `FACE_EYES` - Eye options
- `FACE_EYEBROWS` - Eyebrow options
- `FACE_MOUTH` - Mouth options
- `FACE_FACIAL_HAIR` - Facial hair options
- `BODY_SHAPES` - Body shape options
- `BODY_SIZES` - Body size options
- `getAssetById()` - Get option by ID
- `getAssetsByCategory()` - Get options by category

**Key Features**:
- Centralized asset definitions
- Emoji icons for visual reference
- Color values for presets
- Category-based organization
- Utility functions for lookups

**Asset Structure**:
```typescript
interface AssetOption {
  id: string;
  name: string;
  emoji?: string;
  svg?: string;
  colorable?: boolean;
}
```

---

## 🔗 Integration Points

### 13. `src/pages/Lobby.tsx`

**Purpose**: Main lobby page - integration point for avatar customization.

**Key Responsibilities**:
- Display avatar customizer button
- Show current avatar preview
- Open avatar customizer dialog
- Save avatar configuration
- Pass avatar to game context

**Key Features**:
- Avatar preview button
- Opens `AvatarCustomizer` dialog
- Saves avatar configuration
- Passes avatar to `joinRoom`

**Imports**:
- `AvatarCustomizer` - Customization dialog
- `AvatarPreview` - Preview component
- `AvatarConfig`, `loadAvatarConfig`, `createDefaultAvatarConfig` - Config utilities
- `safeLoadAvatarConfig` - Validation utilities

**Usage**:
```typescript
const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
  return safeLoadAvatarConfig() || createDefaultAvatarConfig();
});

<AvatarCustomizer 
  open={isCustomizerOpen} 
  onOpenChange={setIsCustomizerOpen}
  onSave={(config) => setAvatarConfig(config)}
  initialConfig={avatarConfig}
/>
```

---

### 14. `src/components/PlayerList.tsx`

**Purpose**: Display player avatars in the game room.

**Key Responsibilities**:
- Render player avatars
- Support both old emoji format and new config format
- Decode avatar configurations
- Fallback to emoji for legacy avatars

**Key Features**:
- Avatar preview for each player
- Legacy emoji support
- Config decoding
- Fallback handling

**Imports**:
- `AvatarPreview` - Preview component
- `AvatarConfig`, `decodeAvatarConfig` - Config utilities
- `getAvatarEmoji` - Legacy emoji support

---

### 15. `src/contexts/GameContext.tsx`

**Purpose**: Game context - manages avatar transmission.

**Key Responsibilities**:
- Encode avatar config for transmission
- Decode avatar config from transmission
- Store avatar in player object
- Pass avatar to socket events

**Key Features**:
- Avatar encoding/decoding
- Socket.io integration
- Player avatar storage
- Network transmission support

**Imports**:
- `AvatarConfig`, `encodeAvatarConfig`, `decodeAvatarConfig` - Config utilities

**Usage**:
```typescript
joinRoom: (roomId: string, playerName: string, avatar?: string | AvatarConfig) => {
  const avatarData = typeof avatar === 'object' ? encodeAvatarConfig(avatar) : avatar;
  socket.emit("join-room", { roomId, playerName, avatar: avatarData });
}
```

---

## 📋 Component Hierarchy

```
AvatarCustomizer (Main Dialog)
├── AvatarPreview (Left Sidebar)
│   └── Shows placeholder 👤
├── Tabs (Right Sidebar)
│   ├── Skin Tab
│   │   └── SkinToneSelector
│   │       └── OptionGrid
│   ├── Hair Tab
│   │   └── HairSelector
│   │       └── OptionGrid (Style)
│   │       └── OptionGrid (Color)
│   ├── Clothes Tab
│   │   └── ClothesSelector
│   │       └── OptionGrid (Tops)
│   │       └── OptionGrid (Bottoms)
│   │       └── OptionGrid (Outfits)
│   ├── Accessories Tab
│   │   └── AccessoriesSelector
│   │       └── OptionGrid (Hats)
│   │       └── OptionGrid (Glasses)
│   │       └── OptionGrid (Other)
│   ├── Face Tab
│   │   └── FaceSelector
│   │       └── OptionGrid (Eyes)
│   │       └── OptionGrid (Eyebrows)
│   │       └── OptionGrid (Mouth)
│   │       └── OptionGrid (Facial Hair)
│   └── Body Tab
│       └── BodySelector
│           └── OptionGrid (Shape)
│           └── OptionGrid (Size)
└── Action Buttons
    ├── Save
    ├── Reset
    └── Randomize
```

---

## 🔄 Data Flow

```
User Interaction
    ↓
Category Selector (e.g., HairSelector)
    ↓
OptionGrid (handles selection)
    ↓
onUpdate callback
    ↓
AvatarCustomizer.updateConfig()
    ↓
setConfig (state update)
    ↓
AvatarPreview (re-renders)
    ↓
User clicks Save
    ↓
validateAvatarConfig()
    ↓
saveAvatarConfig() (localStorage)
    ↓
onSave callback
    ↓
Lobby.setAvatarConfig()
    ↓
GameContext.joinRoom()
    ↓
encodeAvatarConfig()
    ↓
Socket.io transmission
```

---

## 🎨 UI Layout Structure

### Dialog Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Customize Your Avatar                                      │
│  Personalize your avatar with custom skin tone, clothes...  │
├──────────────────┬──────────────────────────────────────────┤
│                  │  [Tabs: Skin | Hair | Clothes | ...]     │
│  [Preview Area]  │  ┌────────────────────────────────────┐  │
│                  │  │  Category Selector                 │  │
│     👤           │  │  [Option Grid]                     │  │
│                  │  │  [Option Grid]                     │  │
│  [Name Input]    │  │  [Color Picker]                    │  │
│                  │  └────────────────────────────────────┘  │
│  [Randomize]     │                                          │
│  [Reset]         │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 🔧 Key Functions

### Configuration Management

- `createDefaultAvatarConfig()` - Create new config with defaults
- `loadAvatarConfig()` - Load from localStorage
- `saveAvatarConfig()` - Save to localStorage
- `cloneAvatarConfig()` - Deep copy
- `generateAvatarId()` - Generate unique ID
- `encodeAvatarConfig()` - Encode for transmission
- `decodeAvatarConfig()` - Decode from transmission

### Validation

- `validateAvatarConfig()` - Validate structure
- `sanitizeAvatarConfig()` - Sanitize invalid data
- `safeLoadAvatarConfig()` - Load with validation

### Assets

- `getAssetById()` - Get option by ID
- `getAssetsByCategory()` - Get options by category

---

## 📝 Notes

### Current State

- ✅ **UI Structure**: Complete and functional
- ✅ **Configuration System**: Fully implemented
- ✅ **Validation**: Working
- ✅ **Storage**: localStorage persistence
- ✅ **Integration**: Connected to game context
- ⚠️ **Preview**: Placeholder only (👤 emoji)
- ⚠️ **Rendering**: No actual avatar rendering system

### Future Extensions

To add avatar rendering:

1. **Replace `AvatarPreview.tsx`** with actual rendering component
2. **Update `OptionGrid.tsx`** to show rendered previews (optional)
3. **Add rendering utilities** in `src/lib/avatar/preview/`
4. **Update imports** in `AvatarCustomizer.tsx` and `Lobby.tsx`

### File Organization

The avatar system is organized into:
- **Components** (`src/components/avatar/`) - UI components
- **Categories** (`src/components/avatar/categories/`) - Category selectors
- **Preview** (`src/components/avatar/preview/`) - Preview components
- **Config** (`src/lib/avatar/config.ts`) - Configuration system
- **Validation** (`src/lib/avatar/validation.ts`) - Validation utilities
- **Assets** (`src/lib/avatar/categories/assets.ts`) - Asset definitions

---

## 🚀 Usage Example

```typescript
// In Lobby.tsx
const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
  return safeLoadAvatarConfig() || createDefaultAvatarConfig();
});

// Open customizer
<AvatarCustomizer 
  open={isCustomizerOpen}
  onOpenChange={setIsCustomizerOpen}
  onSave={(config) => {
    setAvatarConfig(config);
    saveAvatarConfig(config);
  }}
  initialConfig={avatarConfig}
/>

// Use avatar
joinRoom(roomId, playerName, avatarConfig);
```

---

## 📊 Summary

**Total Files**: 15 core files

**Components**: 9 (1 main + 6 selectors + 1 grid + 1 preview)

**Libraries**: 3 (config + validation + assets)

**Integration Points**: 3 (Lobby + PlayerList + GameContext)

**Lines of Code**: ~2000+ (estimated)

**Dependencies**: 
- React
- shadcn/ui components (Dialog, Tabs, Button, Input, Label)
- lucide-react (icons)
- sonner (toasts)

---

## 🔍 Quick Reference

| File | Purpose | Key Exports |
|------|---------|-------------|
| `AvatarCustomizer.tsx` | Main dialog | `AvatarCustomizer` |
| `OptionGrid.tsx` | Option grid | `OptionGrid` |
| `SkinToneSelector.tsx` | Skin tone | `SkinToneSelector` |
| `HairSelector.tsx` | Hair | `HairSelector` |
| `ClothesSelector.tsx` | Clothes | `ClothesSelector` |
| `AccessoriesSelector.tsx` | Accessories | `AccessoriesSelector` |
| `FaceSelector.tsx` | Face | `FaceSelector` |
| `BodySelector.tsx` | Body | `BodySelector` |
| `AvatarPreview.tsx` | Preview | `AvatarPreview` |
| `config.ts` | Config | `AvatarConfig`, utilities |
| `validation.ts` | Validation | `validateAvatarConfig`, etc. |
| `assets.ts` | Assets | All asset definitions |

---

**Last Updated**: After Dicebear removal - skeleton structure only

**Status**: ✅ Core structure complete, ready for rendering system integration

