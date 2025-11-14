/**
 * Virtual Smoke Test for DiceBear Avatar Mapping
 * 
 * This script validates that the AvatarConfig to DiceBear options mapping
 * works correctly by generating avatars and verifying they render properly.
 * 
 * Run with: npx tsx scripts/test-dicebear-mapping.ts
 */

import { createAvatar } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";
import { avatarConfigToDiceBearOptions } from "../src/lib/avatar/dicebear/mapper";
import { AvatarConfig, createDefaultAvatarConfig } from "../src/lib/avatar/config";

interface TestCase {
  name: string;
  config: AvatarConfig;
  description?: string;
}

// Test cases covering various scenarios
const testCases: TestCase[] = [
  {
    name: "Default Config",
    config: createDefaultAvatarConfig("Test Avatar"),
    description: "Tests the default avatar configuration",
  },
  {
    name: "Custom Skin Tone (Hex)",
    config: {
      ...createDefaultAvatarConfig("Custom Skin"),
      skinTone: "#C68642",
    },
    description: "Tests custom hex skin tone color",
  },
  {
    name: "Preset Skin Tone",
    config: {
      ...createDefaultAvatarConfig("Preset Skin"),
      skinTone: "dark",
    },
    description: "Tests preset skin tone ID",
  },
  {
    name: "Short Hair with Custom Color",
    config: {
      ...createDefaultAvatarConfig("Short Hair"),
      hair: {
        style: "short",
        color: "#FFD700",
      },
    },
    description: "Tests short hair style with custom color",
  },
  {
    name: "Long Hair",
    config: {
      ...createDefaultAvatarConfig("Long Hair"),
      hair: {
        style: "long",
        color: "brown",
      },
    },
    description: "Tests long hair style with preset color",
  },
  {
    name: "Curly Hair",
    config: {
      ...createDefaultAvatarConfig("Curly Hair"),
      hair: {
        style: "curly",
        color: "black",
      },
    },
    description: "Tests curly hair style",
  },
  {
    name: "Bald",
    config: {
      ...createDefaultAvatarConfig("Bald"),
      hair: {
        style: "bald",
        color: "black",
      },
    },
    description: "Tests bald hair style",
  },
  {
    name: "With Hat",
    config: {
      ...createDefaultAvatarConfig("With Hat"),
      accessories: {
        hat: "cap",
        glasses: null,
        jewelry: [],
        other: [],
      },
    },
    description: "Tests avatar with hat accessory",
  },
  {
    name: "With Glasses",
    config: {
      ...createDefaultAvatarConfig("With Glasses"),
      accessories: {
        hat: null,
        glasses: "regular",
        jewelry: [],
        other: [],
      },
    },
    description: "Tests avatar with glasses",
  },
  {
    name: "With Sunglasses",
    config: {
      ...createDefaultAvatarConfig("Sunglasses"),
      accessories: {
        hat: null,
        glasses: "sunglasses",
        jewelry: [],
        other: [],
      },
    },
    description: "Tests avatar with sunglasses",
  },
  {
    name: "Hat and Glasses",
    config: {
      ...createDefaultAvatarConfig("Hat and Glasses"),
      accessories: {
        hat: "beanie",
        glasses: "regular",
        jewelry: [],
        other: [],
      },
    },
    description: "Tests avatar with both hat and glasses",
  },
  {
    name: "Different Clothing Types",
    config: {
      ...createDefaultAvatarConfig("T-Shirt"),
      clothes: {
        top: "tshirt",
        bottom: "jeans",
        outfit: null,
        color: "#3B82F6",
      },
    },
    description: "Tests different clothing combinations",
  },
  {
    name: "Suit Outfit",
    config: {
      ...createDefaultAvatarConfig("Suit"),
      clothes: {
        top: null,
        bottom: null,
        outfit: "suit",
        color: "#000000",
      },
    },
    description: "Tests full outfit (suit)",
  },
  {
    name: "Hoodie Outfit",
    config: {
      ...createDefaultAvatarConfig("Hoodie"),
      clothes: {
        top: null,
        bottom: null,
        outfit: "casual",
        color: "#8B5CF6",
      },
    },
    description: "Tests casual outfit",
  },
  {
    name: "Happy Eyes",
    config: {
      ...createDefaultAvatarConfig("Happy"),
      face: {
        eyes: "happy",
        eyebrows: "default",
        mouth: "smile",
        facialHair: null,
      },
    },
    description: "Tests happy facial expression",
  },
  {
    name: "Surprised Expression",
    config: {
      ...createDefaultAvatarConfig("Surprised"),
      face: {
        eyes: "surprised",
        eyebrows: "raised",
        mouth: "neutral",
        facialHair: null,
      },
    },
    description: "Tests surprised facial expression",
  },
  {
    name: "With Beard",
    config: {
      ...createDefaultAvatarConfig("Beard"),
      face: {
        eyes: "default",
        eyebrows: "default",
        mouth: "smile",
        facialHair: "beard",
      },
    },
    description: "Tests facial hair (beard)",
  },
  {
    name: "With Mustache",
    config: {
      ...createDefaultAvatarConfig("Mustache"),
      face: {
        eyes: "default",
        eyebrows: "default",
        mouth: "smile",
        facialHair: "mustache",
      },
    },
    description: "Tests facial hair (mustache)",
  },
  {
    name: "Complex Combination",
    config: {
      ...createDefaultAvatarConfig("Complex"),
      skinTone: "medium",
      hair: {
        style: "wavy",
        color: "#A0522D",
      },
      clothes: {
        top: "hoodie",
        bottom: "jeans",
        outfit: null,
        color: "#EF4444",
      },
      accessories: {
        hat: "fedora",
        glasses: "sunglasses",
        jewelry: [],
        other: [],
      },
      face: {
        eyes: "happy",
        eyebrows: "raised",
        mouth: "laugh",
        facialHair: "goatee",
      },
    },
    description: "Tests complex combination of all features",
  },
  {
    name: "Edge Case - Invalid Hair Style",
    config: {
      ...createDefaultAvatarConfig("Invalid Hair"),
      hair: {
        style: "nonexistent-style",
        color: "black",
      },
    },
    description: "Tests fallback for invalid hair style",
  },
  {
    name: "Edge Case - Invalid Color Format",
    config: {
      ...createDefaultAvatarConfig("Invalid Color"),
      skinTone: "not-a-color",
      hair: {
        style: "short",
        color: "invalid",
      },
    },
    description: "Tests fallback for invalid color values",
  },
];

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  svgLength?: number;
  hasSvgContent?: boolean;
  options?: any;
}

