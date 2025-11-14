import type { Options } from "@dicebear/avataaars";
import {
  AvatarConfig,
  generateAvatarId,
} from "@/lib/avatar/config";
import {
  SKIN_TONE_COLORS,
  HAIR_COLOR_VALUES,
} from "@/lib/avatar/categories/assets";

/**
 * Result returned by the DiceBear mapper.
 */
export interface DiceBearMappingResult {
  /**
   * Deterministic seed used when generating the avatar.
   */
  seed: string;
  /**
   * Fully mapped DiceBear options derived from the AvatarConfig.
   */
  options: Options;
}

const DEFAULT_SKIN_COLOR = "ffdbb4";
const DEFAULT_HAIR_COLOR = "2c1b18";
const DEFAULT_CLOTHING_COLOR = "5199e4";
const DEFAULT_TOP_STYLE = "shortFlat";

const SKIN_PRESET_TO_HEX = Object.entries(SKIN_TONE_COLORS).reduce(
  (map, [id, value]) => {
    map[id] = normalizeHexColor(value, DEFAULT_SKIN_COLOR);
    return map;
  },
  {} as Record<string, string>,
);

const HAIR_PRESET_TO_HEX = Object.entries(HAIR_COLOR_VALUES).reduce(
  (map, [id, value]) => {
    map[id] = normalizeHexColor(value, DEFAULT_HAIR_COLOR);
    return map;
  },
  {} as Record<string, string>,
);

const HAIR_STYLE_MAP: Record<string, string> = {
  short: "shortFlat",
  medium: "shortRound",
  long: "longButNotTooLong",
  curly: "curly",
  wavy: "shortWaved",
  bald: "shavedSides",
  bun: "bun",
  ponytail: "straight02",
};

const HAT_STYLE_MAP: Record<string, string> = {
  cap: "hat",
  beanie: "winterHat1",
  fedora: "hat",
  helmet: "winterHat04",
  "graduation-cap": "hat",
  crown: "hat",
};

const CLOTHING_MAP: Record<string, string> = {
  tshirt: "shirtCrewNeck",
  "dress-shirt": "blazerAndShirt",
  "tank-top": "shirtScoopNeck",
  jacket: "blazerAndSweater",
  hoodie: "hoodie",
  sweater: "collarAndSweater",
};

const OUTFIT_MAP: Record<string, string> = {
  suit: "blazerAndShirt",
  uniform: "overall",
  costume: "graphicShirt",
  casual: "shirtCrewNeck",
  formal: "blazerAndSweater",
};

const GLASSES_MAP: Record<string, string> = {
  regular: "prescription01",
  sunglasses: "sunglasses",
  goggles: "kurt",
  monocle: "round",
};

const EYE_MAP: Record<string, string> = {
  default: "default",
  happy: "happy",
  surprised: "surprised",
};

const EYEBROW_MAP: Record<string, string> = {
  default: "default",
  raised: "raisedExcited",
  angry: "angry",
};

const MOUTH_MAP: Record<string, string> = {
  smile: "smile",
  neutral: "serious",
  laugh: "twinkle",
};

const FACIAL_HAIR_MAP: Record<string, string> = {
  mustache: "moustacheFancy",
  beard: "beardMedium",
  goatee: "beardLight",
};

/**
 * Convert the in-app avatar configuration to DiceBear options.
 */
export function avatarConfigToDiceBearOptions(
  config: AvatarConfig,
): DiceBearMappingResult {
  const seed = config.id || generateAvatarId(config);
  const useHat = Boolean(config.accessories.hat);
  const glassesStyle = mapGlasses(config.accessories.glasses);
  const facialHairStyle = mapFacialHair(config.face.facialHair);

  const options: Options = {
    style: ["default"],
    top: [mapTopStyle(config, useHat)],
    clothing: [mapClothing(config)],
    hairColor: [mapHairColor(config.hair.color)],
    skinColor: [mapSkinTone(config.skinTone)],
    clothesColor: [mapClothingColor(config.clothes.color)],
    eyes: [mapEyes(config.face.eyes)],
    eyebrows: [mapEyebrows(config.face.eyebrows)],
    mouth: [mapMouth(config.face.mouth)],
    hatColor: useHat
      ? [mapHatColor(config)]
      : undefined,
    topProbability: 100,
    accessories: glassesStyle ? [glassesStyle] : undefined,
    accessoriesProbability: glassesStyle ? 100 : 0,
    facialHair: facialHairStyle ? [facialHairStyle] : undefined,
    facialHairProbability: facialHairStyle ? 100 : 0,
    facialHairColor: facialHairStyle
      ? [mapHairColor(config.hair.color)]
      : undefined,
  };

  return {
    seed,
    options,
  };
}

function mapSkinTone(value: string): string {
  if (!value) {
    return DEFAULT_SKIN_COLOR;
  }

  if (!value.startsWith("#") && SKIN_PRESET_TO_HEX[value]) {
    return SKIN_PRESET_TO_HEX[value];
  }

  return normalizeHexColor(value, DEFAULT_SKIN_COLOR);
}

function mapHairColor(value: string): string {
  if (!value) {
    return DEFAULT_HAIR_COLOR;
  }

  if (!value.startsWith("#") && HAIR_PRESET_TO_HEX[value]) {
    return HAIR_PRESET_TO_HEX[value];
  }

  return normalizeHexColor(value, DEFAULT_HAIR_COLOR);
}

function mapClothingColor(value: string): string {
  return normalizeHexColor(value, DEFAULT_CLOTHING_COLOR);
}

function mapHatColor(config: AvatarConfig): string {
  if (config.clothes.color) {
    return mapClothingColor(config.clothes.color);
  }
  return mapHairColor(config.hair.color);
}

function mapTopStyle(config: AvatarConfig, useHat: boolean): string {
  if (useHat && config.accessories.hat) {
    return (
      HAT_STYLE_MAP[config.accessories.hat] ??
      HAIR_STYLE_MAP[config.hair.style] ??
      DEFAULT_TOP_STYLE
    );
  }

  return (
    HAIR_STYLE_MAP[config.hair.style] ??
    DEFAULT_TOP_STYLE
  );
}

function mapClothing(config: AvatarConfig): string {
  if (config.clothes.outfit) {
    return (
      OUTFIT_MAP[config.clothes.outfit] ??
      CLOTHING_MAP[config.clothes.top ?? ""] ??
      "shirtCrewNeck"
    );
  }

  if (config.clothes.top && CLOTHING_MAP[config.clothes.top]) {
    return CLOTHING_MAP[config.clothes.top];
  }

  return "shirtCrewNeck";
}

function mapGlasses(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return GLASSES_MAP[value] ?? "round";
}

function mapEyes(value: string): string {
  return EYE_MAP[value] ?? "default";
}

function mapEyebrows(value: string): string {
  return EYEBROW_MAP[value] ?? "default";
}

function mapMouth(value: string): string {
  return MOUTH_MAP[value] ?? "smile";
}

function mapFacialHair(value: string | null): string | null {
  if (!value || value === "none") {
    return null;
  }

  return FACIAL_HAIR_MAP[value] ?? "beardLight";
}

function normalizeHexColor(value: string, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const hex = value.startsWith("#") ? value.slice(1) : value;
  return /^[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : fallback;
}

