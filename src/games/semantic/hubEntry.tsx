import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getSemanticPreviewEntry(): NormalizedGameEntry {
  return {
    id: "semantic",
    version: "1.0.0",
    name: { default: "Semantic" },
    description: {
      default: "A word-guessing game where you find the secret word by guessing semantically similar words. The closer your guess, the warmer you get!",
    },
    status: "stable",
    supportedPlayers: { min: 1, max: 1, recommended: 1 },
    monetization: "free",
    category: ["puzzle", "word"],
    badges: ["new"],
    assets: {
      thumbnail: "/games/semantic-card.png",
      background: "/games/semantic-card.png",
    },
    navigation: {
      category: "puzzle",
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
        <CardDescription>Find the secret word!</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Guess semantically similar words to discover the daily secret word. 
        The closer your guess, the warmer you get!
      </CardContent>
    </Card>
  );
}

export function getSemanticPreviewComponent() {
  return SemanticPreviewCard;
}

