import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGameRegistry } from "@/games/registry";
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


  if (isLoading) {
    return <LoadingCards />;
  }

  const errorMessage = error instanceof Error ? error.message : error ? "Unable to load CMS registry" : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Games</h1>
        <p className="text-muted-foreground">Your gaming library</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {games.map((game) => {
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
  );
};

export default AllGames;

