import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Trophy, Pencil } from "lucide-react";
import { getAvatarEmoji, DEFAULT_AVATAR } from "@/lib/avatars";
import { AvatarConfig, decodeAvatarConfig, createDefaultAvatarConfig } from "@/lib/avatar/config";
import { AvatarPreviewDicebear } from "./avatar/preview/AvatarPreviewDicebear";

export function PlayerList() {
  const { gameState } = useGame();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Players ({gameState.players.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {gameState.players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted"
            >
              <div className="flex items-center gap-2">
                {gameState.currentDrawer?.id === player.id && (
                  <Pencil className="w-4 h-4 text-primary" />
                )}
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-lg bg-transparent p-0">
                    {(() => {
                      // Check if avatar is a config object (new format) or string (old format)
                      if (!player.avatar) {
                        return <span>{getAvatarEmoji(DEFAULT_AVATAR.id)}</span>;
                      }
                      
                      if (typeof player.avatar === 'string') {
                        // Try to decode as JSON config, fallback to emoji ID
                        const decoded = decodeAvatarConfig(player.avatar);
                        if (decoded) {
                          return <AvatarPreviewDicebear config={decoded} size={32} />;
                        }
                        // Old emoji format - fallback to emoji
                        return <span>{getAvatarEmoji(player.avatar)}</span>;
                      }
                      
                      // Already an AvatarConfig object
                      return <AvatarPreviewDicebear config={player.avatar} size={32} />;
                    })()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{player.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-bold">{player.score}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

