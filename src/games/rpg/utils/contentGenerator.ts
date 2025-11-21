import { faker } from "@faker-js/faker";
import Chance from "chance";
import { contentDebug } from "./debug";

const chance = new Chance();

// NPC Generation
export interface NPC {
  name: string;
  title: string;
  description: string;
  dialogue: string[];
  quest?: Quest;
}

interface GenerateNPCOptions {
  ensureQuest?: boolean;
}

export function generateNPC(options?: GenerateNPCOptions): NPC {
  const startTime = performance.now();
  const titles = [
    "Ancient Scholar",
    "Mysterious Wanderer",
    "Cursed Guardian",
    "Forgotten Sage",
    "Shadow Merchant",
    "Echo of the Past",
    "Whispering Spirit",
  ];

  const dialogues = [
    "The abyss remembers all who enter...",
    "You seek answers, but are you prepared for the truth?",
    "Many have come before you. Few have returned.",
    "The ancient magic flows through these ruins still.",
    "Beware the shadows that move when you're not looking.",
  ];

  const shouldIncludeQuest = options?.ensureQuest
    ? true
    : chance.bool({ likelihood: 40 });

  const npc = {
    name: faker.person.fullName(),
    title: chance.pickone(titles),
    description: faker.lorem.sentence(),
    dialogue: chance.pickset(dialogues, chance.integer({ min: 1, max: 3 })),
    quest: shouldIncludeQuest ? generateQuest() : undefined,
  };

  const duration = performance.now() - startTime;
  contentDebug.generate("NPC", { ...npc, generationTime: `${duration.toFixed(2)}ms` });

  return npc;
}

// Location Generation
export interface Location {
  name: string;
  description: string;
  danger: "low" | "medium" | "high";
  treasures: string[];
}

export function generateLocation(): Location {
  const locationTypes = [
    "Ancient Ruins",
    "Forgotten Temple",
    "Shadowy Cavern",
    "Cursed Crypt",
    "Abandoned Tower",
    "Dark Sanctum",
    "Echoing Halls",
  ];

  const treasureTypes = [
    "Enchanted Shard",
    "Ancient Scroll",
    "Cursed Coin",
    "Mystic Gem",
    "Forgotten Relic",
    "Shadow Essence",
  ];

  return {
    name: `${chance.pickone(locationTypes)} of ${faker.location.city()}`,
    description: faker.lorem.paragraph(),
    danger: chance.pickone(["low", "medium", "high"]),
    treasures: chance.pickset(treasureTypes, chance.integer({ min: 0, max: 3 })),
  };
}

