import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Clock } from "lucide-react";

interface PlayerPanelProps {
  name: string;
  rating?: number;
  avatar?: string;
  country?: string; // Country code for flag emoji
  timer?: string; // e.g., "9:59"
  color: "white" | "black";
  isActive?: boolean; // Whether it's this player's turn
}

export function PlayerPanel({
  name,
  rating,
  avatar,
  country,
  timer,
  color,
  isActive = false,
}: PlayerPanelProps) {
  const displayName = name.length > 15 ? `${name.slice(0, 12)}...` : name;
  
  // Format timer display
  const timerDisplay = timer || (color === "white" ? "10:00" : "10:00");

  return (
    <div className={`flex items-center justify-between px-4 py-2 bg-card border-b ${isActive ? "bg-muted/50" : ""}`}>
      {/* Left side - Avatar and info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="text-sm">
            {name[0]?.toUpperCase() || (color === "white" ? "W" : "B")}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium truncate">{displayName}</span>
              {rating !== undefined && (
                <span className="text-xs text-muted-foreground">({rating})</span>
              )}
              {country && (
                <span className="text-base" title={country}>
                  {getCountryFlag(country)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{rating || 1500} +0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Timer */}
      <div className="flex items-center gap-2 ml-2">
        <div className="px-3 py-1.5 bg-background rounded border text-sm font-mono min-w-[4rem] text-center">
          {timerDisplay}
        </div>
      </div>
    </div>
  );
}

// Helper function to get country flag emoji from country code
function getCountryFlag(countryCode: string): string {
  // Simple mapping for common countries - can be expanded
  const flagMap: Record<string, string> = {
    kz: "🇰🇿", // Kazakhstan
    br: "🇧🇷", // Brazil
    us: "🇺🇸",
    gb: "🇬🇧",
    ru: "🇷🇺",
    cn: "🇨🇳",
    jp: "🇯🇵",
    // Add more as needed
  };
  
  return flagMap[countryCode.toLowerCase()] || "🏳️";
}
