// Centralized debug utilities for RPG game integration

const DEBUG_RPG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_RPG === "true";
const DEBUG_CONTENT = import.meta.env.DEV || import.meta.env.VITE_DEBUG_CONTENT === "true";
const DEBUG_INVENTORY = import.meta.env.DEV || import.meta.env.VITE_DEBUG_INVENTORY === "true";
const DEBUG_ANIMATIONS = import.meta.env.DEV || import.meta.env.VITE_DEBUG_ANIMATIONS === "true";

export const DEBUG_CONFIG = {
  rpg: DEBUG_RPG,
  content: DEBUG_CONTENT,
  inventory: DEBUG_INVENTORY,
  animations: DEBUG_ANIMATIONS,
};

type DebugLevel = "info" | "warn" | "error" | "action" | "success";

interface DebugLog {
  timestamp: number;
  level: DebugLevel;
  category: string;
  message: string;
  data?: unknown;
}

class DebugLogger {
  private logs: DebugLog[] = [];
  private maxLogs = 1000;
  private categories: Set<string> = new Set();

  log(level: DebugLevel, category: string, message: string, data?: unknown) {
    const log: DebugLog = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(log);
    this.categories.add(category);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console based on level
    const prefix = `[RPG:${category}]`;
    const timestamp = new Date(log.timestamp).toISOString();

    switch (level) {
      case "info":
        if (DEBUG_RPG) {
          console.log(`%c${prefix}%c [${timestamp}] ${message}`, "color: #3b82f6; font-weight: bold", "color: #999", data || "");
        }
        break;
      case "warn":
        console.warn(`%c${prefix}%c [${timestamp}] ${message}`, "color: #f59e0b; font-weight: bold", "color: #999", data || "");
        break;
      case "error":
        console.error(`%c${prefix}%c [${timestamp}] ${message}`, "color: #ef4444; font-weight: bold", "color: #999", data || "");
        break;
      case "action":
        if (DEBUG_RPG) {
          console.groupCollapsed(`%c${prefix}%c [${timestamp}] ${message}`, "color: #10b981; font-weight: bold", "color: #999");
          if (data) console.log(data);
          console.groupEnd();
        }
        break;
      case "success":
        if (DEBUG_RPG) {
          console.log(`%c${prefix}%c [${timestamp}] ${message}`, "color: #10b981; font-weight: bold", "color: #999", data || "");
        }
        break;
    }
  }

  getLogs(category?: string, level?: DebugLevel, limit?: number): DebugLog[] {
    let filtered = this.logs;

    if (category) {
      filtered = filtered.filter((log) => log.category === category);
    }

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  getStats() {
    const byCategory = new Map<string, number>();
    const byLevel = new Map<DebugLevel, number>();

    this.logs.forEach((log) => {
      byCategory.set(log.category, (byCategory.get(log.category) || 0) + 1);
      byLevel.set(log.level, (byLevel.get(log.level) || 0) + 1);
    });

    return {
      total: this.logs.length,
      byCategory: Object.fromEntries(byCategory),
      byLevel: Object.fromEntries(byLevel),
      categories: Array.from(this.categories),
      recent: this.logs.slice(-10),
    };
  }

  clear() {
    this.logs = [];
    this.categories.clear();
  }

  export() {
    return {
      config: DEBUG_CONFIG,
      stats: this.getStats(),
      logs: this.logs,
      exportedAt: new Date().toISOString(),
    };
  }
}

export const debugLogger = new DebugLogger();

// Category-specific loggers
export const contentDebug = {
  log: (level: DebugLevel, message: string, data?: unknown) => {
    if (DEBUG_CONTENT || DEBUG_RPG) {
      debugLogger.log(level, "Content", message, data);
    }
  },
  generate: (type: string, result: unknown) => {
    contentDebug.log("action", `Generated ${type}`, result);
  },
  error: (message: string, error: unknown) => {
    contentDebug.log("error", message, error);
  },
};

export const inventoryDebug = {
  log: (level: DebugLevel, message: string, data?: unknown) => {
    if (DEBUG_INVENTORY || DEBUG_RPG) {
      debugLogger.log(level, "Inventory", message, data);
    }
  },
  add: (item: unknown) => {
    inventoryDebug.log("action", "Item added", item);
  },
  remove: (item: unknown) => {
    inventoryDebug.log("action", "Item removed", item);
  },
  update: (message: string, data?: unknown) => {
    inventoryDebug.log("info", message, data);
  },
};

export const animationDebug = {
  log: (level: DebugLevel, message: string, data?: unknown) => {
    if (DEBUG_ANIMATIONS || DEBUG_RPG) {
      debugLogger.log(level, "Animation", message, data);
    }
  },
  start: (component: string, animation: string) => {
    animationDebug.log("action", `${component}: ${animation} started`);
  },
  complete: (component: string, animation: string, duration?: number) => {
    animationDebug.log("success", `${component}: ${animation} completed`, { duration });
  },
  error: (component: string, animation: string, error: unknown) => {
    animationDebug.log("error", `${component}: ${animation} failed`, error);
  },
};

// Performance tracking
class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();

