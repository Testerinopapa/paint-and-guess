import { ReactNode } from "react";
import { create } from "zustand";
import { generateMonster, generateCombatDescription, generateLootTable, generateItem, Item } from "../utils/contentGenerator";
import { inventoryDebug, performanceTracker } from "../utils/debug";

// Debug configuration
const DEBUG_RPG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_RPG === "true";
const DEBUG_LOG_PREFIX = "[RPG Store]";

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
}

type CharacterDelta = Partial<Pick<Character, "hp" | "mana" | "xp" | "gold">>;

export interface BaseRpgState {
  character: Character;
  location: string;
  storyText: string[];
  availableCommands: string[];
  inventory: Item[];
}

interface RpgStore extends BaseRpgState {
  performAction: (action: string) => void;
  submitCommand: (command: string) => void;
  setLocation: (location: string) => void;
  addItem: (item: Item) => void;
  removeItem: (item: Item) => void;
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

const INITIAL_COMMANDS = ["Attack", "Investigate Symbols", "Cast Light Spell", "Search for Treasure", "Listen Carefully", "Rest"];

const DEFAULT_LOCATION = "Ruins of Eldrath";

const createInitialState = (): BaseRpgState => ({
  character: { ...DEFAULT_CHARACTER },
  location: DEFAULT_LOCATION,
  storyText: [...INITIAL_STORY],
  availableCommands: [...INITIAL_COMMANDS],
  inventory: [],
});

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

  const newState = {
    character: applyCharacterDelta(state.character, resolution.characterDelta),
    location: resolution.locationChange ?? state.location,
    storyText: [...state.storyText, "", `> ${label}`, ...narrative],
    availableCommands: newCommands,
    inventory: newInventory,
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

function resolveCommand(command: string): Resolution {
  const normalized = command.toLowerCase();
  debugLog("info", `Resolving command: "${command}" (normalized: "${normalized}")`);

  let resolution: Resolution;
  switch (normalized) {
    case "attack":
      const monster = generateMonster(get().character.level);
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
      const endLootTracking = performanceTracker.start("command.searchForTreasure");
      const loot = generateLootTable("medium");
      const goldReward = loot.reduce((sum, item) => sum + item.value, 0) + Math.floor(Math.random() * 20);
      endLootTracking();
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

export const useRpgStore = create<RpgStore>((set, get) => ({
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
      const newState = applyResolution(state, command, resolveCommand(command));
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
  reset: () => {
    debugLog("action", "Resetting game state");
    const newState = createInitialState();
    set(newState);
    performanceTracker.clear();
    debugLog("info", "Game state reset", {
      location: newState.location,
      character: newState.character,
      storyTextLength: newState.storyText.length,
      commandCount: newState.availableCommands.length,
    });
  },
}));

/**
 * Zustand does not require React context providers, but we still export these to
 * keep the previous public surface area stable for future integrations.
 */
export function RpgProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

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
