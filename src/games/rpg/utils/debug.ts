// Debug utilities - stubbed out (all debug functionality removed)

type DebugLevel = "info" | "warn" | "error" | "action" | "success";

// No-op debug logger
class DebugLogger {
  log(_level: DebugLevel, _category: string, _message: string, _data?: unknown) {
    // No-op
  }
  getLogs(_category?: string, _level?: DebugLevel, _limit?: number) {
    return [];
  }
  getStats() {
    return { total: 0, byCategory: {}, byLevel: {}, categories: [], recent: [] };
  }
  clear() {
    // No-op
  }
  export() {
    return { config: {}, stats: this.getStats(), logs: [], exportedAt: new Date().toISOString() };
  }
}

export const debugLogger = new DebugLogger();

// No-op category-specific loggers
export const contentDebug = {
  log: (_level: DebugLevel, _message: string, _data?: unknown) => {
    // No-op
  },
  generate: (_type: string, _result: unknown) => {
    // No-op
  },
  error: (_message: string, _error: unknown) => {
    // No-op
  },
};

export const inventoryDebug = {
  log: (_level: DebugLevel, _message: string, _data?: unknown) => {
    // No-op
  },
  add: (_item: unknown) => {
    // No-op
  },
  remove: (_item: unknown) => {
    // No-op
  },
  update: (_message: string, _data?: unknown) => {
    // No-op
  },
};

export const animationDebug = {
  log: (_level: DebugLevel, _message: string, _data?: unknown) => {
    // No-op
  },
  start: (_component: string, _animation: string) => {
    // No-op
  },
  complete: (_component: string, _animation: string, _duration?: number) => {
    // No-op
  },
  error: (_component: string, _animation: string, _error: unknown) => {
    // No-op
  },
};

// Performance tracking (stub - keeps API but no tracking)
class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();

  start(_label: string): () => void {
    return () => {
      // No-op
    };
  }

  getStats(_label?: string) {
    return null;
  }

  clear(_label?: string) {
    // No-op
  }
}

export const performanceTracker = new PerformanceTracker();
