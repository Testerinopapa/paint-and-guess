# Avatar Customization System - Architecture & Organization

## Overview
This document organizes the avatar customization codebase into logical groups and outlines an incremental approach for updates and maintenance.

## Code Organization by Role

### Layer 1: Core Data & Types
**Purpose**: Foundation layer - data structures, types, and core utilities

**Files**:
- `src/lib/avatarConfig.ts`
  - TypeScript interfaces (`AvatarConfig`, `AvatarHair`, `AvatarClothes`, etc.)
  - Default configuration
  - Storage functions (load/save with versioning)
  - ID generation
  - Encoding/decoding for transmission

**Dependencies**: None (foundation layer)

**Update Strategy**: 
- Changes here affect everything else
- Version carefully
- Maintain backward compatibility
- Test thoroughly before deploying

---

### Layer 2: Asset Definitions
**Purpose**: Defines available options for each customization category

**Files**:
- `src/lib/avatarAssets.ts`
  - Asset option arrays (SKIN_TONE_PRESETS, HAIR_STYLES, etc.)
  - Color mappings (SKIN_TONE_COLORS, HAIR_COLOR_VALUES)
  - Category lookup functions

**Dependencies**: None (pure data)

**Update Strategy**:
- Easy to add new options
- No breaking changes when adding items
- Can be updated independently
- Consider asset loading optimization for large lists

---

### Layer 3: Validation & Sanitization
**Purpose**: Data integrity and error prevention

**Files**:
- `src/lib/avatarValidation.ts`
  - `validateAvatarConfig()` - Runtime validation
  - `sanitizeAvatarConfig()` - Fix invalid data
  - `safeLoadAvatarConfig()` - Safe loading wrapper

**Dependencies**: 
- `avatarConfig.ts` (types)
- `avatarAssets.ts` (for validation rules)

**Update Strategy**:
- Add validation rules as new features are added
- Update sanitization when defaults change
- Keep validation rules in sync with types

---

### Layer 4: Rendering Components
**Purpose**: Visual representation of avatars

**Files**:
- `src/components/AvatarPreview.tsx`
  - SVG-based avatar renderer
  - Takes config and renders visual representation
  - Handles all visual layers (body, clothes, accessories, etc.)

- `src/components/AvatarPreviewErrorBoundary.tsx`
  - Error boundary for preview rendering
  - Fallback to default avatar on errors

**Dependencies**:
- `avatarConfig.ts` (config type)
- `avatarAssets.ts` (for color lookups)

**Update Strategy**:
- Rendering logic is isolated
- Can be swapped (SVG → Canvas → Image) without affecting other layers
- Add new visual features here
- Consider performance optimizations

---

### Layer 5: UI Selector Components
**Purpose**: User interface for selecting customization options

**Files**:
- `src/components/avatar/OptionGrid.tsx`
  - Reusable grid component for displaying options
  - Generic, works for any category

- `src/components/avatar/SkinToneSelector.tsx`
- `src/components/avatar/ClothesSelector.tsx`
- `src/components/avatar/AccessoriesSelector.tsx`
- `src/components/avatar/HairSelector.tsx`
- `src/components/avatar/FaceSelector.tsx`
- `src/components/avatar/BodySelector.tsx`

**Dependencies**:
- `avatarAssets.ts` (for options)
- `avatarConfig.ts` (for types)
- `OptionGrid.tsx` (shared component)

**Update Strategy**:
- Each selector is independent
- Can update UI/UX of one category without affecting others
- Easy to add new categories (create new selector component)
- Consider extracting common patterns

---

### Layer 6: Main Orchestrator
**Purpose**: Coordinates all components and manages state

**Files**:
- `src/components/AvatarCustomizer.tsx`
  - Main dialog component
  - Manages overall state
  - Coordinates selectors
  - Handles save/reset/randomize
  - Integrates preview, validation, storage

**Dependencies**: All layers below

**Update Strategy**:
- Central coordination point
- Changes here affect user experience
- Keep focused on orchestration, not implementation
- Consider splitting into smaller hooks/components

