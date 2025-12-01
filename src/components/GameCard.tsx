import { useState, useEffect } from "react";
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
  const [imageError, setImageError] = useState(false);
  
  // Use background image if available, fallback to thumbnail
  // Ensure path starts with / for absolute path from root
  const cardImage = (game.assets.background || game.assets.thumbnail)?.startsWith('/') 
    ? (game.assets.background || game.assets.thumbnail)
    : `/${game.assets.background || game.assets.thumbnail}`;

  // Reset error state when image source changes
  useEffect(() => {
    setImageError(false);
  }, [cardImage]);

  // Debug logging (remove in production)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[GameCard] ${game.id} - Image: ${cardImage}, Error: ${imageError}`);
    }
  }, [game.id, cardImage, imageError]);

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
      className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 cursor-pointer"
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-game-card">
        {!imageError ? (
          <img 
            src={cardImage} 
            alt={game.displayName}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error(`[GameCard] Failed to load image for ${game.id}:`, {
                attemptedUrl: target.src,
                cardImage,
                gameId: game.id,
              });
              setImageError(true);
            }}
            onLoad={() => {
              if (import.meta.env.DEV) {
                console.log(`[GameCard] Successfully loaded image for ${game.id}:`, cardImage);
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">🎮</div>
              <p className="text-sm text-muted-foreground font-medium">{game.displayName}</p>
            </div>
          </div>
        )}
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

