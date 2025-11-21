import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getPingPongPreviewEntry(): NormalizedGameEntry {
  return {
    id: "ping-pong",
    version: "1.0.0",
    name: { default: "Ping Pong" },
    description: {
      default: "Classic table tennis game. Play solo or challenge friends in real-time multiplayer!",
    },
    status: "stable",
    supportedPlayers: { min: 1, max: 2, recommended: 2 },
    monetization: "free",
    category: ["sports", "multiplayer"],
    badges: ["new"],
    assets: {
      thumbnail: "/placeholder.svg",
    },
    navigation: {
      category: "sports",
      priority: 75,
    },
    visibleIf: ["public"],
    route: { slug: "ping-pong" },
    featureFlags: [],
    plugin: {
      previewComponent: "pingPongPreview",
      moduleId: "@/games/ping-pong",
    },
  };
}

export function PingPongPreviewCard() {
  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="default">New</Badge>
          <CardTitle>Ping Pong</CardTitle>
        </div>
        <CardDescription>Fast-paced table tennis action.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Practice solo or compete with friends in real-time multiplayer matches.
      </CardContent>
    </Card>
  );
}

export function getPingPongPreviewComponent() {
  return PingPongPreviewCard;
}