---

### Layer 7: Integration Points
**Purpose**: Connects avatar system to rest of application

**Files**:
- `src/pages/Lobby.tsx`
  - Opens AvatarCustomizer
  - Manages avatar config state
  - Passes config to game context

- `src/contexts/GameContext.tsx`
  - Handles avatar in player data
  - Encodes/decodes for network transmission
  - Updates player interface

- `src/components/PlayerList.tsx`
  - Displays avatars in game
  - Handles both old (emoji) and new (config) formats

**Dependencies**: 
- `AvatarCustomizer.tsx`
- `avatarConfig.ts`
- `AvatarPreview.tsx`

**Update Strategy**:
- Integration points are touchy
- Test thoroughly when changing
- Maintain backward compatibility
- Consider migration path from old system

---

### Layer 8: Utilities & Hooks
**Purpose**: Shared utilities and React hooks

**Files**:
- `src/hooks/useDebounce.ts`
  - Performance optimization hook
  - Used for preview updates

**Dependencies**: None (generic utility)

**Update Strategy**:
- Generic utilities can be reused
- Easy to add new hooks
- Consider extracting to shared utilities

---

### Layer 9: Legacy Code
**Purpose**: Old emoji-based system (maintained for compatibility)

**Files**:
- `src/lib/avatars.ts`
  - Old emoji avatar definitions
  - Used for backward compatibility

- `src/components/AvatarSelector.tsx`
  - Old popover-based selector
  - May be deprecated

**Dependencies**: None (standalone)

**Update Strategy**:
- Keep for migration period
- Plan deprecation timeline
- Document migration path

---

## Incremental Update Strategy

### Phase 1: Foundation Stability
**Goal**: Ensure core data layer is solid

**Tasks**:
1. Review and document all types in `avatarConfig.ts`
2. Add comprehensive JSDoc comments
3. Create unit tests for storage functions
4. Verify versioning system works correctly
5. Test migration paths

**Files to Update**:
- `src/lib/avatarConfig.ts`

**Risk**: Low (foundation layer, changes affect everything)

---

### Phase 2: Asset Management
**Goal**: Organize and optimize asset definitions

**Tasks**:
1. Review all asset categories
2. Add missing options if needed
3. Optimize asset loading
4. Consider lazy loading for large lists
5. Add asset validation

**Files to Update**:
- `src/lib/avatarAssets.ts`

**Risk**: Low (data layer, easy to add/remove items)

---

### Phase 3: Validation Enhancement
**Goal**: Strengthen data integrity

**Tasks**:
1. Review validation rules
2. Add more comprehensive checks
3. Improve error messages
4. Add validation for edge cases
5. Create validation test suite

**Files to Update**:
- `src/lib/avatarValidation.ts`

**Risk**: Low-Medium (affects data integrity, but isolated)

---

### Phase 4: Rendering Improvements
**Goal**: Enhance visual quality and performance

**Tasks**:
1. Review SVG rendering logic
2. Optimize rendering performance
3. Add more visual details
4. Fix any clipping/overlap issues
5. Consider alternative rendering methods

**Files to Update**:
- `src/components/AvatarPreview.tsx`
- `src/components/AvatarPreviewErrorBoundary.tsx`

**Risk**: Medium (affects visual output, but isolated)

---

### Phase 5: UI/UX Refinements
**Goal**: Improve user experience of selectors

**Tasks**:
1. Review each selector component
2. Improve visual design
3. Add better feedback
4. Optimize interactions
5. Add keyboard navigation

**Files to Update**:
- `src/components/avatar/*Selector.tsx`
- `src/components/avatar/OptionGrid.tsx`

**Risk**: Low-Medium (affects UX, but isolated per category)

---

### Phase 6: Orchestrator Optimization
**Goal**: Improve main component structure

**Tasks**:
1. Review state management
2. Consider extracting custom hooks
3. Optimize re-renders
4. Improve error handling
5. Add loading states

