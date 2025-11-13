# Avatar Customization System - Layout Proposal

## Overview
This document proposes a comprehensive avatar customization system to replace the simple emoji-based selection. The new system will allow players to customize their avatars with skin tone, clothes, accessories, and more through an intuitive interface.

## Design Philosophy

### Key Requirements
- **Modular System**: Each customization category (skin, clothes, accessories) is independent
- **Live Preview**: Real-time preview of avatar changes
- **Easy Navigation**: Clear categorization and intuitive controls
- **Performance**: Efficient rendering and state management
- **Accessibility**: Keyboard navigation and screen reader support

## Main Menu Integration

### Updated Lobby Layout
```
┌─────────────────────────────────────────────────┐
│  Multiplayer Draw & Guess                        │
│  Create or join a room to start playing          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Your Name                                │   │
│  │ [________________________]               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Customize Avatar                         │   │
│  │ ┌────┐                                   │   │
│  │ │ 👤 │  Custom Avatar              ✏️   │   │
│  │ └────┘                                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ Create Room  │  │  Join Room   │          │
│  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────┘
```

## Avatar Customization Dialog

### Dialog Structure
The customization interface opens as a **Dialog/Modal** (not a popover) to provide sufficient space for all customization options.

```
┌──────────────────────────────────────────────────────────────┐
│  Customize Your Avatar                              [×]       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │                  │  │  Customization Categories       │ │
│  │                  │  │  ┌─────┐ ┌─────┐ ┌─────┐       │ │
│  │   Live Preview   │  │  │ Skin │ │Cloth│ │Acces│       │ │
│  │                  │  │  └─────┘ └─────┘ └─────┘       │ │
│  │      [👤]        │  │  ┌─────┐ ┌─────┐ ┌─────┐       │ │
│  │                  │  │  │Hair │ │Face │ │Body │       │ │
│  │                  │  │  └─────┘ └─────┘ └─────┘       │ │
│  │                  │  │                                 │ │
│  │                  │  │  ┌─────────────────────────┐ │ │
│  │                  │  │  │ Selected Category        │ │ │
│  │                  │  │  │ Options Grid              │ │ │
│  │                  │  │  │                          │ │ │
│  │                  │  │  │  [ ] [ ] [ ] [ ] [ ]    │ │ │
│  │                  │  │  │  [ ] [ ] [ ] [ ] [ ]    │ │ │
│  │                  │  │  │                          │ │ │
│  │                  │  │  └─────────────────────────┘ │ │
│  │                  │  │                                 │ │
│  │                  │  │  [Reset]  [Random]  [Save]    │ │
│  └──────────────────┘  └─────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Layout Dimensions
- **Dialog Width**: 900px (desktop), 95vw (mobile)
- **Dialog Height**: 600px (desktop), 85vh (mobile)
- **Preview Area**: 300px × 400px (left side)
- **Options Area**: Remaining width (right side)

## Component Breakdown

### 1. Live Preview Panel (Left Side)

```
┌──────────────────────┐
│                      │
│   ┌──────────────┐   │
│   │              │   │
│   │              │   │
│   │   Avatar     │   │  ← 200×200px render area
│   │   Preview    │   │
│   │              │   │
│   └──────────────┘   │
│                      │
│   ┌────────────────┐ │
│   │ Avatar Name    │ │  ← Editable text input
│   │ [My Avatar  ]  │ │
│   └────────────────┘ │
│                      │
│   ┌────────────────┐ │
│   │ Quick Actions  │ │
│   │ [🔄 Random]    │ │
│   │ [↩️  Reset]    │ │
│   └────────────────┘ │
└──────────────────────┘
```

**Features:**
- Real-time SVG/Canvas rendering of avatar
- Rotating preview (optional 360° view)
- Zoom controls (optional)
- Avatar name input field
- Quick action buttons (Random, Reset)

### 2. Category Tabs (Top Right)

```
┌────────────────────────────────────────────┐
│ [Skin Tone] [Clothes] [Accessories]       │
│ [Hair] [Face] [Body]                       │
└────────────────────────────────────────────┘
```

**Categories:**
1. **Skin Tone** - Color picker + preset tones
2. **Clothes** - Tops, bottoms, full outfits
3. **Accessories** - Hats, glasses, jewelry, etc.
4. **Hair** - Styles, colors
5. **Face** - Eyes, eyebrows, mouth, facial hair
6. **Body** - Shape, size (optional)

**Visual Style:**
- Tab navigation (similar to shadcn/ui Tabs component)
- Active tab highlighted with primary color
- Icons for each category (optional)

### 3. Options Grid (Main Right Area)

#### Skin Tone Selection
```
┌────────────────────────────────────┐
│ Skin Tone                          │
│                                    │
│  Preset Tones:                     │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│  │  │ │  │ │  │ │  │ │  │        │
│  └──┘ └──┘ └──┘ └──┘ └──┘        │
│                                    │
│  Custom Color:                     │
│  ┌──────────────────────────────┐ │
│  │ [Color Picker] #FFDBAC       │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

