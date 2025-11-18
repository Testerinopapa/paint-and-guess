import { useGame } from "@/contexts/GameContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { Users, Trophy, Pencil } from "lucide-react";
import { getAvatarEmoji, DEFAULT_AVATAR } from "@/lib/avatars";
import { AvatarConfig, decodeAvatarConfig, createDefaultAvatarConfig } from "@/lib/avatar/config";
import { getDiceBearAvatarUrl, getDiceBearAvatarUrlFromSeed } from "@/lib/avatar/dicebear/api";

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
          {gameState.players.map((player) => {
            const isHost = gameState.ownerId === player.id;
            return (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted"
              >
                <div className="flex items-center gap-2">
                  {gameState.currentDrawer?.id === player.id && (
                    <Pencil className="w-4 h-4 text-primary" />
                  )}
                  <Avatar className="h-8 w-8">
                    {(() => {
                    // Check if avatar is a config object (new format) or string (old format)
                    if (!player.avatar) {
                      // No avatar - use default emoji
                      const defaultUrl = getDiceBearAvatarUrlFromSeed(DEFAULT_AVATAR.id, { format: 'png', size: 32 });
                      return (
                        <>
                          <AvatarImage src={defaultUrl} alt={player.name} />
                          <AvatarFallback className="text-lg bg-transparent p-0">
                            <span>{getAvatarEmoji(DEFAULT_AVATAR.id)}</span>
                          </AvatarFallback>
                        </>
                      );
                    }
                    
                    // Get avatar config
                    let avatarConfig: AvatarConfig | null = null;
                    
                    if (typeof player.avatar === 'string') {
                      // Try to decode as JSON config
                      avatarConfig = decodeAvatarConfig(player.avatar);
                      if (!avatarConfig) {
                        // Old emoji format - use seed-based generation
                        const avatarUrl = getDiceBearAvatarUrlFromSeed(player.avatar, { format: 'png', size: 32 });
                        return (
                          <>
                            <AvatarImage src={avatarUrl} alt={player.name} />
                            <AvatarFallback className="text-lg bg-transparent p-0">
                              <span>{getAvatarEmoji(player.avatar)}</span>
                            </AvatarFallback>
                          </>
                        );
                      }
                    } else {
                      // Already an AvatarConfig object
                      avatarConfig = player.avatar;
                    }
                    
                    // Check if custom image is uploaded
                    if (avatarConfig?.customImageUrl) {
                      return (
                        <>
                          <AvatarImage src={avatarConfig.customImageUrl} alt={player.name} />
                          <AvatarFallback className="text-lg bg-transparent p-0">
                            <span>{getAvatarEmoji(DEFAULT_AVATAR.id)}</span>
                          </AvatarFallback>
                        </>
                      );
                    }
                    
                    // Otherwise use DiceBear API
                    const avatarUrl = getDiceBearAvatarUrl(avatarConfig, { format: 'png', size: 32 });
                    return (
                      <>
                        <AvatarImage src={avatarUrl} alt={player.name} />
                        <AvatarFallback className="text-lg bg-transparent p-0">
                          <span>{getAvatarEmoji(DEFAULT_AVATAR.id)}</span>
                        </AvatarFallback>
                      </>
                    );
                  })()}
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{player.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    {isHost && <Badge variant="outline">Host</Badge>}
                    <Badge variant={player.isReady ? "default" : "secondary"}>
                      {player.isReady ? "Ready" : "Not Ready"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-bold">{player.score}</span>
              </div>
            </div>
          );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

