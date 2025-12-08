import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getSemanticPreviewEntry(): NormalizedGameEntry {
  return {
    id: "semantic",
    version: "1.0.0",
    name: { default: "Semantic" },
    description: {
      default: "Guess the secret word by entering similar words. Each guess receives a rank based on semantic similarity!",
    },
    status: "stable",
    supportedPlayers: { min: 1, max: 1, recommended: 1 },
    monetization: "free",
    category: ["word", "puzzle"],
    badges: ["new"],
    assets: {
      thumbnail: "/games/semantic-card.png",
      background: "/games/semantic-card.png",
    },
    navigation: {
      category: "word",
      priority: 85,
    },
    visibleIf: ["public"],
    route: { slug: "semantic" },
    featureFlags: [],
    plugin: {
      previewComponent: "semanticPreview",
      moduleId: "@/games/semantic",
    },
  };
}

export function SemanticPreviewCard() {
  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="default">New</Badge>
          <CardTitle>Semantic</CardTitle>
        </div>
        <CardDescription>Word guessing with semantic similarity.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Guess the secret word by entering similar words. Get ranked by closeness!
      </CardContent>
    </Card>
  );
}

export function getSemanticPreviewComponent() {
  return SemanticPreviewCard;
}

