import type { AIConfig } from "../state/types";

export type Side = "white" | "black";

export type OpponentKind = "human" | "engine" | "enginevengine";

export interface OpponentPolicy {
  shouldEngineMove(params: { turn: Side; playerColor: Side; movesCount: number }): boolean;
}

// Re-export AIConfig type for convenience
export type { AIConfig };

