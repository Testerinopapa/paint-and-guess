import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGameRegistry } from "@/games/registry";
import { cn } from "@/lib/utils";

const DEBUG = import.meta.env.DEV || import.meta.env.VITE_GAME_HUB_DEBUG === "true";
const statusVariant: Record<string, string> = {
  stable: "bg-emerald-500/10 text-emerald-700",
  beta: "bg-amber-500/10 text-amber-700",
  alpha: "bg-sky-500/10 text-sky-700",
  deprecated: "bg-rose-500/10 text-rose-700",
};

const formatPlayers = (min: number, max: number, recommended?: number) => {
  if (recommended) {
    return `${min}-${max} players (best with ${recommended})`;
  }
  return `${min}-${max} players`;
};

const MetricPill = ({ label, value }: { label: string; value?: string | number }) => {
  if (value === undefined || value === null) return null;
  return (
    <Badge variant="outline" className="text-xs font-normal">
      {`${value} ${label}`}
    </Badge>
  );
};

const LoadingCards = () => {
  if (DEBUG) {
    console.debug("[hub] Rendering loading skeletons for AllGames");
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="flex flex-col overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const AllGames = () => {
  const { games, isLoading, error, source } = useGameRegistry();

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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">All Games</h1>
        <p className="text-muted-foreground">Browse live, prototype, and upcoming party experiences.</p>
        <p className="text-xs text-muted-foreground">Registry source: {source}</p>
        {errorMessage ? <p className="text-sm text-red-600">Fell back to bundled registry: {errorMessage}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <Card key={game.id} data-game-id={game.id} className="flex flex-col overflow-hidden">
            <img src={game.assets.thumbnail} alt={`${game.displayName} thumbnail`} className="h-40 w-full object-cover" />
            <CardHeader className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("capitalize", statusVariant[game.status] ?? "")}>{game.status}</Badge>
                {game.badges?.map((badge) => (
                  <Badge key={badge} variant="secondary" className="capitalize">
                    {badge}
                  </Badge>
                ))}
              </div>
              <div className="space-y-1">
                <CardTitle>{game.displayName}</CardTitle>
                <CardDescription>{game.displayDescription}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs font-normal">
                  {formatPlayers(game.supportedPlayers.min, game.supportedPlayers.max, game.supportedPlayers.recommended)}
                </Badge>
                <Badge variant="outline" className="text-xs font-normal capitalize">
                  {game.monetization}
                </Badge>
                <MetricPill
                  label="playing now"
                  value={
                    game.metrics?.concurrentUsers && game.metrics.concurrentUsers > 0
                      ? `${(game.metrics.concurrentUsers / 1000).toFixed(1)}k`
                      : undefined
                  }
                />
                <MetricPill
                  label="uptime"
                  value={game.metrics?.uptimePercentage ? `${game.metrics.uptimePercentage.toFixed(1)}%` : undefined}
                />
              </div>
              {game.PreviewComponent ? <game.PreviewComponent /> : null}
            </CardHeader>
            <CardContent className="pb-6">
              {game.isEnabled ? (
                <Button asChild className="w-full">
                  <Link to={game.derivedRoute}>Play now</Link>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Unavailable for your cohort
                </Button>
              )}
            </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AllGames;