function validateSvg(svg: string): { valid: boolean; error?: string } {
  if (!svg || typeof svg !== "string") {
    return { valid: false, error: "SVG is not a string or is empty" };
  }

  if (svg.trim().length === 0) {
    return { valid: false, error: "SVG is empty" };
  }

  // Check for basic SVG structure
  if (!svg.includes("<svg")) {
    return { valid: false, error: "SVG does not contain <svg> tag" };
  }

  // Check for reasonable content length (too short might indicate error)
  if (svg.length < 100) {
    return { valid: false, error: "SVG appears too short (might be an error message)" };
  }

  // Check for common error indicators
  if (svg.toLowerCase().includes("error") || svg.toLowerCase().includes("undefined")) {
    return { valid: false, error: "SVG contains error indicators" };
  }

  return { valid: true };
}

function runTest(testCase: TestCase): TestResult {
  const result: TestResult = {
    name: testCase.name,
    passed: false,
  };

  try {
    // Step 1: Map AvatarConfig to DiceBear options
    const mapping = avatarConfigToDiceBearOptions(testCase.config);
    result.options = mapping.options;

    // Step 2: Generate avatar using DiceBear
    // Wrap the create function in a style object
    const style = {
      create: avataaars.create,
      meta: avataaars.meta,
      schema: avataaars.schema,
    };
    const avatar = createAvatar(style, {
      seed: mapping.seed,
      ...mapping.options,
    });

    // Step 3: Get SVG string
    const svg = avatar.toString();

    // Step 4: Validate SVG
    const validation = validateSvg(svg);
    if (!validation.valid) {
      result.error = validation.error;
      return result;
    }

    // Step 5: Check SVG content
    result.svgLength = svg.length;
    result.hasSvgContent = svg.includes("<svg") && svg.includes("</svg>");
    result.passed = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

function main() {
  console.log("🧪 DiceBear Mapping Smoke Test\n");
  console.log("=" .repeat(60));
  console.log(`Testing ${testCases.length} scenarios...\n`);

  const results: TestResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  // Run all tests
  for (const testCase of testCases) {
    const result = runTest(testCase);
    results.push(result);

    if (result.passed) {
      passedCount++;
      console.log(`✅ ${result.name}`);
      if (result.svgLength) {
        console.log(`   SVG length: ${result.svgLength} chars`);
      }
    } else {
      failedCount++;
      console.log(`❌ ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (testCase.description) {
        console.log(`   Description: ${testCase.description}`);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  console.log(`Total tests: ${testCases.length}`);
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`Success rate: ${((passedCount / testCases.length) * 100).toFixed(1)}%`);

  // Show failed tests details
  if (failedCount > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("❌ Failed Tests Details");
    console.log("=".repeat(60));
    results
      .filter((r) => !r.passed)
      .forEach((result) => {
        console.log(`\n${result.name}:`);
        console.log(`  Error: ${result.error || "Unknown error"}`);
        const testCase = testCases.find((tc) => tc.name === result.name);
        if (testCase?.description) {
          console.log(`  Description: ${testCase.description}`);
        }
      });
  }

  // Exit with appropriate code
  process.exit(failedCount > 0 ? 1 : 0);
}

// Run the tests
main();

