function normalizeUrl(url?: string) {
  if (!url) return url;
  return url.replace(/\/$/, "");
}

function trimSlashes(path: string) {
  return path.replace(/^\/+|\/+$/g, "");
}

function joinPaths(...parts: string[]) {
  const filtered = parts.filter(Boolean).map(trimSlashes);
  if (filtered.length === 0) return "";
  return `/${filtered.join("/")}`;
}

const fallbackOrigin = "http://localhost:3001";

export const API_BASE_URL = normalizeUrl(import.meta.env.VITE_API_BASE_URL) || fallbackOrigin;
export const API_VERSION_PATH = import.meta.env.VITE_API_VERSION_PATH || "/api/v1";
export const PAINT_AND_GUESS_BASE_PATH =
  import.meta.env.VITE_PAINT_AND_GUESS_BASE_PATH || "/paint-and-guess";
export const SOCKET_URL = normalizeUrl(import.meta.env.VITE_SOCKET_URL) || API_BASE_URL;

export function apiPath(path: string) {
  return `${API_BASE_URL}${joinPaths(API_VERSION_PATH, path)}`;
}

export function paintAndGuessApiPath(path: string) {
  return `${API_BASE_URL}${joinPaths(API_VERSION_PATH, PAINT_AND_GUESS_BASE_PATH, path)}`;
}