#### Clothes Selection
```
┌────────────────────────────────────┐
│ Clothes                            │
│                                    │
│  Tops:                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│  │👕│ │👔│ │🎽│ │🧥│ │👗│        │
│  └──┘ └──┘ └──┘ └──┘ └──┘        │
│                                    │
│  Bottoms:                          │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│  │👖│ │🩳│ │👔│ │👗│ │  │        │
│  └──┘ └──┘ └──┘ └──┘ └──┘        │
│                                    │
│  Full Outfits:                     │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│  │👔│ │🎩│ │👘│ │🥼│ │  │        │
│  └──┘ └──┘ └──┘ └──┘ └──┘        │
└────────────────────────────────────┘
```

#### Accessories Selection
```
┌────────────────────────────────────┐
│ Accessories                        │
│                                    │
│  Hats:                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│  │🎩│ │🧢│ │👒│ │⛑️│ │🎓│        │
│  └──┘ └──┘ └──┘ └──┘ └──┘        │
│                                    │
│  Glasses:                          │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│  │👓│ │🕶️│ │🥽│ │  │ │  │        │
│  └──┘ └──┘ └──┘ └──┘ └──┘        │
│                                    │
│  Other:                            │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │
│  │💍│ │⌚│ │🎒│ │  │ │  │        │
│  └──┘ └──┘ └──┘ └──┘ └──┘        │
└────────────────────────────────────┘
```

**Grid Specifications:**
- 5 columns on desktop, 3-4 on tablet, 2-3 on mobile
- Each option: 60×60px square
- Hover: scale to 110%, border highlight
- Selected: primary border, primary/10 background
- Tooltip on hover showing option name

### 4. Action Buttons (Bottom Right)

```
┌────────────────────────────────────┐
│                                    │
│  [Reset to Default]  [Randomize]  │
│                                    │
│           [Save Avatar]            │
└────────────────────────────────────┘
```

**Button Functions:**
- **Reset**: Restore default avatar configuration
- **Randomize**: Generate random avatar combination
- **Save**: Save current configuration and close dialog

## Avatar Data Structure

### Avatar Configuration Object
```typescript
interface AvatarConfig {
  id: string;                    // Unique identifier
  name: string;                  // Custom name
  skinTone: string;              // Hex color or preset ID
  hair: {
    style: string;               // Hair style ID
    color: string;               // Hair color hex
  };
  clothes: {
    top: string | null;          // Top/clothing item ID
    bottom: string | null;       // Bottom item ID
    outfit: string | null;       // Full outfit ID (overrides top/bottom)
    color: string;               // Primary clothing color
  };
  accessories: {
    hat: string | null;          // Hat ID
    glasses: string | null;      // Glasses ID
    jewelry: string[];          // Array of jewelry IDs
    other: string[];             // Other accessories
  };
  face: {
    eyes: string;                // Eye style ID
    eyebrows: string;            // Eyebrow style ID
    mouth: string;              // Mouth style ID
    facialHair: string | null;   // Facial hair ID
  };
  body: {
    shape: string;               // Body shape ID
    size: 'small' | 'medium' | 'large';
  };
}
```

## Implementation Approach

### Option 1: SVG-Based Rendering (Recommended)
- **Pros**: Scalable, lightweight, easy to customize colors
- **Cons**: More complex layering logic
- **Library**: Custom SVG composition or react-avatar library

### Option 2: Canvas-Based Rendering
- **Pros**: More control, can handle complex graphics
- **Cons**: Less scalable, more performance considerations
- **Library**: Fabric.js (already in project) or custom Canvas

