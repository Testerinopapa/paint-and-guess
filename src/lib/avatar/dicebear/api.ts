/**
 * DiceBear API Client Utility
 * 
 * Provides functions to generate DiceBear avatar URLs from AvatarConfig.
 * Supports both local API server and hosted API.
 * 
 * @module avatar/dicebear/api
 */

import { AvatarConfig } from "@/lib/avatar/config";
import { avatarConfigToDiceBearOptions } from "./mapper";

/**
 * Get the base URL for the DiceBear API
 * 
 * Defaults to hosted API, but can be overridden with environment variable
 * for local development or self-hosted instances.
 */
function getApiBaseUrl(): string {
  // Check for environment variable first (for local API server)
  if (import.meta.env.VITE_DICEBEAR_API_URL) {
    return import.meta.env.VITE_DICEBEAR_API_URL;
  }
  
  // Default to hosted API
  return "https://api.dicebear.com";
}

/**
 * Build query string from DiceBear options
 */
function buildQueryString(options: Record<string, any>): string {
  const params = new URLSearchParams();
  
  // Add seed
  if (options.seed) {
    params.append("seed", options.seed);
  }
  
  // Add all style options (arrays are joined with commas)
  Object.entries(options).forEach(([key, value]) => {
    if (key === "seed") return; // Already handled
    
    if (Array.isArray(value)) {
      // DiceBear expects arrays as comma-separated values
      if (value.length > 0) {
        params.append(key, value.join(","));
      }
    } else if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

/**
 * Generate a DiceBear avatar URL from AvatarConfig
 * 
 * @param config - Avatar configuration
 * @param options - Additional options (format, size, etc.)
 * @returns Complete URL to fetch the avatar
 * 
 * @example
 * const url = getDiceBearAvatarUrl(config, { format: 'png', size: 128 });
 * // Returns: "https://api.dicebear.com/9.x/avataaars/png?seed=...&skinColor=..."
 */
export function getDiceBearAvatarUrl(
  config: AvatarConfig,
  options: {
    format?: "svg" | "png" | "jpg" | "jpeg" | "webp" | "avif";
    size?: number;
    style?: string; // Avatar style (default: 'avataaars')
  } = {}
): string {
  const {
    format = "svg",
    size,
    style = "avataaars",
  } = options;

  // Map config to DiceBear options
  const mapping = avatarConfigToDiceBearOptions(config);
  
  // Build DiceBear options object
  const dicebearOptions: Record<string, any> = {
    seed: mapping.seed,
    ...mapping.options,
  };
  
  // Add size if specified (for raster formats)
  if (size && (format === "png" || format === "jpg" || format === "jpeg" || format === "webp" || format === "avif")) {
    dicebearOptions.size = size;
  }
  
  // Build query string
  const queryString = buildQueryString(dicebearOptions);
  
  // Construct URL
  const baseUrl = getApiBaseUrl();
  const version = "9.x"; // DiceBear API version
  
  return `${baseUrl}/${version}/${style}/${format}?${queryString}`;
}

/**
 * Generate a DiceBear avatar URL using just a seed
 * 
 * Useful for generating random avatars or when you only have a seed.
 * 
 * @param seed - Seed value for deterministic avatar generation
 * @param options - Additional options
 * @returns Complete URL to fetch the avatar
 */
export function getDiceBearAvatarUrlFromSeed(
  seed: string,
  options: {
    format?: "svg" | "png" | "jpg" | "jpeg" | "webp" | "avif";
    size?: number;
    style?: string;
  } = {}
): string {
  const {
    format = "svg",
    size,
    style = "avataaars",
  } = options;

  const params = new URLSearchParams();
  params.append("seed", seed);
  
  if (size && (format === "png" || format === "jpg" || format === "jpeg" || format === "webp" || format === "avif")) {
    params.append("size", String(size));
  }
  
  const baseUrl = getApiBaseUrl();
  const version = "9.x";
  
  return `${baseUrl}/${version}/${style}/${format}?${params.toString()}`;
}

/**
 * Check if the API is available (for fallback logic)
 * 
 * @returns Promise that resolves to true if API is reachable
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl();
    const testUrl = `${baseUrl}/9.x/avataaars/svg?seed=test`;
    
    const response = await fetch(testUrl, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

