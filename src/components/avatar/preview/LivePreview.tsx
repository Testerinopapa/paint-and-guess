/**
 * Live Preview Wrapper Component
 * 
 * Wraps the avatar preview with error boundary and provides
 * a consistent interface for displaying live avatar previews
 * that update as the user customizes their avatar.
 * 
 * @module avatar/preview/LivePreview
 */

import { AvatarConfig } from "@/lib/avatar/config";
import { AvatarPreviewDicebear } from "./AvatarPreviewDicebear";
import { AvatarPreviewErrorBoundary } from "./AvatarPreviewErrorBoundary";

interface LivePreviewProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

/**
 * Live Preview component for avatar customization
 * 
 * Displays a live preview of the avatar that updates in real-time
 * as the user makes customization selections. Includes error
 * boundary for graceful error handling.
 * 
 * @param config - Current avatar configuration
 * @param size - Size of the preview in pixels (default: 200)
 * @param className - Additional CSS classes
 */
export function LivePreview({ 
  config, 
  size = 200, 
  className 
}: LivePreviewProps) {
  return (
    <AvatarPreviewErrorBoundary fallbackConfig={config}>
      <AvatarPreviewDicebear 
        config={config} 
        size={size} 
        className={className} 
      />
    </AvatarPreviewErrorBoundary>
  );
}

