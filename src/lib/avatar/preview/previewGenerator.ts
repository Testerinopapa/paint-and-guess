/**
 * Preview Generator Wrapper
 * 
 * Provides a high-level interface for generating avatar previews.
 * Wraps the Dicebear adapter to provide a cleaner API for preview generation.
 * 
 * @module avatar/preview/previewGenerator
 */

import { AvatarConfig } from '../config';
import { generateAvatarDataUri, generateAvatarWithDicebear } from './dicebearAdapter';

/**
 * Generate a data URI for an avatar preview
 * 
 * Creates a data URI that can be used directly in img src attributes.
 * This is the most common use case for displaying avatars.
 * 
 * @param config - Avatar configuration
 * @returns Data URI string
 * 
 * @example
 * const dataUri = generatePreview(config);
 * <img src={dataUri} alt="Avatar" />
 */
export function generatePreview(config: AvatarConfig): string {
  return generateAvatarDataUri(config);
}

/**
 * Generate an SVG string for an avatar
 * 
 * Creates an SVG string representation of the avatar.
 * Useful for inline SVG rendering or further processing.
 * 
 * @param config - Avatar configuration
 * @returns SVG string
 * 
 * @example
 * const svg = generatePreviewSVG(config);
 * <div dangerouslySetInnerHTML={{ __html: svg }} />
 */
export function generatePreviewSVG(config: AvatarConfig): string {
  return generateAvatarWithDicebear(config);
}

/**
 * Generate preview with size option
 * 
 * Note: Size is currently handled by the component rendering,
 * but this function provides a consistent interface for future
 * size-based optimizations.
 * 
 * @param config - Avatar configuration
 * @param size - Desired size in pixels (for future use)
 * @returns Data URI string
 */
export function generatePreviewWithSize(
  config: AvatarConfig, 
  size: number = 200
): string {
  // Currently size is handled at render time, but this provides
  // a hook for future size-based optimizations
  return generateAvatarDataUri(config);
}

