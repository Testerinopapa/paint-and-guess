## DiceBear Selector Enhancements Plan

### Overview
- Purpose: capture the combined scope for the next DiceBear UX improvements:
  1. extend every existing selector with the extra DiceBear presets we already ship but do not expose,
  2. add dedicated pickers for DiceBear-only categories (clothing graphics, background style, etc.),
  3. gate legacy-only features so users see only what the active renderer can actually draw.
- Status: planning document – no code implemented yet.
- Owners: Avatar customization pod.

### Current Baseline
- Renderer: hybrid system described in `docs/implementations/dice-bear-integration-status.md` – DiceBear Avataaars is the default preview (`AvatarPreviewDiceBear.tsx`) while legacy SVG acts as fallback.
- Config/Selectors:
  - `src/lib/avatar/categories/assets.ts` defines the option arrays that power `SkinToneSelector`, `HairSelector`, `ClothesSelector`, `AccessoriesSelector`, `FaceSelector`.
  - The arrays are intentionally small (ex: 8 hair styles, 3 eyes) even though Avataaars exposes 30+ top styles, 12 eye expressions, etc.
- Mapping: `src/lib/avatar/dicebear/mapper.ts` translates our config IDs to DiceBear options. New IDs will require map table updates and smoke-test coverage in `scripts/test-dicebear-mapping.ts`.

### Workstream 1 – Extend Existing Selectors
**Goal:** expose the extra Avataaars presets directly inside the current five tabs so DiceBear users can pick them without switching renderers.

Implementation notes:
- `assets.ts`
  - Hair: add entries for DiceBear tops such as `fro`, `fro-band`, `shaggy`, `dreads`, `straight01/02`, `bob`, `pixie`, `hijab`, `turban`, and the four winter hats. Give them stable `id`s that map cleanly to Avataaars values.
  - Face eyes/eyebrows/mouth: append the missing DiceBear expressions (eyes: `wink`, `wink-wacky`, `squint`, etc.; eyebrows: `angryNatural`, `frownNatural`, `unibrowNatural`, etc.; mouths: `twinkle`, `grimace`, `tongue`, etc.).
  - Glasses: include `prescription02`, `wayfarers`, `eyepatch`. Consider renaming the current `regular` option to `prescription01` for clarity.
  - Skin & hair colors: add the extra palette swatches (`fd9841`, `f8d25c`, auburn/platinum hair).
  - Clothing arrays: include `overall`, `shirtVNeck`, `collarAndSweater`, `graphicShirt`.
- `mapper.ts`
  - Extend `HAIR_STYLE_MAP`, `HAT_STYLE_MAP`, `CLOTHING_MAP`, `OUTFIT_MAP`, `GLASSES_MAP`, `EYE_MAP`, `EYEBROW_MAP`, `MOUTH_MAP`, `FACIAL_HAIR_MAP` to translate the new IDs.
  - Ensure new IDs fall back gracefully when renderer === custom SVG (see Workstream 3).
- `scripts/test-dicebear-mapping.ts`
  - Add representative configs for the newly introduced IDs to keep coverage.
- UX impact: selectors become longer; plan to group or alphabetize entries and ensure `OptionGrid` still paginates well.

### Workstream 2 – DiceBear-Only Pickers
**Goal:** expose features that only exist in Avataaars so users can take advantage of them without confusing the legacy renderer.

Target controls:
- **Clothing graphics** (`clothingGraphic`): add a sub-picker inside the Clothes tab that shows the 10 DiceBear decals (bat, bear, pizza, etc.) when the user chooses a shirt type that supports graphics.
- **Background frame** (`style: "default" | "circle"`) and **background color palette** (`backgroundColor`, maybe include transparent). Can live in a new “Style” tab (sixth tab) so we don’t overload Clothes.
- **Accessory colors** (`accessoriesColor`, `hatColor` quick presets) – optional toggles/pickers to match DiceBear palettes quickly.
- **Probability sliders** (`topProbability`, `accessoriesProbability`, `facialHairProbability`) surfaced only in randomize contexts; otherwise default to 100/0.

Implementation notes:
- Add a `StyleSelector` component to `src/components/avatar/categories/` and register it via `AvatarCustomizer` tabs: when renderer is DiceBear, show the tab; otherwise hide or disable.
- Extend `AvatarConfig` if necessary (e.g., `dicebearBackground`, `dicebearClothingGraphic`). Alternatively, store the selections under existing nested objects but mark them as DiceBear-only via `dicebear` namespace keys.
- Update mapper to pass the new options arrays (`clothingGraphic`, `style`, `backgroundColor`, `accessoriesColor`).
- Consider storing defaults in `createDefaultAvatarConfig` so serialization stays deterministic.

### Workstream 3 – Gate Custom-Only Features
**Goal:** avoid presenting options that DiceBear cannot draw, reducing user confusion between renderers.

Target areas:
- **Body shape/size** and **accessory.other** (jewelry/backpack) currently appear in selectors but have no DiceBear equivalent. When `config.renderer === 'dicebear'`, either:
  - hide these sections entirely,
  - or display read-only badges explaining “Custom renderer only”.
- **Randomizer**: ensure it doesn’t assign unsupported fields when DiceBear is active (e.g., skip `body.shape` updates, or only randomize them if renderer === "custom").
- **Preview hints**: `AvatarPreview` can surface a banner when some selected option is ignored by DiceBear (e.g., selecting `body.shape` while renderer === DiceBear).

Implementation steps:
- Update selector components to read renderer from context/props and conditionally render sections.
- Extend validation in `sanitizeAvatarConfig` so DiceBear configs automatically null out unsupported fields.
- Update persistence/migration logic to store renderer-aware defaults (maybe add `activeRenderer` to saved payloads if not already).

### Milestones & Acceptance
1. **Selector Expansion**
   - Asset arrays updated, mapper tables extended, smoke tests green.
   - UI shows the larger option set without layout regressions.
2. **DiceBear Pickers**
   - New picker(s) rendered only when DiceBear renderer active.
   - Config persists new fields; mapper produces valid DiceBear schema.
3. **Renderer Gating**
   - Unsupported fields hidden or clearly marked when DiceBear is active.
   - Randomizer and validators respect renderer differences.

### Testing Strategy
- Unit: augment `scripts/test-dicebear-mapping.ts` and any jest suites covering selectors.
- Visual: manual QA of AvatarCustomizer tabs for both renderers, ensuring new options appear only when appropriate.
- Regression: verify `PlayerList` still fetches avatars from the DiceBear API and that `AvatarPreviewSVG` path remains unaffected.

### Open Questions / Follow-Ups
- Do we want analytics to track which renderer users select? If yes, add telemetry while gating features.
- Should we auto-switch to DiceBear when a DiceBear-only option is chosen, or block the choice unless DiceBear is active?
- Need UX approval for adding a sixth tab vs. embedding pickers inside existing tabs.


