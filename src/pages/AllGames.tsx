import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGameRegistry } from "@/games/registry";
import { GameHero } from "@/components/GameHero";
import GameCard from "@/components/GameCard";

const DEBUG = import.meta.env.DEV || import.meta.env.VITE_GAME_HUB_DEBUG === "true";

const LoadingCards = () => {
  if (DEBUG) {
    console.debug("[hub] Rendering loading skeletons for AllGames");
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="rounded-lg bg-game-card overflow-hidden">
          <div className="aspect-[3/4]">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper to get "last played" time
const getLastPlayed = (gameId: string): string | undefined => {
  const lastPlayed = localStorage.getItem(`game-last-played-${gameId}`);
  if (!lastPlayed) return undefined;
  
  const date = new Date(lastPlayed);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return diffMins <= 1 ? "just now" : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
};

const AllGames = () => {
  const { games, isLoading, error, source } = useGameRegistry();
  const [lastPlayedMap, setLastPlayedMap] = useState<Record<string, string>>({});

  // Load last played times
  useEffect(() => {
    const map: Record<string, string> = {};
    games.forEach(game => {
      const lastPlayed = getLastPlayed(game.id);
      if (lastPlayed) {
        map[game.id] = lastPlayed;
      }
    });
    setLastPlayedMap(map);
  }, [games]);

  useEffect(() => {
    if (!DEBUG) return;
    console.debug("[hub] AllGames state updated", {
      loading: isLoading,
      error: error instanceof Error ? error.message : error ?? null,
      source,
      gameCount: games.length,
    });
  }, [games.length, isLoading, error, source]);

  // Get featured game (first enabled game, or first game with "hot" badge, or first stable game)
  const featuredGame = useMemo(() => {
    if (games.length === 0) return null;
    
    // Try to find a game with "hot" badge
    const hotGame = games.find(g => g.badges?.includes("hot") && g.isEnabled);
    if (hotGame) return hotGame;
    
    // Try to find a stable game
    const stableGame = games.find(g => g.status === "stable" && g.isEnabled);
    if (stableGame) return stableGame;
    
    // Return first enabled game
    return games.find(g => g.isEnabled) || games[0];
  }, [games]);

  // Get other games (excluding featured)
  const otherGames = useMemo(() => {
    if (!featuredGame) return games;
    return games.filter(g => g.id !== featuredGame.id);
  }, [games, featuredGame]);

  if (isLoading) {
    return <LoadingCards />;
  }

  const errorMessage = error instanceof Error ? error.message : error ? "Unable to load CMS registry" : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">All Games</h1>
        <p className="text-muted-foreground">Browse live, prototype, and upcoming party experiences.</p>
        <p className="text-xs text-muted-foreground">Registry source: {source}</p>
        {errorMessage ? <p className="text-sm text-red-600">Fell back to bundled registry: {errorMessage}</p> : null}
      </div>

      {/* Featured Game Hero */}
      {featuredGame && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Featured</h2>
          <GameHero game={featuredGame} />
        </div>
      )}

      {/* Other Games Grid */}
      {otherGames.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">All Games</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {otherGames.map((game) => {
              if (DEBUG) {
                console.debug("[hub] Rendering tile", {
                  id: game.id,
                  status: game.status,
                  enabled: game.isEnabled,
                  route: game.derivedRoute,
                });
              }
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  lastPlayed={lastPlayedMap[game.id]}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllGames;

