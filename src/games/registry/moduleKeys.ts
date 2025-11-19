function normalizePath(filePath: string) {
  return filePath.replace(/\\/g, "/");
}

export function extractGameId(filePath: string): string | undefined {
  const normalized = normalizePath(filePath);
  const segments = normalized.split("/").filter((segment) => segment.length > 0);

  const gamesIndex = segments.lastIndexOf("games");
  if (gamesIndex !== -1 && gamesIndex + 1 < segments.length) {
    const candidate = segments[gamesIndex + 1];
    if (candidate !== "registry") return candidate;
  }

  const parentIndex = segments.lastIndexOf("..");
  if (parentIndex !== -1 && parentIndex + 1 < segments.length) {
    const candidate = segments[parentIndex + 1];
    if (candidate !== "registry") return candidate;
  }

  return undefined;
}

export function getFileExtension(filePath: string): string | undefined {
  const normalized = normalizePath(filePath);
  const lastSegment = normalized.split("/").pop();
  if (!lastSegment) return undefined;
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === lastSegment.length - 1) return undefined;
  return lastSegment.slice(dotIndex + 1);
}

type RegistryKeyOptions = {
  resource?: string;
  extension?: string;
};

export function createRegistryKeyVariants(gameId: string, options?: RegistryKeyOptions) {
  const suffixes = buildSuffixes(options);
  const variants = new Set<string>();

  for (const suffix of suffixes) {
    variants.add(`${gameId}${suffix}`);
    variants.add(`@/games/${gameId}${suffix}`);
  }

  return Array.from(variants);
}

function buildSuffixes(options?: RegistryKeyOptions) {
  if (!options?.resource) return [""];
  const resourceSegment = `/${options.resource}`;
  if (!options.extension) return [resourceSegment];

  const normalizedExtension = options.extension.startsWith(".") ? options.extension : `.${options.extension}`;
  return [resourceSegment, `${resourceSegment}${normalizedExtension}`];
}

