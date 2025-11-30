# Game Images Analysis & Implementation Guide

## Current State Analysis

### 1. Game Card Component (`src/components/GameCard.tsx`)

**Current Implementation:**
- Uses `game.assets.thumbnail` for the card image
- Displays image in `aspect-[3/4]` container
- Image has hover effects (scale on hover)
- Gradient overlay appears on hover with game info

**Image Usage:**
```tsx
<img 
  src={game.assets.thumbnail} 
  alt={game.displayName}
  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
/>
```

### 2. Game Detail Page (`src/pages/GameDetail.tsx`)

**Current Implementation:**
- Uses `GameHero` component for the hero section
- Related games section uses thumbnails
- No image gallery or screenshots currently

### 3. Game Hero Component (`src/components/GameHero.tsx`)

**Current Implementation:**
- Attempts to use `game.assets.background` (but not in schema)
- Falls back to `game.assets.thumbnail` if background doesn't exist
- Uses background image with blur overlay

**Current Code:**
```tsx
const backgroundImage = (game.assets as any)?.background || game.assets.thumbnail;
```

### 4. Schema Definition (`src/games/registry/schema.ts`)

**Current Assets Schema:**
```typescript
assets: z.object({
  thumbnail: z.string(),
  trailerUrl: z.string().url().optional(),
  patchNotesUrl: z.string().url().optional(),
}),
```

**Limitations:**
- Only `thumbnail` is defined
- No support for background images, screenshots, or galleries
- `GameHero` uses type assertion `(game.assets as any)?.background` to access undefined field

## Proposed Solution

### Phase 1: Extend Schema to Support Multiple Image Types

#### Option A: Minimal Extension (Recommended for MVP)
Add commonly needed image types:

```typescript
assets: z.object({
  thumbnail: z.string(),
  background: z.string().optional(),        // Hero/background image
  screenshots: z.array(z.string()).optional(), // Gallery of screenshots
  trailerUrl: z.string().url().optional(),
  patchNotesUrl: z.string().url().optional(),
}),
```

#### Option B: Comprehensive Extension
Support all potential image use cases:

```typescript
assets: z.object({
  thumbnail: z.string(),
  background: z.string().optional(),
  hero: z.string().optional(),              // Alternative hero image
  icon: z.string().optional(),              // Small icon/logo
  screenshots: z.array(z.string()).optional(),
  gallery: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
    type: z.enum(["screenshot", "artwork", "promotional"]).optional(),
  })).optional(),
  trailerUrl: z.string().url().optional(),
  patchNotesUrl: z.string().url().optional(),
}),
```

### Phase 2: Update Components

#### 2.1 Update GameCard Component

**Enhancements:**
1. Support fallback image chain: `background` → `thumbnail`
2. Add lazy loading for performance
3. Add error handling for broken images
4. Optional: Support image gallery on hover/click

**Example Implementation:**
```tsx
const GameCard = ({ game, lastPlayed, onPlay }: GameCardProps) => {
  const [imageError, setImageError] = useState(false);
  const cardImage = game.assets.background || game.assets.thumbnail;
  
  return (
    <div className="...">
      <div className="aspect-[3/4] relative overflow-hidden">
        {!imageError ? (
          <img 
            src={cardImage} 
            alt={game.displayName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
        {/* Rest of card content */}
      </div>
    </div>
  );
};
```

#### 2.2 Update GameHero Component

**Remove Type Assertion:**
```tsx
// Before
const backgroundImage = (game.assets as any)?.background || game.assets.thumbnail;

// After
const backgroundImage = game.assets.background || game.assets.thumbnail;
```

#### 2.3 Add Image Gallery to GameDetail Page