**Files to Update**:
- `src/components/AvatarCustomizer.tsx`

**Risk**: Medium (central component, affects overall UX)

---

### Phase 7: Integration Refinement
**Goal**: Smooth integration with game

**Tasks**:
1. Review integration points
2. Test edge cases
3. Improve error handling
4. Add migration utilities
5. Document integration patterns

**Files to Update**:
- `src/pages/Lobby.tsx`
- `src/contexts/GameContext.tsx`
- `src/components/PlayerList.tsx`

**Risk**: Medium-High (affects game functionality)

---

### Phase 8: Legacy Cleanup
**Goal**: Remove or fully migrate old system

**Tasks**:
1. Assess usage of old system
2. Create migration utility
3. Migrate existing data
4. Remove legacy code
5. Update documentation

**Files to Update**:
- `src/lib/avatars.ts` (remove)
- `src/components/AvatarSelector.tsx` (remove or update)

**Risk**: High (breaking changes, need careful migration)

---

## Update Workflow

### Before Making Changes
1. **Identify the layer** you're working in
2. **Check dependencies** - what depends on this?
3. **Review related files** in the same layer
4. **Plan the change** - document what you're changing and why
5. **Test impact** - how does this affect other layers?

### Making Changes
1. **Start with tests** - write or update tests first
2. **Make incremental changes** - small, focused updates
3. **Test after each change** - verify nothing breaks
4. **Update documentation** - keep docs in sync
5. **Review dependencies** - ensure dependent code still works

### After Making Changes
1. **Test integration** - verify all layers work together
2. **Check performance** - ensure no regressions
3. **Update examples** - if applicable
4. **Document changes** - update this architecture doc
5. **Consider migration** - if breaking changes, plan migration

---

## Common Update Patterns

### Adding a New Category
1. Add asset definitions to `avatarAssets.ts`
2. Add type to `AvatarConfig` in `avatarConfig.ts`
3. Create new selector component in `avatar/`
4. Add validation rules in `avatarValidation.ts`
5. Update `AvatarPreview.tsx` to render new category
6. Add tab to `AvatarCustomizer.tsx`
7. Update default config

### Modifying Existing Category
1. Update assets in `avatarAssets.ts`
2. Update selector component
3. Update validation if needed
4. Update preview rendering
5. Test backward compatibility

### Performance Optimization
1. Identify bottleneck (use profiling)
2. Determine which layer is affected
3. Optimize that layer
4. Test performance improvement
5. Verify no regressions

### Bug Fixes
1. Identify which layer the bug is in
2. Fix in that layer
3. Add test to prevent regression
4. Verify fix doesn't break other layers
5. Document the fix

---

## File Dependency Graph

```
avatarConfig.ts (Layer 1)
  ↓
avatarAssets.ts (Layer 2) ──┐
  ↓                          │
avatarValidation.ts (Layer 3)│
  ↓                          │
AvatarPreview.tsx (Layer 4)  │
  ↓                          │
*Selector.tsx (Layer 5)      │
  ↓                          │
AvatarCustomizer.tsx (Layer 6)│
  ↓                          │
Lobby.tsx (Layer 7) ──────────┘
GameContext.tsx (Layer 7)
PlayerList.tsx (Layer 7)
```

---

## Recommendations

### Immediate Actions
1. **Document each layer** - Add JSDoc comments
2. **Create test structure** - Set up testing framework
3. **Add type exports** - Make types easily accessible
4. **Create examples** - Document usage patterns

### Short-term Improvements
1. **Extract custom hooks** - Move logic from AvatarCustomizer
2. **Optimize rendering** - Improve SVG performance
3. **Add loading states** - Better UX during operations
4. **Improve error messages** - More user-friendly

### Long-term Considerations
1. **Consider state management** - If complexity grows
2. **Asset loading strategy** - For large asset libraries
3. **Rendering optimization** - Canvas or WebGL if needed
4. **Migration tools** - For future schema changes

---

This architecture document should be updated as the system evolves.

