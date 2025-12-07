import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Opponent } from "../data/opponents";
import { useAuth } from "@/contexts/AuthContext";

interface OpponentProfileProps {
  opponent: Opponent | null;
}

export function OpponentProfile({ opponent }: OpponentProfileProps) {
  const { user } = useAuth();
  const playerName = user?.username || "You";
  
  if (!opponent) return null;

  return (
    <div className="flex items-center justify-between w-full mb-4 px-4">
      {/* Player Profile (White) */}
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {playerName[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-sm">{playerName}</div>
          <Badge variant="outline" className="text-xs">White</Badge>
        </div>
      </div>

      {/* VS Divider */}
      <div className="text-muted-foreground font-bold text-lg">VS</div>

      {/* Opponent Profile (Black) */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-medium text-sm">{opponent.name}</div>
          <Badge variant="secondary" className="text-xs">
            {opponent.rating}
          </Badge>
        </div>
        <Avatar className="w-12 h-12">
          <AvatarImage src={opponent.avatar} alt={opponent.name} />
          <AvatarFallback>{opponent.name[0]}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

