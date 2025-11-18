const normalizedFlags = new Set(
  (import.meta.env.VITE_FEATURE_FLAGS ?? "")
    .split(",")
    .map((flag) => flag.trim())
    .filter(Boolean)
);

const environment = import.meta.env.MODE ?? "development";

export type TargetingRule = string;

export function isFeatureEnabled(flag: string) {
  if (!flag) return true;
  return normalizedFlags.has(flag);
}

export function matchesTargeting(rules: TargetingRule[], { geography, cohort }: { geography?: string; cohort?: string } = {}) {
  if (!rules.length) return true;
  return rules.every((rule) => {
    if (rule === "public") return true;
    if (rule === "internal") return environment !== "production";
    if (rule.startsWith("geo:")) {
      return geography ? rule === `geo:${geography}` : false;
    }
    if (rule.startsWith("cohort:")) {
      return cohort ? rule === `cohort:${cohort}` : false;
    }
    if (rule.startsWith("environment:")) {
      return rule === `environment:${environment}`;
    }
    return normalizedFlags.has(rule);
  });
}