**New Component: GameImageGallery**
```tsx
const GameImageGallery = ({ screenshots }: { screenshots: string[] }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <img 
          src={screenshots[selectedIndex]} 
          alt={`Screenshot ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      {screenshots.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {screenshots.map((screenshot, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-video overflow-hidden rounded border-2 ${
                index === selectedIndex ? 'border-primary' : 'border-transparent'
              }`}
            >
              <img 
                src={screenshot} 
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Integration in GameDetail:**
```tsx
{game.assets.screenshots && game.assets.screenshots.length > 0 && (
  <div>
    <h2 className="text-2xl font-bold mb-4">Screenshots</h2>
    <GameImageGallery screenshots={game.assets.screenshots} />
  </div>
)}
```

## Implementation Steps

### Step 1: Update Schema
1. Modify `src/games/registry/schema.ts`
2. Add `background` and `screenshots` fields to assets schema
3. Ensure backward compatibility (all fields optional except thumbnail)

### Step 2: Update Type Definitions
1. TypeScript types will auto-update from Zod schema
2. Remove `as any` type assertions in `GameHero.tsx`

### Step 3: Update Components
1. **GameCard.tsx**: Add error handling and fallback logic
2. **GameHero.tsx**: Use proper typed access to background
3. **GameDetail.tsx**: Add screenshot gallery section

### Step 4: Update Registry Data
1. Add image URLs to game registry entries
2. Update fallback registry if needed
3. Ensure CMS/API returns new asset fields

### Step 5: Testing
1. Test with games that have all image types
2. Test with games that only have thumbnails (backward compatibility)
3. Test error handling for broken image URLs
4. Test responsive behavior on mobile/tablet/desktop

## Image Requirements & Best Practices

### Image Specifications

**Thumbnail:**
- Recommended size: 400x533px (3:4 aspect ratio)
- Format: WebP or JPEG
- Max file size: 200KB
- Purpose: Game card display

**Background/Hero:**
- Recommended size: 1920x1080px (16:9 aspect ratio)
- Format: WebP or JPEG
- Max file size: 500KB
- Purpose: Hero section background

**Screenshots:**
- Recommended size: 1920x1080px (16:9 aspect ratio)
- Format: WebP or JPEG
- Max file size: 500KB each
- Purpose: Game detail gallery

### Performance Considerations

1. **Lazy Loading**: Use `loading="lazy"` on images below the fold
2. **Image Optimization**: Serve WebP with JPEG fallback
3. **CDN**: Host images on CDN for faster delivery
4. **Responsive Images**: Consider `srcset` for different screen sizes
5. **Placeholder**: Show skeleton/placeholder while loading

### Accessibility

1. **Alt Text**: Always provide descriptive alt text
2. **Loading States**: Show loading indicators
3. **Error States**: Graceful fallback for broken images
4. **Keyboard Navigation**: Ensure gallery is keyboard accessible

## Migration Path

### For Existing Games

1. **Immediate**: Games continue working with just thumbnails
2. **Gradual**: Add background/screenshots as assets become available
3. **No Breaking Changes**: All new fields are optional

### For New Games

1. Provide thumbnail (required)
2. Provide background for better hero section
3. Provide 3-5 screenshots for gallery

## Example Registry Entry

```json
{
  "id": "paint-and-guess",
  "name": { "default": "Paint & Guess" },
  "assets": {
    "thumbnail": "https://cdn.example.com/games/paint-and-guess/thumbnail.webp",
    "background": "https://cdn.example.com/games/paint-and-guess/background.webp",
    "screenshots": [
      "https://cdn.example.com/games/paint-and-guess/screenshot1.webp",
      "https://cdn.example.com/games/paint-and-guess/screenshot2.webp",
      "https://cdn.example.com/games/paint-and-guess/screenshot3.webp"
    ]
  }
}
```

## Future Enhancements

1. **Image Upload UI**: Allow game creators to upload images via CMS
2. **Image Cropping**: Built-in image editor for thumbnails
3. **Video Support**: Support for video previews/trailers
4. **Image CDN Integration**: Automatic optimization and CDN upload
5. **Progressive Loading**: Blur-up technique for better perceived performance
6. **Image Zoom**: Lightbox/modal for full-size image viewing

## Related Files

- `src/games/registry/schema.ts` - Schema definition
- `src/components/GameCard.tsx` - Card component
- `src/components/GameHero.tsx` - Hero component
- `src/pages/GameDetail.tsx` - Detail page
- `src/pages/AllGames.tsx` - All games listing
- `src/games/registry/fallback.ts` - Fallback registry data

## Next Steps

1. ✅ **Analysis Complete** - Current state documented
2. ⏳ **Schema Update** - Extend assets schema
3. ⏳ **Component Updates** - Update components to use new fields
4. ⏳ **Testing** - Test with sample data
5. ⏳ **Documentation** - Update API/docs with new fields

