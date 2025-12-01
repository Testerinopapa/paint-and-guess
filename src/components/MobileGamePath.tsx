import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Check, Lock } from "lucide-react";
import type { HubGame } from "@/games/registry";

interface MobileGamePathProps {
  games: HubGame[];
  lastPlayedMap: Record<string, string>;
  onPlay?: (gameId: string) => void;
}

const MobileGamePath = ({ games, lastPlayedMap, onPlay }: MobileGamePathProps) => {
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Group games by category
  const groupedGames = games.reduce((acc, game) => {
    const category = game.category?.[0] || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(game);
    return acc;
  }, {} as Record<string, HubGame[]>);

  const handlePlay = (game: HubGame) => {
    if (game.isEnabled) {
      if (onPlay) {
        onPlay(game.id);
      }
      localStorage.setItem(`game-last-played-${game.id}`, new Date().toISOString());
      navigate(game.derivedRoute);
    }
  };

  const handleImageError = (gameId: string) => {
    setImageErrors(prev => new Set(prev).add(gameId));
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedGames).map(([category, categoryGames], categoryIndex) => {
        const firstUnplayedIndex = categoryGames.findIndex(game => !lastPlayedMap[game.id] && game.isEnabled);
        
        return (
          <div key={category} className="space-y-4">
            {/* Unit Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Unit {categoryIndex + 1}</h2>
                <p className="text-sm text-muted-foreground capitalize">{category} games</p>
              </div>
            </div>

            {/* Path Container */}
            <div className="relative pl-8">
              {/* Vertical Path Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              {/* Game Nodes */}
              <div className="space-y-6">
                {categoryGames.map((game, gameIndex) => {
                  const hasPlayed = lastPlayedMap[game.id];
                  const isCurrent = gameIndex === firstUnplayedIndex && game.isEnabled;
                  const isLocked = !game.isEnabled;
                  const imagePath = game.assets.background || game.assets.thumbnail || '';
                  const baseUrl = import.meta.env.BASE_URL || '/';
                  const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
                  const cardImage = `${baseUrl}${normalizedPath}`;
                  const hasError = imageErrors.has(game.id);

                  return (
                    <div key={game.id} className="relative flex items-center gap-4">
                      {/* Path Node */}
                      <div className="relative z-10 flex-shrink-0">
                        {hasPlayed ? (
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <Check className="w-6 h-6 text-primary-foreground" />
                          </div>
                        ) : isCurrent ? (
                          <button
                            onClick={() => handlePlay(game)}
                            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          >
                            <Play className="w-6 h-6 text-primary-foreground fill-current" />
                          </button>
                        ) : isLocked ? (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-secondary border-2 border-border flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-muted" />
                          </div>
                        )}
                      </div>

                      {/* Game Card */}
                      <div
                        onClick={() => !isLocked && handlePlay(game)}
                        className={`flex-1 flex items-center gap-3 p-3 rounded-lg bg-card border border-border ${
                          isCurrent ? 'ring-2 ring-primary' : ''
                        } ${!isLocked ? 'cursor-pointer hover:bg-secondary transition-colors' : 'opacity-60'}`}
                      >
                        {/* Game Image/Icon */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-game-card">
                          {!hasError && cardImage ? (
                            <img
                              src={cardImage}
                              alt={game.displayName}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(game.id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <span className="text-2xl">🎮</span>
                            </div>
                          )}
                        </div>

                        {/* Game Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{game.displayName}</h3>
                          {game.displayDescription && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {game.displayDescription}
                            </p>
                          )}
                          {hasPlayed && lastPlayedMap[game.id] && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Played {lastPlayedMap[game.id]}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        {isCurrent && (
                          <div className="flex-shrink-0">
                            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                              START
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileGamePath;

