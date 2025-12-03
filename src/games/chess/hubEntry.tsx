import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getChessPreviewEntry(): NormalizedGameEntry {
  return {
    id: "chess",
    version: "1.0.0",
    name: { default: "Chess" },
    description: {
      default: "Play chess with friends or analyze your games with Stockfish. Import PGN files or play live matches with real-time analysis.",
    },
    status: "stable",
    supportedPlayers: { min: 1, max: 2, recommended: 2 },
    monetization: "free",
    category: ["strategy", "board"],
    badges: ["new"],
    assets: {
      thumbnail: "/games/chess-card.png",
      background: "/games/chess-card.png",
    },
    navigation: {
      category: "strategy",
      priority: 95,
    },
    visibleIf: ["public"],
    route: { slug: "chess" },
    featureFlags: [],
    plugin: {
      previewComponent: "chessPreview",
      moduleId: "@/games/chess",
    },
  };
}

export function ChessPreviewCard() {
  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="default">New</Badge>
          <CardTitle>Chess</CardTitle>
        </div>
        <CardDescription>Play and analyze chess games.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Play chess with friends or analyze your games with Stockfish engine. Import PGN files or play live matches!
      </CardContent>
    </Card>
  );
}

export function getChessPreviewComponent() {
  return ChessPreviewCard;
}