### Option 3: Pre-rendered Image Sprites
- **Pros**: Fast rendering, consistent appearance
- **Cons**: Limited customization, large asset files
- **Library**: Image composition library

### Recommended: Hybrid Approach
- Use **SVG** for base avatar rendering
- Layer different SVG elements (clothes, accessories) on top
- Use CSS filters/colors for skin tone and clothing colors
- Export as data URL or SVG string for storage

## Storage & Persistence

### Local Storage
```typescript
// Store full avatar config
localStorage.setItem('avatar-config', JSON.stringify(avatarConfig));

// Store as compact string for server
const avatarString = encodeAvatarConfig(avatarConfig);
```

### Server Transmission
- Send avatar config as JSON string in `join-room` event
- Server stores in player object
- Broadcast to all players in room

### Avatar ID Generation
- Generate unique ID from config hash
- Use for quick lookup and caching
- Format: `avatar-{hash}`

## Responsive Design

### Desktop (> 1024px)
- Full dialog layout as shown
- Side-by-side preview and options
- 5-column option grids

### Tablet (768px - 1024px)
- Reduced dialog width (800px)
- Preview area: 250px width
- 4-column option grids

### Mobile (< 768px)
- Full-screen modal
- Stacked layout (preview on top)
- 3-column option grids
- Bottom sheet style for options

## Interaction Flow

### Opening Customization
1. User clicks "Customize Avatar" button in lobby
2. Dialog opens with current/default avatar
3. Preview shows current configuration

### Customizing Avatar
1. User selects a category tab
2. Options grid updates for that category
3. User clicks an option
4. Preview updates immediately
5. Option is highlighted as selected

### Saving Avatar
1. User clicks "Save Avatar"
2. Configuration is validated
3. Avatar is stored in localStorage
4. Avatar config is sent to server on room join/create
5. Dialog closes
6. Button preview updates

### Random Avatar
1. User clicks "Randomize"
2. System generates random combination
3. Preview updates immediately
4. User can save or continue customizing

## Accessibility Features

- **Keyboard Navigation**: Tab through categories and options
- **Screen Reader**: ARIA labels for all interactive elements
- **Focus Indicators**: Clear focus states for keyboard users
- **Color Contrast**: WCAG AA compliant color combinations
- **Tooltips**: Descriptive tooltips for all options

## Performance Considerations

- **Lazy Loading**: Load option images/icons on demand
- **Debouncing**: Debounce preview updates during rapid changes
- **Caching**: Cache rendered avatar previews
- **Optimization**: Minimize re-renders with React.memo
- **Asset Optimization**: Compress and optimize all avatar assets

## Future Enhancements

1. **Avatar Presets**: Save multiple avatar configurations
2. **Avatar Sharing**: Share avatar configs with other players
3. **Unlockable Items**: Earn new clothes/accessories through gameplay
4. **Animation**: Animated avatar previews
5. **3D Avatars**: Upgrade to 3D avatar system
6. **Avatar Marketplace**: Community-created avatar items

## Technical Stack Recommendations

- **UI Components**: shadcn/ui Dialog, Tabs, Button, Input
- **Rendering**: SVG-based with react-avatar or custom SVG composer
- **State Management**: React useState/useReducer for avatar config
- **Storage**: localStorage for persistence
- **Icons**: lucide-react for UI icons, custom SVG for avatar parts

## Migration Path

1. **Phase 1**: Implement basic customization (skin, clothes, accessories)
2. **Phase 2**: Add face and hair customization
3. **Phase 3**: Add body customization and advanced features
4. **Phase 4**: Add presets, sharing, and unlockables

## Example Avatar Assets

### Skin Tones (Preset Colors)
- Light: #FFDBAC
- Medium Light: #F1C27D
- Medium: #E0AC69
- Medium Dark: #C68642
- Dark: #8D5524

### Clothing Items
- Tops: T-shirt, Dress Shirt, Tank Top, Jacket, Dress
- Bottoms: Jeans, Shorts, Pants, Skirt
- Outfits: Suit, Uniform, Costume, Casual

### Accessories
- Hats: Cap, Beanie, Fedora, Helmet, Graduation Cap
- Glasses: Regular, Sunglasses, Goggles
- Jewelry: Ring, Watch, Necklace

This proposal provides a comprehensive foundation for implementing a fully customizable avatar system that enhances player personalization and engagement.

