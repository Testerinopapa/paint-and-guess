import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GameHubEntry } from "@/games/registry/schema";
import { CheckCircle2, Clock, Palette, Users } from "lucide-react";

export const paintAndGuessHubEntry: GameHubEntry = {
  heroEyebrow: "Live multiplayer",
  heroTitle: "Paint & Guess",
  heroDescription: "Queue up prompts, draw live with friends, and keep the laughter chain going with quick scoring loops.",
  heroImage: "/placeholder.svg",
  primaryCta: { label: "Host a room", to: "/games/paint-and-guess" },
  secondaryCta: { label: "Practice solo", to: "/games/paint-and-guess/single" },
  highlights: [
    { title: "Fabric-powered canvas", description: "Undo, brush sizes, and palette sharing synced over Socket.io." },
    { title: "Smart scoring", description: "Time-scaled scoring rewards quick guesses and confident drawing." },
    { title: "Watch-friendly", description: "Spectators stay in sync with drawer focus and live chat." },
  ],
  checklist: [
    { label: "Multiplayer lobby", complete: true },
    { label: "Heartbeat reconnection", complete: true },
    { label: "Custom avatars", complete: false },
    { label: "Ranked playlists", complete: false },
  ],
};

const stats = [
  { icon: Users, label: "Players", value: "2-12" },
  { icon: Clock, label: "Round length", value: "60s" },
  { icon: Palette, label: "Toolset", value: "Brush, fill, erase" },
];

export const PaintAndGuessHubPanel = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">{paintAndGuessHubEntry.heroEyebrow}</p>
          <h2 className="text-3xl font-semibold">{paintAndGuessHubEntry.heroTitle}</h2>
          <p className="text-muted-foreground">{paintAndGuessHubEntry.heroDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {paintAndGuessHubEntry.highlights.map((highlight) => (
            <Badge key={highlight.title} variant="secondary">
              {highlight.title}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {paintAndGuessHubEntry.primaryCta?.to ? (
            <Button asChild>
              <a href={paintAndGuessHubEntry.primaryCta.to}>{paintAndGuessHubEntry.primaryCta.label}</a>
            </Button>
          ) : null}
          {paintAndGuessHubEntry.secondaryCta?.to ? (
            <Button asChild variant="outline">
              <a href={paintAndGuessHubEntry.secondaryCta.to}>{paintAndGuessHubEntry.secondaryCta.label}</a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-semibold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Feature rollout</h3>
        <div className="space-y-2">
          {paintAndGuessHubEntry.checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`h-4 w-4 ${item.complete ? "text-primary" : "text-muted-foreground"}`} />
              <span className={item.complete ? "" : "text-muted-foreground"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaintAndGuessHubPanel;

