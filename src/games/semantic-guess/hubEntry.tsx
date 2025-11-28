import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getSemanticGuessPreviewEntry(): NormalizedGameEntry {
  return {
    id: "semantic-guess",
    version: "0.1.0",
    name: { default: "Semantic Guess" },
    description: {
      default: "Guess the daily word using semantic similarity hints.",
    },
    status: "beta",
    supportedPlayers: { min: 1, max: 1, recommended: 1 },
    monetization: "free",
    category: ["word", "puzzle", "daily"],
    badges: ["new", "daily"],
    assets: {
      thumbnail: "/placeholder.svg",
    },
    navigation: {
      category: "word",
      priority: 80,
    },
    visibleIf: ["public"],
    route: { slug: "semantic-guess" },
    featureFlags: [],
    plugin: {
      previewComponent: "semanticGuessPreview",
      moduleId: "@/games/semantic-guess",
    },
  };
}

export function SemanticGuessPreviewCard() {
  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Daily</Badge>
          <CardTitle>Semantic Guess</CardTitle>
        </div>
        <CardDescription>Single-player semantic word puzzle.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Try to find the daily secret word using only semantic similarity hints.
      </CardContent>
    </Card>
  );
}

export function getSemanticGuessPreviewComponent() {
  return SemanticGuessPreviewCard;
}