  start(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      const times = this.metrics.get(label) || [];
      times.push(duration);
      this.metrics.set(label, times);

      if (DEBUG_RPG) {
        debugLogger.log("info", "Performance", `${label}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  getStats(label?: string) {
    if (label) {
      const times = this.metrics.get(label) || [];
      if (times.length === 0) return null;

      return {
        label,
        count: times.length,
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        total: times.reduce((a, b) => a + b, 0),
      };
    }

    const stats: Record<string, any> = {};
    this.metrics.forEach((times, label) => {
      stats[label] = {
        count: times.length,
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        total: times.reduce((a, b) => a + b, 0),
      };
    });

    return stats;
  }

  clear(label?: string) {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
    }
  }
}

export const performanceTracker = new PerformanceTracker();

// Expose debug utilities to window in development
if (typeof window !== "undefined" && DEBUG_RPG) {
  (window as any).__RPG_DEBUG_INTEGRATION__ = {
    // Logger utilities
    logs: {
      getAll: (category?: string, level?: DebugLevel, limit?: number) =>
        debugLogger.getLogs(category, level, limit),
      getStats: () => debugLogger.getStats(),
      clear: () => debugLogger.clear(),
      export: () => debugLogger.export(),
    },

    // Content generation debug
    content: {
      generateNPC: async () => {
        const { generateNPC } = await import("./contentGenerator");
        const npc = generateNPC();
        contentDebug.generate("NPC", npc);
        return npc;
      },
      generateItem: async () => {
        const { generateItem } = await import("./contentGenerator");
        const item = generateItem();
        contentDebug.generate("Item", item);
        return item;
      },
      generateMonster: async (level?: number) => {
        const { generateMonster } = await import("./contentGenerator");
        const monster = generateMonster(level);
        contentDebug.generate("Monster", monster);
        return monster;
      },
      generateLocation: async () => {
        const { generateLocation } = await import("./contentGenerator");
        const location = generateLocation();
        contentDebug.generate("Location", location);
        return location;
      },
      generateLootTable: async (difficulty?: "low" | "medium" | "high") => {
        const { generateLootTable } = await import("./contentGenerator");
        const loot = generateLootTable(difficulty);
        contentDebug.generate("Loot Table", loot);
        return loot;
      },
    },

    // Inventory debug
    inventory: {
      getItems: async () => {
        const { useRpgStore } = await import("../state/useRpgStore");
        return useRpgStore.getState().inventory;
      },
      addItem: async (item?: any) => {
        const { useRpgStore } = await import("../state/useRpgStore");
        const { generateItem } = await import("./contentGenerator");
        const newItem = item || generateItem();
        useRpgStore.getState().addItem(newItem);
        inventoryDebug.add(newItem);
        return newItem;
      },
      removeItem: async (item: any) => {
        const { useRpgStore } = await import("../state/useRpgStore");
        useRpgStore.getState().removeItem(item);
        inventoryDebug.remove(item);
      },
      clear: async () => {
        const { useRpgStore } = await import("../state/useRpgStore");
        const state = useRpgStore.getState();
        state.inventory.forEach((item) => state.removeItem(item));
        inventoryDebug.log("action", "Inventory cleared");
      },
    },

    // Performance tracking
    performance: {
      getStats: (label?: string) => performanceTracker.getStats(label),
      clear: (label?: string) => performanceTracker.clear(label),
    },

    // Config
    config: DEBUG_CONFIG,

    // Help
    help: () => {
      console.log(
        `%c[RPG Integration Debug Utilities]%c

Available commands:

%cLogger:%
  __RPG_DEBUG_INTEGRATION__.logs.getAll(category?, level?, limit?)
  __RPG_DEBUG_INTEGRATION__.logs.getStats()
  __RPG_DEBUG_INTEGRATION__.logs.clear()
  __RPG_DEBUG_INTEGRATION__.logs.export()

%cContent Generation:%
  __RPG_DEBUG_INTEGRATION__.content.generateNPC()
  __RPG_DEBUG_INTEGRATION__.content.generateItem()
  __RPG_DEBUG_INTEGRATION__.content.generateMonster(level?)
  __RPG_DEBUG_INTEGRATION__.content.generateLocation()
  __RPG_DEBUG_INTEGRATION__.content.generateLootTable(difficulty?)

%cInventory:%
  __RPG_DEBUG_INTEGRATION__.inventory.getItems()
  __RPG_DEBUG_INTEGRATION__.inventory.addItem(item?)
  __RPG_DEBUG_INTEGRATION__.inventory.removeItem(item)
  __RPG_DEBUG_INTEGRATION__.inventory.clear()

%cPerformance:%
  __RPG_DEBUG_INTEGRATION__.performance.getStats(label?)
  __RPG_DEBUG_INTEGRATION__.performance.clear(label?)

%cConfig:%
  __RPG_DEBUG_INTEGRATION__.config

%cExamples:%
  __RPG_DEBUG_INTEGRATION__.content.generateItem()
  __RPG_DEBUG_INTEGRATION__.inventory.addItem()
  __RPG_DEBUG_INTEGRATION__.logs.getStats()
  __RPG_DEBUG_INTEGRATION__.logs.export()
`,
        "color: #10b981; font-weight: bold; font-size: 16px;",
        "color: #999; font-size: 12px;",
        "color: #3b82f6; font-weight: bold;",
        "color: #f59e0b; font-weight: bold;",
        "color: #8b5cf6; font-weight: bold;",
        "color: #ef4444; font-weight: bold;",
        "color: #6366f1; font-weight: bold;",
        "color: #10b981; font-weight: bold;"
      );
    },
  };

  console.log(
    "%c[RPG Integration Debug]%c Debug utilities loaded. Type __RPG_DEBUG_INTEGRATION__.help() for available commands.",
    "color: #10b981; font-weight: bold;",
    "color: #999;"
  );
}

