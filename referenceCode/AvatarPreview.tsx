import { AvatarConfig } from "@/types/avatar";

interface AvatarPreviewProps {
  config: AvatarConfig;
  size?: number;
}

export const AvatarPreview = ({ config, size = 200 }: AvatarPreviewProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className="animate-scale-in"
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="95" fill="hsl(var(--preview-bg))" />
      
      {/* Body */}
      <rect
        x="60"
        y="140"
        width="80"
        height="60"
        rx="8"
        fill={config.topColor}
      />
      
      {/* Neck */}
      <rect
        x="85"
        y="120"
        width="30"
        height="25"
        fill={config.skinTone}
      />
      
      {/* Head */}
      <circle cx="100" cy="85" r="40" fill={config.skinTone} />
      
      {/* Hair */}
      {config.hairStyle === 'short' && (
        <path
          d="M 60 75 Q 60 40, 100 40 Q 140 40, 140 75 L 135 80 Q 130 45, 100 45 Q 70 45, 65 80 Z"
          fill={config.hairColor}
        />
      )}
      {config.hairStyle === 'long' && (
        <>
          <path
            d="M 60 75 Q 60 40, 100 40 Q 140 40, 140 75 L 135 80 Q 130 45, 100 45 Q 70 45, 65 80 Z"
            fill={config.hairColor}
          />
          <ellipse cx="60" cy="100" rx="10" ry="25" fill={config.hairColor} />
          <ellipse cx="140" cy="100" rx="10" ry="25" fill={config.hairColor} />
        </>
      )}
      {config.hairStyle === 'curly' && (
        <>
          <circle cx="80" cy="60" r="15" fill={config.hairColor} />
          <circle cx="100" cy="50" r="18" fill={config.hairColor} />
          <circle cx="120" cy="60" r="15" fill={config.hairColor} />
          <circle cx="70" cy="75" r="12" fill={config.hairColor} />
          <circle cx="130" cy="75" r="12" fill={config.hairColor} />
        </>
      )}
      
      {/* Eyes */}
      {config.eyeType === 'default' && (
        <>
          <circle cx="85" cy="85" r="5" fill="#2C3E50" />
          <circle cx="115" cy="85" r="5" fill="#2C3E50" />
          <circle cx="87" cy="83" r="2" fill="#FFFFFF" />
          <circle cx="117" cy="83" r="2" fill="#FFFFFF" />
        </>
      )}
      {config.eyeType === 'happy' && (
        <>
          <path d="M 78 85 Q 85 80, 92 85" stroke="#2C3E50" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 108 85 Q 115 80, 122 85" stroke="#2C3E50" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {config.eyeType === 'surprised' && (
        <>
          <circle cx="85" cy="85" r="7" fill="none" stroke="#2C3E50" strokeWidth="2" />
          <circle cx="115" cy="85" r="7" fill="none" stroke="#2C3E50" strokeWidth="2" />
          <circle cx="85" cy="85" r="4" fill="#2C3E50" />
          <circle cx="115" cy="85" r="4" fill="#2C3E50" />
        </>
      )}
      
      {/* Eyebrows */}
      {config.eyebrowType === 'default' && (
        <>
          <path d="M 75 72 Q 85 70, 95 72" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 105 72 Q 115 70, 125 72" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {config.eyebrowType === 'raised' && (
        <>
          <path d="M 75 68 Q 85 65, 95 68" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 105 68 Q 115 65, 125 68" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {config.eyebrowType === 'angry' && (
        <>
          <path d="M 75 75 L 95 70" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 125 75 L 105 70" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      
      {/* Mouth */}
      {config.mouthType === 'smile' && (
        <path d="M 80 105 Q 100 115, 120 105" stroke="#E74C3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      {config.mouthType === 'neutral' && (
        <line x1="85" y1="105" x2="115" y2="105" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {config.mouthType === 'laugh' && (
        <>
          <path d="M 80 105 Q 100 118, 120 105" stroke="#E74C3C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 85 108 Q 100 115, 115 108" fill="#FFFFFF" opacity="0.8" />
        </>
      )}
      
      {/* Accessories */}
      {config.accessoryType === 'glasses' && (
        <>
          <circle cx="85" cy="85" r="12" fill="none" stroke="#2C3E50" strokeWidth="2" />
          <circle cx="115" cy="85" r="12" fill="none" stroke="#2C3E50" strokeWidth="2" />
          <line x1="97" y1="85" x2="103" y2="85" stroke="#2C3E50" strokeWidth="2" />
        </>
      )}
      {config.accessoryType === 'hat' && (
        <>
          <ellipse cx="100" cy="45" rx="45" ry="8" fill="#E74C3C" />
          <rect x="75" y="38" width="50" height="15" rx="5" fill="#E74C3C" />
        </>
      )}
      {config.accessoryType === 'earrings' && (
        <>
          <circle cx="65" cy="95" r="4" fill="#FFD700" />
          <circle cx="135" cy="95" r="4" fill="#FFD700" />
        </>
      )}
    </svg>
  );
};
