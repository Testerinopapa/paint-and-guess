import { ComponentType, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackGameRegistry } from "@/games/registry/fallback";
import { PaintAndGuessHubPanel } from "@/games/paint-and-guess/hubEntry";
import { getVisibleGames, loadGameRegistry, type GameRegistryEntry, type GameStatus } from "@/games/registry";
import { Clock, Cpu, Info, Sparkles } from "lucide-react";

const statusTokens: Record<GameStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  available: { label: "Available", variant: "default" },
  "coming-soon": { label: "Coming soon", variant: "secondary" },
  prototype: { label: "Prototype", variant: "outline" },
  retired: { label: "Retired", variant: "destructive" },
};

const hubComponents: Record<string, ComponentType | undefined> = {
  "paint-and-guess": PaintAndGuessHubPanel,
};

const skeletonCards = Array.from({ length: 3 }, (_, index) => index);

const AllGames = () => {
  const [entries, setEntries] = useState<GameRegistryEntry[]>(fallbackGameRegistry.entries);
  const [registryMeta, setRegistryMeta] = useState({
    updatedAt: fallbackGameRegistry.updatedAt,
    source: fallbackGameRegistry.source,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadStart = Date.now();
    
    console.debug("[AllGames] Loading game registry...");
    
    loadGameRegistry()
      .then((payload) => {
        if (!mounted) {
          console.debug("[AllGames] Component unmounted, ignoring registry load result");
          return;
        }
        const loadDuration = Date.now() - loadStart;
        console.debug("[AllGames] Registry loaded successfully", {
          source: payload.source,
          entryCount: payload.entries.length,
          duration: `${loadDuration}ms`,
        });
        setEntries(payload.entries);
        setRegistryMeta({ updatedAt: payload.updatedAt, source: payload.source });
        setError(null);
      })
      .catch((err) => {
        if (!mounted) {
          console.debug("[AllGames] Component unmounted, ignoring registry load error");
          return;
        }
        const loadDuration = Date.now() - loadStart;
        const errorMessage = err instanceof Error ? err.message : "Unable to load games";
        console.error("[AllGames] Failed to load registry", {
          error: errorMessage,
          duration: `${loadDuration}ms`,
          fallbackUsed: true,
        });
        setError(errorMessage);
        setEntries(fallbackGameRegistry.entries);
      })
      .finally(() => {
        if (!mounted) return;
        const loadDuration = Date.now() - loadStart;
        console.debug("[AllGames] Registry load completed", { duration: `${loadDuration}ms` });
        setIsLoading(false);
      });

    return () => {
      console.debug("[AllGames] Component unmounting, canceling registry load");
      mounted = false;
    };
  }, []);

  const games = useMemo(() => {
    const visible = getVisibleGames(entries);
    console.debug("[AllGames] Visible games computed", {
      totalEntries: entries.length,
      visibleGames: visible.length,
      visibleIds: visible.map((g) => g.id),
    });
    return visible;
  }, [entries]);
  
  const selectedGame = games.find((game) => game.id === activeGameId);
  const HubComponent = selectedGame ? hubComponents[selectedGame.id] : undefined;
  
  useEffect(() => {
    if (selectedGame) {
      console.debug("[AllGames] Game selected", {
        gameId: selectedGame.id,
        name: selectedGame.name,
        hasHubComponent: !!HubComponent,
      });
    }
  }, [selectedGame, HubComponent]);
  const formattedUpdatedAt = useMemo(() => {
    const parsedDate = new Date(registryMeta.updatedAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return registryMeta.updatedAt;
    }
    return parsedDate.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [registryMeta.updatedAt]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Game hub preview
        </div>
        <h1 className="text-3xl font-bold tracking-tight">All Games</h1>
        <p className="text-muted-foreground max-w-2xl">
          Explore live, prototype, and upcoming social games. The registry is sourced from the backend so we can update
          tiles without shipping a new client.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Registry source</CardTitle>
            <CardDescription>The backend snapshot used for this session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span>
                Source: <Badge variant="secondary">{registryMeta.source}</Badge>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Updated: {formattedUpdatedAt}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cpu className="h-4 w-4" />
              <span>Feature flags gate unreleased tiles automatically.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Registry offline</AlertTitle>
          <AlertDescription>
            {error}. Displaying the bundled fallback so you can continue exploring layouts.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? skeletonCards.map((item) => (
              <Card key={`skeleton-${item}`} className="flex flex-col overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardHeader className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          : games.map((game) => {
              const status = statusTokens[game.status];
              const primaryRoute = game.route !== "#" ? game.route : game.cta?.to;
              const primaryHref = primaryRoute ? null : game.cta?.href && game.cta.href !== "#" ? game.cta.href : null;
              const disabled = !primaryRoute && !primaryHref;
              const showDetails = Boolean(hubComponents[game.id]);

              return (
                <Card key={game.id} className="flex flex-col overflow-hidden">
                  <img src={game.thumbnail} alt={`${game.name} thumbnail`} className="h-40 w-full object-cover" />
                  <CardHeader className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      {status ? (
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      ) : null}
                      {game.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <CardTitle>{game.name}</CardTitle>
                      <CardDescription>{game.description}</CardDescription>
                    </div>
                    {game.modes?.length ? (
                      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        {game.modes.map((mode) => (
                          <Badge key={mode} variant="secondary">
                            {mode}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </CardHeader>
                  <CardFooter className="flex flex-col gap-2">
                    {disabled ? (
                      <Button variant="outline" className="w-full" disabled>
                        Coming soon
                      </Button>
                    ) : primaryRoute ? (
                      <Button asChild className="w-full">
                        <Link to={primaryRoute}>{game.cta?.label ?? "Play now"}</Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <a
                          href={primaryHref!}
                          target={game.cta?.external ? "_blank" : undefined}
                          rel={game.cta?.external ? "noreferrer" : undefined}
                        >
                          {game.cta?.label ?? "Play now"}
                        </a>
                      </Button>
                    )}
                    {showDetails ? (
                      <Button variant="ghost" className="w-full" onClick={() => setActiveGameId(game.id)}>
                        Learn more
                      </Button>
                    ) : null}
                  </CardFooter>
                </Card>
              );
            })}
      </div>

      <Dialog open={Boolean(selectedGame)} onOpenChange={(open) => (!open ? setActiveGameId(null) : undefined)}>
        <DialogContent className="max-w-3xl">
          {selectedGame ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedGame.name}</DialogTitle>
                <DialogDescription>{selectedGame.shortDescription ?? selectedGame.description}</DialogDescription>
              </DialogHeader>
              {HubComponent ? (
                <HubComponent />
              ) : (
                <p className="text-sm text-muted-foreground">Detailed hub content for this game is coming soon.</p>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllGames;

