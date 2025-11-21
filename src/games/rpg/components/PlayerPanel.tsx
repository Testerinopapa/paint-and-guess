import { Heart, Droplet, Star, Coins } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PlayerPanelProps {
  character: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    xp: number;
    xpToNextLevel: number;
    gold: number;
  };
}

export const PlayerPanel = ({ character }: PlayerPanelProps) => {
  const hpPercent = (character.hp / character.maxHp) * 100;
  const manaPercent = (character.mana / character.maxMana) * 100;
  const xpPercent = (character.xp / character.xpToNextLevel) * 100;

  return (
    <div className="flex flex-col gap-4 p-6 bg-card border-2 border-primary/30 rounded-lg">
      <div className="relative">
        <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-primary/50 bg-secondary/30 flex items-center justify-center">
          <div className="text-4xl">⚔️</div>
        </div>
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg border-2 border-background">
          {character.level}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-primary text-center">
        {character.name}
      </h2>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-foreground/80">HP</span>
            </div>
            <span className="font-mono text-red-500">
              {character.hp}/{character.maxHp}
            </span>
          </div>
          <Progress value={hpPercent} className="h-2" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span className="text-foreground/80">Mana</span>
            </div>
            <span className="font-mono text-blue-500">
              {character.mana}/{character.maxMana}
            </span>
          </div>
          <Progress value={manaPercent} className="h-2" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-foreground/80">XP</span>
            </div>
            <span className="font-mono text-yellow-500">
              {character.xp}/{character.xpToNextLevel}
            </span>
          </div>
          <Progress value={xpPercent} className="h-2" />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-primary/20">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <span className="text-foreground/80">Gold</span>
          </div>
          <span className="font-mono font-bold text-primary text-lg">
            {character.gold}
          </span>
        </div>
      </div>
    </div>
  );
};

