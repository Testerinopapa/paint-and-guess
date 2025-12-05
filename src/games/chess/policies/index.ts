import { makeOpponentPolicy } from "./opponent";
import type { AIConfig } from "./types";

export type PolicyConfig = {
  aiConfig: AIConfig;
};

export function composePolicies(cfg: PolicyConfig) {
  const opponent = makeOpponentPolicy(cfg.aiConfig);
  return { opponent };
}

