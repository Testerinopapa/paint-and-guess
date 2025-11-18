type FlagRecord = Record<string, boolean>;

const metaEnv = typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }) : undefined;
const DEBUG = Boolean(metaEnv?.env?.DEV || metaEnv?.env?.MODE === "development");

function debugLog(message: string, ...args: unknown[]) {
  if (DEBUG) {
    console.debug(`[FeatureFlags] ${message}`, ...args);
  }
}

const defaultFlags: FlagRecord = {
  "games.paintAndGuess": true,
  "games.mysteryMashup": false,
  "games.triviaTrails": false,
  "ui.experimentalHub": false,
};

const runtimeOverrides = new Map<string, boolean>();

function parseEnvOverrides(): FlagRecord {
  const envValue = import.meta.env?.VITE_FEATURE_FLAGS;
  if (!envValue || typeof envValue !== "string") {
    debugLog("No VITE_FEATURE_FLAGS environment variable found");
    return {};
  }

  debugLog("Parsing VITE_FEATURE_FLAGS", { rawValue: envValue });
  const parsed = envValue.split(",").reduce<FlagRecord>((acc, entry) => {
    const trimmed = entry.trim();
    if (!trimmed) return acc;

    const [flag, rawValue] = trimmed.split("=");
    if (!flag) return acc;

    const normalizedValue = rawValue?.toLowerCase();
    const enabled = normalizedValue === "true" || normalizedValue === "1" || normalizedValue === undefined;
    acc[flag] = enabled;
    debugLog("Parsed feature flag from env", { flag, rawValue, enabled });
    return acc;
  }, {});
  
  debugLog("Environment overrides parsed", { count: Object.keys(parsed).length, flags: Object.keys(parsed) });
  return parsed;
}

const envOverrides = parseEnvOverrides();

if (DEBUG) {
  debugLog("Feature flags initialized", {
    defaultFlags: Object.keys(defaultFlags),
    envOverrides: Object.keys(envOverrides),
    runtimeOverrides: Array.from(runtimeOverrides.keys()),
  });
}

export function getFeatureFlagsSnapshot(): FlagRecord {
  return {
    ...defaultFlags,
    ...envOverrides,
    ...Object.fromEntries(runtimeOverrides.entries()),
  };
}

export function isFeatureEnabled(flag: string, fallback = false): boolean {
  let value: boolean;
  let source: string;

  if (runtimeOverrides.has(flag)) {
    value = Boolean(runtimeOverrides.get(flag));
    source = "runtime";
  } else if (flag in envOverrides) {
    value = envOverrides[flag];
    source = "environment";
  } else if (flag in defaultFlags) {
    value = defaultFlags[flag];
    source = "default";
  } else {
    value = fallback;
    source = "fallback";
  }

  debugLog(`isFeatureEnabled(${flag})`, {
    flag,
    enabled: value,
    source,
    fallback,
  });

  return value;
}

export function setFeatureFlag(flag: string, value: boolean) {
  debugLog(`setFeatureFlag(${flag}, ${value})`, { flag, value, previous: runtimeOverrides.get(flag) });
  runtimeOverrides.set(flag, value);
}

export function enableFeatureFlag(flag: string) {
  debugLog(`enableFeatureFlag(${flag})`);
  setFeatureFlag(flag, true);
}

export function disableFeatureFlag(flag: string) {
  debugLog(`disableFeatureFlag(${flag})`);
  setFeatureFlag(flag, false);
}

