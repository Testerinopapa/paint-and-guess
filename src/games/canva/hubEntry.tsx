import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getCanvaPreviewEntry(): NormalizedGameEntry {
  return {
    id: "canva",
    version: "0.1.0",
    name: { default: "Canva" },
    description: {
      default: "Collaborative drawing canvas. Draw together with friends in real-time!",
    },
    status: "stable",
    supportedPlayers: { min: 1, max: 10, recommended: 4 },
    monetization: "free",
    category: ["drawing", "creative"],
    badges: ["new"],
    assets: {
      thumbnail: "/games/canva-card.png",
      background: "/games/canva-card.png",
    },
    navigation: {
      category: "creative",
      priority: 85,
    },
    visibleIf: ["public"],
    route: { slug: "canva" },
    featureFlags: [],
    plugin: {
      previewComponent: "canvaPreview",
      moduleId: "@/games/canva",
    },
  };
}

export function CanvaPreviewCard() {
  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Alpha</Badge>
          <CardTitle>Canva</CardTitle>
        </div>
        <CardDescription>Collaborative drawing canvas.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Draw together with friends in real-time!
      </CardContent>
    </Card>
  );
}

export function getCanvaPreviewComponent() {
  return CanvaPreviewCard;
}

