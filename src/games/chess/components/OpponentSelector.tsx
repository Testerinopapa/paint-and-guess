import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Crown, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Opponent } from "../data/opponents";
import { OPPONENTS } from "../data/opponents";

interface OpponentSelectorProps {
  selectedOpponent: Opponent | null;
  onSelectOpponent: (opponent: Opponent) => void;
  onStartGame: () => void;
  isGameActive: boolean;
}

export function OpponentSelector({
  selectedOpponent,
  onSelectOpponent,
  onStartGame,
  isGameActive,
}: OpponentSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof OPPONENTS>("streamers");

  const categoryLabels: Record<keyof typeof OPPONENTS, string> = {
    streamers: "Streamers",
    "top-players": "Top Players",
    personalities: "Personalities",
    custom: "Custom",
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Play vs...</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Selected Opponent Display */}
        {selectedOpponent && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-4 mb-3">
              <Avatar className="w-16 h-16">
                <AvatarImage src={selectedOpponent.avatar} alt={selectedOpponent.name} />
                <AvatarFallback>{selectedOpponent.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{selectedOpponent.name}</h3>
                  {selectedOpponent.featured && (
                    <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <Badge variant="secondary" className="mt-1">
                  {selectedOpponent.rating}
                </Badge>
                {selectedOpponent.country && (
                  <span className="ml-2 text-sm">{selectedOpponent.country}</span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {selectedOpponent.description}
            </p>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 border-b overflow-x-auto">
          {Object.keys(OPPONENTS).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category as keyof typeof OPPONENTS)}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeCategory === category
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {categoryLabels[category as keyof typeof OPPONENTS]}
            </button>
          ))}
        </div>

        {/* Opponent Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-4 gap-3 p-2">
            {OPPONENTS[activeCategory].map((opponent) => (
              <button
                key={opponent.id}
                onClick={() => onSelectOpponent(opponent)}
                className={cn(
                  "relative p-2 rounded-lg border-2 transition-all hover:scale-105",
                  selectedOpponent?.id === opponent.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Avatar className="w-full aspect-square mb-2">
                  <AvatarImage src={opponent.avatar} alt={opponent.name} />
                  <AvatarFallback className="text-xs">
                    {opponent.name[0]}
                  </AvatarFallback>
                </Avatar>
                {opponent.featured && (
                  <Crown className="absolute top-1 right-1 w-3 h-3 text-yellow-500" />
                )}
                <div className="text-xs font-medium truncate">{opponent.name}</div>
                <div className="text-xs text-muted-foreground">{opponent.rating}</div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Start Game Button */}
        <Button
          onClick={onStartGame}
          disabled={!selectedOpponent || isGameActive}
          className="w-full"
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          {isGameActive ? "Game in Progress" : "Choose"}
        </Button>
      </CardContent>
    </Card>
  );
}

