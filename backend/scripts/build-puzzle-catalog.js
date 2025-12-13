import { prisma } from "../src/prismaClient.js";

const RATING_PRESETS = {
  easy: { min: 0, max: 1400 },
  medium: { min: 1400, max: 2000 },
  hard: { min: 2000, max: 10000 },
};

// Common motifs to catalog
const COMMON_MOTIFS = [
  "fork",
  "pin",
  "skewer",
  "hangingPiece",
  "mateIn1",
  "mateIn2",
  "mateIn3",
  "mateIn4",
  "backRankMate",
  "deflection",
  "discoveredAttack",
  "doubleCheck",
  "interference",
  "capturingDefender",
  "promotion",
  "zugzwang",
  "sacrifice",
  "advantage",
  "equality",
  "mate", // General mate (not mateInX)
];

/**
 * Parse motifs from JSON string or array
 */
function parseMotifs(motifs) {
  if (typeof motifs === "string") {
    try {
      return JSON.parse(motifs);
    } catch {
      return [];
    }
  }
  return Array.isArray(motifs) ? motifs : [];
}

/**
 * Check if puzzle has a specific motif
 */
function hasMotif(puzzleMotifs, motif) {
  const parsed = parseMotifs(puzzleMotifs);
  return parsed.some(m => 
    typeof m === "string" && m.toLowerCase().includes(motif.toLowerCase())
  );
}

/**
 * Get all motifs present in a puzzle
 */
function getPuzzleMotifs(puzzleMotifs) {
  const parsed = parseMotifs(puzzleMotifs);
  const found = [];
  
  for (const motif of COMMON_MOTIFS) {
    if (hasMotif(parsed, motif)) {
      found.push(motif);
    }
  }
  
  return found;
}

/**
 * Build catalog for a specific rating range and motif
 * Optimized for large datasets - processes in batches
 */
async function buildCatalogEntry(ratingMin, ratingMax, motif = "all") {
  console.log(`\n📦 Building catalog: rating ${ratingMin}-${ratingMax}, motif: ${motif}`);
  
  // Build where clause
  const where = {
    rating: {
      gte: ratingMin,
      lte: ratingMax,
    },
  };
  
  // Add motif filter if not "all"
  if (motif !== "all") {
    where.motifs = {
      contains: motif,
    };
  }
  
  // Get count first (faster than fetching all)
  const totalCount = await prisma.puzzle.count({ where });
  console.log(`   Found ${totalCount} puzzles`);
  
  if (totalCount === 0) {
    // Delete catalog entry if it exists
    try {
      await prisma.puzzleCatalog.deleteMany({
        where: {
          ratingMin,
          ratingMax,
          motif: motif || "all",
        },
      });
    } catch (e) {
      // Ignore errors
    }
    console.log(`   ⚠️  No puzzles found`);
    return 0;
  }
  
  // For large datasets, fetch IDs in batches to avoid timeout
  const BATCH_SIZE = 5000;
  const puzzleIds = [];
  let skip = 0;
  
  while (skip < totalCount) {
    const batch = await prisma.puzzle.findMany({
      where,
      select: {
        id: true,
      },
      skip,
      take: BATCH_SIZE,
    });
    
    puzzleIds.push(...batch.map(p => p.id));
    skip += BATCH_SIZE;
    
    if (skip < totalCount) {
      console.log(`   Progress: ${Math.min(skip, totalCount)}/${totalCount}...`);
    }
  }
  
  // Store catalog entry
  const catalogKey = {
    ratingMin,
    ratingMax,
    motif: motif || "all",
  };
  
  try {
    await prisma.puzzleCatalog.upsert({
      where: {
        ratingMin_ratingMax_motif: catalogKey,
      },
      update: {
        puzzleIds: JSON.stringify(puzzleIds),
        count: puzzleIds.length,
      },
      create: {
        ...catalogKey,
        puzzleIds: JSON.stringify(puzzleIds),
        count: puzzleIds.length,
      },
    });
    
    console.log(`   💾 Saved ${puzzleIds.length} puzzles`);
    return puzzleIds.length;
  } catch (error) {
    console.error(`   ❌ Error saving catalog entry:`, error.message);
    throw error;
  }
}

/**
 * Main function to build entire catalog
 */
async function buildPuzzleCatalog() {
  console.log("🏗️  Building Puzzle Catalog");
  console.log("=".repeat(50));
  
  try {
    // Connect to database
    await prisma.$connect();
    console.log("✅ Connected to database");
    
    // Clear existing catalog
    console.log("\n🗑️  Clearing existing catalog...");
    const deleted = await prisma.puzzleCatalog.deleteMany({});
    console.log(`   Deleted ${deleted.count} existing catalog entries`);
    
    // Build catalog for each rating preset
    const stats = {
      totalEntries: 0,
      totalPuzzles: 0,
    };
    
    for (const [difficulty, preset] of Object.entries(RATING_PRESETS)) {
      console.log(`\n📊 Processing ${difficulty} puzzles (${preset.min}-${preset.max})`);
      
      // Build "all motifs" entry
      const allCount = await buildCatalogEntry(preset.min, preset.max, "all");
      stats.totalEntries++;
      stats.totalPuzzles += allCount;
      
      // Build entries for each common motif
      for (const motif of COMMON_MOTIFS) {
        const count = await buildCatalogEntry(preset.min, preset.max, motif);
        if (count > 0) {
          stats.totalEntries++;
          stats.totalPuzzles += count;
        }
      }
    }
    
    // Also build catalog for custom ranges (common ranges users might use)
    console.log("\n📊 Processing custom ranges");
    const customRanges = [
      { min: 0, max: 1000 },
      { min: 1000, max: 1500 },
      { min: 1500, max: 1800 },
      { min: 1800, max: 2200 },
      { min: 2200, max: 2500 },
      { min: 2500, max: 3000 },
    ];
    
    for (const range of customRanges) {
      const count = await buildCatalogEntry(range.min, range.max, "all");
      if (count > 0) {
        stats.totalEntries++;
        stats.totalPuzzles += count;
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ Catalog build complete!");
    console.log(`   Total catalog entries: ${stats.totalEntries}`);
    console.log(`   Total valid puzzles cataloged: ${stats.totalPuzzles}`);
    
    // Show summary
    console.log("\n📈 Catalog Summary:");
    const allEntries = await prisma.puzzleCatalog.findMany({
      orderBy: [
        { ratingMin: "asc" },
        { ratingMax: "asc" },
        { motif: "asc" },
      ],
    });
    
    for (const entry of allEntries) {
      const motifLabel = entry.motif || "all";
      console.log(`   ${entry.ratingMin}-${entry.ratingMax} | ${motifLabel.padEnd(20)} | ${entry.count} puzzles`);
    }
    
  } catch (error) {
    console.error("❌ Error building catalog:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('build-puzzle-catalog.js');

if (isMainModule) {
  buildPuzzleCatalog()
    .then(() => {
      console.log("\n✨ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Failed:", error);
      console.error(error.stack);
      process.exit(1);
    });
}

export { buildPuzzleCatalog };

