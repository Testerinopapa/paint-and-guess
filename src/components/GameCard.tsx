import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import type { HubGame } from "@/games/registry";

interface GameCardProps {
  game: HubGame;
  lastPlayed?: string;
  onPlay?: (gameId: string) => void;
}

const GameCard = ({ game, lastPlayed, onPlay }: GameCardProps) => {
  const navigate = useNavigate();

  const handlePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (game.isEnabled) {
      // Track game play
      if (onPlay) {
        onPlay(game.id);
      }
      // Store last played time
      localStorage.setItem(`game-last-played-${game.id}`, new Date().toISOString());
      // Navigate to game
      navigate(game.derivedRoute);
    }
  };

  const handleCardClick = () => {
    if (game.isEnabled) {
      handlePlay();
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative overflow-hidden rounded-lg bg-game-card transition-all duration-300 hover:bg-game-card-hover hover:scale-105 hover:shadow-xl hover:shadow-primary/20 cursor-pointer"
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
              <button 
                onClick={handlePlay}
                className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/50"
              >
                <Play className="w-5 h-5" fill="currentColor" />
              </button>
            ) : (
              <div className="p-3 bg-muted text-muted-foreground rounded-full opacity-50">
                <Play className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;

