import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvatarConfig, decodeAvatarConfig } from "@/lib/avatar/config";
import { getDiceBearAvatarUrl, getDiceBearAvatarUrlFromSeed } from "@/lib/avatar/dicebear/api";
import { getAvatarEmoji, DEFAULT_AVATAR } from "@/lib/avatars";

interface PlayerAvatarProps {
  avatar?: string | AvatarConfig | null;
  name: string;
  size?: number;
  className?: string;
}

export function PlayerAvatar({ avatar, name, size = 32, className }: PlayerAvatarProps) {
  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {(() => {
        // Check if avatar is a config object (new format) or string (old format)
        if (!avatar) {
          // No avatar - use default emoji
          const defaultUrl = getDiceBearAvatarUrlFromSeed(DEFAULT_AVATAR.id, { format: 'png', size });
          return (
            <>
              <AvatarImage src={defaultUrl} alt={name} />
              <AvatarFallback className="text-lg bg-transparent p-0">
                <span>{getAvatarEmoji(DEFAULT_AVATAR.id)}</span>
              </AvatarFallback>
            </>
          );
        }
        
        // Get avatar config
        let avatarConfig: AvatarConfig | null = null;
        
        if (typeof avatar === 'string') {
          // Try to decode as JSON config
          avatarConfig = decodeAvatarConfig(avatar);
          if (!avatarConfig) {
            // Old emoji format - use seed-based generation
            const avatarUrl = getDiceBearAvatarUrlFromSeed(avatar, { format: 'png', size });
            return (
              <>
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="text-lg bg-transparent p-0">
                  <span>{getAvatarEmoji(avatar)}</span>
                </AvatarFallback>
              </>
            );
          }
        } else {
          // Already an AvatarConfig object
          avatarConfig = avatar;
        }
        
        // Check if custom image is uploaded
        if (avatarConfig?.customImageUrl) {
          return (
            <>
              <AvatarImage src={avatarConfig.customImageUrl} alt={name} />
              <AvatarFallback className="text-lg bg-transparent p-0">
                <span>{getAvatarEmoji(DEFAULT_AVATAR.id)}</span>
              </AvatarFallback>
            </>
          );
        }
        
        // Otherwise use DiceBear API
        const avatarUrl = getDiceBearAvatarUrl(avatarConfig, { format: 'png', size });
        return (
          <>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-lg bg-transparent p-0">
              <span>{getAvatarEmoji(DEFAULT_AVATAR.id)}</span>
            </AvatarFallback>
          </>
        );
      })()}
    </Avatar>
  );
}

