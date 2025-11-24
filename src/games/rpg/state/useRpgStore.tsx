/* @refresh reset */
import { ReactNode } from "react";
import { create } from "zustand";
import { persist, createJSONStorage, PersistOptions } from "zustand/middleware";
import {
  generateMonster,
  generateCombatDescription,
  generateLootTable,
  generateItem,
  generateNPC,
  generateQuest,
  Item,
  Quest,
} from "../utils/contentGenerator";
import { inventoryDebug } from "../utils/debug";

// Debug configuration
const DEBUG_RPG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_RPG === "true";
const DEBUG_LOG_PREFIX = "[RPG Store]";
const MAX_ACTIVE_QUESTS = 3;

// Persistence configuration
const RPG_STORAGE_KEY = "chronicles-of-the-abyss-save";
const RPG_STORAGE_VERSION = 1;
const MAX_STORY_TEXT_LINES = 100; // Keep last 100 lines of story text

// Debug logging utilities
function debugLog(level: "info" | "warn" | "error" | "action", message: string, data?: unknown) {
  if (!DEBUG_RPG) return;

  const timestamp = new Date().toISOString();
  const prefix = `${DEBUG_LOG_PREFIX} [${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case "info":
      console.log(prefix, message, data ? data : "");
      break;
    case "warn":
      console.warn(prefix, message, data ? data : "");
      break;
    case "error":
      console.error(prefix, message, data ? data : "");
      break;
    case "action":
      console.groupCollapsed(`${prefix} ${message}`);
      if (data) console.log(data);
      console.groupEnd();
      break;
  }
}

// Performance tracking
const performanceTracker = {
  actions: [] as Array<{ action: string; duration: number; timestamp: number }>,
  maxEntries: 50,
  track(action: string, startTime: number) {
    const duration = performance.now() - startTime;
    this.actions.push({ action, duration, timestamp: Date.now() });
    if (this.actions.length > this.maxEntries) {
      this.actions.shift();
    }
    debugLog("info", `Action '${action}' took ${duration.toFixed(2)}ms`);
  },
  getStats() {
    if (this.actions.length === 0) return null;
    const durations = this.actions.map((a) => a.duration);
    return {
      count: this.actions.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      recent: this.actions.slice(-10),
    };
  },
  clear() {
    this.actions = [];
  },
};

import type { AvatarConfig } from "@/lib/avatar/config";
import type { CharacterType } from "../components/CharacterSprite";

export interface Character {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  /** Optional avatar configuration for character customization */
  avatarConfig?: AvatarConfig;
  /** Optional seed string for simple deterministic avatar generation */
  avatarSeed?: string;
  /** Character sprite type: 'character' | 'ninja' */
  spriteType?: CharacterType;
}

type CharacterDelta = Partial<Pick<Character, "hp" | "mana" | "xp" | "gold">>;

export interface BaseRpgState {
  character: Character;
  location: string;
  storyText: string[];
  availableCommands: string[];
  inventory: Item[];
  quests: Quest[];
  completedQuests: Quest[];
  isCharacterCreated: boolean;
}

interface RpgStore extends BaseRpgState {
  performAction: (action: string) => void;
  submitCommand: (command: string) => void;
  setLocation: (location: string) => void;
  addItem: (item: Item) => void;
  removeItem: (item: Item) => void;
  setCharacterAvatar: (avatarConfig: AvatarConfig | null) => void;
  setCharacterSpriteType: (spriteType: CharacterType) => void;
  initializeCharacter: (name: string, characterClass?: string) => void;
  reset: () => void;
}

const DEFAULT_CHARACTER: Character = {
  name: "Wanderer",
  level: 5,
  hp: 75,
  maxHp: 100,
  mana: 40,
  maxMana: 80,
  xp: 1250,
  xpToNextLevel: 2000,
  gold: 347,
};

const INITIAL_STORY: string[] = [
  "The ancient ruins of **Eldrath** loom before you, their crumbling stones weathered by countless ages. A cold wind whispers through the broken archways, carrying with it the scent of decay and forgotten magic.",
  "",
  "Your torch flickers in the darkness, casting dancing shadows against walls inscribed with arcane symbols. The air itself seems to *hum with dormant power*.",
  "",
  "What will you do?",
];

const INITIAL_COMMANDS = [
  "Attack",
  "Investigate Symbols",
  "Cast Light Spell",
  "Search for Treasure",
  "Listen Carefully",
  "Rest",
  "Seek Quest",
  "Review Quests",
];

const DEFAULT_LOCATION = "Ruins of Eldrath";

const createInitialState = (): BaseRpgState => ({
  character: { ...DEFAULT_CHARACTER },
  location: DEFAULT_LOCATION,
  storyText: [...INITIAL_STORY],
  availableCommands: [...INITIAL_COMMANDS],
  inventory: [],
  quests: [],
  completedQuests: [],
  isCharacterCreated: false,
});

// Persisted state type (only what we save to localStorage)
interface PersistedRpgState {
  version: number;
  character: Character;
  location: string;
  storyText: string[];
  availableCommands: string[];
  inventory: Item[];
  quests: Quest[];
  completedQuests: Quest[];
  isCharacterCreated: boolean;
}

// Migration function for handling future schema changes
function migratePersistedState(
  persistedState: unknown,
  version: number
): PersistedRpgState | null {
  if (!persistedState || typeof persistedState !== "object") {
    debugLog("warn", "Invalid persisted state, resetting to initial state");
    return null;
  }

  const state = persistedState as Partial<PersistedRpgState>;

  // Version 1: Initial persistence format
  if (version === 1) {
    // Validate required fields exist
    if (
      state.character &&
      state.location &&
      Array.isArray(state.storyText) &&
      Array.isArray(state.availableCommands) &&
      Array.isArray(state.inventory) &&
      Array.isArray(state.quests) &&
      Array.isArray(state.completedQuests)
    ) {
      // Limit story text to last N lines to prevent localStorage bloat
      const limitedStoryText =
        state.storyText.length > MAX_STORY_TEXT_LINES
          ? state.storyText.slice(-MAX_STORY_TEXT_LINES)
          : state.storyText;

      return {
        version: RPG_STORAGE_VERSION,
        character: state.character,
        location: state.location,
        storyText: limitedStoryText,
        availableCommands: state.availableCommands,
        inventory: state.inventory,
        quests: state.quests,
        completedQuests: state.completedQuests.slice(-10), // Keep last 10 completed quests
        // If character exists, assume it was created (for backward compatibility)
        isCharacterCreated: state.isCharacterCreated ?? (state.character ? true : false),
      };
    }

    debugLog("warn", "Persisted state missing required fields, resetting");
    return null;
  }

  // Future migrations can be added here
  // Example for version 2:
  // if (version === 2) {
  //   // Migration logic for v2
  //   return { ...state, version: RPG_STORAGE_VERSION };
  // }

  debugLog("warn", `Unknown persisted state version ${version}, resetting`);
  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function applyCharacterDelta(character: Character, delta?: CharacterDelta) {
  if (!delta) {
    debugLog("info", "No character delta to apply");
    return character;
  }

  debugLog("info", "Applying character delta", {
    before: { hp: character.hp, mana: character.mana, xp: character.xp, gold: character.gold, level: character.level },
    delta,
  });

  const updated: Character = {
    ...character,
    hp: clamp(character.hp + (delta.hp ?? 0), 0, character.maxHp),
    mana: clamp(character.mana + (delta.mana ?? 0), 0, character.maxMana),
    xp: character.xp,
    xpToNextLevel: character.xpToNextLevel,
    gold: character.gold + (delta.gold ?? 0),
  };

  const levelBefore = updated.level;
  if (typeof delta.xp === "number" && delta.xp !== 0) {
    let accumulatedXp = updated.xp + delta.xp;
    let level = updated.level;
    let xpToNextLevel = updated.xpToNextLevel;
    let maxHp = updated.maxHp;
    let maxMana = updated.maxMana;
    let hp = updated.hp;
    let mana = updated.mana;

    while (accumulatedXp >= xpToNextLevel) {
      accumulatedXp -= xpToNextLevel;
      level += 1;
      xpToNextLevel = Math.round(xpToNextLevel * 1.2);
      maxHp += 5;
      maxMana += 5;
      hp = clamp(hp + 5, 0, maxHp);
      mana = clamp(mana + 5, 0, maxMana);
      debugLog("info", `Level up! Level ${level}`, {
        newMaxHp: maxHp,
        newMaxMana: maxMana,
        xpRemaining: accumulatedXp,
        xpToNext: xpToNextLevel,
      });
    }

    updated.level = level;
    updated.xpToNextLevel = xpToNextLevel;
    updated.maxHp = maxHp;
    updated.maxMana = maxMana;
    updated.hp = hp;
    updated.mana = mana;
    updated.xp = accumulatedXp;

    if (level > levelBefore) {
      debugLog("info", `Leveled up from ${levelBefore} to ${level}`);
    }
  }

  debugLog("info", "Character delta applied", {
    after: { hp: updated.hp, mana: updated.mana, xp: updated.xp, gold: updated.gold, level: updated.level },
    changes: {
      hp: updated.hp - character.hp,
      mana: updated.mana - character.mana,
      xp: updated.xp - character.xp,
      gold: updated.gold - character.gold,
      level: updated.level - character.level,
    },
  });

  return updated;
}

interface Resolution {
  narrative: string[];
  characterDelta?: CharacterDelta;
  locationChange?: string;
  unlockCommand?: string;
  items?: Item[];
  questUpdate?: QuestUpdate;
}

interface QuestUpdate {
  add?: Quest;
}

function ensureUnlockedCommands(commands: string[], unlockCommand?: string) {
  if (!unlockCommand) return commands;
  if (commands.includes(unlockCommand)) return commands;
  return [...commands, unlockCommand];
}

function applyResolution(state: BaseRpgState, label: string, resolution: Resolution): BaseRpgState {
  debugLog("action", `Resolving: "${label}"`, {
    resolution,
    currentLocation: state.location,
    currentCommands: state.availableCommands.length,
  });

  const narrative = resolution.narrative.length ? resolution.narrative : ["Nothing seems to happen..."];

  const locationChanged = resolution.locationChange && resolution.locationChange !== state.location;
  const commandsBefore = state.availableCommands.length;
  const newCommands = ensureUnlockedCommands(state.availableCommands, resolution.unlockCommand);
  const commandUnlocked = newCommands.length > commandsBefore;

  const newInventory = resolution.items
    ? [...state.inventory, ...resolution.items]
    : state.inventory;

  const updatedQuests = applyQuestUpdates(state.quests, resolution.questUpdate);

  const newState = {
    ...state,
    character: applyCharacterDelta(state.character, resolution.characterDelta),
    location: resolution.locationChange ?? state.location,
    storyText: [...state.storyText, "", `> ${label}`, ...narrative],
    availableCommands: newCommands,
    inventory: newInventory,
    quests: updatedQuests,
  };

  debugLog("info", `Resolution applied: "${label}"`, {
    locationChanged: locationChanged ? { from: state.location, to: newState.location } : false,
    commandUnlocked: commandUnlocked ? resolution.unlockCommand : false,
    newCommandCount: newState.availableCommands.length,
    narrativeLines: narrative.length,
    storyTextLength: newState.storyText.length,
    itemsAdded: resolution.items?.length || 0,
  });

  return newState;
}

function applyQuestUpdates(current: Quest[], questUpdate?: QuestUpdate) {
  if (!questUpdate?.add) {
    return current;
  }
  if (current.find((quest) => quest.id === questUpdate.add!.id)) {
    return current;
  }
  return [...current, questUpdate.add];
}

function applyQuestProgress(state: BaseRpgState, command: string): BaseRpgState {
  if (!state.quests.length) {
    return state;
  }

  const normalizedCommand = command.toLowerCase().trim();
  let progressMade = false;
  let character = state.character;
  let inventory = state.inventory;
  const updates: string[] = [];
  const newlyCompleted: Quest[] = [];

  const quests = state.quests.map((quest) => {
    if (quest.status !== "active") {
      return quest;
    }

    if (quest.objective.requiredCommand.toLowerCase() !== normalizedCommand) {
      return quest;
    }

    progressMade = true;
    const nextProgress = Math.min(quest.objective.targetCount, quest.objective.progress + 1);
    const updatedQuest: Quest = {
      ...quest,
      objective: { ...quest.objective, progress: nextProgress },
    };

    if (nextProgress >= quest.objective.targetCount) {
      updatedQuest.status = "completed";
      newlyCompleted.push(updatedQuest);
      updates.push(
        `Quest Complete: ${quest.title}! Rewarded +${quest.reward.xp} XP and +${quest.reward.gold} gold.`
      );
      character = applyCharacterDelta(character, { xp: quest.reward.xp, gold: quest.reward.gold });

      if (quest.reward.items?.length) {
        inventory = [...inventory, ...quest.reward.items];
        const itemNames = quest.reward.items.map((item) => item.name).join(", ");
        updates.push(`Quest Rewards: ${itemNames}`);
        inventoryDebug.log("info", "Quest reward items granted", {
          quest: quest.title,
          items: quest.reward.items.map((item) => ({ name: item.name, rarity: item.rarity })),
        });
      }
    } else {
      updates.push(`Quest Progress: ${quest.title} (${nextProgress}/${quest.objective.targetCount}).`);
    }

    return updatedQuest;
  });

  if (!progressMade) {
    return state;
  }

  const completedQuests =
    newlyCompleted.length > 0
      ? [
          ...state.completedQuests,
          ...newlyCompleted.filter(
            (quest) => !state.completedQuests.some((existing) => existing.id === quest.id)
          ),
        ]
      : state.completedQuests;

  return {
    ...state,
    quests,
    completedQuests,
    character,
    inventory,
    storyText: updates.length ? [...state.storyText, "", ...updates] : state.storyText,
  };
}

function resolveAction(action: string, state: BaseRpgState): Resolution {
  const normalized = action.toLowerCase();
  debugLog("info", `Resolving action: "${action}" (normalized: "${normalized}")`, {
    currentLocation: state.location,
    currentHp: state.character.hp,
    currentMana: state.character.mana,
  });

  let resolution: Resolution;
  switch (normalized) {
    case "explore":
      return {
        narrative: [
          "You edge deeper into the maze of shattered corridors. A dormant obelisk hums faintly as you pass.",
          "Strange glyphs glow for a moment, revealing a hidden inscription.",
        ],
        unlockCommand: "Translate Glyphs",
      };
    case "inventory":
      return {
        narrative: [
          "Your satchel rattles softly: a few enchanted shards, a single healing draught, and a worn charcoal sketch of the obelisk.",
        ],
      };
    case "stats":
      return {
        narrative: [
          `HP ${state.character.hp}/${state.character.maxHp} · Mana ${state.character.mana}/${state.character.maxMana} · XP ${state.character.xp}/${state.character.xpToNextLevel}`,
        ],
      };
    case "save":
      resolution = {
        narrative: ["You etch a protective rune into the stone, anchoring your presence should the abyss swallow you whole."],
      };
      break;
    default:
      debugLog("warn", `Unknown action: "${action}" (normalized: "${normalized}")`);
      resolution = { narrative: ["The darkness waits patiently for a clearer intention."] };
      break;
  }

  debugLog("info", `Action resolved: "${action}"`, resolution);
  return resolution;
}

function resolveCommand(command: string, state: BaseRpgState): Resolution {
  const normalized = command.toLowerCase().trim();
  debugLog("info", `Resolving command: "${command}" (normalized: "${normalized}")`);

  let resolution: Resolution;
  switch (normalized) {
    case "attack":
      const monster = generateMonster(state.character.level);
      const combatDesc = generateCombatDescription(monster, "victory");
      const xpReward = 50 + monster.level * 15;
      const manaCost = 5 + Math.floor(Math.random() * 5);
      return {
        narrative: [
          `A ${monster.name} appears from the shadows!`,
          combatDesc,
          `*+${xpReward} XP, -${manaCost} Mana*`,
        ],
        characterDelta: { xp: xpReward, mana: -manaCost },
      };
    case "investigate symbols":
      return {
        narrative: [
          "Tracing the glyphs reveals a hidden pattern – a **ritual map** showing a sealed chamber beneath the ruins.",
          "",
          "> *New command unlocked: Descend to the Chamber*",
        ],
        unlockCommand: "Descend to the Chamber",
      };
    case "cast light spell":
      return {
        narrative: [
          "**Azure light** pours from your hands, illuminating runes that were previously invisible.",
          "You glimpse a passage leading west. *-10 Mana*",
          "",
          "> *New command unlocked: Follow the Light*",
        ],
        characterDelta: { mana: -10 },
        unlockCommand: "Follow the Light",
      };
    case "search for treasure":
      try {
        const loot = generateLootTable("medium");
        const goldReward = loot.reduce((sum, item) => sum + item.value, 0) + Math.floor(Math.random() * 20);
        inventoryDebug.log("action", "Treasure search completed", {
          lootCount: loot.length,
          lootItems: loot.map((i) => ({ name: i.name, value: i.value })),
          goldReward,
        });
        return {
          narrative: [
            "Behind a collapsed column you uncover a pouch of tarnished coins and a shard humming with dormant energy.",
            ...(loot.length > 0 ? [`You found: ${loot.map((i) => i.name).join(", ")}`] : []),
          ],
          characterDelta: { gold: goldReward, xp: 50 },
          items: loot,
        };
      } catch (error) {
        debugLog("error", "Error in search for treasure", error);
        // Fallback if loot generation fails
        return {
          narrative: [
            "Behind a collapsed column you uncover a pouch of tarnished coins and a shard humming with dormant energy.",
          ],
          characterDelta: { gold: 20, xp: 50 },
          items: [],
        };
      }
    case "listen carefully":
      return {
        narrative: [
          "You close your eyes. Soft whispers bleed through the walls, urging you toward the heart of the ruins.",
        ],
        unlockCommand: "Follow the Whispers",
      };
    case "rest":
      return {
        narrative: ["You take a quiet moment to steady your breath. The ruins feel marginally less oppressive."],
        characterDelta: { hp: 15, mana: 10 },
      };
    case "translate glyphs":
      return {
        narrative: [
          "The glyphs resolve into a warning: 'The Abyss remembers every promise. Tread lightly.'",
        ],
        unlockCommand: "Scribe Protective Rune",
      };
    case "scribe protective rune":
      return {
        narrative: ["You inscribe a careful rune, weaving mana into the stone to shield your mind from invasive whispers."],
        characterDelta: { mana: -8, xp: 60 },
      };
    case "seek quest":
      return handleSeekQuest(state);
    case "review quests":
      return {
        narrative: formatQuestReview(state),
      };
    case "follow the light":
    case "follow the whispers":
    case "descend to the chamber":
      return {
        narrative: [
          "You commit to the path revealed by the ruins. The atmosphere shifts as the abyss acknowledges your resolve.",
        ],
        locationChange: "Lower Sanctum",
        unlockCommand: "Confront the Echo",
      };
    case "confront the echo":
      return {
        narrative: [
          "A towering echo of an ancient guardian manifests before you. The duel is swift but costly.",
          "You shatter the echo and claim a fragment of its essence.",
        ],
        characterDelta: { xp: 300, mana: -20 },
      };
    default:
      debugLog("warn", `Unknown command: "${command}" (normalized: "${normalized}")`);
      return {
        narrative: [`${command} is swallowed by the void. Perhaps try phrasing it differently.`],
      };
  }
}

function handleSeekQuest(state: BaseRpgState): Resolution {
  const activeQuestCount = getActiveQuestCount(state);

  if (activeQuestCount >= MAX_ACTIVE_QUESTS) {
    return {
      narrative: [
        "Your journal is crowded with unfinished vows. Complete an active quest before seeking another.",
      ],
    };
  }

  const npc = generateNPC({ ensureQuest: true });
  const baseQuest = npc.quest ?? generateQuest();
  const quest: Quest = {
    ...baseQuest,
    giver: `${npc.title} ${npc.name}`,
    status: "active",
    objective: { ...baseQuest.objective, progress: 0 },
  };

  return {
    narrative: [
      `You encounter ${npc.title} ${npc.name}.`,
      ...(npc.dialogue.length ? npc.dialogue : []),
      "",
      `Quest Accepted: **${quest.title}**`,
      quest.description,
      `Objective: ${quest.objective.summary}`,
      `Rewards: ${formatQuestReward(quest)}`,
    ],
    questUpdate: { add: quest },
  };
}

function formatQuestReview(state: BaseRpgState): string[] {
  const active = state.quests.filter((quest) => quest.status === "active");
  const completed = state.completedQuests;
  const summary: string[] = [];

  if (!active.length) {
    summary.push("You carry no active quests.");
  } else {
    summary.push("Active Quests:");
    active.forEach((quest) => {
      summary.push(
        `- ${quest.title} (${quest.objective.progress}/${quest.objective.targetCount})`
      );
      summary.push(`  Objective: ${quest.objective.summary}`);
    });
  }

  if (completed.length) {
    summary.push("", "Completed Quests:");
    completed
      .slice(-3)
      .forEach((quest) => summary.push(`- ${quest.title} (completed)`));
  }

  return summary.length ? summary : ["The abyss offers no guidance at this time."];
}

function formatQuestReward(quest: Quest): string {
  const base = `${quest.reward.xp} XP, ${quest.reward.gold} gold`;
  if (quest.reward.items?.length) {
    const items = quest.reward.items.map((item) => item.name).join(", ");
    return `${base}, ${items}`;
  }
  return base;
}

function getActiveQuestCount(state: BaseRpgState) {
  return state.quests.filter((quest) => quest.status === "active").length;
}

// Persist configuration: only save essential game state, not transient UI state
const persistConfig: PersistOptions<RpgStore, PersistedRpgState> = {
  name: RPG_STORAGE_KEY,
  version: RPG_STORAGE_VERSION,
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => {
    // Only persist essential game state, not actions/methods
    // Limit story text to prevent localStorage bloat
    const limitedStoryText =
      state.storyText.length > MAX_STORY_TEXT_LINES
        ? state.storyText.slice(-MAX_STORY_TEXT_LINES)
        : state.storyText;

    // Keep only last 10 completed quests
    const limitedCompletedQuests = state.completedQuests.slice(-10);

    return {
      version: RPG_STORAGE_VERSION,
      character: state.character,
      location: state.location,
      storyText: limitedStoryText,
      availableCommands: state.availableCommands,
      inventory: state.inventory,
      quests: state.quests,
      completedQuests: limitedCompletedQuests,
      isCharacterCreated: state.isCharacterCreated,
    };
  },
  migrate: (persistedState: unknown, version: number) => {
    const migrated = migratePersistedState(persistedState, version);
    if (migrated) {
      debugLog("info", `Migrated persisted state from version ${version} to ${RPG_STORAGE_VERSION}`);
      return migrated;
    }
    debugLog("info", "Migration failed or no saved state, using initial state");
    return null; // Return null to use initial state
  },
  merge: (persistedState: PersistedRpgState | null, currentState: RpgStore) => {
    if (!persistedState) {
      debugLog("info", "No persisted state found, using initial state");
      return currentState;
    }

    debugLog("info", "Restoring persisted state", {
      version: persistedState.version,
      characterLevel: persistedState.character?.level,
      location: persistedState.location,
      inventorySize: persistedState.inventory?.length,
      questCount: persistedState.quests?.length,
      storyTextLines: persistedState.storyText?.length,
    });

    // Merge persisted state with current state (keep actions/methods from current)
    return {
      ...currentState,
      character: persistedState.character || currentState.character,
      location: persistedState.location || currentState.location,
      storyText: persistedState.storyText || currentState.storyText,
      availableCommands: persistedState.availableCommands || currentState.availableCommands,
      inventory: persistedState.inventory || currentState.inventory,
      quests: persistedState.quests || currentState.quests,
      completedQuests: persistedState.completedQuests || currentState.completedQuests,
    };
  },
};

export const useRpgStore = create<RpgStore>()(
  persist<RpgStore, [], [], PersistedRpgState>(
    (set, get) => ({
      ...createInitialState(),
      performAction: (action: string) => {
    const startTime = performance.now();
    debugLog("action", `Performing action: "${action}"`);

    set((state) => {
      const newState = applyResolution(state, action, resolveAction(action, state));
      performanceTracker.track(`action:${action}`, startTime);
      debugLog("info", `State after action "${action}"`, {
        newLocation: newState.location,
        newHp: newState.character.hp,
        newMana: newState.character.mana,
        storyTextLength: newState.storyText.length,
        commandCount: newState.availableCommands.length,
      });
      return newState;
    });
  },
  submitCommand: (command: string) => {
    const startTime = performance.now();
    debugLog("action", `Submitting command: "${command}"`);

    set((state) => {
      let newState = applyResolution(state, command, resolveCommand(command, state));
      newState = applyQuestProgress(newState, command);
      performanceTracker.track(`command:${command}`, startTime);
      debugLog("info", `State after command "${command}"`, {
        newLocation: newState.location,
        newHp: newState.character.hp,
        newMana: newState.character.mana,
        storyTextLength: newState.storyText.length,
        commandCount: newState.availableCommands.length,
      });
      return newState;
    });
  },
  setLocation: (location: string) => {
    debugLog("action", `Setting location: "${location}"`);
    set((state) => {
      const newState = {
        ...state,
        location,
        storyText: [...state.storyText, "", `You travel toward ${location}.`],
      };
      debugLog("info", `Location changed`, {
        from: state.location,
        to: location,
        storyTextLength: newState.storyText.length,
      });
      return newState;
    });
  },
  addItem: (item: Item) => {
    const endTracking = performanceTracker.start("inventory.addItem");
    debugLog("action", `Adding item: "${item.name}"`);
    inventoryDebug.add(item);
    set((state) => {
      const newState = {
        ...state,
        inventory: [...state.inventory, item],
      };
      debugLog("info", `Item added`, {
        item: item.name,
        inventorySize: newState.inventory.length,
        totalValue: newState.inventory.reduce((sum, i) => sum + i.value, 0),
      });
      inventoryDebug.update(`Inventory updated: ${newState.inventory.length} items`, {
        added: item,
        totalItems: newState.inventory.length,
      });
      endTracking();
      return newState;
    });
  },
  removeItem: (item: Item) => {
    const endTracking = performanceTracker.start("inventory.removeItem");
    debugLog("action", `Removing item: "${item.name}"`);
    set((state) => {
      const itemIndex = state.inventory.findIndex(
        (i) => i === item || (i.name === item.name && i.type === item.type)
      );
      if (itemIndex === -1) {
        debugLog("warn", `Item not found in inventory: "${item.name}"`);
        inventoryDebug.log("warn", `Item not found: ${item.name}`, item);
        endTracking();
        return state;
      }
      const removedItem = state.inventory[itemIndex];
      const newState = {
        ...state,
        inventory: state.inventory.filter((_, index) => index !== itemIndex),
      };
      debugLog("info", `Item removed`, {
        item: item.name,
        inventorySize: newState.inventory.length,
      });
      inventoryDebug.remove(removedItem);
      inventoryDebug.update(`Inventory updated: ${newState.inventory.length} items`, {
        removed: removedItem,
        totalItems: newState.inventory.length,
      });
      endTracking();
      return newState;
    });
  },
  setCharacterAvatar: (avatarConfig: AvatarConfig | null) => {
    debugLog("action", `Setting character avatar`, { hasConfig: !!avatarConfig });
    set((state) => ({
      ...state,
      character: {
        ...state.character,
        avatarConfig: avatarConfig || undefined,
      },
    }));
  },
  setCharacterSpriteType: (spriteType: CharacterType) => {
    debugLog("action", `Setting character sprite type`, { spriteType });
    set((state) => ({
      ...state,
      character: {
        ...state.character,
        spriteType,
      },
    }));
  },
  initializeCharacter: (name: string, characterClass?: string) => {
    debugLog("action", `Initializing character`, { name, characterClass });
    
    // Character class stat modifiers
    const classStats: Record<string, Partial<Character>> = {
      warrior: {
        hp: 120,
        maxHp: 120,
        mana: 30,
        maxMana: 50,
      },
      mage: {
        hp: 60,
        maxHp: 80,
        mana: 100,
        maxMana: 120,
      },
      rogue: {
        hp: 80,
        maxHp: 100,
        mana: 50,
        maxMana: 70,
      },
      paladin: {
        hp: 100,
        maxHp: 110,
        mana: 60,
        maxMana: 80,
      },
    };

    const baseStats = characterClass && classStats[characterClass.toLowerCase()]
      ? classStats[characterClass.toLowerCase()]
      : {
          hp: 75,
          maxHp: 100,
          mana: 40,
          maxMana: 80,
        };

    set((state) => {
      const newCharacter: Character = {
        ...DEFAULT_CHARACTER,
        name: name.trim() || "Wanderer",
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        gold: 50,
        ...baseStats,
      };

      const newState = {
        ...state,
        character: newCharacter,
        isCharacterCreated: true,
        storyText: [
          `Welcome, **${newCharacter.name}**!`,
          "",
          "You stand at the edge of the ancient ruins of **Eldrath**, their crumbling stones weathered by countless ages. A cold wind whispers through the broken archways, carrying with it the scent of decay and forgotten magic.",
          "",
          "Your journey begins here. What will you do?",
        ],
      };

      debugLog("info", "Character initialized", {
        name: newCharacter.name,
        class: characterClass,
        stats: {
          hp: newCharacter.hp,
          maxHp: newCharacter.maxHp,
          mana: newCharacter.mana,
          maxMana: newCharacter.maxMana,
        },
      });

      return newState;
    });
  },
  reset: () => {
    debugLog("action", "Resetting game state");
    const newState = createInitialState();
    set(newState);
    performanceTracker.clear();
    
    // Clear persisted state from localStorage
    try {
      localStorage.removeItem(RPG_STORAGE_KEY);
      debugLog("info", "Persisted state cleared from localStorage");
    } catch (error) {
      debugLog("error", "Failed to clear persisted state", error);
    }
    
    debugLog("info", "Game state reset", {
      location: newState.location,
      character: newState.character,
      storyTextLength: newState.storyText.length,
      commandCount: newState.availableCommands.length,
      isCharacterCreated: newState.isCharacterCreated,
    });
  },
    }),
    persistConfig
  )
);

/**
 * Zustand does not require React context providers, but we still export these to
 * keep the previous public surface area stable for future integrations.
 * 
 * Note: These exports are marked for Fast Refresh compatibility.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function RpgProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRpg() {
  const baseState = useRpgStore((state) => ({
    character: state.character,
    location: state.location,
    storyText: state.storyText,
    availableCommands: state.availableCommands,
  }));
  return {
    gameState: baseState,
    setGameState: (nextState: BaseRpgState) =>
      useRpgStore.setState((prev) => ({
        ...prev,
        character: nextState.character,
        location: nextState.location,
        storyText: nextState.storyText,
        availableCommands: nextState.availableCommands,
      })),
  };
}

// Debug utilities exposed to window object for console access
if (typeof window !== "undefined" && DEBUG_RPG) {
  (window as any).__RPG_DEBUG__ = {
    // Get current state
    getState: () => useRpgStore.getState(),

    // Get character stats
    getCharacter: () => useRpgStore.getState().character,

    // Get location
    getLocation: () => useRpgStore.getState().location,

    // Get available commands
    getCommands: () => useRpgStore.getState().availableCommands,

    // Get story text
    getStory: () => useRpgStore.getState().storyText,

    // Get quests
    getQuests: () => ({
      active: useRpgStore.getState().quests,
      completed: useRpgStore.getState().completedQuests,
    }),

    // Performance stats
    getPerformanceStats: () => performanceTracker.getStats(),

    // Clear performance tracker
    clearPerformance: () => performanceTracker.clear(),

    // Reset game state
    reset: () => useRpgStore.getState().reset(),

    // Perform action (for testing)
    performAction: (action: string) => {
      debugLog("action", `Debug: Performing action "${action}"`);
      useRpgStore.getState().performAction(action);
    },

    // Submit command (for testing)
    submitCommand: (command: string) => {
      debugLog("action", `Debug: Submitting command "${command}"`);
      useRpgStore.getState().submitCommand(command);
    },

    // Set character stats (for testing)
    setCharacter: (updates: Partial<Character>) => {
      const current = useRpgStore.getState().character;
      useRpgStore.setState({
        character: { ...current, ...updates },
      });
      debugLog("info", "Character updated via debug", { before: current, after: { ...current, ...updates } });
    },

    // Set location (for testing)
    setLocation: (location: string) => {
      debugLog("action", `Debug: Setting location to "${location}"`);
      useRpgStore.getState().setLocation(location);
    },

    // Log current state snapshot
    logState: () => {
      const state = useRpgStore.getState();
      console.log("[RPG Debug] Current State:", {
        character: state.character,
        location: state.location,
        storyText: state.storyText,
        availableCommands: state.availableCommands,
      });
    },

    // Subscribe to state changes
    subscribe: (callback: (state: RpgStore) => void) => {
      return useRpgStore.subscribe(callback);
    },

    // Persistence utilities
    clearPersistence: () => {
      try {
        localStorage.removeItem(RPG_STORAGE_KEY);
        debugLog("info", "Persisted state cleared from localStorage");
        console.log("[RPG Debug] Persisted state cleared. Refresh to see initial state.");
      } catch (error) {
        debugLog("error", "Failed to clear persisted state", error);
      }
    },

    getPersistenceInfo: () => {
      try {
        const stored = localStorage.getItem(RPG_STORAGE_KEY);
        if (!stored) {
          return { exists: false, message: "No persisted state found" };
        }
        const data = JSON.parse(stored);
        return {
          exists: true,
          version: data.state?.version || "unknown",
          storageKey: RPG_STORAGE_KEY,
          size: new Blob([stored]).size,
          sizeKB: (new Blob([stored]).size / 1024).toFixed(2),
        };
      } catch (error) {
        return {
          exists: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    // Help message
    help: () => {
      console.log(
        `%c[RPG Debug Utilities]%c
Available commands:
  __RPG_DEBUG__.getState()              - Get current game state
  __RPG_DEBUG__.getCharacter()          - Get character stats
  __RPG_DEBUG__.getLocation()           - Get current location
  __RPG_DEBUG__.getCommands()           - Get available commands
  __RPG_DEBUG__.getStory()              - Get story text array
  __RPG_DEBUG__.getPerformanceStats()   - Get performance statistics
  __RPG_DEBUG__.clearPerformance()      - Clear performance tracker
  __RPG_DEBUG__.reset()                 - Reset game state
  __RPG_DEBUG__.performAction(action)   - Perform an action
  __RPG_DEBUG__.submitCommand(cmd)      - Submit a command
  __RPG_DEBUG__.setCharacter({...})     - Update character stats
  __RPG_DEBUG__.setLocation(location)   - Set location
  __RPG_DEBUG__.logState()              - Log current state snapshot
  __RPG_DEBUG__.subscribe(callback)     - Subscribe to state changes
  __RPG_DEBUG__.clearPersistence()      - Clear persisted state from localStorage
  __RPG_DEBUG__.getPersistenceInfo()    - Get persistence information
  __RPG_DEBUG__.help()                  - Show this help message

Example:
  __RPG_DEBUG__.performAction("explore")
  __RPG_DEBUG__.submitCommand("attack")
  __RPG_DEBUG__.setCharacter({ hp: 100, mana: 80 })
  __RPG_DEBUG__.logState()
`,
        "color: #45b355; font-weight: bold; font-size: 14px;",
        "color: #999; font-size: 12px;"
      );
    },
  };

  console.log(
    "%c[RPG Debug]%c Debug utilities loaded. Type __RPG_DEBUG__.help() for available commands.",
    "color: #45b355; font-weight: bold;",
    "color: #999;"
  );
}
