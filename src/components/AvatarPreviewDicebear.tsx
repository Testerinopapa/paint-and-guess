/**
 * Avatar Preview using Dicebear
 * 
 * This is a proof-of-concept component using @dicebear/core to render avatars.
 * It serves as an alternative to the basic SVG rendering in AvatarPreview.tsx.
 * 
 * @module AvatarPreviewDicebear
 */

import { AvatarConfig } from "@/lib/avatarConfig";
import { generateAvatarDataUri } from "@/lib/avatarDicebearAdapter";

interface AvatarPreviewDicebearProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

/**
 * Avatar Preview component using Dicebear for rendering
 * 
 * This component uses the Dicebear avatar generation library to create
 * detailed avatars based on the AvatarConfig. It provides much better
 * visual representation than the basic SVG shapes.
 * 
 * @param config - Avatar configuration
 * @param size - Size of the avatar in pixels (default: 200)
 * @param className - Additional CSS classes
 */
export function AvatarPreviewDicebear({ 
  config, 
  size = 200, 
  className 
}: AvatarPreviewDicebearProps) {
  try {
    console.debug('[AvatarPreviewDicebear] Rendering avatar', { 
      configId: config.id, 
      size,
      config: config 
    });
    
    const avatarDataUri = generateAvatarDataUri(config);
    
    if (!avatarDataUri || avatarDataUri.length === 0) {
      throw new Error('Generated empty data URI');
    }
    
    console.debug('[AvatarPreviewDicebear] Avatar generated successfully', { 
      dataUriLength: avatarDataUri.length,
      dataUriPrefix: avatarDataUri.substring(0, 50)
    });
    
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={avatarDataUri}
          alt={`Avatar: ${config.name}`}
          width={size}
          height={size}
          className="drop-shadow-lg"
          style={{
            width: size,
            height: size,
            display: 'block',
            imageRendering: 'crisp-edges',
            border: '2px solid red', // Temporary debug border
            backgroundColor: 'white', // Temporary background to see if image is there
          }}
          onError={(e) => {
            console.error('[AvatarPreviewDicebear] Image load error', {
              error: e,
              src: avatarDataUri.substring(0, 100),
            });
          }}
          onLoad={() => {
            console.debug('[AvatarPreviewDicebear] Image loaded successfully');
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('[AvatarPreviewDicebear] Failed to generate avatar:', error);
    console.error('[AvatarPreviewDicebear] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      config: config,
    });
    
    // Fallback to simple placeholder
    return (
      <div 
        className={`flex items-center justify-center bg-muted rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-4xl">👤</span>
      </div>
    );
  }
}

