import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getSemanticPreviewEntry(): NormalizedGameEntry {
  return {
    id: "semantic",
    version: "1.0.0",
    name: { default: "Semantic" },
    description: {
      default: "Guess the secret word by entering semantically similar words. Each guess receives a rank based on similarity to the target word.",
    },
    status: "stable",
    supportedPlayers: { min: 1, max: 1, recommended: 1 },
    monetization: "free",
    category: ["word", "puzzle"],
    badges: ["new"],
    assets: {
      thumbnail: "/placeholder.svg",
    },
    navigation: {
      category: "puzzle",
      priority: 90,
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
        <CardDescription>Word guessing game based on semantic similarity.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Guess the secret word by entering semantically similar words. Each guess receives a rank based on similarity to the target word.
      </CardContent>
    </Card>
  );
}

export function getSemanticPreviewComponent() {
  return SemanticPreviewCard;
}

