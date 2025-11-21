import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NormalizedGameEntry } from "@/games/registry/schema";

export function getRpgPreviewEntry(): NormalizedGameEntry {
  return {
    id: "chronicles-of-the-abyss",
    version: "1.0.0",
    name: { default: "Chronicles of the Abyss" },
    description: {
      default: "Embark on an epic dark fantasy text-based adventure. Explore ancient ruins, battle monsters, and uncover hidden secrets.",
    },
    status: "stable",
    supportedPlayers: { min: 1, max: 1, recommended: 1 },
    monetization: "free",
    category: ["rpg", "adventure"],
    badges: ["new"],
    assets: {
      thumbnail: "/placeholder.svg",
    },
    navigation: {
      category: "adventure",
      priority: 80,
    },
    visibleIf: ["public"],
    route: { slug: "chronicles-of-the-abyss" },
    featureFlags: [],
    plugin: {
      previewComponent: "rpgPreview",
      moduleId: "@/games/rpg",
    },
  };
}

export function RpgPreviewCard() {
  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="default">New</Badge>
          <CardTitle>Chronicles of the Abyss</CardTitle>
        </div>
        <CardDescription>Dark fantasy text adventure.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Explore ancient ruins, battle monsters, and uncover secrets in this immersive text-based RPG adventure.
      </CardContent>
    </Card>
  );
}

export function getRpgPreviewComponent() {
  return RpgPreviewCard;
}

