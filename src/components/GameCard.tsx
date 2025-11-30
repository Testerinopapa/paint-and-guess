import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import type { HubGame } from "@/games/registry";

interface GameCardProps {
  game: HubGame;
  lastPlayed?: string;
}

const GameCard = ({ game, lastPlayed }: GameCardProps) => {
  const handlePlay = (e: React.MouseEvent) => {
    if (!game.isEnabled) {
      e.preventDefault();
      return;
    }
  };

  return (
    <Link
      to={game.isEnabled ? game.derivedRoute : "#"}
      onClick={handlePlay}
      className="group relative overflow-hidden rounded-lg bg-game-card transition-all duration-300 hover:bg-game-card-hover hover:scale-105 hover:shadow-xl hover:shadow-primary/20 cursor-pointer block"
    >
      <div className="aspect-[3/4] relative overflow-hidden">
        <img 
          src={game.assets.thumbnail} 
          alt={game.displayName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
            <div>
              <h3 className="font-bold text-lg text-foreground mb-1">{game.displayName}</h3>
              {lastPlayed && (
                <p className="text-xs text-muted-foreground">Last played {lastPlayed}</p>
              )}
            </div>
            {game.isEnabled ? (
              <div className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/50">
                <Play className="w-5 h-5" fill="currentColor" />
              </div>
            ) : (
              <div className="p-3 bg-muted text-muted-foreground rounded-full opacity-50">
                <Play className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;

