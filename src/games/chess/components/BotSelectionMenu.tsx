import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Opponent } from "../data/opponents";
import { OPPONENTS } from "../data/opponents";

interface BotSelectionMenuProps {
  onSelectBot: (opponent: Opponent) => void;
  onCancel?: () => void;
  timeLimit?: number;
}

const categoryLabels: Record<keyof typeof OPPONENTS, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
  master: "Master",
  custom: "Custom",
};

export function BotSelectionMenu({ onSelectBot, onCancel, timeLimit }: BotSelectionMenuProps) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<keyof typeof OPPONENTS>("beginner");
  const [selectedBot, setSelectedBot] = useState<Opponent | null>(null);

  const handleBotSelect = (opponent: Opponent) => {
    setSelectedBot(opponent);
  };

  const handleStartGame = () => {
    if (selectedBot) {
      onSelectBot(selectedBot);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background md:hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-3 bg-card border-b flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 flex-1 justify-center">
          <span className="text-lg font-bold">Choose Opponent</span>
        </div>
        
        {/* Spacer to balance the back button */}
        <div className="w-9" />
      </header>

      {/* Selected Bot Preview (if selected) */}
      {selectedBot && (
        <div className="px-4 py-3 bg-muted/50 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={selectedBot.avatar} alt={selectedBot.name} />
              <AvatarFallback>{selectedBot.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{selectedBot.name}</h3>
                {selectedBot.featured && (
                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {selectedBot.rating}
                </Badge>
                {timeLimit !== undefined && timeLimit > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {timeLimit} min
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {selectedBot.description}
          </p>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 border-b bg-card px-4 py-2 overflow-x-auto flex-shrink-0">
        {Object.keys(OPPONENTS).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as keyof typeof OPPONENTS)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeCategory === category
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {categoryLabels[category as keyof typeof OPPONENTS]}
          </button>
        ))}
      </div>

      {/* Bot Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          {OPPONENTS[activeCategory].map((opponent) => (
            <button
              key={opponent.id}
              onClick={() => handleBotSelect(opponent)}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all",
                selectedBot?.id === opponent.id
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-border hover:border-primary/50 hover:scale-105"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={opponent.avatar} alt={opponent.name} />
                    <AvatarFallback className="text-lg">
                      {opponent.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {opponent.featured && (
                    <Crown className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500 bg-background rounded-full" />
                  )}
                </div>
                <div className="text-center w-full">
                  <div className="text-xs font-medium truncate">{opponent.name}</div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {opponent.rating}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Start Game Button */}
      <div className="border-t bg-card px-4 py-4 flex-shrink-0">
        <Button
          onClick={handleStartGame}
          disabled={!selectedBot}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Game
        </Button>
      </div>
    </div>
  );
}
