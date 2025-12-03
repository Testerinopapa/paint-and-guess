import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import type { HubGame } from "@/games/registry";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: HubGame;
  lastPlayed?: string;
  onPlay?: (gameId: string) => void;
}

const GameCard = ({ game, lastPlayed, onPlay }: GameCardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [imageError, setImageError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Use background image if available, fallback to thumbnail
  // Use BASE_URL to ensure correct path resolution in all deployment environments
  const imagePath = game.assets.background || game.assets.thumbnail || '';
  const baseUrl = import.meta.env.BASE_URL || '/';
  // Remove leading slash from path since BASE_URL already provides the root
  const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  const cardImage = `${baseUrl}${normalizedPath}`;

  // Reset error state when image source changes
  useEffect(() => {
    setImageError(false);
  }, [cardImage]);

  // Debug logging (remove in production)
  useEffect(() => {
    if (import.meta.env.DEV) {
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
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        "group relative overflow-hidden rounded-lg transition-all duration-300 cursor-pointer",
        isMobile 
          ? isPressed 
            ? "scale-[0.98] shadow-lg" 
            : "active:scale-[0.98]"
          : "hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
      )}
    >
      <div className="aspect-[3/4] relative overflow-hidden bg-game-card">
        {!imageError ? (
          <img 
            src={cardImage} 
            alt={game.displayName}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-transform duration-300",
              isMobile ? "" : "group-hover:scale-110"
            )}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error(`[GameCard] Failed to load image for ${game.id}:`, {
                attemptedUrl: target.src,
                cardImage,
                gameId: game.id,
              });
              setImageError(true);
            }}
            onLoad={() => {}}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">🎮</div>
              <p className="text-sm text-muted-foreground font-medium">{game.displayName}</p>
            </div>
          </div>
        )}
        {/* Overlay - Always visible on mobile, hover-only on desktop */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent transition-opacity duration-300",
          isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 flex items-end justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-bold text-base md:text-lg text-foreground mb-1 truncate">{game.displayName}</h3>
              {lastPlayed && (
                <p className="text-xs text-muted-foreground">Last played {lastPlayed}</p>
              )}
            </div>
            {game.isEnabled ? (
              <button 
                onClick={handlePlay}
                className={cn(
                  "flex-shrink-0 bg-primary text-primary-foreground rounded-full transition-all shadow-lg shadow-primary/50",
                  isMobile ? "p-3 h-11 w-11 flex items-center justify-center active:scale-90" : "p-3 hover:bg-primary/90"
                )}
                aria-label={`Play ${game.displayName}`}
              >
                <Play className="w-5 h-5 md:w-5 md:h-5" fill="currentColor" />
              </button>
            ) : (
              <div className="flex-shrink-0 p-3 bg-muted text-muted-foreground rounded-full opacity-50 h-11 w-11 flex items-center justify-center">
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

