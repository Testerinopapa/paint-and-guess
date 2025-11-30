import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getTriviaBlitzPreviewEntry(): NormalizedGameEntry {
  return {
    id: "trivia-blitz",
    version: "1.0.0",
    name: { default: "Trivia Blitz" },
    description: {
      default: "Fast-paced quiz game where speed and accuracy win. Answer questions faster than your friends!",
    },
    status: "stable",
    supportedPlayers: { min: 2, max: 12, recommended: 6 },
    monetization: "free",
    category: ["trivia", "party"],
    badges: ["new"],
    assets: {
      thumbnail: "/games/trivia-blitz-card.png",
      background: "/games/trivia-blitz-card.png",
    },
    navigation: {
      category: "trivia",
      priority: 90,
    },
    visibleIf: ["public"],
    route: { slug: "trivia-blitz" },
    featureFlags: [],
    plugin: {
      previewComponent: "triviaBlitzPreview",
      moduleId: "@/games/trivia-blitz",
    },
  };
}

export function TriviaBlitzPreviewCard() {
  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="default">New</Badge>
          <CardTitle>Trivia Blitz</CardTitle>
        </div>
        <CardDescription>Fast-paced quiz battles.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Answer questions faster than your friends to climb the leaderboard!
      </CardContent>
    </Card>
  );
}

export function getTriviaBlitzPreviewComponent() {
  return TriviaBlitzPreviewCard;
}

