# Avatar Assets Summary

## Overview
This document provides a quick reference for all available avatar customization options organized by category.

## Asset Categories

### Skin Tone
**Presets**: 5 options
- Light (#FFDBAC)
- Medium Light (#F1C27D)
- Medium (#E0AC69)
- Medium Dark (#C68642)
- Dark (#8D5524)

**Custom**: Full hex color picker available

---

### Hair
**Styles**: 8 options
- Short, Medium, Long
- Curly, Wavy
- Bald, Bun, Ponytail

**Colors**: 6 presets + custom
- Black, Brown, Blonde, Red, Gray, White
- Custom hex color picker

---

### Clothes
**Tops**: 6 options
- T-Shirt, Dress Shirt, Tank Top
- Jacket, Hoodie, Sweater

**Bottoms**: 5 options
- Jeans, Shorts, Pants
- Skirt, Dress

**Full Outfits**: 5 options
- Suit, Uniform, Costume
- Casual, Formal

**Color**: Custom hex color picker for all clothing

---

### Accessories
**Hats**: 6 options
- Cap, Beanie, Fedora
- Helmet, Graduation Cap, Crown

**Glasses**: 4 options
- Regular Glasses, Sunglasses
- Goggles, Monocle

**Other**: 4 options (multiple selectable)
- Ring, Watch, Backpack, Necklace

---

### Face
**Eyes**: 5 options
- Default, Happy, Wink
- Sleepy, Surprised

**Eyebrows**: 4 options
- Default, Thick, Thin, Arched

**Mouth**: 4 options
- Default, Smile, Big Smile, Neutral

**Facial Hair**: 4 options (toggleable)
- None, Mustache, Beard, Goatee

---

### Body
**Shapes**: 4 options
- Slim, Average, Athletic, Curvy

**Sizes**: 3 options
- Small, Medium, Large

---

## Total Options Count

- **Skin Tones**: 5 presets + unlimited custom
- **Hair Styles**: 8
- **Hair Colors**: 6 presets + unlimited custom
- **Clothing Tops**: 6
- **Clothing Bottoms**: 5
- **Clothing Outfits**: 5
- **Hats**: 6
- **Glasses**: 4
- **Other Accessories**: 4
- **Eyes**: 5
- **Eyebrows**: 4
- **Mouth**: 4
- **Facial Hair**: 4
- **Body Shapes**: 4
- **Body Sizes**: 3

**Total Unique Combinations**: Millions (with custom colors)

---

## Adding New Options

To add a new option to any category:

1. Add the option to the appropriate array in `avatarAssets.ts`
2. Ensure the `id` is unique within that category
3. Add an emoji for visual reference (optional but recommended)
4. Set `colorable: true` if the option supports color customization
5. If it's a color preset, add the hex value to the corresponding color map

**Example**:
```typescript
// Adding a new hair style
export const HAIR_STYLES: AssetOption[] = [
  // ... existing styles
  { id: 'mohawk', name: 'Mohawk', emoji: '💇' },
];
```

---

## Category Identifiers

Use these strings with `getAssetsByCategory()`:

- `'skin-tone'` → SKIN_TONE_PRESETS
- `'hair-style'` → HAIR_STYLES
- `'hair-color'` → HAIR_COLORS
- `'clothing-top'` → CLOTHING_TOPS
- `'clothing-bottom'` → CLOTHING_BOTTOMS
- `'clothing-outfit'` → CLOTHING_OUTFITS
- `'accessory-hat'` → ACCESSORY_HATS
- `'accessory-glasses'` → ACCESSORY_GLASSES
- `'accessory-other'` → ACCESSORY_OTHER
- `'face-eyes'` → FACE_EYES
- `'face-eyebrows'` → FACE_EYEBROWS
- `'face-mouth'` → FACE_MOUTH
- `'face-facial-hair'` → FACE_FACIAL_HAIR
- `'body-shape'` → BODY_SHAPES

---

## Notes

- All clothing items support custom colors
- Skin tone and hair color support custom hex colors
- Outfits override top/bottom selections
- Hats and glasses are single-select (toggleable)
- Other accessories are multi-select
- Facial hair includes 'none' option for toggleable behavior