// Item Generation
export interface Item {
  name: string;
  type: "weapon" | "armor" | "consumable" | "misc";
  description: string;
  value: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export function generateItem(): Item {
  const startTime = performance.now();
  const itemTypes: Item["type"][] = ["weapon", "armor", "consumable", "misc"];
  const rarities: Item["rarity"][] = ["common", "uncommon", "rare", "epic", "legendary"];

  const type = chance.pickone(itemTypes);
  const rarity = chance.weighted(rarities, [40, 30, 20, 8, 2]);

  const names = {
    weapon: ["Shadow Blade", "Echo Sword", "Abyssal Dagger", "Cursed Mace", "Ancient Spear"],
    armor: ["Runic Plate", "Shadow Cloak", "Echo Helm", "Abyssal Shield", "Cursed Gauntlets"],
    consumable: ["Healing Draught", "Mana Elixir", "Fortune Potion", "Shadow Essence", "Echo Fragment"],
    misc: ["Ancient Scroll", "Mystic Gem", "Cursed Coin", "Forgotten Relic", "Abyssal Key"],
  };

  const baseValue = {
    common: 10,
    uncommon: 25,
    rare: 50,
    epic: 100,
    legendary: 250,
  };

  const item = {
    name: chance.pickone(names[type]),
    type,
    description: faker.lorem.sentence(),
    value: baseValue[rarity] + chance.integer({ min: 0, max: 20 }),
    rarity,
  };

  const duration = performance.now() - startTime;
  contentDebug.generate("Item", { ...item, generationTime: `${duration.toFixed(2)}ms` });

  return item;
}

// Quest Generation
export type QuestStatus = "available" | "active" | "completed";

export type QuestObjectiveType =
  | "combat"
  | "recovery"
  | "investigation"
  | "translation"
  | "listening";

export interface QuestObjective {
  type: QuestObjectiveType;
  summary: string;
  requiredCommand: string;
  targetCount: number;
  progress: number;
}

export interface QuestReward {
  xp: number;
  gold: number;
  items?: Item[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  giver?: string;
  status: QuestStatus;
  objective: QuestObjective;
  reward: QuestReward;
}

interface QuestTemplateContext {
  item: string;
  location: string;
  enemy: string;
  npc: string;
  event: string;
  artifact: string;
}

interface QuestTemplate {
  type: QuestObjectiveType;
  requiredCommand: string;
  minCount: number;
  maxCount: number;
  build: (ctx: QuestTemplateContext, count: number) => {
    title: string;
    description: string;
    summary: string;
  };
}

const questTemplates: QuestTemplate[] = [
  {
    type: "recovery",
    requiredCommand: "Search for Treasure",
    minCount: 1,
    maxCount: 2,
    build: (ctx, count) => ({
      title: `Recover the ${ctx.item}`,
      description: `Rumors speak of a ${ctx.item} hidden within the ${ctx.location}. It hums with dormant energy and must be retrieved.`,
      summary: `Search the ruins ${count} time(s) to locate the ${ctx.item}.`,
    }),
  },
  {
    type: "combat",
    requiredCommand: "Attack",
    minCount: 1,
    maxCount: 3,
    build: (ctx, count) => ({
      title: `Silence the ${ctx.enemy}`,
      description: `A ${ctx.enemy} prowls the ${ctx.location}, leaving echoes of terror. It must be defeated.`,
      summary: `Defeat enemies in combat ${count} time(s).`,
    }),
  },
  {
    type: "investigation",
    requiredCommand: "Investigate Symbols",
    minCount: 1,
    maxCount: 1,
    build: (ctx) => ({
      title: `Study the ${ctx.artifact}`,
      description: `Ancient markings referencing a ${ctx.artifact} appear near the ${ctx.location}. They may reveal a hidden chamber.`,
      summary: `Investigate the symbols to decode the ${ctx.artifact}.`,
    }),
  },
  {
    type: "translation",
    requiredCommand: "Cast Light Spell",
    minCount: 1,
    maxCount: 1,
    build: (ctx) => ({
      title: `Illuminate the ${ctx.location}`,
      description: `A ${ctx.npc} believes light magic will reveal the secrets guarded within the ${ctx.location}.`,
      summary: `Cast a light spell to expose hidden glyphs.`,
    }),
  },
  {
    type: "listening",
    requiredCommand: "Listen Carefully",
    minCount: 1,
    maxCount: 2,
    build: (ctx, count) => ({
      title: `Trace the ${ctx.event}`,
      description: `Whispers of a ${ctx.event} echo across the ${ctx.location}. The abyss itself seems unsettled.`,
      summary: `Listen carefully ${count} time(s) to pinpoint the disturbance.`,
    }),
  },
];

export function generateQuest(): Quest {
  const startTime = performance.now();
  const ctx: QuestTemplateContext = {
    item: chance.pickone(["Ancient Scroll", "Mystic Gem", "Shadow Essence", "Echo Fragment"]),
    location: chance.pickone(["Ruins", "Temple", "Cavern", "Crypt", "Sanctum"]),
    enemy: chance.pickone(["Shadow Wraith", "Echo Guardian", "Cursed Spirit", "Abyssal Horror"]),
    npc: chance.pickone(["Ancient Scholar", "Mysterious Wanderer", "Forgotten Sage"]),
    event: chance.pickone(["disturbance", "phenomenon", "anomaly", "occurrence"]),
    artifact: chance.pickone(["rune", "glyph", "inscription", "tablet"]),
  };

  const template = chance.pickone(questTemplates);
  const targetCount = chance.integer({ min: template.minCount, max: template.maxCount });
  const { title, description, summary } = template.build(ctx, targetCount);
  const rewardItems = chance.bool({ likelihood: 30 })
    ? [generateItem()]
    : undefined;

  const quest: Quest = {
    id: chance.guid(),
    title,
    description,
    status: "available",
    objective: {
      type: template.type,
      summary,
      requiredCommand: template.requiredCommand,
      targetCount,
      progress: 0,
    },
    reward: {
      xp: 150 + chance.integer({ min: 25, max: 150 }),
      gold: 40 + chance.integer({ min: 10, max: 80 }),
      items: rewardItems,
    },
  };

  const duration = performance.now() - startTime;
  contentDebug.generate("Quest", { ...quest, generationTime: `${duration.toFixed(2)}ms` });

  return quest;
}

// Monster Generation
export interface Monster {
  name: string;
  level: number;
  hp: number;
  description: string;
  loot: Item[];
}

export function generateMonster(characterLevel: number = 5): Monster {
  const startTime = performance.now();
  const monsterTypes = [
    "Shadow Wraith",
    "Echo Guardian",
    "Cursed Spirit",
    "Abyssal Horror",
    "Ancient Golem",
    "Forgotten Specter",
    "Dark Apparition",
  ];

  const level = characterLevel + chance.integer({ min: -2, max: 3 });
  const hp = 50 + level * 15 + chance.integer({ min: 0, max: 30 });

  const monster = {
    name: chance.pickone(monsterTypes),
    level: Math.max(1, level),
    hp,
    description: faker.lorem.sentence(),
    loot: chance.pickset(
      Array.from({ length: 3 }, () => generateItem()),
      chance.integer({ min: 0, max: 2 })
    ),
  };

  const duration = performance.now() - startTime;
  contentDebug.generate("Monster", {
    ...monster,
    characterLevel,
    generationTime: `${duration.toFixed(2)}ms`,
  });

  return monster;
}

// Loot Table Generation
export function generateLootTable(difficulty: "low" | "medium" | "high" = "medium"): Item[] {
  const count = {
    low: chance.integer({ min: 1, max: 2 }),
    medium: chance.integer({ min: 2, max: 4 }),
    high: chance.integer({ min: 3, max: 5 }),
  };

  return Array.from({ length: count[difficulty] }, () => generateItem());
}

// Dungeon Name Generation
export function generateDungeonName(): string {
  const prefixes = ["Shadow", "Echo", "Abyssal", "Cursed", "Ancient", "Forgotten", "Dark"];
  const suffixes = ["Ruins", "Temple", "Crypt", "Sanctum", "Cavern", "Tower", "Halls"];

  return `${chance.pickone(prefixes)} ${chance.pickone(suffixes)}`;
}

// Combat Description Generation
export function generateCombatDescription(monster: Monster, outcome: "victory" | "defeat"): string {
  if (outcome === "victory") {
    const descriptions = [
      `You strike down the ${monster.name} with a decisive blow!`,
      `The ${monster.name} crumbles before your might!`,
      `Victory! The ${monster.name} falls to the ground, defeated.`,
      `With a final strike, you vanquish the ${monster.name}!`,
    ];
    return chance.pickone(descriptions);
  } else {
    const descriptions = [
      `The ${monster.name} overwhelms you with its dark power...`,
      `You fall before the might of the ${monster.name}!`,
      `Defeated! The ${monster.name} stands triumphant.`,
    ];
    return chance.pickone(descriptions);
  }
}

