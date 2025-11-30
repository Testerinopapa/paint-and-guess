import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGameRegistry } from "@/games/registry";
import { GameHero } from "@/components/GameHero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { games, isLoading } = useGameRegistry();

  const game = games.find(g => g.id === gameId);
  const relatedGames = games.filter(g => 
    g.id !== gameId && 
    g.isEnabled && 
    (g.category?.some(cat => game?.category?.includes(cat)) || g.status === game?.status)
  ).slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/hub">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Games
          </Link>
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Game Not Found</h1>
          <p className="text-muted-foreground mb-4">The game you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/hub">Browse All Games</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link to="/hub">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Games
        </Link>
      </Button>

      {/* Hero Section */}
      <GameHero game={game} />

      {/* Game Details */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">About</h2>
            <p className="text-muted-foreground leading-relaxed">{game.displayDescription}</p>
          </div>

          {game.PreviewComponent && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Preview</h2>
              <game.PreviewComponent />
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("capitalize", statusVariant[game.status] ?? "")}>
                  {game.status}
                </Badge>
                {game.badges?.map((badge) => (
                  <Badge key={badge} variant="secondary" className="capitalize">
                    {badge}
                  </Badge>
                ))}
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Players: </span>
                  <span className="text-muted-foreground">
                    {formatPlayers(game.supportedPlayers.min, game.supportedPlayers.max, game.supportedPlayers.recommended)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Monetization: </span>
                  <span className="text-muted-foreground capitalize">{game.monetization}</span>
                </div>
                {game.metrics?.concurrentUsers && (
                  <div>
                    <span className="font-medium">Playing Now: </span>
                    <span className="text-muted-foreground">
                      {game.metrics.concurrentUsers > 1000 
                        ? `${(game.metrics.concurrentUsers / 1000).toFixed(1)}k`
                        : game.metrics.concurrentUsers}
                    </span>
                  </div>
                )}
                {game.metrics?.uptimePercentage && (
                  <div>
                    <span className="font-medium">Uptime: </span>
                    <span className="text-muted-foreground">
                      {game.metrics.uptimePercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Games */}
      {relatedGames.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Related Games</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedGames.map((relatedGame) => (
              <Card key={relatedGame.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/hub/games/${relatedGame.id}`} className="block">
                  <img 
                    src={relatedGame.assets.thumbnail} 
                    alt={`${relatedGame.displayName} thumbnail`} 
                    className="h-40 w-full object-cover"
                  />
                  <CardHeader>
                    <CardTitle>{relatedGame.displayName}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {relatedGame.displayDescription}
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameDetail;

