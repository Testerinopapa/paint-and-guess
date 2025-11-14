/**
 * Simple Avatar Preview Placeholder
 * 
 * Basic preview component that shows a placeholder until a rendering system is implemented.
 * 
 * @module avatar/preview/AvatarPreview
 */

import { AvatarConfig } from "@/lib/avatar/config";

interface AvatarPreviewProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

/**
 * Simple avatar preview placeholder
 * 
 * @param config - Avatar configuration
 * @param size - Size of the preview in pixels (default: 200)
 * @param className - Additional CSS classes
 */
export function AvatarPreview({ 
  config, 
  size = 200, 
  className 
}: AvatarPreviewProps) {
  return (
    <div 
      className={`flex items-center justify-center bg-muted rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="text-4xl">👤</span>
    </div>
  );
}

