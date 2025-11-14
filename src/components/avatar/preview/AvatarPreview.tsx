/**
 * Avatar Preview Component
 * 
 * Displays a preview of the avatar based on the selected customization options.
 * Uses SVG rendering for accurate visual representation (following reference pattern).
 * 
 * @module avatar/preview/AvatarPreview
 */

import { AvatarConfig } from "@/lib/avatar/config";
import { AvatarPreviewSVG } from "./AvatarPreviewSVG";

interface AvatarPreviewProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  /** Active category tab - for future use with category-aware rendering */
  activeCategory?: string;
}

/**
 * Avatar preview component with SVG-based rendering
 * 
 * Displays avatar using SVG shapes and paths for accurate representation.
 * Supports all customization options: skin tone, hair, clothing, accessories, and facial features.
 * 
 * The preview updates automatically when customization options change.
 * 
 * @param config - Avatar configuration
 * @param size - Size of the preview in pixels (default: 200)
 * @param className - Additional CSS classes
 * @param activeCategory - Active category tab (reserved for future enhancements)
 */
export function AvatarPreview({ 
  config, 
  size = 200, 
  className = "",
  activeCategory = 'skin',
}: AvatarPreviewProps) {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      role="img"
      aria-label={`Avatar preview: ${config.name || 'Custom avatar'}`}
    >
      <AvatarPreviewSVG config={config} size={size} />
    </div>
  );
}

