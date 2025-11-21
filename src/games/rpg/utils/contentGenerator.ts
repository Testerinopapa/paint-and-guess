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
  quest?: string;
}

export function generateNPC(): NPC {
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

  const npc = {
    name: faker.person.fullName(),
    title: chance.pickone(titles),
    description: faker.lorem.sentence(),
    dialogue: chance.pickset(dialogues, chance.integer({ min: 1, max: 3 })),
    quest: chance.bool({ likelihood: 40 }) ? generateQuest() : undefined,
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
export interface Quest {
  title: string;
  description: string;
  objective: string;
  reward: {
    xp: number;
    gold: number;
    items?: Item[];
  };
}

export function generateQuest(): string {
  const questTemplates = [
    "Retrieve the {item} from the {location}",
    "Defeat the {enemy} that haunts the {location}",
    "Collect {count} {item} for the {npc}",
    "Investigate the mysterious {event} in the {location}",
    "Translate the ancient {artifact} found in the {location}",
  ];

  const items = ["Ancient Scroll", "Mystic Gem", "Shadow Essence", "Echo Fragment"];
  const locations = ["Ruins", "Temple", "Cavern", "Crypt", "Sanctum"];
  const enemies = ["Shadow Wraith", "Echo Guardian", "Cursed Spirit", "Abyssal Horror"];
  const npcs = ["Ancient Scholar", "Mysterious Wanderer", "Forgotten Sage"];
  const events = ["disturbance", "phenomenon", "anomaly", "occurrence"];
  const artifacts = ["rune", "glyph", "inscription", "tablet"];

  let quest = chance.pickone(questTemplates);
  quest = quest.replace("{item}", chance.pickone(items));
  quest = quest.replace("{location}", chance.pickone(locations));
  quest = quest.replace("{enemy}", chance.pickone(enemies));
  quest = quest.replace("{npc}", chance.pickone(npcs));
  quest = quest.replace("{event}", chance.pickone(events));
  quest = quest.replace("{artifact}", chance.pickone(artifacts));
  quest = quest.replace("{count}", chance.integer({ min: 3, max: 10 }).toString());

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

